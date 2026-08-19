import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '../../config/api';

// ─── Types ───────────────────────────────────────────────────────────────────
type ActiveType = 'enum' | 'interface' | 'union' | 'input' | 'directive';

interface SearchResult {
  __typename: 'StudentNode' | 'CourseNode';
  id: string;
  name: string;
  age?: number;
  title?: string;
}
interface DemoPayload {
  role: string;
  permissions: string[];
  results: SearchResult[];
  term: string;
  total: number;
}
interface GqlResponse { data?: { advancedTypesDemo: DemoPayload }; errors?: { message: string }[] }

// ─── Syntax-coloured code block ──────────────────────────────────────────────
function Code({ children }: { children: string }) {
  return (
    <pre style={{
      margin: 0, padding: '12px 14px', background: '#0F172A',
      borderRadius: 8, border: '2px solid #000', boxShadow: '2px 2px 0 #000',
      fontSize: 11.5, fontFamily: 'var(--font-mono)', color: '#E2E8F0',
      lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    }}>
      <code>{children}</code>
    </pre>
  );
}

// ─── Pill badge ──────────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px',
      borderRadius: 100, fontSize: 10.5, fontWeight: 800,
      border: `2px solid ${color}`, color: color,
      background: `${color}18`, fontFamily: 'var(--font-mono)',
    }}>{label}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE PANELS
// ═══════════════════════════════════════════════════════════════════════════

