import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '../../config/api';
import { useSound } from '../../context/SoundContext';

// ─── Types ─────────────────────────────────────────────────────────────
interface RunResult {
  data: Record<string, unknown> | null;
  errors?: { message: string; path?: string[] }[];
}

type Mode = 'nullable' | 'nonnull';
type FailState = 'ok' | 'fail';

// ─── Bubble Path Visualizer ─────────────────────────────────────────────
const TREE_NODES = [
  { key: 'query',   label: 'Query Root',            depth: 0 },
  { key: 'student', label: 'student (Object)',       depth: 1 },
  { key: 'name',    label: 'name: String!',          depth: 2 },
  { key: 'age',     label: 'age: Int / Int!',        depth: 2 },
  { key: 'courses', label: 'courses: [Course!]!',    depth: 2 },
];

function TreeVisualizer({
  mode,
  failState,
  result,
}: {
  mode: Mode;
  failState: FailState;
  result: RunResult | null;
}) {
  const failed    = failState === 'fail';
  const bubbled   = failed && mode === 'nonnull';

  const nodeStatus = (key: string): 'ok' | 'null' | 'bubble' | 'discard' | 'idle' => {
    if (!result) return 'idle';
    if (key === 'age')    return failed ? (bubbled ? 'bubble' : 'null') : 'ok';
    if (key === 'name')   return bubbled ? 'discard' : 'ok';
    if (key === 'courses') return bubbled ? 'discard' : 'ok';
    if (key === 'student') return bubbled ? 'bubble' : 'ok';
    if (key === 'query')   return bubbled ? 'bubble' : 'ok';
    return 'ok';
  };

  const COLOR: Record<string, string> = {
    ok:      '#86EFAC',
    null:    '#FCA5A5',
    bubble:  '#EF4444',
    discard: '#D1D5DB',
    idle:    '#E5E7EB',
  };

  const ICON: Record<string, string> = {
    ok:      '✓',
    null:    'null',
    bubble:  '⬆️',
    discard: '✕',
    idle:    '○',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {TREE_NODES.map((n, i) => {
        const status = nodeStatus(n.key);
        return (
          <motion.div
            key={n.key}
            initial={false}
            animate={{
              backgroundColor: COLOR[status],
              boxShadow: status === 'bubble' ? '0 0 0 2px #EF4444, 3px 3px 0 #000' : '2px 2px 0 #000',
            }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            style={{
              marginLeft: n.depth * 20,
              padding: '6px 12px',
              borderRadius: 8,
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>{n.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 900,
              background: 'rgba(0,0,0,0.1)',
              padding: '1px 6px', borderRadius: 999,
            }}>
              {ICON[status]}
            </span>
          </motion.div>
        );
      })}

      {/* Legend */}
      <div style={{
        marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {[
          { color: COLOR.ok,      label: 'Resolved OK' },
          { color: COLOR.null,    label: 'Returns null (safe)' },
          { color: COLOR.bubble,  label: 'Null bubbles UP ⬆️' },
          { color: COLOR.discard, label: 'Discarded' },
        ].map(item => (
          <span key={item.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 10, fontWeight: 700,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2,
              background: item.color, border: '1.5px solid #000',
              flexShrink: 0,
            }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── JSON Response Panel ────────────────────────────────────────────────
function JSONPanel({ result, mode }: { result: RunResult | null; mode: Mode }) {
  if (!result) {
    return (
      <div style={{
        padding: '16px', borderRadius: 8,
        background: '#F3F4F6', border: '2px solid #000',
        fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9CA3AF',
      }}>
        Run a query to see the response here…
      </div>
    );
  }

  const hasErrors  = result.errors && result.errors.length > 0;
  const studentKey = mode === 'nullable' ? 'studentNullable' : 'studentNonNull';
  const student    = result.data?.[studentKey];

  const formatted = JSON.stringify({ data: result.data, errors: result.errors }, null, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Outcome banner */}
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: hasErrors ? (student === null ? '#FEE2E2' : '#FEF9C3') : '#DCFCE7',
        border: '2px solid #000',
        fontSize: 12, fontWeight: 700, color: '#000',
        lineHeight: 1.5,
      }}>
        {hasErrors
          ? student === null
            ? '🕳️ Null bubbled all the way up! student is null, data is partial.'
            : '⚠️ Partial data returned — age is null but name & courses survived!'
          : '✅ All fields resolved successfully — no errors.'}
      </div>

      {/* Raw JSON */}
      <pre style={{
        padding: '12px 14px',
        borderRadius: 8,
        background: '#0F172A',
        color: '#E2E8F0',
        fontSize: 11.5,
        fontFamily: 'var(--font-mono)',
        lineHeight: 1.7,
        overflow: 'auto',
        maxHeight: 320,
        border: '2px solid #000',
        margin: 0,
      }}>
        {formatted
          .replace(/"null"/g, '<null>')
          .split('\n')
          .map((line, i) => {
            const isNull    = line.includes(': null');
            const isError   = line.includes('"errors"') || line.includes('"message"') || line.includes('"path"');
            const color     = isNull ? '#F87171' : isError ? '#FBBF24' : '#E2E8F0';
            return <span key={i} style={{ color, display: 'block' }}>{line}</span>;
          })
        }
      </pre>
    </div>
  );
}

// ─── Explanation Panel ──────────────────────────────────────────────────
const EXPLANATIONS: Record<Mode, Record<FailState, { title: string; body: string; rule: string }>> = {
  nullable: {
    ok: {
      title: 'Everything works ✅',
      body:  'The age resolver returned a number. GraphQL assembles all fields and returns the complete JSON object.',
      rule:  'When all resolvers succeed, no special error handling is needed.',
    },
    fail: {
      title: 'Partial data returned ⚠️',
      body:  'The age resolver failed, but because age: Int is nullable (no ! suffix), GraphQL calls completeValue() which returns null for that field. The error is added to the errors[] array. All sibling fields (name, courses) still resolve and are included in the response.',
      rule:  '📌 Rule: Nullable field failure → null stays at that field, siblings survive, errors[] is populated.',
    },
  },
  nonnull: {
    ok: {
      title: 'Everything works ✅',
      body:  'The age resolver returned a number. Even though age: Int! is non-null, it resolved correctly so no null propagation occurs.',
      rule:  'Non-null guarantees only activate on failure.',
    },
    fail: {
      title: 'Null bubbled to parent! 🕳️',
      body:  'The age resolver failed. Because age: Int! is non-null (! suffix), completeValue() cannot return null for it. Instead, it forces the PARENT object (student) to become null. If student were also non-null, the null would continue bubbling up until it reaches a nullable ancestor or the root, making data: null.',
      rule:  '📌 Rule: Non-null field failure → null bubbles UP to nearest nullable ancestor. completeValue() propagates the error upward.',
    },
  },
};

// ─── Main Component ─────────────────────────────────────────────────────
export function NullBubbleDemo() {
  const [mode,      setMode]      = useState<Mode>('nullable');
  const [failState, setFailState] = useState<FailState>('ok');
  const [result,    setResult]    = useState<RunResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const { playSound }             = useSound();

  const explain = EXPLANATIONS[mode][failState];

  const runQuery = useCallback(async (m: Mode, f: FailState) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fieldKey  = m === 'nullable' ? 'studentNullable' : 'studentNonNull';
      const query     = `
        query NullDemo {
          ${fieldKey}(id: "1", failAge: ${f === 'fail'}) {
            id
            name
            age
            courses {
              title
            }
          }
        }
      `;
      const res = await fetch(`${getApiBaseUrl()}/graphql`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query }),
      });
      const json = await res.json() as RunResult;
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleModeOrFail = (newMode: Mode, newFail: FailState) => {
    if (newFail === 'fail') {
      playSound('error');
    } else if (newMode !== mode) {
      playSound('toggle');
    } else {
      playSound('execute');
    }
    setMode(newMode);
    setFailState(newFail);
    runQuery(newMode, newFail);
  };

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
        <span style={{ fontSize: 18 }}>🕳️</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-sans)' }}>
            Null Bubbling & Partial Failure
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
            How <code style={{ fontFamily: 'var(--font-mono)', color: '#7DD3FC' }}>completeValue()</code> handles resolver errors in GraphQL
          </div>
        </div>
      </div>

      {/* Theory banner */}
      <div style={{
        padding: '12px 18px',
        background: '#EFF6FF',
        borderBottom: '2px solid #000',
        fontSize: 12, color: '#1E40AF', lineHeight: 1.6,
      }}>
        <strong>How it works:</strong> When a resolver throws or returns null, GraphQL's <code style={{ fontFamily: 'var(--font-mono)' }}>completeValue()</code>
        function decides what to do. If the field is <strong>nullable</strong> (<code>Int</code>), null stays at that field.
        If it's <strong>non-null</strong> (<code>Int!</code>), null <strong>bubbles up</strong> to the nearest nullable parent — potentially making the whole response null.
      </div>

      {/* Controls */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '2px solid #000',
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Field type toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.06em' }}>
            Field Type
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['nullable', 'age: Int', '✅ Nullable'], ['nonnull', 'age: Int!', '🔴 Non-Null']] as [Mode, string, string][]).map(([m, code, label]) => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleModeOrFail(m, failState)}
                style={{
                  padding: '7px 14px',
                  border: '2.5px solid #000',
                  borderRadius: 8,
                  background: mode === m ? '#0F172A' : '#fff',
                  color:      mode === m ? '#fff'    : '#000',
                  fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  boxShadow: '2px 2px 0 #000',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {label} &nbsp;
                <span style={{ opacity: 0.7, fontSize: 10 }}>({code})</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ width: 1, height: 40, background: '#000', opacity: 0.1 }} />

        {/* Fail toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.06em' }}>
            Resolver Behavior
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['ok', '✅ Success'], ['fail', '💥 Trigger Failure']] as [FailState, string][]).map(([f, label]) => (
              <motion.button
                key={f}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleModeOrFail(mode, f)}
                style={{
                  padding: '7px 14px',
                  border: '2.5px solid #000',
                  borderRadius: 8,
                  background: failState === f ? (f === 'fail' ? '#EF4444' : '#22C55E') : '#fff',
                  color:      failState === f ? '#fff' : '#000',
                  fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  boxShadow: '2px 2px 0 #000',
                }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
            style={{ fontSize: 18, marginLeft: 8 }}
          >
            ⏳
          </motion.div>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '10px 18px', background: '#FEE2E2',
              borderBottom: '2px solid #000',
              fontSize: 12, fontWeight: 600, color: '#991B1B',
            }}
          >
            ⚠️ Server unreachable: {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — 3 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 0,
        minHeight: 380,
      }}>
        {/* Column 1: Propagation Tree */}
        <div style={{
          padding: '16px 18px',
          borderRight: '2px solid #000',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#6B7280', marginBottom: 12,
          }}>
            📊 Propagation Tree
          </div>
          <TreeVisualizer mode={mode} failState={failState} result={result} />
        </div>

        {/* Column 2: JSON Response */}
        <div style={{
          padding: '16px 18px',
          borderRight: '2px solid #000',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#6B7280', marginBottom: 12,
          }}>
            📋 Server Response
          </div>
          <JSONPanel result={result} mode={mode} />
        </div>

        {/* Column 3: Explanation */}
        <div style={{ padding: '16px 18px' }}>
          <div style={{
            fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#6B7280', marginBottom: 12,
          }}>
            💬 What Happened
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${failState}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: failState === 'fail' && mode === 'nonnull'
                  ? '#FEE2E2' : failState === 'fail' ? '#FEF9C3' : '#DCFCE7',
                border: '2px solid #000', boxShadow: '2px 2px 0 #000',
                fontSize: 13, fontWeight: 900, color: '#000',
              }}>
                {explain.title}
              </div>

              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: '#fff', border: '2px solid #000',
                boxShadow: '2px 2px 0 #000',
                fontSize: 12, color: '#374151', lineHeight: 1.65,
              }}>
                {explain.body}
              </div>

              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: '#FEF9C3', border: '2px solid #000',
                boxShadow: '2px 2px 0 #000',
                fontSize: 11.5, fontWeight: 700, color: '#713F12', lineHeight: 1.5,
              }}>
                {explain.rule}
              </div>

              {/* Schema snippet */}
              <pre style={{
                padding: '10px 12px', borderRadius: 8,
                background: '#0F172A', color: '#E2E8F0',
                fontSize: 11, fontFamily: 'var(--font-mono)',
                lineHeight: 1.7, border: '2px solid #000',
                margin: 0, overflow: 'auto',
              }}>
                {mode === 'nullable'
                  ? `type Student {\n  name:   String!\n  age:    Int     # nullable\n  courses: [Course!]!\n}`
                  : `type Student {\n  name:   String!\n  age:    Int!    # non-null!\n  courses: [Course!]!\n}`}
              </pre>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
