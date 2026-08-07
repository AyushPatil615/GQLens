import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ─── Health check ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GraphScope server running', phase: 'Phase 0 — stub' });
});

// ─── TODO: Phase 3 ─────────────────────────────────────────────────
// app.use('/api', apolloMiddleware);      ← real GraphQL endpoint
// app.get('/events', sseHandler);         ← SSE instrumentation stream

app.listen(PORT, () => {
  console.log(`\n🚀 GraphScope Server ready at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
