import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantMetaphorDemo } from './RestaurantMetaphor';

// ─── Data ─────────────────────────────────────────────────────────────
interface RestCall {
  method:   string;
  url:      string;
  ms:       number;
  color:    string;
  desc:     string;
  response: string;
}

const REST_CALLS: RestCall[] = [
  { method: 'GET', url: '/api/students/1', ms: 45, color: '#FDA4AF', desc: 'Fetch student record',   response: '{ id: 1, name: "Alex Rivera", age: 21 }' },
  { method: 'GET', url: '/api/courses/c1',  ms: 38, color: '#FDB97D', desc: 'Fetch first course',    response: '{ id: "c1", title: "Intro to CS" }' },
  { method: 'GET', url: '/api/courses/c3',  ms: 35, color: '#FCA5A5', desc: 'Fetch second course',   response: '{ id: "c3", title: "Web Development" }' },
];
const TOTAL_REST_MS = REST_CALLS.reduce((s, c) => s + c.ms, 0); // 118
const GRAPHQL_MS    = 21;

// ─── Animation steps ───────────────────────────────────────────────────
// animStep: 0=idle, 1=r1 loading, 2=r1 done+r2 loading, 3=r2 done+r3 loading,
//           4=all REST done, 5=gql loading, 6=gql done, 7=stats
const STEP_DELAYS = [0, 700, 1300, 1800, 2150, 2500, 2850];

// ─── Sub-components ───────────────────────────────────────────────────
function LoadingBar({ color, duration }: { color: string; duration: number }) {
  return (
    <div style={{
      height: 5, borderRadius: 3,
      background: '#e5e7eb',
      overflow: 'hidden',
      flex: 1,
      border: '1.5px solid #000',
    }}>
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        style={{ height: '100%', background: color, borderRadius: 3 }}
      />
    </div>
  );
}

