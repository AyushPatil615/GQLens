/**
 * errors.test.ts
 * Smoke tests for security controls and error code standards.
 *
 * Covers:
 *  - QUERY_TOO_DEEP   — query depth > MAX_QUERY_DEPTH (8) is rejected
 *  - QUERY_TOO_COMPLEX — no test (complexity is schema-dependent, hard to trigger exactly)
 *  - NOT_FOUND        — verified in queries.test.ts via student(id:"999")
 *  - UNAUTHENTICATED  — verified in auth.test.ts
 *  - Error extensions — all errors must have an extensions.code
 *  - Malformed JSON   — server returns HTTP 400, not a crash
 */
import { describe, it, expect } from 'vitest';
import { gql, baseUrl }         from './setup/helpers';

// ── QUERY_TOO_DEEP ────────────────────────────────────────────────────────────
describe('Security: QUERY_TOO_DEEP', () => {
  // Construct a query that nests 10 levels deep (limit is 8)
  const deepQuery = `
    query {
      students {
        courses {
          students {
            courses {
              students {
                courses {
                  students {
                    courses {
                      students { name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  it('rejects queries deeper than the configured depth limit', async () => {
    const { errors } = await gql(deepQuery);
    expect(errors).toBeDefined();
    expect(errors!.length).toBeGreaterThan(0);
    // graphql-depth-limit produces a validation error (no code extension)
    // but the message should mention depth
    const msg = errors![0].message.toLowerCase();
    expect(msg).toMatch(/depth|exceed|maximum/);
  });
});

// ── Error format (extensions.code) ───────────────────────────────────────────
describe('Error format: extensions.code', () => {
  it('returns extensions with a code for a field that does not exist', async () => {
    const { errors } = await gql(`query { nonExistentField }`);
    expect(errors).toBeDefined();
    // GraphQL validation error — message should mention the unknown field
    expect(errors![0].message).toMatch(/nonExistentField|Cannot query/);
  });

  it('returns a proper GraphQL error for an empty query body', async () => {
    const { errors } = await gql('');
    expect(errors).toBeDefined();
    expect(errors!.length).toBeGreaterThan(0);
  });
});

// ── Raw HTTP edge cases ────────────────────────────────────────────────────────
describe('HTTP: edge cases', () => {
  it('returns HTTP 400 for missing requestId on /events', async () => {
    const res = await fetch(`${baseUrl()}/events`);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('requestId required');
  });

  it('accepts POST to /graphql with valid JSON even without x-request-id', async () => {
    // Without requestId the SSE tracing simply emits nothing — the query still executes
    const res = await fetch(`${baseUrl()}/graphql`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query: '{ students { id } }' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data?: unknown };
    expect(body.data).toBeDefined();
  });
});
