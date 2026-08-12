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

// ─── Main ─────────────────────────────────────────────────────────────
export function RestComparison({ onTryDemo }: { onTryDemo: () => void }) {
  const [animStep, setAnimStep] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isIdle       = animStep === 0;
  const isAnimating  = animStep > 0 && animStep < 7;
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
