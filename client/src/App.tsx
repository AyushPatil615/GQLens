import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FakeDemo }        from './components/FakeDemo/FakeDemo';
import { RestComparison }  from './components/RestVsGraphQL/RestComparison';
import './index.css';

type Tab = 'rest' | 'graphql';

const TAB_CONFIG: { id: Tab; emoji: string; label: string }[] = [
  { id: 'rest',    emoji: '😩', label: 'The Problem (REST)' },
  { id: 'graphql', emoji: '✨', label: 'The Solution (GraphQL)' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('rest');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Shared sticky header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff',
        borderBottom: 'var(--border)',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 54,
      }}>
        {/* Logo */}
        <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px', flexShrink: 0 }}>
          ⬡ GraphScope
        </span>

        {/* Tab switcher */}
        <nav style={{ display: 'flex', gap: 4, background: 'var(--bg-base)', border: 'var(--border-2)', borderRadius: 10, padding: 3 }}>
          {TAB_CONFIG.map(t => (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                background: tab === t.id ? '#000' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text-mid)',
                fontSize: 12.5, fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.emoji} {t.label}
            </motion.button>
          ))}
        </nav>
      </header>

      {/* ── Active page ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ flex: 1 }}
        >
          {tab === 'rest'
            ? <RestComparison onTryDemo={() => setTab('graphql')} />
            : <FakeDemo />
          }
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
