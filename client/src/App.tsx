import './index.css'

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>

      {/* Logo Mark */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, #e535ab 0%, #bf5af2 50%, #7c5cfc 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 0 40px rgba(229,53,171,0.4)',
        fontSize: 32
      }}>
        ⬡
      </div>

      {/* Heading */}
      <h1 style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        GraphScope
      </h1>

      <p style={{ fontSize: 18, maxWidth: 520, marginBottom: 40, color: 'var(--text-secondary)' }}>
        Watch a GraphQL query travel through resolvers, step by step — with plain-English explanations at every stage.
      </p>

      {/* Phase badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 999,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-base)',
        color: 'var(--text-secondary)', fontSize: 14
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e535ab', display: 'inline-block', boxShadow: '0 0 8px #e535ab' }} />
        Phase 0 complete — Foundation ready
      </div>

      {/* Tech stack pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 40 }}>
        {['React + TypeScript', 'Tailwind CSS v4', 'React Flow', 'Framer Motion', 'Apollo Server', 'SQLite'].map(tech => (
          <span key={tech} style={{
            padding: '6px 14px', borderRadius: 999,
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            fontSize: 13, color: 'var(--text-secondary)'
          }}>{tech}</span>
        ))}
      </div>

      <p style={{ marginTop: 48, fontSize: 13, color: 'var(--text-muted)' }}>
        Phase 1 — Fake Demo coming next
      </p>
    </div>
  )
}

export default App
