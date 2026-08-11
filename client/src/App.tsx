import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FakeDemo }        from './components/FakeDemo/FakeDemo';
import { RestComparison }  from './components/RestVsGraphQL/RestComparison';
import { DOMAINS, getDomain } from './data/domains';
import type { DomainId } from './data/domains';
import './index.css';

type Tab = 'rest' | 'graphql';

const TAB_CONFIG: { id: Tab; emoji: string; label: string }[] = [
  { id: 'rest',    emoji: '😩', label: 'The Problem (REST)' },
  { id: 'graphql', emoji: '✨', label: 'The Solution (GraphQL)' },
];

export default function App() {
  const [tab, setTab]         = useState<Tab>('rest');
  const [domainId, setDomainId] = useState<DomainId>('education');

  const domain = getDomain(domainId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Shared sticky header ── */}
      <header className="gs-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#fff',
        borderBottom: 'var(--border)',
        padding: '0 28px',
        height: 54,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        {/* Logo */}
        <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px', flexShrink: 0 }}>
          ⬡ GraphScope
        </span>

        {/* Tab switcher */}
        <nav className="gs-tab-nav" style={{ background: 'var(--bg-base)', border: 'var(--border-2)', borderRadius: 10, padding: 3, flexShrink: 0 }}>
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
              {t.emoji} <span className="gs-tab-label">{t.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Domain switcher — only visible on the GraphQL tab */}
        <AnimatePresence>
          {tab === 'graphql' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
            >
              {/* Divider */}
              <span style={{ width: 1, height: 22, background: '#e5e7eb', display: 'inline-block' }} />

              {/* Label */}
              <span style={{
                fontSize: 10, fontWeight: 800, color: '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Domain
              </span>

              {/* Pill group */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-base)',
                border: 'var(--border-2)',
                borderRadius: 10,
                padding: 3,
                gap: 2,
              }}>
                {DOMAINS.map(d => (
                  <motion.button
                    key={d.id}
                    onClick={() => setDomainId(d.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    title={d.description}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 7,
                      border: 'none',
                      background: domainId === d.id ? '#000' : 'transparent',
                      color: domainId === d.id ? '#fff' : 'var(--text-mid)',
                      fontSize: 11.5, fontWeight: 700,
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <span>{d.emoji}</span>
                    <span className="gs-tab-label">{d.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            : <FakeDemo domain={domain} />
          }
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
