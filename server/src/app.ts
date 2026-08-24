/**
 * app.ts — Express + Apollo factory (no listen call).
 * Imported by index.ts (production) and tests (which bind their own port).
 */
import dns from 'dns';
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs }            from './schema/typeDefs';
import { resolvers }           from './resolvers/index';
import { createTracingPlugin }  from './plugins/tracingPlugin';
import { registerClient, removeClient } from './tracer';
import { verifyToken }         from './auth/jwt';
import {
  apiRateLimiter,
  depthLimitRule,
  createComplexityPlugin,
  MAX_QUERY_DEPTH,
  MAX_QUERY_COMPLEXITY,
} from './security/controls';
import type { AppContext } from './resolvers/index';

// ─── Initialise DB (side effect — creates tables + seeds data) ───────
import './db/database';


export async function buildApp() {
  const app = express();

  // ─── CORS ─────────────────────────────────────────────────────────
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CLIENT_ORIGIN,
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // open for demo
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-request-id', 'x-domain-id', 'x-dataloader-enabled', 'Authorization'],
    credentials: true,
  }));
  app.use(express.json());

  // ─── Rate Limiting (/graphql only; SSE /events is exempt) ─────────
  app.use('/graphql', apiRateLimiter);

  // ─── SSE endpoint — must be registered BEFORE Apollo middleware ───
  app.get('/events', (req, res) => {
    const requestId = (req.query['requestId'] as string) ?? '';
    if (!requestId) { res.status(400).json({ error: 'requestId required' }); return; }
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write(`: connected\n\n`);
    registerClient(requestId, res);
    req.on('close', () => removeClient(requestId));
  });

  // ─── Health check ─────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status:   'ok',
      message:  'GQLens server running',
      security: {
        maxQueryDepth:      MAX_QUERY_DEPTH,
        maxQueryComplexity: MAX_QUERY_COMPLEXITY,
        rateLimitPerMinute: 100,
      },
    });
  });

  // ─── Apollo Server ────────────────────────────────────────────────
  const executableSchema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer<AppContext>({
    typeDefs,
    resolvers,
    plugins: [
      createTracingPlugin(),
      createComplexityPlugin(executableSchema),
    ],
    validationRules: [depthLimitRule],
    documentStore: null, // force re-parse every request (needed for learning traces)
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const requestId         = (req.headers['x-request-id'] as string) ?? '';
        const dataLoaderEnabled = req.headers['x-dataloader-enabled'] === 'true';
        let user: AppContext['user'] = null;
        const authHeader = req.headers['authorization'] ?? '';
        if (authHeader.startsWith('Bearer ')) {
          const token   = authHeader.slice(7).trim();
          const payload = await verifyToken(token);
          if (payload) {
            user = { id: payload.userId, name: payload.name, role: payload.role };
          }
        }
        return { requestId, dataLoaderEnabled, user };
      },
    }) as any,
  );

  return app;
}
