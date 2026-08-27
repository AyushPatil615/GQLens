import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Data ───────────────────────────────────────────────────────────────────

const SUBGRAPHS = [
  {
    id: 'users',
    name: 'Users Subgraph',
    emoji: '👤',
    color: '#6366F1',
    team: 'Auth Team',
    port: ':4001',
    schema: `type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

type Query {
  user(id: ID!): User
  me: User
}`,
    resolves: ['user.id', 'user.name', 'user.email'],
  },
  {
    id: 'products',
    name: 'Products Subgraph',
    emoji: '📦',
    color: '#F59E0B',
    team: 'Catalog Team',
    port: ':4002',
    schema: `type Product @key(fields: "id") {
  id: ID!
  title: String!
  price: Float!
  category: String!
}

type Query {
  product(id: ID!): Product
  products: [Product!]!
}`,
    resolves: ['product.id', 'product.title', 'product.price'],
  },
  {
    id: 'orders',
    name: 'Orders Subgraph',
    emoji: '🛒',
    color: '#10B981',
    team: 'Commerce Team',
    port: ':4003',
    schema: `type Order @key(fields: "id") {
  id: ID!
  total: Float!
  status: String!
  createdAt: String!
}

# Extends User from Users Subgraph
type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!
}

type Query {
  order(id: ID!): Order
}`,
    resolves: ['user.orders', 'order.id', 'order.total'],
  },
];

const DIRECTIVES = [
  {
    name: '@key',
    color: '#6366F1',
    usage: 'type User @key(fields: "id")',
    description:
      'Marks the primary key of an entity so the Gateway can uniquely identify and reference it across subgraphs.',
    analogy: 'Like a primary key in a database — the Gateway uses this to join data from multiple services.',
  },
  {
    name: '@external',
    color: '#F59E0B',
    usage: 'id: ID! @external',
    description:
      'Declares that this field is owned by another subgraph. The current subgraph needs it for computation but does not define it.',
    analogy: 'Like a foreign key — "I reference this field but I don\'t own it."',
  },
  {
    name: '@requires',
    color: '#10B981',
    usage: '@requires(fields: "shippingZone")',
    description:
      'Tells the Gateway to first fetch certain fields from the owning subgraph before calling this resolver. Used for computed fields that depend on data from another service.',
    analogy: 'Like a SQL JOIN — "Before calling me, go get these fields first."',
  },
  {
    name: '@provides',
    color: '#EC4899',
    usage: '@provides(fields: "name")',
    description:
      'Tells the Gateway this subgraph can locally return certain fields of a related entity, avoiding an extra network hop.',
    analogy: 'Like an eager-loaded relationship — "I already have this, no need to fetch separately."',
  },
];

const QUERY_EXAMPLE = `query GetUserDashboard($userId: ID!) {
  user(id: $userId) {
    name          # ← Users Subgraph
    email         # ← Users Subgraph
    orders {      # ← Gateway routes to Orders Subgraph
      id
      total
      status
    }
  }
}`;

type Step = {
  id: string;
  label: string;
  from: string;
  to: string;
  detail: string;
  color: string;
};

const QUERY_STEPS: Step[] = [
  {
    id: 'client',
    label: '1. Client sends query',
    from: 'Client',
    to: 'Gateway',
    detail: 'Single GraphQL query hits the Gateway at port :4000. Client has no idea about subgraphs.',
    color: '#6366F1',
  },
  {
    id: 'plan',
    label: '2. Gateway builds query plan',
    from: 'Gateway',
    to: 'Query Planner',
    detail:
      'Gateway reads the federated schema, figures out which subgraphs own which fields, and builds an execution plan.',
    color: '#8B5CF6',
  },
  {
    id: 'users',
    label: '3. Fetch from Users Subgraph',
    from: 'Gateway',
    to: 'Users :4001',
    detail: 'Gateway fetches { user { name email } } from the Users Subgraph.',
    color: '#6366F1',
  },
  {
    id: 'orders',
    label: '4. Fetch from Orders Subgraph',
    from: 'Gateway',
    to: 'Orders :4003',
    detail: 'Gateway sends user.id (from step 3) + fetches { user { orders { id total status } } } from Orders Subgraph.',
    color: '#10B981',
  },
  {
    id: 'merge',
    label: '5. Merge & respond',
    from: 'Gateway',
    to: 'Client',
    detail:
      'Gateway merges all subgraph responses into one clean JSON object. Client receives a single unified response.',
    color: '#F59E0B',
  },
];

