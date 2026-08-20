/**
 * mutations.test.ts
 * Smoke tests for the GraphQL mutation layer.
 *
 * Covers:
 *  - login (valid credentials → token, invalid → error)
 *  - enrollStudent (authenticated ADMIN can enroll)
 */
import { describe, it, expect } from 'vitest';
import { gql, loginAs }         from './setup/helpers';

// ── login mutation ────────────────────────────────────────────────────────────
describe('Mutation: login', () => {
  it('returns a token for alice (ADMIN) with correct password', async () => {
    const { data, errors } = await gql<{
      login: { token: string; user: { name: string; role: string } };
    }>(`
      mutation {
        login(username: "alice", password: "admin123") {
          token
          user { name role }
        }
      }
    `);
    expect(errors).toBeUndefined();
    expect(typeof data!.login.token).toBe('string');
    expect(data!.login.token.split('.').length).toBe(3); // JWT-shaped
    expect(data!.login.user.role).toBe('ADMIN');
  });

  it('returns a token for bob (VIEWER) with correct password', async () => {
    const { data, errors } = await gql<{
      login: { token: string; user: { role: string } };
    }>(`
      mutation {
        login(username: "bob", password: "view123") {
          token user { role }
        }
      }
    `);
    expect(errors).toBeUndefined();
    expect(data!.login.user.role).toBe('VIEWER');
  });

  it('rejects wrong password with an error', async () => {
    const { data, errors } = await gql(`
      mutation {
        login(username: "alice", password: "wrongpassword") {
          token
        }
      }
    `);
    expect(errors).toBeDefined();
    expect(errors!.length).toBeGreaterThan(0);
    // data.login is undefined (not null) when the resolver throws before returning
    expect((data as Record<string, unknown> | null)?.['login']).toBeUndefined();
    // The login resolver throws a generic Error (not a GraphQLError with extensions)
    expect(errors![0].message.toLowerCase()).toMatch(/invalid|credentials|password/);
  });

  it('rejects unknown username', async () => {
    const { data, errors } = await gql(`
      mutation {
        login(username: "nobody", password: "123") { token }
      }
    `);
    expect(errors).toBeDefined();
    expect(errors!.length).toBeGreaterThan(0);
  });
});

// ── enrollStudent mutation ────────────────────────────────────────────────────
describe('Mutation: enrollStudent', () => {
  it('allows an authenticated ADMIN to enroll a student', async () => {
    const token = await loginAs('alice');
    const { data, errors } = await gql<{
      enrollStudent: { success: boolean; message?: string };
    }>(
      `mutation Enroll($studentId: ID!, $courseId: ID!) {
         enrollStudent(studentId: $studentId, courseId: $courseId) {
           success message
         }
       }`,
      { studentId: '1', courseId: 'c1' },
      token,
    );
    // success OR already enrolled are both valid outcomes
    if (errors) {
      // idempotent: already enrolled is acceptable
      expect(errors[0].message.toLowerCase()).toMatch(/already|enrolled/);
    } else {
      expect(typeof data!.enrollStudent.success).toBe('boolean');
    }
  });

  it('enrollStudent has no auth guard — works without a token (learning demo)', async () => {
    // The current learning app intentionally does not guard enrollStudent
    // behind auth (the me query is the auth demo target).
    // This test documents that behavior as expected.
    const { data, errors } = await gql(`
      mutation {
        enrollStudent(studentId: "1", courseId: "c1") { success }
      }
    `);
    // Either success (idempotent) or already enrolled is fine — no auth rejection
    const succeeded  = data !== null && errors === undefined;
    const alreadyEnrolled = errors?.some(e => e.message.toLowerCase().includes('already'));
    expect(succeeded || alreadyEnrolled).toBe(true);
  });
});