function EnumPanel() {
  const ROLES = [
    { role: 'ADMIN',  perms: ['READ','WRITE','DELETE'], color: '#EF4444', badge: '🔴' },
    { role: 'VIEWER', perms: ['READ'],                  color: '#3B82F6', badge: '🔵' },
    { role: 'GUEST',  perms: [],                        color: '#9CA3AF', badge: '⚪' },
  ];
  const [selected, setSelected] = useState('ADMIN');
  const active = ROLES.find(r => r.role === selected)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#EFF6FF', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 12, color: '#1E40AF', lineHeight: 1.7 }}>
        <strong>📌 What is an Enum?</strong><br/>
        An enum is a scalar type with a <em>fixed set of named constants</em>. The schema validator rejects any value not in the list — no runtime check needed. Unlike strings, typos are impossible.
      </div>
      <Code>{`enum Role {\n  ADMIN\n  VIEWER\n  GUEST\n}\n\nenum Permission {\n  READ\n  WRITE\n  DELETE\n}`}</Code>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Click a role — see which permissions it grants
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {ROLES.map(r => (
          <motion.button key={r.role} whileTap={{ scale: 0.96 }} onClick={() => setSelected(r.role)}
            style={{ flex: 1, padding: '10px 8px', border: `2.5px solid ${selected === r.role ? r.color : '#000'}`, borderRadius: 9, background: selected === r.role ? r.color : '#fff', color: selected === r.role ? '#fff' : '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '2px 2px 0 #000' }}>
            {r.badge} {r.role}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ padding: '14px 16px', border: `2.5px solid ${active.color}`, borderRadius: 10, background: `${active.color}11`, boxShadow: '2px 2px 0 #000' }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: active.color, marginBottom: 8 }}>{selected} grants:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {active.perms.length > 0
              ? active.perms.map(p => <Pill key={p} label={p} color={active.color} />)
              : <span style={{ fontSize: 11.5, color: '#9CA3AF', fontStyle: 'italic' }}>No permissions — public read only</span>}
          </div>
        </motion.div>
      </AnimatePresence>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFF7ED', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 11.5, color: '#92400E', lineHeight: 1.6 }}>
        <strong>🔑 Key Insight:</strong> If you pass <code style={{ fontFamily: 'var(--font-mono)', background: '#FED7AA', padding: '1px 4px', borderRadius: 3 }}>role: "SUPERUSER"</code> to the GraphQL API, it's rejected at validation time with <code style={{ fontFamily: 'var(--font-mono)' }}>BAD_USER_INPUT</code> — the resolver never runs.
      </div>
    </div>
  );
}

function InterfacePanel() {
  const [selected, setSelected] = useState<'StudentNode' | 'CourseNode'>('StudentNode');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F0FDF4', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 12, color: '#166534', lineHeight: 1.7 }}>
        <strong>📌 What is an Interface?</strong><br/>
        An interface defines a <em>contract</em> — a set of fields every implementing type must provide.
        You can query any field from the interface without knowing the concrete type underneath.
      </div>
      <Code>{`interface Node {\n  id:   ID!\n  name: String!\n}\n\ntype StudentNode implements Node {\n  id:   ID!      # required by Node\n  name: String!  # required by Node\n  age:  Int!     # StudentNode-specific\n}\n\ntype CourseNode implements Node {\n  id:    ID!      # required by Node\n  name:  String!  # required by Node\n  title: String!  # CourseNode-specific\n}`}</Code>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        What each type adds on top of the interface:
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {(['StudentNode', 'CourseNode'] as const).map(t => (
          <motion.button key={t} whileTap={{ scale: 0.96 }} onClick={() => setSelected(t)}
            style={{ flex: 1, padding: '10px 8px', border: '2.5px solid #000', borderRadius: 9, background: selected === t ? '#000' : '#fff', color: selected === t ? '#fff' : '#000', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '2px 2px 0 #000' }}>
            {t === 'StudentNode' ? '👤' : '📚'} {t}
          </motion.button>
        ))}
      </div>
      <div style={{ padding: '12px 14px', borderRadius: 9, border: '2px solid #000', background: '#F8FAFC', boxShadow: '2px 2px 0 #000' }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', marginBottom: 10 }}>Fields:</div>
        {['id: ID!', 'name: String!'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#22C55E', background: '#F0FDF4', padding: '2px 6px', borderRadius: 4, border: '1.5px solid #22C55E', fontFamily: 'var(--font-mono)' }}>Node</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#1F2937' }}>{f}</span>
          </div>
        ))}
        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {selected === 'StudentNode'
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#3B82F6', background: '#EFF6FF', padding: '2px 6px', borderRadius: 4, border: '1.5px solid #3B82F6', fontFamily: 'var(--font-mono)' }}>StudentNode</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#1F2937' }}>age: Int!</span>
                </div>
              : <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#8B5CF6', background: '#F5F3FF', padding: '2px 6px', borderRadius: 4, border: '1.5px solid #8B5CF6', fontFamily: 'var(--font-mono)' }}>CourseNode</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#1F2937' }}>title: String!</span>
                </div>
            }
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFF7ED', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 11.5, color: '#92400E', lineHeight: 1.6 }}>
        <strong>🔑 Key Insight:</strong> A query like <code style={{ fontFamily: 'var(--font-mono)', background: '#FED7AA', padding: '1px 4px', borderRadius: 3 }}>{'node(id: "1") { id name }'}</code> works regardless of whether the underlying object is a Student or Course — the interface guarantees both fields exist.
      </div>
    </div>
  );
}

