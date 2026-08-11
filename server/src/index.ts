import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { typeDefs }           from './schema/typeDefs';
import { resolvers }          from './resolvers/index';
import { createTracingPlugin } from './plugins/tracingPlugin';
import { registerClient, removeClient } from './tracer';
import type { AppContext } from './resolvers/index';

// ─── Initialise DB (side effect — creates tables + seeds data) ───────
import './db/database';

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── CORS ────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-request-id', 'x-domain-id'],
}));
app.use(express.json());

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
    phase:   'Phase 2 — Real backend',
  });
});

// ─── Bootstrap Apollo Server ─────────────────────────────────────────
async function start() {
  const server = new ApolloServer<AppContext>({
    typeDefs,
    resolvers,
    plugins: [createTracingPlugin()],
    // Disable the document store so Apollo re-parses and re-validates
    // every query. Without this, the parsingDidStart and validationDidStart
    // plugin hooks are skipped on repeated runs, making Parser and Validator
    // appear grayed out in the learning pipeline.
    documentStore: null,
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({
        requestId: (req.headers['x-request-id'] as string) ?? '',
      }),
    }),
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
