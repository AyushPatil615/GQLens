/**
 * GQLens — Security Controls
 *
 * 1. Query Depth Limiting   — prevents recursive/nested query abuse
 * 2. Query Complexity        — prevents expensive queries from running
 * 3. Rate Limiting           — prevents API abuse per IP
 * 4. Standardized Errors     — consistent error codes across all resolvers
 */

import depthLimit from 'graphql-depth-limit';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import rateLimit from 'express-rate-limit';
import { GraphQLError, type DocumentNode, type GraphQLSchema } from 'graphql';
import type { ApolloServerPlugin } from '@apollo/server';
import { emitTrace } from '../tracer';

// ─── 1. Query Depth Limit ────────────────────────────────────────────────────
export const MAX_QUERY_DEPTH = 8;

/**
 * Passed to Apollo Server's `validationRules` array.
 * Rejects queries deeper than MAX_QUERY_DEPTH before any resolver runs.
 */
export const depthLimitRule = depthLimit(MAX_QUERY_DEPTH, { ignore: [] }, (depths) => {
  const maxDepth = Math.max(...Object.values(depths).map(Number));
  if (maxDepth > MAX_QUERY_DEPTH) {
    console.warn(`[Security] Query depth ${maxDepth} rejected (limit: ${MAX_QUERY_DEPTH})`);
  }
});

// ─── 2. Query Complexity ─────────────────────────────────────────────────────
export const MAX_QUERY_COMPLEXITY = 100;

/**
 * Apollo Server plugin that calculates query cost BEFORE execution.
 * Lists, objects, and scalars each have a cost multiplier.
 */
export function createComplexityPlugin(
  schema: GraphQLSchema,
): ApolloServerPlugin {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation({ request, document, contextValue }) {
          const ctx = contextValue as { requestId?: string };

          const complexity = getComplexity({
            schema,
            operationName: request.operationName ?? undefined,
            query: document as DocumentNode,
            variables: (request.variables as Record<string, unknown>) ?? {},
            estimators: [
              fieldExtensionsEstimator(),
              // Lists cost 10 × child cost; scalars cost 1
              simpleEstimator({ defaultComplexity: 1 }),
            ],
          });

          // Emit to SSE so the frontend can show it in the trace panel
          if (ctx?.requestId) {
            emitTrace(ctx.requestId, {
              step:    'security:complexity',
              ms:      0,
              caption: complexity > MAX_QUERY_COMPLEXITY
                ? `🚨 Query complexity ${complexity} exceeds limit of ${MAX_QUERY_COMPLEXITY} — request rejected.`
                : `🔢 Query complexity: ${complexity} / ${MAX_QUERY_COMPLEXITY} — within limit ✅`,
              ts: Date.now(),
            });
          }

          if (complexity > MAX_QUERY_COMPLEXITY) {
            throw new GraphQLError(
              `Query complexity ${complexity} exceeds maximum allowed complexity of ${MAX_QUERY_COMPLEXITY}.`,
              {
                extensions: {
                  code: 'QUERY_TOO_COMPLEX',
                  complexity,
                  maxComplexity: MAX_QUERY_COMPLEXITY,
                },
              },
            );
          }
        },
      };
    },
  };
}

// ─── 3. Rate Limiting ────────────────────────────────────────────────────────
/**
 * Express middleware — 100 requests per minute per IP (anonymous).
 * Returns a standard JSON error (not a GraphQL response, since rate limiting
 * happens before the GraphQL layer).
 */
export const apiRateLimiter = rateLimit({
  windowMs:         60 * 1000,  // 1 minute
  max:              100,         // requests per window per IP
  standardHeaders:  true,        // Return `RateLimit-*` headers
  legacyHeaders:    false,
  message: {
    errors: [{
      message: 'Too many requests. Please slow down.',
      extensions: {
        code:       'RATE_LIMITED',
        retryAfter: '60 seconds',
      },
    }],
  },
  skip: (req) => {
    // Never rate-limit the SSE endpoint (it's a long-lived connection)
    return req.path === '/events';
  },
});

// ─── 4. Standardized Error Helpers ───────────────────────────────────────────
/**
 * Use these helpers in resolvers instead of throwing raw Errors.
 * They produce consistent `extensions.code` values in the GraphQL response.
 *
 * @example
 *   throw Errors.notFound('Student', args.id);
 *   throw Errors.unauthenticated();
 *   throw Errors.forbidden('ADMIN role required');
 */
export const Errors = {
  unauthenticated: (message = 'Authentication required. Provide a valid Authorization: Bearer <token> header.') =>
    new GraphQLError(message, {
      extensions: { code: 'UNAUTHENTICATED' },
    }),

  forbidden: (message = 'You do not have permission to perform this action.') =>
    new GraphQLError(message, {
      extensions: { code: 'FORBIDDEN' },
    }),

  notFound: (resource: string, id?: string) =>
    new GraphQLError(
      id ? `${resource} with id "${id}" was not found.` : `${resource} not found.`,
      { extensions: { code: 'NOT_FOUND', resource } },
    ),

  badInput: (message: string) =>
    new GraphQLError(message, {
      extensions: { code: 'BAD_USER_INPUT' },
    }),

  internal: (message = 'An unexpected error occurred.') =>
    new GraphQLError(message, {
      extensions: { code: 'INTERNAL_ERROR' },
    }),
};
