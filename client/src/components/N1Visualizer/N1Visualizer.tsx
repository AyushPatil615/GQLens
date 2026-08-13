import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────────────
interface DbQueryEvent {
  step: string;
  ms: number;
  caption: string;
  kind: 'students' | 'n1' | 'batched';
  index: number; // 1-based display index
}

type Phase = 'idle' | 'running' | 'complete' | 'error';

const N1_QUERY = `query {
  studentsWithCourses {
    name
    courses {
      title
    }
  }
}`;

// ─── Color helpers ─────────────────────────────────────────────────────
function queryColor(kind: DbQueryEvent['kind'], dataLoaderEnabled: boolean): string {
  if (kind === 'students') return '#93C5FD'; // always blue
  if (dataLoaderEnabled) return '#86EFAC';   // green = fast batched
  return '#FCA5A5';                           // red = N+1 problem
}

function queryLabel(kind: DbQueryEvent['kind'], dataLoaderEnabled: boolean): string {
  if (kind === 'students') return '📋 Fetch All Students';
  if (dataLoaderEnabled)   return '⚡ Batched Courses (DataLoader)';
  return '🔄 Fetch Courses (N+1)';
}

// ─── Main component ────────────────────────────────────────────────────
export function N1Visualizer() {
  const [dataLoaderEnabled, setDataLoaderEnabled] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [events, setEvents] = useState<DbQueryEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventIndexRef = useRef(0);

  const isRunning  = phase === 'running';
  const isComplete = phase === 'complete';
  const isError    = phase === 'error';

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setPhase('idle');
    setEvents([]);
    setErrorMsg(null);
    eventIndexRef.current = 0;
  }, []);

  const runDemo = useCallback(async (useDL: boolean) => {
    if (isRunning) return;
    reset();
    setPhase('running');
    setEvents([]);
    eventIndexRef.current = 0;

    const requestId = crypto.randomUUID();

    // Timeout watchdog
    timeoutRef.current = setTimeout(() => {
      esRef.current?.close();
      esRef.current = null;
      setPhase('error');
      setErrorMsg('Server did not respond in time. Make sure the backend is running on port 4000.');
    }, 10_000);

    // Open SSE connection
    const es = new EventSource(`/events?requestId=${requestId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as { step: string; ms: number; caption: string };

        if (event.step === '__done__') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPhase('complete');
          es.close();
          esRef.current = null;
          return;
        }

        // Only capture DB-level events relevant to this demo
        let kind: DbQueryEvent['kind'] | null = null;
        if (event.step === 'db:query:students')    kind = 'students';
        else if (event.step === 'db:query:batched') kind = 'batched';
        else if (event.step.startsWith('db:query:n1:')) kind = 'n1';

        if (kind) {
          const idx = ++eventIndexRef.current;
          setEvents(prev => [...prev, {
            step:    event.step,
            ms:      event.ms,
            caption: event.caption,
            kind,
            index:   idx,
          }]);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('error');
      setErrorMsg('Could not connect to the server. Is it running on port 4000?');
      es.close();
    };

    // Wait for SSE to be ready
    await new Promise(resolve => setTimeout(resolve, 80));

    // Fire the GraphQL query
    try {
      const res = await fetch('/graphql', {
        method:  'POST',
        headers: {
          'Content-Type':         'application/json',
          'x-request-id':         requestId,
          'x-domain-id':          'education',
          'x-dataloader-enabled': useDL ? 'true' : 'false',
        },
        body: JSON.stringify({ query: N1_QUERY }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      es.close();
    }
  }, [isRunning, reset]);

  // ── Derived UI state ──────────────────────────────────────────────
  const totalMs = events.reduce((s, e) => s + e.ms, 0);
  const nStudentQueries = events.filter(e => e.kind === 'n1').length;
  const isN1Problem = !dataLoaderEnabled;
  const queryCount = events.length;

  const btnBg     = isRunning ? '#FDB97D' : isError ? '#FCA5A5' : isComplete ? '#86EFAC' : '#FF6B6B';
  const btnShadow = isRunning ? 'none' : '5px 5px 0 #000';

  function handleToggle() {
    if (!isRunning) {
      const next = !dataLoaderEnabled;
      setDataLoaderEnabled(next);
      reset();
    }
  }

  function handleRunClick() {
    if (isRunning) return;
    if (isComplete || isError) {
      reset();
      setTimeout(() => runDemo(dataLoaderEnabled), 20);
    } else {
      runDemo(dataLoaderEnabled);
    }
  }

  return (
    <div style={{
      background: '#fff',
      border: '3px solid #000',
      boxShadow: '6px 6px 0 #000',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 24,
    }}>

      {/* ── "Why are we showing this?" context banner ──────────────── */}
      <div style={{
        padding: '14px 20px',
        background: '#FEF9C3',
        borderBottom: '3px solid #000',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>🤔</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#000', marginBottom: 5 }}>
            Wait — I thought GraphQL was supposed to be better than REST?
          </div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, fontWeight: 500, maxWidth: 820 }}>
            It is! But every technology has a hidden trap that beginners accidentally walk into.{' '}
            <strong>GraphQL's #1 trap is called the N+1 Problem.</strong> It doesn't crash your app — it
            just quietly makes it <strong>10×, 50×, or even 100× slower</strong> in production without
            you noticing. Because of how GraphQL resolvers work, asking for a list of items with nested data
            (like <code style={{ background: '#fef08a', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
              students {'{'} courses {'}'}
            </code>) fires <em>one separate database query per item</em> — not one query total.{' '}
            <strong>This section shows you the problem live, then shows you the industry fix (DataLoader).</strong>{' '}
            Every professional GraphQL developer must know this.
          </div>
        </div>
      </div>

      <div style={{
        padding: '14px 20px',
        borderBottom: '3px solid #000',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-sans)' }}>
              N+1 Problem Visualizer
            </div>
            <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>
              The #1 GraphQL performance pitfall — and how DataLoader fixes it
            </div>
          </div>
        </div>

        {/* DataLoader Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#a5b4fc' }}>DataLoader</span>
          <motion.button
            onClick={handleToggle}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 52, height: 28,
              borderRadius: 999,
              border: '2.5px solid #000',
              background: dataLoaderEnabled ? '#86EFAC' : '#FCA5A5',
              boxShadow: '2px 2px 0 #000',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              position: 'relative',
              display: 'flex', alignItems: 'center',
              padding: '0 3px',
              transition: 'background 0.2s',
              opacity: isRunning ? 0.6 : 1,
            }}
          >
            <motion.div
              animate={{ x: dataLoaderEnabled ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ width: 20, height: 20, borderRadius: '50%', background: '#000', flexShrink: 0 }}
            />
          </motion.button>
          <motion.span
            key={String(dataLoaderEnabled)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 11, fontWeight: 800,
              padding: '3px 10px', borderRadius: 999,
              background: dataLoaderEnabled ? '#86EFAC' : '#FCA5A5',
              border: '2px solid #000',
              boxShadow: '2px 2px 0 #000',
              color: '#000',
            }}
          >
            {dataLoaderEnabled ? '✅ ON' : '❌ OFF'}
          </motion.span>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ── Two columns ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* Left: Query + Run button */}
          <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Context explanation */}
            <motion.div
              key={String(dataLoaderEnabled)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '10px 14px',
                background: dataLoaderEnabled ? '#f0fdf4' : '#fef2f2',
                border: `2.5px solid ${dataLoaderEnabled ? '#86EFAC' : '#FCA5A5'}`,
                boxShadow: `3px 3px 0 ${dataLoaderEnabled ? '#86EFAC' : '#FCA5A5'}`,
                borderRadius: 10,
                fontSize: 12, fontWeight: 600,
                lineHeight: 1.6, color: '#000',
              }}
            >
              {dataLoaderEnabled ? (
                <>
                  <strong>✅ DataLoader ON</strong> — Courses for all students are loaded in <em>one single batched query</em>. This is the fix.
                </>
              ) : (
                <>
                  <strong>❌ DataLoader OFF</strong> — For each student returned, a <em>separate</em> courses query fires. With 3 students that's <strong>1 + 3 = 4 DB queries</strong>!
                </>
              )}
            </motion.div>

            {/* Query code box */}
            <div style={{
              background: '#1e1b4b',
              border: '2.5px solid #000',
              boxShadow: '4px 4px 0 #000',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '7px 12px',
                borderBottom: '2px solid #312e81',
                background: '#312e81',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57', border: '1.5px solid rgba(255,255,255,0.3)' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e', border: '1.5px solid rgba(255,255,255,0.3)' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840', border: '1.5px solid rgba(255,255,255,0.3)' }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#a5b4fc', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>
                  n1-demo.graphql
                </span>
              </div>
              <pre style={{
                margin: 0, padding: '14px 16px',
                fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.9,
                color: '#e0e7ff', whiteSpace: 'pre', overflowX: 'auto',
              }}>
                {`query {\n  `}
                <span style={{ color: '#93c5fd' }}>studentsWithCourses</span>
                {` {\n    `}
                <span style={{ color: '#6ee7b7' }}>name</span>
                {`\n    `}
                <span style={{ color: '#93c5fd' }}>courses</span>
                {` {\n      `}
                <span style={{ color: '#6ee7b7' }}>title</span>
                {`\n    }\n  }\n}`}
              </pre>
            </div>

            {/* Run button */}
            <motion.button
              whileHover={!isRunning ? { x: -3, y: -3, boxShadow: '8px 8px 0 #000' } : {}}
              whileTap={!isRunning ? { x: 0, y: 0, boxShadow: '2px 2px 0 #000' } : {}}
              onClick={handleRunClick}
              disabled={isRunning}
              style={{
                width: '100%', padding: '14px 24px',
                background: btnBg,
                border: '3px solid #000',
                boxShadow: btnShadow,
                borderRadius: 10,
                color: '#000',
                fontSize: 14, fontWeight: 900,
                fontFamily: 'var(--font-sans)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              {isRunning ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >⟳</motion.span>
                  Running Demo…
                </span>
              ) : isComplete ? '↺ Run Again' : isError ? '↺ Try Again' : '▶ Run N+1 Demo'}
            </motion.button>

            {/* Error */}
            <AnimatePresence>
              {isError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    padding: '10px 14px',
                    background: '#FEE2E2', border: '2px solid #000',
                    boxShadow: '3px 3px 0 #000', borderRadius: 10,
                    fontSize: 12, fontWeight: 600, color: '#000', lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>⚠️ Server unreachable</div>
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Live DB Timeline */}
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div style={{
              background: '#f9f5f0',
              border: '2.5px solid #000',
              boxShadow: '4px 4px 0 #000',
              borderRadius: 10,
              overflow: 'hidden',
              minHeight: 180,
            }}>
              {/* Timeline header */}
              <div style={{
                padding: '10px 14px',
                borderBottom: '2.5px solid #000',
                background: '#f9f5f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#000' }}>🗄️ Live DB Query Stream</span>
                <AnimatePresence>
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                    >
                      <span style={{
                        fontSize: 10.5, fontWeight: 800,
                        padding: '3px 10px', borderRadius: 999,
                        background: isN1Problem ? '#FCA5A5' : '#86EFAC',
                        border: '2px solid #000', boxShadow: '2px 2px 0 #000', color: '#000',
                      }}>
                        {isN1Problem ? `❌ ${queryCount} DB queries` : `✅ ${queryCount} DB queries`}
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
                        {totalMs}ms
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Timeline rows */}
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {!isRunning && !isComplete && !isError && events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '28px 16px', color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🗄️</div>
                    Hit <strong style={{ color: '#000' }}>Run N+1 Demo</strong> to watch<br />the database queries stream in live
                  </div>
                )}

                {isRunning && events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block', fontSize: 24, marginBottom: 8 }}
                    >⟳</motion.div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Waiting for DB queries…</div>
                  </div>
                )}

                <AnimatePresence>
                  {events.map((ev) => {
                    const color = queryColor(ev.kind, dataLoaderEnabled);
                    const label = queryLabel(ev.kind, dataLoaderEnabled);
                    return (
                      <motion.div
                        key={ev.step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        style={{
                          padding: '10px 12px',
                          background: '#fff',
                          border: `2.5px solid ${color}`,
                          boxShadow: `3px 3px 0 ${color}`,
                          borderRadius: 9,
                          display: 'flex', flexDirection: 'column', gap: 5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 800,
                              padding: '2px 8px', borderRadius: 999,
                              background: color, border: '2px solid #000', color: '#000', whiteSpace: 'nowrap',
                            }}>
                              Query #{ev.index}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>{label}</span>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {ev.ms}ms
                          </span>
                        </div>
                        <div style={{
                          fontSize: 10.5, color: '#374151',
                          fontFamily: 'var(--font-mono)', lineHeight: 1.5, wordBreak: 'break-all',
                        }}>
                          {ev.caption}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{
                        padding: '12px 14px',
                        background: isN1Problem ? '#fef2f2' : '#f0fdf4',
                        border: `2.5px solid ${isN1Problem ? '#FCA5A5' : '#86EFAC'}`,
                        boxShadow: `3px 3px 0 ${isN1Problem ? '#FCA5A5' : '#86EFAC'}`,
                        borderRadius: 9,
                        fontSize: 12, fontWeight: 700,
                        color: '#000', lineHeight: 1.6, textAlign: 'center',
                      }}
                    >
                      {isN1Problem ? (
                        <>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>😱</div>
                          <strong>{queryCount} DB queries</strong> for {nStudentQueries} students!<br />
                          <span style={{ fontWeight: 600, color: '#6b7280' }}>Toggle DataLoader ON to fix this.</span>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>🚀</div>
                          Only <strong>{queryCount} DB queries</strong> for all students!<br />
                          <span style={{ fontWeight: 600, color: '#6b7280' }}>DataLoader batched all course lookups into one query.</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ── Educational Explainer Cards ─────────────────────────── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 220px',
            padding: '14px 16px',
            background: '#fef2f2',
            border: '2.5px solid #FCA5A5',
            boxShadow: '4px 4px 0 #FCA5A5',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#000', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>😱</span> The N+1 Problem
            </div>
            <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.7, fontWeight: 500 }}>
              When resolving <code style={{ background: '#fee2e2', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>students {'{'}courses{'}'}</code>, GraphQL calls the <strong>courses resolver once per student</strong>.<br /><br />
              3 students → <strong>1 + 3 = 4 queries</strong>.<br />
              100 students → <strong>101 queries</strong>!<br /><br />
              This <strong>destroys performance</strong> at scale.
            </div>
          </div>

          <div style={{
            flex: '1 1 220px',
            padding: '14px 16px',
            background: '#f0fdf4',
            border: '2.5px solid #86EFAC',
            boxShadow: '4px 4px 0 #86EFAC',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#000', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚡</span> The DataLoader Fix
            </div>
            <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.7, fontWeight: 500 }}>
              DataLoader <strong>collects all student IDs</strong> in a single tick, then issues <strong>one batched SQL query</strong>:<br /><br />
              <code style={{ display: 'block', background: '#dcfce7', padding: '6px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: 1.6, marginBottom: 6 }}>
                SELECT * FROM courses<br />WHERE student_id IN ('1','2','3')
              </code>
              <strong>Always 2 queries</strong>, regardless of student count.
            </div>
          </div>

          <div style={{
            flex: '1 1 220px',
            padding: '14px 16px',
            background: '#fefce8',
            border: '2.5px solid #FDB97D',
            boxShadow: '4px 4px 0 #FDB97D',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#000', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🌍</span> In The Real World
            </div>
            <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.7, fontWeight: 500 }}>
              Facebook's <strong>DataLoader</strong> library is the standard solution — it works by <em>batching</em> and <em>caching</em> per-request.<br /><br />
              Apollo Server, Pothos, and most GraphQL frameworks integrate DataLoader natively. Always use it when resolving <strong>child lists from parent rows</strong>!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
