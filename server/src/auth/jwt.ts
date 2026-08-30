/**
 * JWT utility for the Auth & Context Flow learning demo.
 * Uses only Node built-ins (crypto) — no external dependencies.
 *
 * Produces real HMAC-SHA256 signed JWTs (header.payload.signature).
 * Secret is read from JWT_SECRET env var (falls back to a dev default).
 * Tokens carry an `exp` claim and are rejected after expiry.
 */

export interface TokenPayload {
  userId: string;
  name:   string;
  role:   'ADMIN' | 'VIEWER';
  iat:    number; // issued-at  (unix ms)
  exp:    number; // expires-at (unix ms)
}

// ── Secret ────────────────────────────────────────────────────────────────────
// In production set JWT_SECRET to a long random string:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const SECRET = process.env.JWT_SECRET ?? 'gqlens-demo-secret-change-in-production';

// Token lifetime in seconds — default 1 hour
const EXPIRES_IN_SEC = Number(process.env.JWT_EXPIRES_IN ?? 3600);

// ── Base64url helpers ─────────────────────────────────────────────────────────
function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
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

// ── HMAC-SHA256 signature ─────────────────────────────────────────────────────
async function sign(data: string): Promise<string> {
  const { createHmac } = await import('crypto');
  return base64url(createHmac('sha256', SECRET).update(data).digest('base64'));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Issue a signed JWT for a demo user.
 * Format: <header>.<payload>.<signature>
 *
 * Includes:
 *   iat — issued-at timestamp (ms)
 *   exp — expiry timestamp    (ms)  → now + EXPIRES_IN_SEC seconds
 */
export async function issueToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
): Promise<string> {
  const now    = Date.now();
  const exp    = now + EXPIRES_IN_SEC * 1000;
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64url(JSON.stringify({ ...payload, iat: now, exp }));
  const sig    = await sign(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

/**
 * Verify and decode a token.
 * Returns null when the token is:
 *   - malformed (wrong number of segments)
 *   - tampered  (signature mismatch)
 *   - expired   (exp < now)
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;

    // 1. Verify signature
    const expectedSig = await sign(`${header}.${body}`);
    if (sig !== expectedSig) return null;

    // 2. Decode payload
    const payload = JSON.parse(fromBase64url(body)) as TokenPayload;

    // 3. Check expiry
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}