function UnionPanel() {
  const [term, setTerm]   = useState('a');
  const [role, setRole]   = useState('ADMIN');
  const [result, setResult] = useState<DemoPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query Demo($input: SearchInput!, $role: Role) {
  advancedTypesDemo(input: $input, role: $role) {
    role
    permissions
    term
    total
    results {
      __typename
      ... on StudentNode { id name age }
      ... on CourseNode  { id name title }
    }
  }
}`,
          variables: { input: { term, maxResults: 6 }, role },
        }),
      });
      const json: GqlResponse = await res.json();
      if (json.errors?.length) { setError(json.errors[0].message); return; }
      setResult(json.data?.advancedTypesDemo ?? null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [term, role]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F5F3FF', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 12, color: '#5B21B6', lineHeight: 1.7 }}>
        <strong>📌 What is a Union?</strong><br/>
        A union field can return <em>completely different types</em> — unlike interfaces, the types share no required fields.
        The client must use <code style={{ fontFamily: 'var(--font-mono)', background: '#EDE9FE', padding: '1px 4px', borderRadius: 3 }}>__typename</code> and inline fragments (<code style={{ fontFamily: 'var(--font-mono)' }}>... on TypeName</code>) to handle each case.
      </div>
      <Code>{`union SearchResult = StudentNode | CourseNode\n\n# Query using inline fragments:\nquery {\n  advancedTypesDemo(input: { term: "a" }, role: ADMIN) {\n    results {\n      __typename          # "StudentNode" or "CourseNode"\n      ... on StudentNode { name age }\n      ... on CourseNode  { name title }\n    }\n  }\n}`}</Code>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Search Term</div>
          <input value={term} onChange={e => { setTerm(e.target.value); setResult(null); }}
            placeholder='e.g. "a", "web", "data"'
            style={{ width: '100%', padding: '9px 12px', border: '2px solid #000', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)', boxSizing: 'border-box', boxShadow: '2px 2px 0 #000' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Role (Enum)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ADMIN', 'VIEWER', 'GUEST'].map(r => (
              <motion.button key={r} whileTap={{ scale: 0.96 }} onClick={() => { setRole(r); setResult(null); }}
                style={{ flex: 1, padding: '9px 4px', border: '2px solid #000', borderRadius: 8, background: role === r ? '#000' : '#fff', color: role === r ? '#fff' : '#000', fontWeight: 800, fontSize: 10.5, cursor: 'pointer', boxShadow: '2px 2px 0 #000' }}>
                {r}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={run} disabled={loading || !term.trim()}
        style={{ padding: '10px 18px', border: '2.5px solid #000', borderRadius: 9, background: loading ? '#F3F4F6' : '#000', color: loading ? '#9CA3AF' : '#fff', fontWeight: 900, fontSize: 13, cursor: loading ? 'default' : 'pointer', boxShadow: '3px 3px 0 #000' }}>
        {loading ? '⏳ Querying…' : '▶ Run advancedTypesDemo Query'}
      </motion.button>
      {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '2px solid #EF4444', fontSize: 11.5, color: '#991B1B' }}>{error}</div>}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151' }}>Role: <strong>{result.role}</strong></span>
              <span style={{ fontSize: 11, color: '#6B7280' }}>·</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151' }}>Permissions:</span>
              {result.permissions.length > 0
                ? result.permissions.map(p => <Pill key={p} label={p} color="#8B5CF6" />)
                : <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>none</span>}
              <span style={{ fontSize: 11, color: '#6B7280' }}>·</span>
              <span style={{ fontSize: 11.5, color: '#374151' }}>{result.total} results for "{result.term}"</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.results.length === 0
                ? <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: 12, border: '2px dashed #D1D5DB', borderRadius: 8 }}>No results matched "{result.term}"</div>
                : result.results.map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '2px solid #000', borderRadius: 8, background: r.__typename === 'StudentNode' ? '#EFF6FF' : '#F5F3FF', boxShadow: '2px 2px 0 #000' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: r.__typename === 'StudentNode' ? '#1E40AF' : '#5B21B6', background: r.__typename === 'StudentNode' ? '#DBEAFE' : '#EDE9FE', padding: '2px 7px', borderRadius: 100, border: `1.5px solid ${r.__typename === 'StudentNode' ? '#3B82F6' : '#8B5CF6'}`, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {r.__typename}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1F2937' }}>{r.name}</span>
                    {r.__typename === 'StudentNode' && <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>age: {r.age}</span>}
                    {r.__typename === 'CourseNode'  && <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>title: "{r.title}"</span>}
                  </motion.div>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFF7ED', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 11.5, color: '#92400E', lineHeight: 1.6 }}>
        <strong>🔑 Key Insight:</strong> Notice how <code style={{ fontFamily: 'var(--font-mono)', background: '#FED7AA', padding: '1px 4px', borderRadius: 3 }}>__typename</code> in the response tells the client exactly which type each result is — <code style={{ fontFamily: 'var(--font-mono)' }}>StudentNode</code> or <code style={{ fontFamily: 'var(--font-mono)' }}>CourseNode</code>. The resolver uses <code style={{ fontFamily: 'var(--font-mono)' }}>__resolveType()</code> on the server to make this determination.
      </div>
    </div>
  );
}

function InputPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFF7ED', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 12, color: '#92400E', lineHeight: 1.7 }}>
        <strong>📌 What is an Input Type?</strong><br/>
        Input types are structured argument objects for queries and mutations. Unlike output types, they can only appear as <em>arguments</em> — never in a response. They enforce structure and typing on complex inputs.
      </div>
      <Code>{`# Input type — used ONLY as an argument, never in a response\ninput SearchInput {\n  term:       String!   # required\n  maxResults: Int       # optional, defaults handled in resolver\n}\n\n# Used in a query:\nquery Search($input: SearchInput!, $role: Role) {\n  advancedTypesDemo(input: $input, role: $role) {\n    role\n    permissions\n    total\n  }\n}\n\n# Variables:\n{\n  "input": { "term": "web", "maxResults": 5 },\n  "role": "ADMIN"\n}`}</Code>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Output Type (response)', color: '#22C55E', desc: 'type Student { ... }', note: 'Can have resolvers. Used in query results.' },
          { label: 'Input Type (argument)', color: '#F59E0B', desc: 'input SearchInput { ... }', note: 'No resolvers. Only used as query/mutation arguments.' },
        ].map(c => (
          <div key={c.label} style={{ padding: '12px 14px', borderRadius: 9, border: `2px solid ${c.color}`, background: `${c.color}11`, boxShadow: '2px 2px 0 #000' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: c.color, marginBottom: 6 }}>{c.label}</div>
            <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#1F2937', display: 'block', marginBottom: 6 }}>{c.desc}</code>
            <div style={{ fontSize: 10.5, color: '#6B7280' }}>{c.note}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#EFF6FF', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 11.5, color: '#1E40AF', lineHeight: 1.6 }}>
        <strong>🔑 Key Insight:</strong> Input types let you group related arguments into a reusable object. Instead of <code style={{ fontFamily: 'var(--font-mono)', background: '#DBEAFE', padding: '1px 4px', borderRadius: 3 }}>search(term: String!, max: Int, sort: String)</code>, you write <code style={{ fontFamily: 'var(--font-mono)', background: '#DBEAFE', padding: '1px 4px', borderRadius: 3 }}>search(input: SearchInput!)</code> — cleaner, and the input type is reusable across multiple queries.
      </div>
    </div>
  );
}

function DirectivePanel() {
  const [hideAge, setHideAge] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query Demo($hideAge: Boolean!) {\n  student(id: "1") {\n    id\n    name\n    age @skip(if: $hideAge)\n  }\n}`,
          variables: { hideAge },
        }),
      });
      const json = await res.json();
      if (json.errors?.length) { setResult({ error: json.errors[0].message }); return; }
      setResult(json.data);
    } finally {
      setLoading(false);
    }
  }, [hideAge]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F0FDF4', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 12, color: '#166534', lineHeight: 1.7 }}>
        <strong>📌 What are Directives?</strong><br/>
        Directives control execution behaviour on a field level. The built-in <code style={{ fontFamily: 'var(--font-mono)', background: '#DCFCE7', padding: '1px 4px', borderRadius: 3 }}>@skip(if: Boolean)</code> and <code style={{ fontFamily: 'var(--font-mono)', background: '#DCFCE7', padding: '1px 4px', borderRadius: 3 }}>@include(if: Boolean)</code> conditionally include or omit fields at execution time — before the resolver runs.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Toggle the directive:</div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setHideAge(h => !h); setResult(null); }}
            style={{ padding: '12px 16px', border: '2.5px solid #000', borderRadius: 9, background: hideAge ? '#EF4444' : '#22C55E', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '3px 3px 0 #000', textAlign: 'left' }}>
            {hideAge ? '🔴 @skip(if: true)  →  age OMITTED' : '🟢 @skip(if: false) →  age INCLUDED'}
          </motion.button>
          <Code>{`query Demo($hideAge: Boolean!) {\n  student(id: "1") {\n    id\n    name\n    age @skip(if: $hideAge)\n  }\n}`}</Code>
          <Code>{`// Variables:\n{ "hideAge": ${hideAge} }`}</Code>
          <motion.button whileTap={{ scale: 0.97 }} onClick={run} disabled={loading}
            style={{ padding: '9px 14px', border: '2.5px solid #000', borderRadius: 9, background: loading ? '#F3F4F6' : '#000', color: loading ? '#9CA3AF' : '#fff', fontWeight: 900, fontSize: 12, cursor: loading ? 'default' : 'pointer', boxShadow: '2px 2px 0 #000' }}>
            {loading ? '⏳ Running…' : '▶ Run Query'}
          </motion.button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Response:</div>
          <AnimatePresence mode="wait">
            {result
              ? <motion.pre key={JSON.stringify(result)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ margin: 0, padding: '12px 14px', background: '#F0FDF4', borderRadius: 8, border: '2px solid #22C55E', boxShadow: '2px 2px 0 #000', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#1F2937', lineHeight: 1.6 }}>
                  {JSON.stringify(result, null, 2)}
                </motion.pre>
              : <div style={{ padding: '40px 20px', textAlign: 'center', border: '2px dashed #D1D5DB', borderRadius: 8, color: '#9CA3AF', fontSize: 12 }}>
                  Run the query to see the response
                </div>
            }
          </AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '10px 12px', borderRadius: 8, background: hideAge ? '#FEF2F2' : '#F0FDF4', border: `2px solid ${hideAge ? '#EF4444' : '#22C55E'}`, fontSize: 11.5, color: hideAge ? '#991B1B' : '#166534', lineHeight: 1.6 }}>
              {hideAge
                ? '🔴 age field is ABSENT from the response — the resolver was never called!'
                : '🟢 age field is PRESENT in the response — resolver ran normally.'}
            </motion.div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFF7ED', border: '2px solid #000', boxShadow: '2px 2px 0 #000', fontSize: 11.5, color: '#92400E', lineHeight: 1.6 }}>
        <strong>🔑 Key Insight:</strong> <code style={{ fontFamily: 'var(--font-mono)', background: '#FED7AA', padding: '1px 4px', borderRadius: 3 }}>@skip</code> fires at <em>execution time</em> — after parsing and validation, but before field resolution. The <code style={{ fontFamily: 'var(--font-mono)' }}>age</code> resolver literally never runs when skipped.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
