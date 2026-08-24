/**
 * index.ts — Production entry point.
 * Builds the Express + Apollo app then binds to PORT.
 * Test files import buildApp() directly from app.ts to avoid listen().
 */
import { buildApp } from './app';

const PORT = process.env.PORT || 4000;

buildApp().then(app => {
  app.listen(PORT, () => {
    console.log('\n🚀  GQLens Server — Phase 2');
    console.log(`   GraphQL:  http://localhost:${PORT}/graphql`);
    console.log(`   Events:   http://localhost:${PORT}/events`);
    console.log(`   Health:   http://localhost:${PORT}/health\n`);
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

