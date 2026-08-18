import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '../../config/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface InfoSnapshot {
  fieldName:      string;
  returnType:     string;
  parentType:     string;
  path:           { key: string | number; prev?: unknown };
  selectedFields: string[];
  argKeys:        string[];
}
interface TraceEvent {
  step:    string;
  caption: string;
  ms:      number;
  ts:      number;
  info?:   InfoSnapshot;
}

// ─── Info field metadata: what each property means ───────────────────────────
const INFO_FIELDS: {
  key:   keyof InfoSnapshot;
  label: string;
  color: string;
  explain: string;
}[] = [
  {
    key:     'fieldName',
    label:   'fieldName',
    color:   '#86EFAC',
    explain: 'The name of the field being resolved. Useful for generic resolver factories that handle multiple fields.',
  },
  {
    key:     'returnType',
    label:   'returnType',
    color:   '#93C5FD',
    explain: 'The GraphQL return type of this field (e.g. Student, [Course!]!). Use this to inspect non-null / list wrappers at runtime.',
  },
  {
    key:     'parentType',
    label:   'parentType',
    color:   '#FCD34D',
    explain: 'The type that owns this field (e.g. Query, Student). Lets a single resolver function know which type it\'s being called on.',
  },
  {
    key:     'path',
    label:   'path',
    color:   '#F9A8D4',
    explain: 'The execution path to this field (e.g. student → courses). Useful for logging, tracing, and error reporting.',
  },
  {
    key:     'selectedFields',
    label:   'fieldNodes (selection)',
    color:   '#C4B5FD',
    explain: 'The sub-fields the client actually requested on this type. Advanced resolvers use this to SELECT only the columns they need from the database (query optimization).',
  },
  {
    key:     'argKeys',
    label:   'variableValues (keys)',
    color:   '#FCA5A5',
    explain: 'The variable names passed in this request. Use this to access $id, $filter, etc. without threading them through every function call.',
  },
];

// ─── Format path chain ────────────────────────────────────────────────────────
function formatPath(path: InfoSnapshot['path']): string {
  const parts: (string | number)[] = [];
  let current: { key: string | number; prev?: unknown } | undefined = path;
  while (current) {
    parts.unshift(current.key);
    current = current.prev as typeof current;
  }
  return parts.join(' → ');
}