const TABS: { key: ActiveType; label: string; sub: string; color: string }[] = [
  { key: 'enum',      label: '🔢 Enum',       sub: 'Role, Permission',       color: '#EF4444' },
  { key: 'interface', label: '📐 Interface',   sub: 'Node contract',          color: '#22C55E' },
  { key: 'union',     label: '🔀 Union',       sub: 'SearchResult live demo', color: '#8B5CF6' },
  { key: 'input',     label: '📥 Input Type',  sub: 'SearchInput args',       color: '#F59E0B' },
  { key: 'directive', label: '✨ Directive',   sub: '@skip(if: …) live',      color: '#3B82F6' },
];

export function AdvancedTypesDemo() {
  const [tab, setTab] = useState<ActiveType>('enum');

  return (
    <div style={{ background: '#FFF8F0', border: 'var(--border)', boxShadow: 'var(--shadow-md)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: '#0F172A', borderBottom: '3px solid #000', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🧩</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Advanced GraphQL Types</div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
            Enum · Interface · Union · Input Type · Directive — the complete type system
          </div>
        </div>
      </div>

      {/* Tab row */}
      <div style={{ display: 'flex', borderBottom: '2px solid #000', overflowX: 'auto', background: '#F8FAFC' }}>
        {TABS.map((t, i) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: '0 0 auto', padding: '11px 16px', border: 'none', borderRight: i < TABS.length - 1 ? '1.5px solid #E5E7EB' : 'none', background: tab === t.key ? '#FFF8F0' : 'transparent', fontWeight: 900, fontSize: 12, cursor: 'pointer', textAlign: 'left', borderBottom: tab === t.key ? `3px solid ${t.color}` : '3px solid transparent', color: tab === t.key ? '#000' : '#6B7280', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {t.label}
            <span style={{ display: 'block', fontSize: 9.5, fontWeight: 600, color: tab === t.key ? t.color : '#9CA3AF', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{t.sub}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {tab === 'enum'      && <EnumPanel />}
            {tab === 'interface' && <InterfacePanel />}
            {tab === 'union'     && <UnionPanel />}
            {tab === 'input'     && <InputPanel />}
            {tab === 'directive' && <DirectivePanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