const NETFLIX_PANELS = [
  {
    icon: '🎬',
    subgraph: 'Streaming Subgraph',
    team: 'Streaming Platform Team',
    owns: ['Title metadata', 'Episode info', 'Stream URLs', 'Quality settings'],
    color: '#E50914',
  },
  {
    icon: '👤',
    subgraph: 'Identity Subgraph',
    team: 'Auth & Identity Team',
    owns: ['User accounts', 'Profiles', 'Parental controls', 'Auth tokens'],
    color: '#564D4D',
  },
  {
    icon: '🤖',
    subgraph: 'Recommendations Subgraph',
    team: 'ML & Personalization Team',
    owns: ['Watch history', 'Personalized rows', 'Similarity scores', 'Trending lists'],
    color: '#B81D24',
  },
  {
    icon: '💳',
    subgraph: 'Billing Subgraph',
    team: 'Payments Team',
    owns: ['Subscription plans', 'Payment methods', 'Invoices', 'Renewal dates'],
    color: '#221F1F',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ArchDiagram({ runningStep }: { runningStep: number }) {
  const activeNodes: Record<number, string[]> = {
    0: ['client', 'gateway'],
    1: ['gateway'],
    2: ['gateway', 'users'],
    3: ['gateway', 'orders'],
    4: ['gateway', 'client'],
  };

  const lit = runningStep >= 0 ? activeNodes[runningStep] ?? [] : [];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      width: '100%',
      userSelect: 'none',
      padding: '8px 0',
    }}>

      {/* ── Col 1: Client ── */}
      <Node label="Client" emoji="🌐" active={lit.includes('client')} color="#6366F1" />

      {/* ── Arrow: client → gateway ── */}
      <FlexArrow active={runningStep === 0} />

      {/* ── Col 2: Gateway ── */}
      <Node label="Gateway :4000" emoji="⬡" active={runningStep >= 0} color="#000" />

      {/* ── Arrow: gateway → subgraphs ── */}
      <FlexArrow active={runningStep >= 1} />

      {/* ── Col 3: three subgraph nodes stacked ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <Node label="Users :4001"    emoji="👤" active={lit.includes('users')}    color="#6366F1" size="sm" />
        <Node label="Products :4002" emoji="📦" active={false}                   color="#F59E0B" size="sm" />
        <Node label="Orders :4003"   emoji="🛒" active={lit.includes('orders')}  color="#10B981" size="sm" />
      </div>

    </div>
  );
}

function Node({
  label, emoji, active, color, size = 'md', style,
}: {
  label: string; emoji: string; active: boolean; color: string;
  size?: 'md' | 'sm'; style?: React.CSSProperties;
}) {
  const sz = size === 'sm' ? 38 : 48;
  const fs = size === 'sm' ? 16 : 20;
  const ls = size === 'sm' ? 8  : 9;

  return (
    <motion.div
      animate={{ scale: active ? 1.07 : 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 4, minWidth: size === 'sm' ? 76 : 90, flexShrink: 0,
        ...style,
      }}
    >
      <div style={{
        width: sz, height: sz, borderRadius: 10,
        background: active ? color : '#F3F4F6',
        border: `2.5px solid ${active ? color : '#E5E7EB'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: fs,
        boxShadow: active ? `3px 3px 0 ${color}55` : '2px 2px 0 #E5E7EB',
        transition: 'all 0.2s',
      }}>
        {emoji}
      </div>
      <span style={{
        fontSize: ls, fontWeight: 800, textAlign: 'center',
        color: active ? color : '#9CA3AF',
        fontFamily: 'var(--font-mono)',
        transition: 'color 0.2s',
        lineHeight: 1.3,
        maxWidth: 84,
      }}>
        {label}
      </span>
    </motion.div>
  );
}

function FlexArrow({ active }: { active: boolean }) {
  return (
    <div style={{ flex: 1, height: 2, minWidth: 24, position: 'relative' }}>
      <motion.div
        animate={{ opacity: active ? 1 : 0.18, scaleX: active ? 1 : 0.8 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%', height: '100%',
          background: active
            ? 'linear-gradient(90deg, #6366F1, #10B981)'
            : '#E5E7EB',
          borderRadius: 2,
          transformOrigin: 'left center',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', right: -1, top: '50%',
          transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: `6px solid ${active ? '#10B981' : '#E5E7EB'}`,
          transition: 'border-color 0.2s',
        }} />
      </motion.div>
    </div>
  );
}


// ─── Main Component ──────────────────────────────────────────────────────────

export function FederationDemo() {
  const [activeTab, setActiveTab]       = useState<'arch' | 'directives' | 'subgraphs'>('arch');
  const [runningStep, setRunningStep]   = useState(-1);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [netflixOpen, setNetflixOpen]   = useState(false);
  const [activeDirective, setActiveDirective] = useState(0);
  const [activeSubgraph, setActiveSubgraph]   = useState(0);

  async function handlePlayQuery() {
    if (isPlaying) return;
    setIsPlaying(true);
    setRunningStep(-1);
    for (let i = 0; i < QUERY_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setRunningStep(i);
    }
    await new Promise(r => setTimeout(r, 800));
    setIsPlaying(false);
  }

  function handleReset() {
    setIsPlaying(false);
    setRunningStep(-1);
  }

  const tabs = [
    { id: 'arch' as const,       label: '🏗️ Architecture',  desc: 'How queries flow' },
    { id: 'directives' as const, label: '🔖 Directives',     desc: '@key @external @requires' },
    { id: 'subgraphs' as const,  label: '🗂️ Subgraph Schemas', desc: 'What each service owns' },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 860 }}>

      {/* ── Intro banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        border: '2.5px solid #4F46E5',
        boxShadow: '4px 4px 0 #4F46E5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>🌐</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#E0E7FF' }}>
              GraphQL Federation
            </div>
            <div style={{ fontSize: 11, color: '#A5B4FC', fontWeight: 600 }}>
              One API. Many Services. Zero coupling.
            </div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#C7D2FE', lineHeight: 1.7 }}>
          Federation lets multiple teams independently own a piece of the GraphQL schema.
          A <strong style={{ color: '#E0E7FF' }}>Gateway</strong> stitches all subgraphs into one unified API.
          The client sends one query — the Gateway figures out which services to call, joins the data, and returns a single response.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '10px 12px',
              border: `2.5px solid ${activeTab === t.id ? '#6366F1' : '#E5E7EB'}`,
              borderRadius: 10,
              background: activeTab === t.id ? '#6366F1' : '#FFF',
              color: activeTab === t.id ? '#FFF' : '#374151',
              fontWeight: 800, fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              boxShadow: activeTab === t.id ? '3px 3px 0 #4338CA' : '2px 2px 0 #E5E7EB',
              transition: 'all 0.15s',
            }}
          >
            <div>{t.label}</div>
            <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >

          {/* ─── Architecture Tab ─── */}
          {activeTab === 'arch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Architecture diagram */}
              <div style={{
                background: '#FFF', border: '2.5px solid #E5E7EB',
                borderRadius: 14, padding: '20px 24px',
                boxShadow: '3px 3px 0 #E5E7EB',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 16 }}>
                  Live Query Execution Flow
                </div>
                <ArchDiagram runningStep={runningStep} />
              </div>

              {/* Query + Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Query box */}
                <div style={{
                  background: '#0F172A', borderRadius: 12,
                  border: '2.5px solid #334155',
                  padding: '16px',
                  boxShadow: '3px 3px 0 #334155',
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 900, color: '#64748B',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: 10,
                  }}>
                    Client Query →
                  </div>
                  <pre style={{
                    margin: 0, fontSize: 11.5,
                    color: '#E2E8F0',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre',
                  }}>
                    {QUERY_EXAMPLE}
                  </pre>

                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button
                      onClick={handlePlayQuery}
                      disabled={isPlaying}
                      style={{
                        flex: 1, padding: '9px 0',
                        background: isPlaying ? '#1E293B' : '#6366F1',
                        color: '#FFF', fontWeight: 800, fontSize: 11,
                        border: '2px solid #818CF8',
                        borderRadius: 8, cursor: isPlaying ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-sans)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isPlaying ? '⏳ Running...' : '▶ Run Query'}
                    </button>
                    <button
                      onClick={handleReset}
                      style={{
                        padding: '9px 12px',
                        background: '#1E293B', color: '#94A3B8',
                        fontWeight: 800, fontSize: 11,
                        border: '2px solid #334155',
                        borderRadius: 8, cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      ↺
                    </button>
                  </div>
                </div>

                {/* Steps panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {QUERY_STEPS.map((step, i) => {
                    const done    = runningStep >= i;
                    const current = runningStep === i;
                    return (
                      <motion.div
                        key={step.id}
                        animate={{
                          opacity: done ? 1 : 0.35,
                          x: current ? 3 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: `2px solid ${done ? step.color : '#E5E7EB'}`,
                          background: current ? `${step.color}12` : '#FFF',
                          boxShadow: current ? `2px 2px 0 ${step.color}` : 'none',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 800, color: done ? step.color : '#9CA3AF' }}>
                          {step.label}
                        </div>
                        {current && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ fontSize: 10, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}
                          >
                            {step.detail}
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Directives Tab ─── */}
          {activeTab === 'directives' && (
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
              {/* Directive list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DIRECTIVES.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() => setActiveDirective(i)}
                    style={{
                      padding: '10px 12px', textAlign: 'left',
                      border: `2px solid ${activeDirective === i ? d.color : '#E5E7EB'}`,
                      borderRadius: 10,
                      background: activeDirective === i ? `${d.color}15` : '#FFF',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      boxShadow: activeDirective === i ? `2px 2px 0 ${d.color}` : 'none',
                    }}
                  >
                    <code style={{
                      fontSize: 12, fontWeight: 900,
                      color: activeDirective === i ? d.color : '#374151',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {d.name}
                    </code>
                  </button>
                ))}
              </div>

              {/* Directive detail */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDirective}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    background: '#FFF', borderRadius: 14,
                    border: `2.5px solid ${DIRECTIVES[activeDirective].color}`,
                    padding: '20px 22px',
                    boxShadow: `4px 4px 0 ${DIRECTIVES[activeDirective].color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <code style={{
                      fontSize: 18, fontWeight: 900,
                      color: DIRECTIVES[activeDirective].color,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {DIRECTIVES[activeDirective].name}
                    </code>
                  </div>

                  <div style={{
                    background: '#F8FAFC', borderRadius: 8,
                    border: '2px solid #E2E8F0',
                    padding: '10px 14px', marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      Usage
                    </div>
                    <code style={{
                      fontSize: 12, color: DIRECTIVES[activeDirective].color,
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                    }}>
                      {DIRECTIVES[activeDirective].usage}
                    </code>
                  </div>

                  <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.7, margin: '0 0 12px' }}>
                    {DIRECTIVES[activeDirective].description}
                  </p>

                  <div style={{
                    background: `${DIRECTIVES[activeDirective].color}10`,
                    borderLeft: `3px solid ${DIRECTIVES[activeDirective].color}`,
                    borderRadius: '0 8px 8px 0',
                    padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 9.5, fontWeight: 900, color: DIRECTIVES[activeDirective].color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      💡 Think of it as...
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                      {DIRECTIVES[activeDirective].analogy}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ─── Subgraphs Tab ─── */}
          {activeTab === 'subgraphs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
              {/* Subgraph list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUBGRAPHS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSubgraph(i)}
                    style={{
                      padding: '11px 13px', textAlign: 'left',
                      border: `2px solid ${activeSubgraph === i ? s.color : '#E5E7EB'}`,
                      borderRadius: 10,
                      background: activeSubgraph === i ? `${s.color}15` : '#FFF',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      boxShadow: activeSubgraph === i ? `2px 2px 0 ${s.color}` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 14, marginBottom: 3 }}>{s.emoji}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 800,
                      color: activeSubgraph === i ? s.color : '#374151',
                    }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>
                      {s.team}
                    </div>
                  </button>
                ))}
              </div>

              {/* Schema panel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSubgraph}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <div style={{
                    background: '#FFF', borderRadius: 14,
                    border: `2.5px solid ${SUBGRAPHS[activeSubgraph].color}`,
                    overflow: 'hidden',
                    boxShadow: `4px 4px 0 ${SUBGRAPHS[activeSubgraph].color}`,
                  }}>
                    {/* Header */}
                    <div style={{
                      background: SUBGRAPHS[activeSubgraph].color,
                      padding: '12px 18px',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 18 }}>{SUBGRAPHS[activeSubgraph].emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>
                          {SUBGRAPHS[activeSubgraph].name}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                          {SUBGRAPHS[activeSubgraph].team} · {SUBGRAPHS[activeSubgraph].port}
                        </div>
                      </div>
                    </div>

                    {/* Schema */}
                    <div style={{ background: '#0F172A', padding: '16px 18px' }}>
                      <div style={{
                        fontSize: 9, fontWeight: 900, color: '#475569',
                        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                      }}>
                        GraphQL Schema (SDL)
                      </div>
                      <pre style={{
                        margin: 0, fontSize: 11.5,
                        color: '#E2E8F0',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1.75,
                        whiteSpace: 'pre',
                      }}>
                        {SUBGRAPHS[activeSubgraph].schema}
                      </pre>
                    </div>

                    {/* What it resolves */}
                    <div style={{ padding: '14px 18px' }}>
                      <div style={{
                        fontSize: 10, fontWeight: 900, color: '#9CA3AF',
                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
                      }}>
                        Fields this subgraph resolves:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {SUBGRAPHS[activeSubgraph].resolves.map(r => (
                          <code
                            key={r}
                            style={{
                              padding: '3px 8px',
                              background: `${SUBGRAPHS[activeSubgraph].color}15`,
                              border: `1.5px solid ${SUBGRAPHS[activeSubgraph].color}55`,
                              borderRadius: 6,
                              fontSize: 11,
                              color: SUBGRAPHS[activeSubgraph].color,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                            }}
                          >
                            {r}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Netflix Real-World Example (Hidden Box) ── */}
      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => setNetflixOpen(o => !o)}
          style={{
            width: '100%', padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: netflixOpen ? '#E50914' : '#1A1A1A',
            border: '2.5px solid #E50914',
            borderRadius: netflixOpen ? '12px 12px 0 0' : 12,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            boxShadow: '4px 4px 0 #E50914',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎬</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>
                Netflix Real-World Example
              </div>
              <div style={{ fontSize: 10, color: netflixOpen ? 'rgba(255,255,255,0.8)' : '#9CA3AF', fontWeight: 600 }}>
                How Netflix uses Federation at scale — click to reveal
              </div>
            </div>
          </div>
          <motion.span
            animate={{ rotate: netflixOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 16, color: '#FFF' }}
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {netflixOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                background: '#111',
                border: '2.5px solid #E50914',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                padding: '24px 22px',
              }}>
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#E50914', marginBottom: 6 }}>
                    Netflix Studio Engineering: Apollo Federation in Production
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
                    Netflix runs <strong style={{ color: '#FFF' }}>hundreds of microservices</strong>. Before Federation, each team maintained their own REST API and the frontend had to call 6–10 APIs per page load. With Apollo Federation, they unified it into a single GraphQL Gateway — teams still independently own their service, but the client sees one clean API.
                  </p>
                </div>

                {/* Subgraph cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {NETFLIX_PANELS.map(p => (
                    <div
                      key={p.subgraph}
                      style={{
                        background: '#1A1A1A',
                        border: `2px solid ${p.color}`,
                        borderRadius: 10, padding: '14px 16px',
                        boxShadow: `3px 3px 0 ${p.color}55`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{p.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: '#FFF' }}>{p.subgraph}</div>
                          <div style={{ fontSize: 9, color: '#6B7280', fontWeight: 600 }}>{p.team}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {p.owns.map(o => (
                          <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 600 }}>{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* The "N+watch" query */}
                <div style={{
                  background: '#0D0D0D', borderRadius: 10,
                  border: '1.5px solid #2D2D2D', padding: '16px 18px',
                  marginBottom: 16,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 900, color: '#E50914',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                  }}>
                    One query — 4 subgraphs touched:
                  </div>
                  <pre style={{
                    margin: 0, fontSize: 11.5,
                    color: '#E2E8F0',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.75,
                  }}>
{`query NetflixHomePage {
  me {                          # → Identity Subgraph
    name
    subscription { plan }      # → Billing Subgraph
    recommendations {          # → Recommendations Subgraph
      title
      matchScore
      streamUrl                # → Streaming Subgraph
    }
  }
}`}
                  </pre>
                </div>

                {/* Key results */}
                <div style={{
                  background: 'linear-gradient(135deg, #1A0A0A, #0D0D0D)',
                  border: '1.5px solid #E50914',
                  borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 900, color: '#E50914', marginBottom: 10 }}>
                    📊 What Netflix reported after migrating to Federation:
                  </div>
                  {[
                    { metric: '~60%', label: 'Reduction in client-side API calls per page' },
                    { metric: '~4×',  label: 'Faster feature development per team' },
                    { metric: '100+', label: 'Subgraph services running in production' },
                    { metric: '0',    label: 'Breaking changes from one team to another (schema contracts enforced)' },
                  ].map(r => (
                    <div key={r.metric} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#E50914', minWidth: 44 }}>{r.metric}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{r.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 10, color: '#4B5563', textAlign: 'center' }}>
                  Source: Netflix Tech Blog & Apollo Federation docs · 2023
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
