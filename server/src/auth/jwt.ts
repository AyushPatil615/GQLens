/**
 * Lightweight fake JWT for the Auth & Context Flow learning demo.
 * Uses only Node built-ins (crypto) — no external dependencies.
 *
 * The tokens are base64url-encoded JSON objects (not cryptographically
 * signed with a secret) — perfectly fine for a demo where the goal
 * is to teach the CONCEPT of context creation, not production security.
 */

export interface TokenPayload {
  userId: string;
  name:   string;
  role:   'ADMIN' | 'VIEWER';
  iat:    number; // issued-at (unix ms)
}

const FAKE_SECRET = 'graphscope-demo-secret';

function base64url(str: string): string {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function fromBase64url(str: string): string {
  const pad = (4 - (str.length % 4)) % 4;
  return Buffer.from(
    str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad),
    'base64',
  ).toString('utf8');
}

// Simple HMAC-SHA256 signature
async function sign(data: string): Promise<string> {
  const { createHmac } = await import('crypto');
  return base64url(createHmac('sha256', FAKE_SECRET).update(data).digest('base64'));
}

/**
 * Issue a fake JWT-style token for a demo user.
 * Format: <header>.<payload>.<signature>  (looks like a real JWT)
 */
export async function issueToken(payload: Omit<TokenPayload, 'iat'>): Promise<string> {
  const header  = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = base64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig     = await sign(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

/**
 * Verify and decode a token. Returns null if invalid / malformed.
 * (We only validate structure for the demo — no expiry checks.)
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = await sign(`${header}.${body}`);
    if (sig !== expectedSig) return null;
    return JSON.parse(fromBase64url(body)) as TokenPayload;
  } catch {
    return null;
  }
}
