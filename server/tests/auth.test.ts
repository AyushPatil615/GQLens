/**
 * auth.test.ts
 * Smoke tests for the JWT auth and context flow.
 *
 * Covers:
 *  - me query: no token → UNAUTHENTICATED
 *  - me query: invalid token → UNAUTHENTICATED
 *  - me query: valid ADMIN token → returns user
 *  - me query: valid VIEWER token → returns user
 *  - token structure (3-part, parseable)
 */
import { describe, it, expect } from 'vitest';
import { gql, loginAs }         from './setup/helpers';

const ME_QUERY = `query { me { id name role } }`;

// ── Unauthenticated ───────────────────────────────────────────────────────────
describe('Auth: unauthenticated requests', () => {
  it('rejects me query with no Authorization header', async () => {
    const { data, errors } = await gql(ME_QUERY);
    // Apollo resolves the nullable `me` field to null and places the error in
    // the errors array: { data: { me: null }, errors: [...] }
    expect((data as Record<string, unknown> | null)?.me).toBeNull();
    expect(errors).toBeDefined();
    expect(errors![0].message.toLowerCase()).toMatch(/unauthenticat|authorization/);
  });

  it('rejects me query with a malformed Bearer token', async () => {
    const { errors } = await gql(ME_QUERY, {}, 'not.a.valid.token');
    expect(errors).toBeDefined();
    expect(errors!.length).toBeGreaterThan(0);
  });

  it('rejects me query with an empty Bearer string', async () => {
    const { errors } = await gql(ME_QUERY, {}, '');
    expect(errors).toBeDefined();
  });
});

// ── Authenticated ─────────────────────────────────────────────────────────────
describe('Auth: authenticated requests', () => {
  it('resolves me for alice (ADMIN)', async () => {
    const token            = await loginAs('alice');
    const { data, errors } = await gql<{
      me: { id: string; name: string; role: string };
    }>(ME_QUERY, {}, token);
    expect(errors).toBeUndefined();
    expect(data!.me.role).toBe('ADMIN');
    expect(typeof data!.me.id).toBe('string');
    expect(typeof data!.me.name).toBe('string');
  });

  it('resolves me for bob (VIEWER)', async () => {
    const token            = await loginAs('bob');
    const { data, errors } = await gql<{
      me: { role: string };
    }>(ME_QUERY, {}, token);
    expect(errors).toBeUndefined();
    expect(data!.me.role).toBe('VIEWER');
  });

  it('resolves me for charlie (VIEWER/Guest)', async () => {
    const token            = await loginAs('charlie');
    const { data, errors } = await gql<{
      me: { role: string };
    }>(ME_QUERY, {}, token);
    expect(errors).toBeUndefined();
    expect(data!.me.role).toBe('VIEWER');
  });
});

// ── Token structure ───────────────────────────────────────────────────────────
describe('Auth: token structure', () => {
  it('issued token is a 3-part dot-separated string (JWT-shaped)', async () => {
    const token = await loginAs('alice');
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
  });

  it('token payload decodes to expected user fields', async () => {
    const token   = await loginAs('alice');
    const [, body] = token.split('.');
    const pad     = (4 - (body.length % 4)) % 4;
    const payload = JSON.parse(
      Buffer.from(
        body.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad),
        'base64',
      ).toString('utf8'),
    ) as { userId: string; name: string; role: string; iat: number };
    expect(payload.role).toBe('ADMIN');
    expect(typeof payload.userId).toBe('string');
    expect(typeof payload.iat).toBe('number');
  });
});
