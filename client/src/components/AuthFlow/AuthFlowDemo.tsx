import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '../../config/api';

// ─── Types ─────────────────────────────────────────────────────────────
interface AuthUser { id: string; name: string; role: string; }
interface LoginResult { token: string; user: AuthUser; }
type FlowStep = 'idle' | 'request' | 'context' | 'resolver' | 'response';

// ─── Demo User Presets ─────────────────────────────────────────────────
const DEMO_USERS = [
  { username: 'alice',   password: 'admin123', role: 'ADMIN',  color: '#86EFAC', emoji: '👩‍💼' },
  { username: 'bob',     password: 'view123',  role: 'VIEWER', color: '#93C5FD', emoji: '👨‍💻' },
  { username: 'charlie', password: 'guest123', role: 'VIEWER', color: '#FCD34D', emoji: '🧑‍🎓' },
];

// ─── Animated Flow Diagram ─────────────────────────────────────────────
function FlowDiagram({ step, token, user }: { step: FlowStep; token: string | null; user: AuthUser | null }) {
  const stages: { key: FlowStep; label: string; sub: string; emoji: string }[] = [
    { key: 'request',  label: 'HTTP Request',  sub: 'Authorization: Bearer ...', emoji: '📡' },
    { key: 'context',  label: 'context() fn',  sub: 'server/src/index.ts',       emoji: '⚙️' },
    { key: 'resolver', label: 'ctx.user',       sub: '3rd resolver arg',          emoji: '🔐' },
    { key: 'response', label: 'Response',       sub: 'data: { me: {...} }',       emoji: '✅' },
  ];

  const activeIdx = stages.findIndex(s => s.key === step);

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* Node row with inline arrows */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {stages.map((s, i) => {
          const isActive = s.key === step;
          const isDone   = activeIdx > i;

          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              {/* Node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
                <motion.div
                  animate={{
                    background: isActive ? '#000' : isDone ? '#22C55E' : '#F3F4F6',
                    scale:      isActive ? 1.1 : 1,
                    boxShadow:  isActive ? '0 0 0 3px #000' : isDone ? '2px 2px 0 #000' : '2px 2px 0 #D1D5DB',
                  }}
                  transition={{ duration: 0.25 }}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '2.5px solid #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                    color: isActive || isDone ? '#fff' : '#374151',
                  }}
                >
                  {isDone ? '✓' : s.emoji}
                </motion.div>
                <div style={{ textAlign: 'center', padding: '0 2px' }}>
                  <div style={{
                    fontSize: 10.5, fontWeight: 900,
                    color: isActive ? '#000' : '#6B7280',
                    whiteSpace: 'nowrap',
                  }}>{s.label}</div>
                  <div style={{
                    fontSize: 9, color: '#9CA3AF',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: 80,
                  }}>{s.sub}</div>
                </div>
              </div>

              {/* Arrow connector between nodes */}
              {i < stages.length - 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  paddingTop: 14, flexShrink: 0,
                }}>
                  <motion.span
                    animate={{ color: activeIdx > i ? '#22C55E' : '#D1D5DB' }}
                    style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}
                  >→</motion.span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Token / user info badges */}
      <AnimatePresence>
        {token && step !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 12, padding: '7px 11px',
              borderRadius: 8, border: '2px solid #000', boxShadow: '2px 2px 0 #000',
              background: '#F0FDF4', fontSize: 10.5,
              fontFamily: 'var(--font-mono)', wordBreak: 'break-all', lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 900, color: '#166534' }}>Authorization: </span>
            <span style={{ color: '#374151' }}>Bearer {token.slice(0, 44)}…</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {user && (step === 'resolver' || step === 'response') && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 8, padding: '8px 12px',
              borderRadius: 8, border: '2px solid #000', boxShadow: '2px 2px 0 #000',
              background: '#EFF6FF', fontSize: 11,
              fontFamily: 'var(--font-mono)', lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 900, color: '#1D4ED8' }}>context.user = </span>
            <span style={{ color: '#374151' }}>{'{ '}id: "{user.id}", name: "{user.name}", role: "{user.role}"{' }'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Code Snippet Panel ────────────────────────────────────────────────
function CodeSnippet({ step, user }: { step: FlowStep; user: AuthUser | null }) {
  const snippets: Partial<Record<FlowStep, { file: string; code: string }>> = {
    request: {
      file: 'HTTP Request',
      code: `fetch('/graphql', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'Authorization': 'Bearer eyJhbGc...',\n  },\n  body: JSON.stringify({ query: '{ me { id name role } }' }),\n})`,
    },
    context: {
      file: 'server/src/index.ts',
      code: `// context() runs before EVERY resolver\ncontext: async ({ req }) => {\n  const authHeader = req.headers['authorization'];\n  let user = null;\n  if (authHeader?.startsWith('Bearer ')) {\n    const token = authHeader.slice(7);\n    const payload = await verifyToken(token);\n    if (payload) user = payload; // ← decoded!\n  }\n  return { requestId, user };  // ← injected into ctx\n}`,
    },
    resolver: {
      file: 'server/src/resolvers/index.ts',
      code: `// Every resolver receives (parent, args, context, info)\nasync me(_: unknown, __: unknown, ctx: AppContext) {\n  //                                    ^\n  //                            ctx.user is here!\n  if (!ctx.user) {\n    throw new Error('Unauthenticated!');\n  }\n  return ctx.user; // { id, name, role }\n}`,
    },
    response: {
      file: 'GraphQL Response',
      code: user
        ? `{\n  "data": {\n    "me": {\n      "id": "${user.id}",\n      "name": "${user.name}",\n      "role": "${user.role}"\n    }\n  }\n}`
        : `{\n  "data": { "me": null },\n  "errors": [{\n    "message": "Unauthenticated: provide an Authorization header.",\n    "path": ["me"]\n  }]\n}`,
    },
  };

  const snippet = snippets[step];
  if (!snippet) return (
    <div style={{
      padding: 16, borderRadius: 8, background: '#0F172A',
      border: '2px solid #000', color: '#64748B',
      fontSize: 12, fontFamily: 'var(--font-mono)',
      minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      Login to see the code flow…
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div style={{
          fontSize: 10, fontWeight: 800, color: '#94A3B8',
          fontFamily: 'var(--font-mono)', marginBottom: 6,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          📄 {snippet.file}
        </div>
        <pre style={{
          padding: '12px 14px', borderRadius: 8,
          background: '#0F172A', border: '2px solid #000',
          color: '#E2E8F0', fontSize: 11.5,
          fontFamily: 'var(--font-mono)', lineHeight: 1.7,
          overflow: 'auto', maxHeight: 240, margin: 0,
        }}>
          {snippet.code}
        </pre>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Me Query Panel ─────────────────────────────────────────────────────
function MeQueryPanel({ token }: { token: string | null }) {
  const [result, setResult]   = useState<{ data?: { me: AuthUser | null }, errors?: {message:string}[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const runMe = useCallback(async (useToken: boolean) => {
    setLoading(true);
    setResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (useToken && token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${getApiBaseUrl()}/graphql`, {
        method: 'POST', headers,
        body: JSON.stringify({ query: '{ me { id name role } }' }),
      });
      const json = await res.json() as { data?: { me: AuthUser | null }, errors?: {message:string; path?: string[]}[] };
      // Strip server-side stacktraces from errors — they are noise for the learning demo
      if (json.errors) {
        json.errors = json.errors.map(e => ({ message: e.message, path: e.path }));
      }
      setResult(json);
    } finally {
      setLoading(false);
    }
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6B7280' }}>
        🧪 Try the <code style={{ fontFamily: 'var(--font-mono)', textTransform: 'none' }}>me</code> Query Live
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: '✅ With Token', useToken: true,  bg: '#22C55E' },
          { label: '❌ Without Token', useToken: false, bg: '#EF4444' },
        ].map(btn => (
          <motion.button
            key={String(btn.useToken)}
            whileTap={{ scale: 0.97 }}
            onClick={() => runMe(btn.useToken)}
            disabled={!token && btn.useToken}
            style={{
              flex: 1, padding: '8px 10px',
              border: '2.5px solid #000', borderRadius: 8,
              background: !token && btn.useToken ? '#F3F4F6' : btn.bg,
              color: !token && btn.useToken ? '#9CA3AF' : '#fff',
              fontWeight: 800, fontSize: 11.5, cursor: 'pointer',
              boxShadow: '2px 2px 0 #000',
            }}
          >
            {btn.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: 12, textAlign: 'center', fontSize: 20 }}>⏳</motion.div>
        ) : result ? (
          <motion.pre
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 12px', borderRadius: 8,
              background: result.errors ? '#FEF2F2' : '#F0FDF4',
              border: `2px solid ${result.errors ? '#EF4444' : '#22C55E'}`,
              boxShadow: '2px 2px 0 #000',
              fontSize: 11, fontFamily: 'var(--font-mono)',
              lineHeight: 1.6, overflow: 'auto', margin: 0,
              color: '#1F2937',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </motion.pre>
        ) : null}
      </AnimatePresence>

      {!token && (
        <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
          ↑ Login first to get a token, then test the query
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export function AuthFlowDemo() {
  const [token,     setToken]     = useState<string | null>(null);
  const [authUser,  setAuthUser]  = useState<AuthUser | null>(null);
  const [flowStep,  setFlowStep]  = useState<FlowStep>('idle');
  const [loginErr,  setLoginErr]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState<number | null>(null);

  const doLogin = useCallback(async (idx: number) => {
    const u = DEMO_USERS[idx];
    setSelected(idx);
    setLoading(true);
    setLoginErr(null);
    setToken(null);
    setAuthUser(null);

    // Animate through the flow steps
    setFlowStep('request');
    await new Promise(r => setTimeout(r, 600));
    setFlowStep('context');
    await new Promise(r => setTimeout(r, 700));

    try {
      const res = await fetch(`${getApiBaseUrl()}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { login(username: "${u.username}", password: "${u.password}") { token user { id name role } } }`,
        }),
      });
      const json = await res.json() as { data?: { login: LoginResult }; errors?: {message:string}[] };

      if (json.errors?.length) throw new Error(json.errors[0].message);
      const result = json.data!.login;

      setToken(result.token);
      setAuthUser(result.user);
      setFlowStep('resolver');
      await new Promise(r => setTimeout(r, 600));
      setFlowStep('response');
    } catch (e) {
      setLoginErr(e instanceof Error ? e.message : 'Login failed');
      setFlowStep('idle');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{
      background: '#FFF8F0',
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: '#0F172A',
        borderBottom: '3px solid #000',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🔐</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-sans)' }}>
            Auth & Context Flow
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
            How <code style={{ fontFamily: 'var(--font-mono)', color: '#7DD3FC' }}>Authorization</code> headers flow through
            context() into every resolver as <code style={{ fontFamily: 'var(--font-mono)', color: '#86EFAC' }}>ctx.user</code>
          </div>
        </div>
      </div>

      {/* Theory banner */}
      <div style={{
        padding: '10px 18px',
        background: '#EFF6FF',
        borderBottom: '2px solid #000',
        fontSize: 12, color: '#1E40AF', lineHeight: 1.6,
      }}>
        <strong>How it works:</strong> There are no route-level auth middlewares in GraphQL.
        Instead, the <code style={{ fontFamily: 'var(--font-mono)' }}>context()</code> function runs once per request,
        reads the <code style={{ fontFamily: 'var(--font-mono)' }}>Authorization</code> header, verifies the token,
        and injects <code style={{ fontFamily: 'var(--font-mono)' }}>ctx.user</code> which is then accessible as
        the 3rd argument to <strong>every resolver</strong> in your schema.
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0 }}>

        {/* Left column: Login */}
        <div style={{
          padding: '18px',
          borderRight: '2px solid #000',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#6B7280',
          }}>
            👤 Step 1 — Login as a Demo User
          </div>

          <div style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.5 }}>
            Pick a user to simulate a login. The server validates credentials and issues a JWT token.
          </div>

          {DEMO_USERS.map((u, i) => (
            <motion.button
              key={u.username}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => !loading && doLogin(i)}
              style={{
                padding: '12px 14px',
                border: `2.5px solid #000`,
                borderRadius: 10,
                background: selected === i ? u.color : '#fff',
                fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                boxShadow: selected === i ? '3px 3px 0 #000' : '2px 2px 0 #000',
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
            >
              <span style={{ fontSize: 24 }}>{u.emoji}</span>
              <div>
                <div style={{ fontWeight: 900 }}>{u.username}</div>
                <div style={{
                  fontSize: 10.5, fontWeight: 600, color: '#6B7280',
                  fontFamily: 'var(--font-mono)',
                }}>
                  role: {u.role} · password: {u.password}
                </div>
              </div>
              {selected === i && loading && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  style={{ marginLeft: 'auto', fontSize: 16 }}
                >⏳</motion.span>
              )}
              {selected === i && !loading && authUser && (
                <span style={{ marginLeft: 'auto' }}>✓</span>
              )}
            </motion.button>
          ))}

          {loginErr && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '8px 12px', borderRadius: 8,
                background: '#FEE2E2', border: '2px solid #EF4444',
                fontSize: 11.5, color: '#991B1B', fontWeight: 600,
              }}
            >
              ❌ {loginErr}
            </motion.div>
          )}

          {/* Token display */}
          <AnimatePresence>
            {token && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: '#F0FDF4', border: '2px solid #000',
                  boxShadow: '2px 2px 0 #000',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 900, color: '#166534', marginBottom: 4 }}>
                  🔑 TOKEN ISSUED
                </div>
                <div style={{
                  fontSize: 9.5, fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-all', color: '#374151', lineHeight: 1.5,
                }}>
                  {token.slice(0, 80)}…
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: '#6B7280' }}>
                  Format: <span style={{ fontFamily: 'var(--font-mono)', color: '#EF4444' }}>header</span>
                  .<span style={{ fontFamily: 'var(--font-mono)', color: '#3B82F6' }}>payload</span>
                  .<span style={{ fontFamily: 'var(--font-mono)', color: '#22C55E' }}>signature</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Flow + Code + Live Query */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Flow diagram */}
          <div style={{ padding: '18px', borderBottom: '2px solid #000' }}>
            <div style={{
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: '#6B7280', marginBottom: 12,
            }}>
              🌊 Step 2 — Watch the Flow
            </div>
            <FlowDiagram step={flowStep} token={token} user={authUser} />
          </div>

          {/* Code snippet */}
          <div style={{ padding: '18px', borderBottom: '2px solid #000' }}>
            <div style={{
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: '#6B7280', marginBottom: 12,
            }}>
              💻 Step 3 — See the Code
            </div>
            <CodeSnippet step={flowStep} user={authUser} />
          </div>

          {/* Live me query */}
          <div style={{ padding: '18px' }}>
            <MeQueryPanel token={token} />
          </div>
        </div>
      </div>

      {/* Resolver signature reference */}
      <div style={{
        padding: '12px 18px',
        background: '#F8FAFC',
        borderTop: '2px solid #000',
      }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          📌 The 4 Resolver Arguments (always the same signature)
        </div>
        <pre style={{
          margin: 0, fontSize: 11.5, fontFamily: 'var(--font-mono)',
          color: '#1F2937', lineHeight: 1.7,
          background: 'transparent',
        }}>
{`resolver(
  parent,    // parent object (for nested resolvers)
  args,      // { id: "1", failAge: true, ... }
  context,   // { user, requestId, ... } ← built by context()
  info       // GraphQLResolveInfo — path, returnType, etc
)`}
        </pre>
      </div>
    </div>
  );
}
