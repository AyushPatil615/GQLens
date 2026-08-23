/**
 * smoke.ci.ts — CI smoke test runner (no vitest, no native deps)
 *
 * Uses tsx (already installed) + Node.js built-in fetch + node:test.
 * Runs the same critical paths as the vitest suite.
 *
 * Usage: npx tsx tests/smoke.ci.ts
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { buildApp } from '../src/app';

let server: Server;
let base: string;

// ── Server lifecycle ──────────────────────────────────────────────────
before(async () => {
  delete process.env['DATABASE_URL'];
  const app = await buildApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      base = `http://127.0.0.1:${port}`;
      console.log(`\n🧪  Smoke test server → ${base}`);
      resolve();
    });
  });
});

after(() => new Promise<void>((resolve) => server.close(() => resolve())));

// ── Helpers ───────────────────────────────────────────────────────────
async function gql(query: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}/graphql`, {
    method: 'POST', headers,
    body: JSON.stringify({ query }),
  });
  return res.json() as Promise<{ data: Record<string, unknown>; errors?: { message: string }[] }>;
}

async function login(username: 'alice' | 'bob' | 'charlie') {
  const passwords = { alice: 'admin123', bob: 'view123', charlie: 'guest123' };
  const { data } = await gql(
    `mutation { login(username: "${username}", password: "${passwords[username]}") { token } }`,
  );
  return (data.login as { token: string }).token;
}

// ── Tests ─────────────────────────────────────────────────────────────
describe('Health', () => {
  test('GET /health returns ok', async () => {
    const res  = await fetch(`${base}/health`);
    const body = await res.json() as Record<string, unknown>;
    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
  });
});

describe('Queries', () => {
  test('students list returns array', async () => {
    const { data, errors } = await gql('{ students { id name age } }');
    assert.equal(errors, undefined);
    assert.ok(Array.isArray(data.students));
    assert.ok((data.students as unknown[]).length > 0);
  });

  test('student(id: "1") returns correct record', async () => {
    const { data, errors } = await gql('{ student(id: "1") { id name } }');
    assert.equal(errors, undefined);
    assert.equal((data.student as { id: string }).id, '1');
  });

  test('patients list returns array', async () => {
    const { data, errors } = await gql('{ patients { id name } }');
    assert.equal(errors, undefined);
    assert.ok(Array.isArray(data.patients));
  });
});

describe('Auth', () => {
  test('login(alice) returns JWT-shaped token', async () => {
    const { data, errors } = await gql(
      'mutation { login(username: "alice", password: "admin123") { token user { role } } }',
    );
    assert.equal(errors, undefined);
    const login = data.login as { token: string; user: { role: string } };
    assert.equal(login.token.split('.').length, 3);
    assert.equal(login.user.role, 'ADMIN');
  });

  test('me with no token returns null + error', async () => {
    const { data, errors } = await gql('{ me { id name role } }');
    assert.ok(errors && errors.length > 0);
    assert.ok(errors[0].message.toLowerCase().match(/unauthenticat|authorization/));
  });

  test('me with valid token returns user', async () => {
    const token = await login('alice');
    const { data, errors } = await gql('{ me { id name role } }', token);
    assert.equal(errors, undefined);
    assert.equal((data.me as { role: string }).role, 'ADMIN');
  });

  test('invalid credentials return error', async () => {
    const { errors } = await gql('mutation { login(username: "alice", password: "wrong") { token } }');
    assert.ok(errors && errors.length > 0);
  });
});

describe('Security', () => {
  test('deep query exceeding depth limit is rejected', async () => {
    const { errors } = await gql(`{
      students { courses { students { courses { students { courses {
        students { courses { students { name } } }
      } } } } } }
    }`);
    assert.ok(errors && errors.length > 0);
    assert.ok(errors[0].message.toLowerCase().match(/depth|exceed|maximum/));
  });

  test('/events without requestId returns 400', async () => {
    const res = await fetch(`${base}/events`);
    assert.equal(res.status, 400);
  });
});
