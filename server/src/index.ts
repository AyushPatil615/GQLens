import dns from 'dns';
// Force IPv4 DNS resolution for cloud platforms (Render/Railway/Supabase IPv4 pooler)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

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


const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Dynamic CORS Configuration ──────────────────────────────────────
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
      callback(null, true); // Allow for demo requests
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-request-id', 'x-domain-id', 'x-dataloader-enabled', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// ─── Rate Limiting ────────────────────────────────────────────────────
// Applied to /graphql only. SSE /events is exempt (long-lived connections).
app.use('/graphql', apiRateLimiter);

// ─── SSE endpoint — must be registered BEFORE Apollo middleware ──────
app.get('/events', (req, res) => {
  const requestId = (req.query['requestId'] as string) ?? '';
  if (!requestId) { res.status(400).json({ error: 'requestId required' }); return; }

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering if behind proxy
  res.flushHeaders();

  // Send a heartbeat so the client knows the connection is live
  res.write(`: connected\n\n`);

  registerClient(requestId, res);

  // Cleanup on disconnect
  req.on('close', () => removeClient(requestId));
});

// ─── Health check ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    message: 'GraphScope server running',
    security: {
      maxQueryDepth:       MAX_QUERY_DEPTH,
      maxQueryComplexity:  MAX_QUERY_COMPLEXITY,
      rateLimitPerMinute:  100,
    },
  });
});

// ─── Bootstrap Apollo Server ───────────────────────────────────────────
async function start() {
  // Build schema once to pass to the complexity plugin
  const { makeExecutableSchema } = await import('@graphql-tools/schema');
  const executableSchema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer<AppContext>({
    typeDefs,
    resolvers,
    plugins: [
      createTracingPlugin(),
      createComplexityPlugin(executableSchema),
    ],
    // ── Query depth validation rule ──
    validationRules: [depthLimitRule],
    // Disable document store so Apollo re-parses/re-validates every query.
    // Without this, parsingDidStart and validationDidStart hooks are skipped
    // on repeated runs, making Parser and Validator appear grayed out.
    documentStore: null,
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const requestId         = (req.headers['x-request-id'] as string) ?? '';
        const dataLoaderEnabled = req.headers['x-dataloader-enabled'] === 'true';

        // ── Auth context: parse Authorization: Bearer <token> ────────
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

  app.listen(PORT, () => {
    console.log('\n🚀  GraphScope Server — Phase 2');
    console.log(`   GraphQL:  http://localhost:${PORT}/graphql`);
    console.log(`   Events:   http://localhost:${PORT}/events`);
    console.log(`   Health:   http://localhost:${PORT}/health\n`);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