function RequestRow({
  call, state,
}: {
  call: RestCall;
  state: 'pending' | 'loading' | 'done';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: state === 'pending' ? 0.25 : 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '12px 14px',
        background: state === 'done' ? call.color + '25' : '#fff',
        border: `2px solid ${state === 'done' ? '#000' : '#e5e7eb'}`,
        boxShadow: state === 'done' ? '3px 3px 0 #000' : 'none',
        borderRadius: 10,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top row: method + url + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '2px 7px',
          borderRadius: 4, border: '1.5px solid #000',
          background: call.color,
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>
          {call.method}
        </span>

        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
          color: '#000', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {call.url}
        </span>

        {/* Status */}
        <AnimatePresence mode="wait">
          {state === 'loading' && (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, flexShrink: 0 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >⟳</motion.span>{' '}waiting…
            </motion.span>
          )}
          {state === 'done' && (
            <motion.span
              key="done"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                fontSize: 11, fontWeight: 800, color: '#000',
                background: call.color, border: '1.5px solid #000',
                padding: '1px 7px', borderRadius: 99, flexShrink: 0,
              }}
            >
              ✓ {call.ms}ms
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Loading bar (only while loading) */}
      <AnimatePresence>
        {state === 'loading' && (
          <motion.div
            key="bar"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <LoadingBar color={call.color} duration={call.ms * 14} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response (only when done) */}
      <AnimatePresence>
        {state === 'done' && (
          <motion.div
            key="resp"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              color: '#374151', fontWeight: 600,
              background: '#f9f5f0', border: '1.5px solid #d1d5db',
              padding: '5px 8px', borderRadius: 6,
            }}>
              ↩ {call.response}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Beginner Primer Drawer ───────────────────────────────────────────────────
function BeginnerPrimer() {
  const [open, setOpen] = useState(false);

  const TOPICS = [
    {
      emoji: '🌐',
      title: 'What is an API?',
      color: '#3B82F6',
      body: 'An API (Application Programming Interface) is the bridge between your app and a server. Think of it like a waiter at a restaurant — you (the client) tell the waiter (the API) what you want, the waiter goes to the kitchen (database), and returns with exactly what was ordered.',
      extra: null,
    },
    {
      emoji: '📋',
      title: 'What is REST?',
      color: '#F59E0B',
      body: 'REST is the most common API style. It maps resources to URLs. Each URL is a fixed "endpoint" — it always returns the same shape of data whether you need all of it or not.',
      extra: {
        label: 'HTTP Methods (the "verbs" of REST):',
        rows: [
          { method: 'GET',    color: '#22C55E', desc: 'Read data — "Give me student #1"' },
          { method: 'POST',   color: '#3B82F6', desc: 'Create — "Add a new student"' },
          { method: 'PUT',    color: '#F59E0B', desc: 'Update — "Change student #1\'s name"' },
          { method: 'DELETE', color: '#EF4444', desc: 'Delete — "Remove student #1"' },
        ],
      },
    },
    {
      emoji: '📦',
      title: 'The REST Problem — Overfetching',
      color: '#EF4444',
      body: 'REST endpoints return everything, even fields you don\'t need. To show a student\'s name and courses, you make 3 separate requests — one after another. This is slow and wasteful.',
      extra: {
        label: 'Example — 3 round trips just to show a profile:',
        code: `GET /api/students/1\n→ { id, name, age, address, phone, … }\n\nGET /api/students/1/courses\n→ [ { id, title, instructor, credits, … } ]\n\nGET /api/instructors/42\n→ { id, name, bio, office, … }`,
      },
    },
    {
      emoji: '⚡',
      title: 'What is GraphQL?',
      color: '#8B5CF6',
      body: 'GraphQL (invented at Facebook in 2012, open-sourced 2015) replaces many REST endpoints with a single endpoint. You write a query describing exactly which fields you want. The server returns only those fields — nothing more, nothing less.',
      extra: {
        label: 'Same data — ONE request:',
        code: `query {\n  student(id: "1") {\n    name         # only what I need\n    courses {\n      title\n      instructor { name }\n    }\n  }\n}`,
      },
    },
    {
      emoji: '🔄',
      title: 'REST vs GraphQL — Side by Side',
      color: '#22C55E',
      body: null,
      extra: {
        label: null,
        table: [
          ['Feature',          'REST',                     'GraphQL'],
          ['Endpoints',        'Many (one per resource)',   'One (/graphql)'],
          ['Response shape',   'Fixed by server',          'Defined by client'],
          ['Overfetching',     '✅ Common problem',         '❌ Eliminated'],
          ['Underfetching',    '✅ Requires extra requests','❌ One query does it all'],
          ['Type system',      '❌ No built-in',           '✅ Strongly typed schema'],
          ['Introspection',    '❌ No standard',           '✅ Query the schema itself'],
          ['Real-time',        '❌ Polling or webhooks',   '✅ Subscriptions built-in'],
        ],
      },
    },
    {
      emoji: '🔑',
      title: 'Key GraphQL Concepts',
      color: '#EC4899',
      body: null,
      extra: {
        label: null,
        glossary: [
          ['Schema',      '#C4B5FD', 'The "menu" — defines every type and operation available'],
          ['Query',       '#86EFAC', 'A read operation (equivalent to GET in REST)'],
          ['Mutation',    '#FDB97D', 'A write operation (create/update/delete)'],
          ['Resolver',    '#87CEEF', 'The function that actually fetches the data for a field'],
          ['Type',        '#FDA4AF', 'A named shape: type Student { id: ID!, name: String! }'],
          ['Field',       '#C4B5FD', 'A single piece of data inside a type (like name or age)'],
          ['Subscription','#86EFAC', 'Real-time: the server pushes data when it changes'],
          ['Introspection','#FDB97D', 'Querying GraphQL to discover what queries are possible'],
        ],
      },
    },
  ];

  return (
    <>
      {/* FAB Button — top left, below header */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05, x: 2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          position: 'fixed',
          top: 68,        // below 54px header
          left: 20,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 14px',
          background: '#fff',
          border: '2.5px solid #000',
          borderRadius: 999,
          boxShadow: '3px 3px 0 #000',
          cursor: 'pointer',
          fontWeight: 800,
          fontSize: 12,
          fontFamily: 'var(--font-sans)',
          color: '#000',
        }}
      >
        <span style={{ fontSize: 14 }}>💡</span>
        <span>New to APIs?</span>
        <span style={{
          fontSize: 9.5, fontWeight: 900,
          background: '#FDB97D', color: '#000',
          padding: '1px 6px', borderRadius: 100,
          border: '1.5px solid #000',
        }}>START HERE</span>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 200,
              backdropFilter: 'blur(3px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Side Drawer — slides from LEFT */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, bottom: 0,
              width: 'min(480px, 95vw)',
              zIndex: 300,
              background: '#FFF8F0',
              borderRight: '3px solid #000',
              boxShadow: '6px 0 0 #000',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              background: '#000',
              borderBottom: '2.5px solid #000',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}>
              <span style={{ fontSize: 22 }}>💡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Beginner's Primer</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>APIs, REST & GraphQL — explained from scratch</div>
              </div>
              <motion.button
                onClick={() => setOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: '#1E293B', border: '2px solid #334155',
                  borderRadius: 8, color: '#94A3B8', cursor: 'pointer',
                  fontSize: 15, width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, flexShrink: 0,
                }}
              >✕</motion.button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '16px 18px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Intro note */}
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: '#F0FDF4', border: '2px solid #22C55E',
                fontSize: 12, color: '#166534', lineHeight: 1.6, fontWeight: 500,
              }}>
                👋 Already know REST and GraphQL? <strong>Close this</strong> and dive right in.<br/>
                New here? Read on — you'll be ready in <strong>3 minutes</strong>.
              </div>

              {TOPICS.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    border: `2.5px solid ${t.color}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: `3px 3px 0 ${t.color}`,
                    background: '#fff',
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '9px 14px',
                    background: `${t.color}18`,
                    borderBottom: `1.5px solid ${t.color}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 900, color: t.color }}>{t.title}</span>
                  </div>

                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Body text */}
                    {t.body && (
                      <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.7, fontWeight: 500 }}>
                        {t.body}
                      </p>
                    )}

                    {/* HTTP methods rows */}
                    {t.extra && 'rows' in t.extra && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.extra.label}</div>
                        {t.extra.rows!.map((r: { method: string; color: string; desc: string }) => (
                          <div key={r.method} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: r.color, background: `${r.color}18`, padding: '2px 8px', borderRadius: 4, border: `1.5px solid ${r.color}`, fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 52, textAlign: 'center' }}>{r.method}</span>
                            <span style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.5 }}>{r.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Code block */}
                    {t.extra && 'code' in t.extra && (
                      <div>
                        {t.extra.label && <div style={{ fontSize: 10, fontWeight: 900, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.extra.label}</div>}
                        <pre style={{
                          margin: 0, padding: '10px 12px',
                          background: '#0F172A', borderRadius: 8,
                          border: '2px solid #1E293B',
                          fontSize: 10.5, fontFamily: 'var(--font-mono)',
                          color: '#86EFAC', lineHeight: 1.7,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>{t.extra.code}</pre>
                      </div>
                    )}

                    {/* Comparison table */}
                    {t.extra && 'table' in t.extra && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          {t.extra.table!.map((row: string[], ri: number) => (
                            <tr key={ri} style={{ background: ri === 0 ? '#0F172A' : ri % 2 === 0 ? '#F8FAFC' : '#fff' }}>
                              {row.map((cell: string, ci: number) => (
                                <td key={ci} style={{
                                  padding: '6px 10px',
                                  border: '1.5px solid #E5E7EB',
                                  fontWeight: ri === 0 ? 900 : ci === 0 ? 700 : 500,
                                  color: ri === 0 ? '#fff' : ci === 0 ? '#111827' : '#374151',
                                  fontSize: ri === 0 ? 10 : 11,
                                  textTransform: ri === 0 ? 'uppercase' : 'none',
                                  letterSpacing: ri === 0 ? '0.05em' : 'normal',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </table>
                      </div>
                    )}

                    {/* Glossary */}
                    {t.extra && 'glossary' in t.extra && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {t.extra.glossary!.map(([term, color, def]: string[]) => (
                          <div key={term} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 900,
                              color: '#000', background: color,
                              padding: '2px 7px', borderRadius: 4,
                              fontFamily: 'var(--font-mono)',
                              flexShrink: 0, marginTop: 2,
                              border: '1.5px solid #000',
                            }}>{term}</span>
                            <span style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.5 }}>{def}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* CTA */}
              <motion.button
                onClick={() => setOpen(false)}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                style={{
                  padding: '12px 18px',
                  background: '#000', color: '#fff',
                  border: '2.5px solid #000', borderRadius: 10,
                  fontWeight: 900, fontSize: 13, cursor: 'pointer',
                  boxShadow: '4px 4px 0 #555',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Got it — show me the REST problem →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────
export function RestComparison({ onTryDemo }: { onTryDemo: () => void }) {
  const [animStep, setAnimStep] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isIdle       = animStep === 0;
  const isDone       = animStep >= 7;

  // Per-REST-call state
  const getCallState = (i: number): 'pending' | 'loading' | 'done' => {
    if (animStep < i + 1)  return 'pending';
    if (animStep === i + 1) return 'loading';
    return 'done';
  };

  const gqlLoading = animStep === 5;
  const gqlDone    = animStep >= 6;

  const startAnimation = useCallback(() => {
    // Clear any lingering timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setAnimStep(0);

    STEP_DELAYS.forEach((delay, i) => {
      const t = setTimeout(() => setAnimStep(i + 1), delay + 50);
      timersRef.current.push(t);
    });
  }, []);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    setAnimStep(0);
  }, []);

  const FLOATERS = [
    { char: '⬡', color: '#87CEEF', top: '10%',   left: '2%',   size: 26 },
    { char: '●', color: '#FDB97D', top: '20%',   right: '2%',  size: 16 },
    { char: '✦', color: '#FDA4AF', bottom: '20%', left: '1.5%', size: 20 },
    { char: '▲', color: '#C4B5FD', bottom: '15%', right: '2%',  size: 14 },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(circle, #d4c5b5 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      position: 'relative', overflowX: 'hidden',
    }}>
      {/* Floaters */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {FLOATERS.map((f, i) => (
          <motion.span key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            style={{ position: 'absolute', color: f.color, fontSize: f.size, fontWeight: 900,
              top: (f as any).top, left: (f as any).left,
              right: (f as any).right, bottom: (f as any).bottom }}
          >{f.char}</motion.span>
        ))}
      </div>

      {/* Floating Beginner Primer */}
      <BeginnerPrimer />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 44 }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>😩</div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900,
            color: '#000', fontFamily: 'var(--font-sans)',
            letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 14,
          }}>
            Why REST APIs Struggle<br />with Complex Data
          </h1>

          {/* Rainbow underline */}
          <div style={{
            width: 200, height: 4, margin: '0 auto 20px',
            background: 'linear-gradient(to right, #87CEEF, #C4B5FD, #FDA4AF, #FDB97D, #FCA5A5, #86EFAC)',
            borderRadius: 99,
          }} />

          <p style={{
            fontSize: 15, color: 'var(--text-mid)', fontWeight: 600,
            maxWidth: 520, margin: '0 auto', lineHeight: 1.75,
          }}>
            To fetch one student's name, age, and enrolled courses,
            a REST API makes <strong style={{ color: '#000' }}>3 separate network requests</strong> — one after another.
            Watch how fast that adds up.
          </p>
        </motion.div>

        {/* ── Interactive Restaurant Metaphor ── */}
        <RestaurantMetaphorDemo />

        {/* ── Animation area ── */}
        <div style={{
          background: '#fff',
          border: 'var(--border)',
          boxShadow: 'var(--shadow-md)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {/* Card header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: 'var(--border-2)',
            background: '#f9f5f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-sans)', color: '#000' }}>
              🌐 Network Requests — fetching Alex Rivera's profile
            </span>
            {!isIdle && (
              <button
                onClick={reset}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px',
                  border: 'var(--border-2)', borderRadius: 6,
                  background: '#fff', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                ↺ Reset
              </button>
            )}
          </div>

          <div style={{ padding: '20px 20px 24px' }}>

            {/* ── REST section ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  padding: '3px 10px', borderRadius: 99,
                  background: '#FDA4AF', border: '2px solid #000',
                  boxShadow: '2px 2px 0 #000',
                  fontFamily: 'var(--font-mono)',
                }}>
                  REST API
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-grey)' }}>
                  sequential requests — each must wait for the previous
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 99,
                  background: '#FEF9C3', border: '1.5px solid #d97706',
                  color: '#92400e', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  ★ simulated timings
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REST_CALLS.map((call, i) => (
                  <AnimatePresence key={call.url}>
                    {animStep >= i + 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <RequestRow call={call} state={getCallState(i)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))}
              </div>

              {/* REST total */}
              <AnimatePresence>
                {animStep >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      marginTop: 12, padding: '10px 14px',
                      background: '#fff0f0',
                      border: '2px solid #000',
                      boxShadow: '3px 3px 0 #000',
                      borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#000', fontFamily: 'var(--font-sans)' }}>
                      REST total
                    </span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#000',
                        background: '#FCA5A5', border: '1.5px solid #000',
                        padding: '2px 8px', borderRadius: 99,
                      }}>
                        3 requests
                      </span>
                      <span style={{
                        fontSize: 15, fontWeight: 900, color: '#000',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {TOTAL_REST_MS}ms
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Divider ── */}
            <AnimatePresence>
              {animStep >= 5 && (
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  style={{
                    height: 2,
                    background: 'linear-gradient(to right, #87CEEF, #C4B5FD, #FDA4AF, #FDB97D, #FCA5A5, #86EFAC)',
                    borderRadius: 99, marginBottom: 20,
                  }}
                />
              )}
            </AnimatePresence>

            {/* ── GraphQL section ── */}
            <AnimatePresence>
              {animStep >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      padding: '3px 10px', borderRadius: 99,
                      background: '#86EFAC', border: '2px solid #000',
                      boxShadow: '2px 2px 0 #000',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      GraphQL
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-grey)' }}>
                      one request — gets everything you asked for
                    </span>
                  </div>

                  {/* GraphQL request row */}
                  <div style={{
                    padding: '12px 14px',
                    background: gqlDone ? '#86EFAC25' : '#fff',
                    border: `2px solid ${gqlDone ? '#000' : '#e5e7eb'}`,
                    boxShadow: gqlDone ? '3px 3px 0 #000' : 'none',
                    borderRadius: 10,
                    transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 7px',
                        borderRadius: 4, border: '1.5px solid #000',
                        background: '#86EFAC',
                        fontFamily: 'var(--font-mono)', flexShrink: 0,
                      }}>
                        POST
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#000', flex: 1,
                      }}>
                        /graphql
                      </span>
                      <AnimatePresence mode="wait">
                        {gqlLoading && (
                          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⟳</motion.span> waiting…
                          </motion.span>
                        )}
                        {gqlDone && (
                          <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            style={{
                              fontSize: 11, fontWeight: 800, color: '#000',
                              background: '#86EFAC', border: '1.5px solid #000',
                              padding: '1px 7px', borderRadius: 99,
                            }}>
                            ✓ {GRAPHQL_MS}ms
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {gqlLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LoadingBar color="#86EFAC" duration={GRAPHQL_MS * 14} />
                      </div>
                    )}

                    {gqlDone && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10.5,
                          color: '#374151', fontWeight: 600,
                          background: '#f9f5f0', border: '1.5px solid #d1d5db',
                          padding: '5px 8px', borderRadius: 6,
                        }}>
                          ↩ {'{ student: { name: "Alex Rivera", age: 21, courses: [{…}, {…}] } }'}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* GraphQL total */}
                  {gqlDone && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        marginTop: 10, padding: '10px 14px',
                        background: '#f0fff4',
                        border: '2px solid #000',
                        boxShadow: '3px 3px 0 #000',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#000', fontFamily: 'var(--font-sans)' }}>
                        GraphQL total
                      </span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          background: '#86EFAC', border: '1.5px solid #000',
                          padding: '2px 8px', borderRadius: 99,
                        }}>
                          1 request
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                          {GRAPHQL_MS}ms
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Start button ── */}
            {isIdle && (
              <motion.button
                onClick={startAnimation}
                whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0 #000' }}
                whileTap={{ x: 0, y: 0, boxShadow: '2px 2px 0 #000' }}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: '#FF6B6B', border: 'var(--border)',
                  boxShadow: '5px 5px 0 #000',
                  borderRadius: 10, color: '#fff',
                  fontSize: 15, fontWeight: 900,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                ▶  Watch the REST Waterfall
              </motion.button>
            )}
          </div>
        </div>

        {/* ── Stats comparison ── */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Key numbers */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20,
              }}>
                {[
                  { icon: '⚡', stat: `${(TOTAL_REST_MS / GRAPHQL_MS).toFixed(1)}×`, label: 'faster', sub: `${TOTAL_REST_MS}ms → ${GRAPHQL_MS}ms`, color: '#86EFAC' },
                  { icon: '📦', stat: '3×',  label: 'fewer requests', sub: '3 requests → 1 request', color: '#87CEEF' },
                  { icon: '🎯', stat: '0',   label: 'over-fetching', sub: 'only fields you asked for', color: '#C4B5FD' },
                ].map(s => (
                  <motion.div
                    key={s.stat}
                    whileHover={{ y: -3, boxShadow: '6px 6px 0 #000' }}
                    style={{
                      padding: '16px 14px', textAlign: 'center',
                      background: '#fff', border: 'var(--border)',
                      boxShadow: 'var(--shadow-md)', borderRadius: 12,
                      cursor: 'default',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{
                      fontSize: 28, fontWeight: 900, color: '#000',
                      fontFamily: 'var(--font-sans)', lineHeight: 1,
                      background: s.color, borderRadius: 6, padding: '2px 6px',
                      display: 'inline-block', marginBottom: 4,
                    }}>{s.stat}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#000', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-grey)', fontWeight: 600 }}>{s.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                onClick={onTryDemo}
                whileHover={{ x: -3, y: -3, boxShadow: '8px 8px 0 #000' }}
                whileTap={{ x: 0, y: 0, boxShadow: '2px 2px 0 #000' }}
                style={{
                  width: '100%', padding: '16px 24px',
                  background: '#000', border: 'var(--border)',
                  boxShadow: '5px 5px 0 #374151',
                  borderRadius: 10, color: '#fff',
                  fontSize: 15, fontWeight: 900,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                ✨ Now see GraphQL in action
                <span style={{ fontSize: 18 }}>→</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
