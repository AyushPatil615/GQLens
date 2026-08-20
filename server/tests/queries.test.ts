/**
 * queries.test.ts
 * Smoke tests for the core GraphQL read queries.
 *
 * Covers:
 *  - students (list)
 *  - student(id) — found & not found
 *  - patients (list)
 *  - health endpoint
 */
import { describe, it, expect } from 'vitest';
import { gql, baseUrl }         from './setup/helpers';

// ── /health ──────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns status ok with security config', async () => {
    const res  = await fetch(`${baseUrl()}/health`);
    const body = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.security).toBeDefined();
  });
});

// ── students (Education domain) ───────────────────────────────────────────────
describe('Query: students', () => {
  it('returns a list with id, name, age', async () => {
    const { data, errors } = await gql<{ students: { id: string; name: string; age: number }[] }>(`
      query {
        students { id name age }
      }
    `);
    expect(errors).toBeUndefined();
    expect(Array.isArray(data?.students)).toBe(true);
    expect(data!.students.length).toBeGreaterThan(0);

    const first = data!.students[0];
    expect(typeof first.id).toBe('string');
    expect(typeof first.name).toBe('string');
    expect(typeof first.age).toBe('number');
  });

  it('returns courses when nested in query', async () => {
    const { data, errors } = await gql<{
      students: { name: string; courses: { title: string }[] }[];
    }>(`
      query {
        students { name courses { title } }
      }
    `);
    expect(errors).toBeUndefined();
    const student = data!.students[0];
    expect(Array.isArray(student.courses)).toBe(true);
  });
});

// ── student(id) ───────────────────────────────────────────────────────────────
describe('Query: student(id)', () => {
  it('returns the correct student for id "1"', async () => {
    const { data, errors } = await gql<{ student: { id: string; name: string } }>(`
      query {
        student(id: "1") { id name }
      }
    `);
    expect(errors).toBeUndefined();
    expect(data!.student.id).toBe('1');
    expect(typeof data!.student.name).toBe('string');
  });

  it('returns null (not an error) for a non-existent student id', async () => {
    const { data, errors } = await gql<{ student: null | { id: string } }>(`
      query {
        student(id: "999") { id name }
      }
    `);
    // Resolvers return undefined/null — no throw for a simple not-found in a
    // nullable field. Either null data or a NOT_FOUND error is acceptable.
    const isNull  = data?.student === null || data?.student === undefined;
    const hasErr  = errors?.some(e => e.extensions?.code === 'NOT_FOUND');
    expect(isNull || hasErr).toBe(true);
  });

  it('supports variables ($id: ID!)', async () => {
    const { data, errors } = await gql<{ student: { name: string } }>(
      `query GetStudent($id: ID!) { student(id: $id) { name } }`,
      { id: '1' },
    );
    expect(errors).toBeUndefined();
    expect(typeof data!.student.name).toBe('string');
  });
});

// ── patients (Healthcare domain) ──────────────────────────────────────────────
describe('Query: patients', () => {
  it('returns a list of patients with id and name', async () => {
    const { data, errors } = await gql<{ patients: { id: string; name: string }[] }>(`
      query { patients { id name } }
    `);
    expect(errors).toBeUndefined();
    expect(Array.isArray(data?.patients)).toBe(true);
    expect(data!.patients.length).toBeGreaterThan(0);
  });
});
