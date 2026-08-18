import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '../../config/api';

// ─── Types ──────────────────────────────────────────────────────────────────
interface QueryResult { data?: Record<string, unknown>; errors?: { message: string; path?: string[] }[] }

// ─── Code Block ─────────────────────────────────────────────────────────────
function Code({ children }: { children: string }) {
  return (
    <pre style={{
      margin: 0, padding: '12px 14px',
      background: '#0F172A', borderRadius: 8,
      border: '2px solid #000', boxShadow: '2px 2px 0 #000',
      fontSize: 12, fontFamily: 'var(--font-mono)',
      color: '#E2E8F0', lineHeight: 1.65,
      overflow: 'auto', maxHeight: 220,
    }}>
      <code>{children}</code>
    </pre>
  );
}

// ─── Result Panel ────────────────────────────────────────────────────────────
function ResultPanel({ result, loading }: { result: QueryResult | null; loading: boolean }) {
  if (loading) return (
    <div style={{ padding: 16, textAlign: 'center', fontSize: 20 }}>⏳</div>
  );
  if (!result) return null;
  // Strip extensions stacktrace noise
  const clean = {
    ...result,
    errors: result.errors?.map(e => ({ message: e.message, path: e.path })),
  };
  return (
    <motion.pre
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        margin: 0, padding: '10px 12px',
        borderRadius: 8, overflow: 'auto', maxHeight: 200,
        background: result.errors ? '#FEF2F2' : '#F0FDF4',
        border: `2px solid ${result.errors ? '#EF4444' : '#22C55E'}`,
        boxShadow: '2px 2px 0 #000',
        fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.6, color: '#1F2937',
      }}
    >
      {JSON.stringify(clean, null, 2)}
    </motion.pre>
  );
}

// ─── Run Button ──────────────────────────────────────────────────────────────
function RunBtn({ onClick, loading, label = '▶ Run Query' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '8px 18px', border: '2.5px solid #000',
        borderRadius: 8, background: loading ? '#F3F4F6' : '#000',
        color: loading ? '#9CA3AF' : '#fff', fontWeight: 800,
        fontSize: 12, cursor: loading ? 'default' : 'pointer',
        boxShadow: '2px 2px 0 #000',
      }}
    >
      {loading ? '⏳ Running…' : label}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION A — Variables
