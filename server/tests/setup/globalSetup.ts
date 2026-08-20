/**
 * Vitest Global Setup
 * Starts a real Express + Apollo server on a random free port before any
 * test runs. Tears it down after all tests complete.
 *
 * TEST_SERVER_URL is written into process.env so every test file can
 * import it via the shared gql() helper.
 */
import type { AddressInfo } from 'net';
import type { Server }      from 'http';
import { createRequire }    from 'module';
import { fileURLToPath }    from 'url';
import path                 from 'path';

// __dirname shim for ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let httpServer: Server;

export async function setup() {
  // Use SQLite (not Supabase) during tests
  delete process.env['DATABASE_URL'];

  // Absolute path so Vitest can always find app.ts regardless of cwd
  const appPath = path.resolve(__dirname, '../../src/app.ts');
  const { buildApp } = await import(appPath);
  const app          = await buildApp();

  await new Promise<void>((resolve) => {
    httpServer = app.listen(0, '127.0.0.1', () => {
      const port = (httpServer.address() as AddressInfo).port;
      process.env['TEST_SERVER_URL'] = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  console.log(`\n🧪  Test server → ${process.env['TEST_SERVER_URL']}`);
}

export async function teardown() {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
}