// ─── Render a single info snapshot card ──────────────────────────────────────
function InfoCard({
  snap,
  activeField,
  onHover,
}: {
  snap: InfoSnapshot;
  activeField: keyof InfoSnapshot | null;
  onHover: (k: keyof InfoSnapshot | null) => void;
}) {
  const getValue = (key: keyof InfoSnapshot): string => {
    if (key === 'path')           return formatPath(snap.path);
    if (key === 'selectedFields') return snap.selectedFields.join(', ') || '—';
    if (key === 'argKeys')        return snap.argKeys.join(', ') || '(none)';
    return String(snap[key]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: '2.5px solid #000', borderRadius: 10,
        boxShadow: '3px 3px 0 #000', background: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div style={{
        padding: '8px 12px', background: '#0F172A',
        borderBottom: '2px solid #000',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>
          {snap.parentType === 'Query' ? '🔍' : '🔗'}
        </span>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
          {snap.parentType}.{snap.fieldName}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
          color: '#64748B', fontFamily: 'var(--font-mono)',
        }}>
          {snap.returnType}
        </span>
      </div>

      {/* Fields */}
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {INFO_FIELDS.map(f => (
          <div
            key={f.key}
            onMouseEnter={() => onHover(f.key)}
            onMouseLeave={() => onHover(null)}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '5px 8px', borderRadius: 6, cursor: 'default',
              background: activeField === f.key ? `${f.color}33` : 'transparent',
              border: `1.5px solid ${activeField === f.key ? f.color : 'transparent'}`,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)',
              color: f.color, flexShrink: 0, minWidth: 130,
              background: '#0F172A', padding: '2px 6px', borderRadius: 4,
            }}>
              {f.label}
            </span>
            <span style={{
              fontSize: 10.5, fontFamily: 'var(--font-mono)',
              color: '#1F2937', wordBreak: 'break-all',
            }}>
              {getValue(f.key)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function ResolveInfoInspector() {
  const [snapshots, setSnapshots] = useState<InfoSnapshot[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [activeField, setActiveField] = useState<keyof InfoSnapshot | null>(null);
  const [withCourses, setWithCourses] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  const run = useCallback(async () => {
    // Cleanup previous SSE
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setSnapshots([]);
    setDone(false);
    setLoading(true);

    const requestId = crypto.randomUUID();
    const base      = getApiBaseUrl();

    const es = new EventSource(`${base}/events?requestId=${requestId}`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      const event: TraceEvent = JSON.parse(e.data as string);
      if (event.step === '__done__') {
        es.close();
        esRef.current = null;
        setLoading(false);
        setDone(true);
        return;
      }
      if (event.step === 'resolver:info' && event.info) {
        setSnapshots(prev => [...prev, event.info!]);
      }
    };
    es.onerror = () => { es.close(); setLoading(false); };

    await new Promise(r => setTimeout(r, 80)); // wait for SSE ready

    const query = withCourses
      ? `query { student(id: "1") { id name age courses { title } } }`
      : `query { student(id: "1") { id name age } }`;

    await fetch(`${base}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({ query }),
    });
  }, [withCourses]);

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
        padding: '14px 18px', background: '#0F172A',
        borderBottom: '3px solid #000',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
            GraphQLResolveInfo Inspector
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            resolver(parent, args, context,{' '}
            <span style={{ color: '#F472B6', fontWeight: 900 }}>info</span>
            ) — the 4th arg nobody teaches
          </div>
        </div>
      </div>

      {/* Signature strip */}
      <div style={{
        padding: '12px 18px', background: '#1E293B',
        borderBottom: '2px solid #000',
        display: 'flex', alignItems: 'center', gap: 0,
        fontFamily: 'var(--font-mono)', fontSize: 13, flexWrap: 'wrap',
      }}>
        <span style={{ color: '#7DD3FC' }}>resolver</span>
        <span style={{ color: '#94A3B8' }}>(</span>
        {[
          { name: 'parent',  color: '#FCD34D', tip: 'Result from the parent resolver' },
          { name: 'args',    color: '#86EFAC', tip: 'Arguments from the query (e.g. { id: "1" })' },
          { name: 'context', color: '#C4B5FD', tip: 'Shared request context (auth, requestId, …)' },
          { name: 'info',    color: '#F472B6', tip: 'GraphQLResolveInfo — field metadata ← YOU ARE HERE' },
        ].map((a, i, arr) => (
          <span key={a.name} title={a.tip} style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
            <span style={{ color: a.color, fontWeight: 900, cursor: 'help' }}>{a.name}</span>
            {i < arr.length - 1 && <span style={{ color: '#94A3B8' }}>,&nbsp;</span>}
          </span>
        ))}
        <span style={{ color: '#94A3B8' }}>)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0 }}>

        {/* Left — Controls + field explanation */}
        <div style={{
          padding: 18, borderRight: '2px solid #000',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>

          {/* What to query */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Query Options
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { val: true,  label: 'student + courses', sub: '2 resolvers fire → 2 info objects' },
                { val: false, label: 'student only',      sub: '1 resolver fires → 1 info object' },
              ].map(o => (
                <motion.button
                  key={String(o.val)}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setWithCourses(o.val); setSnapshots([]); setDone(false); }}
                  style={{
                    padding: '9px 12px', border: '2px solid #000',
                    borderRadius: 8, cursor: 'pointer',
                    background: withCourses === o.val ? '#000' : '#fff',
                    color: withCourses === o.val ? '#fff' : '#000',
                    fontWeight: 800, fontSize: 11.5, textAlign: 'left',
                    boxShadow: '2px 2px 0 #000',
                  }}
                >
                  {o.label}
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, marginTop: 2 }}>{o.sub}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Run button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={run}
            disabled={loading}
            style={{
              padding: '10px 14px', border: '2.5px solid #000',
              borderRadius: 9, background: loading ? '#F3F4F6' : '#000',
              color: loading ? '#9CA3AF' : '#fff', fontWeight: 900,
              fontSize: 13, cursor: loading ? 'default' : 'pointer',
              boxShadow: '3px 3px 0 #000',
            }}
          >
            {loading ? '⏳ Running…' : '▶ Run & Inspect info'}
          </motion.button>

          {/* Hoverable field legend */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Hover a row to learn what it means
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {INFO_FIELDS.map(f => (
                <div
                  key={f.key}
                  onMouseEnter={() => setActiveField(f.key)}
                  onMouseLeave={() => setActiveField(null)}
                  style={{
                    padding: '6px 8px', borderRadius: 6, cursor: 'default',
                    border: `1.5px solid ${activeField === f.key ? f.color : '#E5E7EB'}`,
                    background: activeField === f.key ? `${f.color}22` : '#F9FAFB',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)',
                    color: f.color, background: '#0F172A',
                    padding: '1px 5px', borderRadius: 4,
                  }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation box */}
          <AnimatePresence mode="wait">
            {activeField && (
              <motion.div
                key={activeField}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: '#EFF6FF', border: '2px solid #000',
                  boxShadow: '2px 2px 0 #000',
                  fontSize: 11.5, color: '#1E40AF', lineHeight: 1.6,
                }}
              >
                {INFO_FIELDS.find(f => f.key === activeField)?.explain}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — Live info snapshots */}
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Live <code style={{ fontFamily: 'var(--font-mono)', textTransform: 'none', fontSize: 11 }}>info</code> Objects ({snapshots.length} resolver{snapshots.length !== 1 ? 's' : ''} fired)
          </div>

          {snapshots.length === 0 && !loading && (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              border: '2px dashed #D1D5DB', borderRadius: 10,
              color: '#9CA3AF', fontSize: 12.5,
            }}>
              Click <strong>"Run &amp; Inspect info"</strong> to see live{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>GraphQLResolveInfo</code> objects
            </div>
          )}

          {loading && snapshots.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 24 }}>⏳</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {snapshots.map((snap, i) => (
              <InfoCard
                key={i}
                snap={snap}
                activeField={activeField}
                onHover={setActiveField}
              />
            ))}
          </div>

          {done && snapshots.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '10px 14px', borderRadius: 8,
                background: '#FFF7ED', border: '2px solid #000',
                boxShadow: '2px 2px 0 #000',
                fontSize: 11.5, color: '#92400E', lineHeight: 1.6,
              }}
            >
              <strong>Key Insight:</strong> Each resolver received its OWN{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>info</code> object — notice
              how <code style={{ fontFamily: 'var(--font-mono)' }}>parentType</code> changes from{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>Query</code> to{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>Student</code> for the nested{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>courses</code> field, and the{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>path</code> traces the full execution chain.
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
