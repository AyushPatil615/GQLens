/**
 * Shared test helper — sends a GraphQL request to the running test server.
 *
 * Usage:
 *   const { data, errors } = await gql(`{ students { id name } }`);
 *   const { data }         = await gql(`query { me { id } }`, {}, token);
 */
export function baseUrl(): string {
  const url = process.env['TEST_SERVER_URL'];
  if (!url) throw new Error('TEST_SERVER_URL not set — did globalSetup run?');
  return url;
}

export interface GqlResponse<T = Record<string, unknown>> {
  data:   T | null;
  errors: Array<{ message: string; extensions?: { code: string; [k: string]: unknown } }> | undefined;
}

export async function gql<T = Record<string, unknown>>(
  query:     string,
  variables: Record<string, unknown> = {},
  authToken?: string,
): Promise<GqlResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${baseUrl()}/graphql`, {
    method:  'POST',
    headers,
    body:    JSON.stringify({ query, variables }),
  });
  return res.json() as Promise<GqlResponse<T>>;
}

/** Login as a demo user and return the token for use in auth-gated tests. */
export async function loginAs(username: 'alice' | 'bob' | 'charlie') {
  const passwords: Record<string, string> = {
    alice:   'admin123',
    bob:     'view123',
    charlie: 'guest123',
  };
  const { data } = await gql<{ login: { token: string } }>(
    `mutation Login($username: String!, $password: String!) {
       login(username: $username, password: $password) { token }
     }`,
    { username, password: passwords[username] },
  );
  if (!data?.login?.token) throw new Error(`Login as ${username} failed`);
  return data.login.token;
}