// ═══════════════════════════════════════════════════════════════════════════
function VariablesDemo() {
  const [varId, setVarId]     = useState('1');
  const [result, setResult]   = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(0); // 0-3 animate the flow

  const STUDENT_IDS = [
    { id: '1', label: 'Alex Rivera' },
    { id: '2', label: 'Priya Sharma' },
    { id: '3', label: 'Jordan Lee' },
  ];

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setStep(1);
    await new Promise(r => setTimeout(r, 350));
    setStep(2);
    try {
      const res = await fetch(`${getApiBaseUrl()}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query GetStudent($id: ID!) {
  student(id: $id) {
    id
    name
    age
    courses { title }
  }
}`,
          variables: { id: varId },
        }),
      });
      setStep(3);
      const json = await res.json();
      await new Promise(r => setTimeout(r, 250));
      setStep(4);
      setResult(json);
    } finally {
      setLoading(false);
    }
  }, [varId]);

  const FLOW = [
    { label: 'Variables',  sub: `{ id: "${varId}" }`,         emoji: '📦' },
    { label: 'Validation', sub: 'id must be ID! type',        emoji: '✅' },
    { label: 'Resolver',   sub: `args.id = "${varId}"`,       emoji: '⚙️' },
    { label: 'Database',   sub: `WHERE id = '${varId}'`,      emoji: '🗄️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Concept explanation */}
      <div style={{
        padding: '12px 16px', borderRadius: 10,
        background: '#EFF6FF', border: '2px solid #000', boxShadow: '2px 2px 0 #000',
        fontSize: 12.5, color: '#1E40AF', lineHeight: 1.7,
      }}>
        <strong>💡 Why Variables?</strong><br/>
        Instead of embedding literal values inside queries{' '}
        <code style={{ fontFamily: 'var(--font-mono)', background: '#DBEAFE', padding: '1px 4px', borderRadius: 4 }}>
          student(id: "1")
        </code>
        , variables let clients send typed, reusable queries. The server validates the variable type
        <em> before</em> any resolver runs — safer and faster to parse.
      </div>

      {/* 2-column: query + flow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Left: query + variable picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            📝 Named Query with Variable
          </div>
          <Code>{`query GetStudent($id: ID!) {
  student(id: $id) {
    id
    name
    age
    courses { title }
  }
}`}</Code>

          <Code>{`// Variables object (sent alongside the query)
{ "id": "${varId}" }`}</Code>

          {/* Student picker */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>
              Choose a student to look up:
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {STUDENT_IDS.map(s => (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setVarId(s.id); setResult(null); setStep(0); }}
                  style={{
                    flex: 1, padding: '7px 8px',
                    border: '2px solid #000', borderRadius: 8,
                    background: varId === s.id ? '#000' : '#fff',
                    color: varId === s.id ? '#fff' : '#000',
                    fontWeight: 800, fontSize: 11,
                    cursor: 'pointer', boxShadow: '2px 2px 0 #000',
                  }}
                >
                  id: "{s.id}"<br/>
                  <span style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.7 }}>{s.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <RunBtn onClick={run} loading={loading} />
        </div>

        {/* Right: animated flow + result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            🌊 Variable Flow
          </div>

          {/* Flow steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FLOW.map((f, i) => {
              const done   = step > i + 1;
              const active = step === i + 1;
              return (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <motion.div
                    animate={{
                      background: active ? '#000' : done ? '#22C55E' : '#F3F4F6',
                      scale: active ? 1.08 : 1,
                    }}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: '2px solid #000', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                      boxShadow: active ? '3px 3px 0 #000' : '2px 2px 0 #D1D5DB',
                    }}
                  >
                    {done ? '✓' : f.emoji}
                  </motion.div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: active ? '#000' : '#374151' }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>
                      {f.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result */}
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            📥 Response
          </div>
          <ResultPanel result={result} loading={loading} />
        </div>
      </div>

      {/* Key insight */}
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: '#FFF7ED', border: '2px solid #000', boxShadow: '2px 2px 0 #000',
        fontSize: 11.5, color: '#92400E', lineHeight: 1.6,
      }}>
        <strong>🔑 Key Insight:</strong> The variable <code style={{ fontFamily: 'var(--font-mono)' }}>$id: ID!</code> is
        type-checked <em>at validation time</em> — before any resolver runs.
        Pass <code style={{ fontFamily: 'var(--font-mono)' }}>id: 999</code> (an Int instead of ID) and the server
        rejects it immediately with <code style={{ fontFamily: 'var(--font-mono)' }}>BAD_USER_INPUT</code> — the
        database is never touched.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION B — Fragments & Aliases
// ═══════════════════════════════════════════════════════════════════════════
function FragmentsDemo() {
  const [mode, setMode]       = useState<'alias' | 'fragment'>('alias');
  const [result, setResult]   = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const ALIAS_QUERY = `query {
  studentA: student(id: "1") {
    id
    name
    age
  }
  studentB: student(id: "2") {
    id
    name
    age
  }
}`;

  const FRAGMENT_QUERY = `fragment StudentCard on Student {
  id
  name
  age
}

query {
  studentA: student(id: "1") {
    ...StudentCard
  }
  studentB: student(id: "2") {
    ...StudentCard
  }
}`;

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    const query = mode === 'alias' ? ALIAS_QUERY : FRAGMENT_QUERY;
    try {
      const res = await fetch(`${getApiBaseUrl()}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (json.errors) json.errors = json.errors.map((e: {message:string;path?:string[]}) => ({ message: e.message, path: e.path }));
      setResult(json);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 10 }}>
        {(['alias', 'fragment'] as const).map(m => (
          <motion.button
            key={m}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setMode(m); setResult(null); }}
            style={{
              padding: '9px 20px', border: '2.5px solid #000',
              borderRadius: 9, fontWeight: 800, fontSize: 12.5,
              cursor: 'pointer', boxShadow: '2px 2px 0 #000',
              background: mode === m ? '#000' : '#fff',
              color: mode === m ? '#fff' : '#000',
            }}
          >
            {m === 'alias' ? '🏷️ Aliases' : '📎 Fragments'}
          </motion.button>
        ))}
      </div>

      {/* Explanation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          style={{
            padding: '12px 16px', borderRadius: 10,
            background: mode === 'alias' ? '#EFF6FF' : '#F5F3FF',
            border: '2px solid #000', boxShadow: '2px 2px 0 #000',
            fontSize: 12.5, lineHeight: 1.7,
            color: mode === 'alias' ? '#1E40AF' : '#5B21B6',
          }}
        >
          {mode === 'alias' ? (
            <>
              <strong>🏷️ What are Aliases?</strong><br/>
              Normally you can't query the same field twice — the keys would clash in the JSON response.
              Aliases rename a field in the response:{' '}
              <code style={{ fontFamily: 'var(--font-mono)', background: '#DBEAFE', padding: '1px 5px', borderRadius: 4 }}>
                studentA: student(id: "1")
              </code>{' '}
              returns the result under the key <code style={{ fontFamily: 'var(--font-mono)' }}>studentA</code> instead of <code style={{ fontFamily: 'var(--font-mono)' }}>student</code>.
            </>
          ) : (
            <>
              <strong>📎 What are Fragments?</strong><br/>
              Fragments let you define a reusable set of fields once and spread them anywhere with{' '}
              <code style={{ fontFamily: 'var(--font-mono)', background: '#EDE9FE', padding: '1px 5px', borderRadius: 4 }}>
                ...FragmentName
              </code>.
              The server merges fragment fields into the selection set during execution — DRY queries.
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 2-column: code + AST breakdown + result */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Left: query */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            📝 {mode === 'alias' ? 'Alias Query' : 'Fragment Query'}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Code>{mode === 'alias' ? ALIAS_QUERY : FRAGMENT_QUERY}</Code>
            </motion.div>
          </AnimatePresence>
          <RunBtn onClick={run} loading={loading} />
        </div>

        {/* Right: how it works + result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            ⚙️ How It Works
          </div>

          {mode === 'alias' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '📩', label: 'Client sends',    text: 'studentA: student(id: "1")' },
                { icon: '🔍', label: 'Parser reads',    text: 'Field "student" aliased as "studentA"' },
                { icon: '⚙️', label: 'Resolver runs',   text: 'student resolver called twice, args differ' },
                { icon: '📤', label: 'Response key',    text: 'data.studentA / data.studentB (not "student")' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 900, color: '#374151' }}>{s.label}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '✍️', label: 'Define once',    text: 'fragment StudentCard on Student { id name age }' },
                { icon: '♻️', label: 'Spread anywhere', text: '...StudentCard inside any Student selection set' },
                { icon: '🔀', label: 'Parser inlines',  text: 'Fragment fields are merged into selection sets' },
                { icon: '🚀', label: 'Same resolver',   text: 'Resolver runs once per field — no duplication' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 900, color: '#374151' }}>{s.label}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7280' }}>{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            📥 Response
          </div>
          <ResultPanel result={result} loading={loading} />
        </div>
      </div>

      {/* Key insight */}
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: '#FFF7ED', border: '2px solid #000', boxShadow: '2px 2px 0 #000',
        fontSize: 11.5, color: '#92400E', lineHeight: 1.6,
      }}>
        {mode === 'alias' ? (
          <><strong>🔑 Real-world use:</strong> Dashboards often need the same resource with different args on one screen —
            e.g. <code style={{ fontFamily: 'var(--font-mono)' }}>currentUser: me</code> and{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>adminUser: me</code>. Aliases make this one round-trip.</>
        ) : (
          <><strong>🔑 Real-world use:</strong> React apps define a fragment per component (e.g. <code style={{ fontFamily: 'var(--font-mono)' }}>StudentCard_student</code>)
            and co-locate it with the component. Parent queries just spread them in — this is the{' '}
            <a href="https://relay.dev/docs/guided-tour/rendering/fragments/" target="_blank" rel="noreferrer"
              style={{ color: '#B45309', fontWeight: 700 }}>Relay fragment colocation pattern</a>.</>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export function AdvancedQueriesDemo() {
  const [tab, setTab] = useState<'variables' | 'fragments'>('variables');

  const TABS = [
    { key: 'variables' as const, label: '📦 Variables',          sub: '$id: ID!' },
    { key: 'fragments' as const, label: '📎 Fragments & Aliases', sub: '...Fragment, alias:' },
  ];

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
        <span style={{ fontSize: 18 }}>⚡</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-sans)' }}>
            Advanced Query Patterns
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
            Variables, Fragments & Aliases — the building blocks every real GraphQL client uses
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', borderBottom: '2px solid #000',
        background: '#F8FAFC',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 16px',
              border: 'none', borderRight: t.key === 'variables' ? '2px solid #000' : 'none',
              background: tab === t.key ? '#FFF8F0' : 'transparent',
              fontWeight: 900, fontSize: 13,
              cursor: 'pointer', textAlign: 'left',
              borderBottom: tab === t.key ? '3px solid #000' : '3px solid transparent',
              color: tab === t.key ? '#000' : '#6B7280',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
            <span style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#9CA3AF', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              {t.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 20 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'variables' ? <VariablesDemo /> : <FragmentsDemo />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
