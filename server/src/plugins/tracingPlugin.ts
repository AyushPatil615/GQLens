import type { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { emitTrace, emitDone } from '../tracer';

export function createTracingPlugin(): ApolloServerPlugin {
  return {
    async requestDidStart(reqCtx: GraphQLRequestContext<{ requestId?: string }>) {
      const requestId = (reqCtx.request.http?.headers.get('x-request-id')) ?? '';
      if (!requestId) return {};

      const requestStart = Date.now();

      return {
        // ── Parse ──────────────────────────────────────────────────
        async parsingDidStart() {
          const t = Date.now();
          return async () => {
            emitTrace(requestId, {
              step:    'parse',
              ms:      Date.now() - t,
              caption: 'GraphQL read your query text and converted it into a structured tree (AST).',
              ts:      t,
            });
          };
        },

        // ── Validate ────────────────────────────────────────────────
        async validationDidStart() {
          const t = Date.now();
          return async () => {
            emitTrace(requestId, {
              step:    'validate',
              ms:      Date.now() - t,
              caption: 'Checked that every field in your query actually exists in the schema.',
              ts:      t,
            });
          };
        },

        // ── Execution ───────────────────────────────────────────────
        async executionDidStart() {
          return {
            willResolveField({ info }) {
              // Track per-resolver timing
              // We only surface Student-level and courses resolvers
              const typeName  = info.parentType.name;
              const fieldName = info.fieldName;
              const t = Date.now();

              return () => {
                // Student root resolver
                if (typeName === 'Query' && fieldName === 'student') {
                  emitTrace(requestId, {
                    step:    'resolve:Student',
                    ms:      Date.now() - t,
                    caption: 'Ran the Student resolver — a function that knows how to find student data.',
                    ts:      t,
                  });
                }
                // Courses nested resolver
                if (typeName === 'Student' && fieldName === 'courses') {
                  emitTrace(requestId, {
                    step:    'resolve:courses',
                    ms:      Date.now() - t,
                    caption: 'Ran the Courses resolver — fetching which classes this student is enrolled in.',
                    ts:      t,
                  });
                }
              };
            },
          };
        },

        // ── Response ────────────────────────────────────────────────
        async willSendResponse() {
          emitTrace(requestId, {
            step:    'respond',
            ms:      Date.now() - requestStart,
            caption: 'All done! Building the JSON response to send back to your app.',
            ts:      Date.now(),
          });
          // Signal stream complete
          emitDone(requestId);
        },
      };
    },
  };
}
