import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FakeDemo }        from './components/FakeDemo/FakeDemo';
import { RestComparison }  from './components/RestVsGraphQL/RestComparison';
import { GoingDeeper }     from './components/GoingDeeper/GoingDeeper';
import { ChallengesView }   from './components/Challenges/ChallengesView';
import { DOMAINS, getDomain } from './data/domains';
import type { DomainId } from './data/domains';
import { ModeProvider, useAppMode } from './context/ModeContext';
import type { AppMode } from './context/ModeContext';
import './index.css';

type Tab = 'rest' | 'graphql' | 'deeper' | 'challenges';

const TAB_CONFIG: { id: Tab; emoji: string; label: string }[] = [
  { id: 'rest',       emoji: '😩', label: 'The Problem (REST)' },
  { id: 'graphql',    emoji: '✨', label: 'The Solution (GraphQL)' },
  { id: 'deeper',     emoji: '⚡', label: 'Going Deeper' },
  { id: 'challenges', emoji: '🎯', label: 'Challenges' },
];

// ─── Mode Toggle Component ────────────────────────────────────────────────────
function ModeToggle() {
  const { mode, setMode } = useAppMode();
  const isLearning = mode === 'learning';

  const MODES: { key: AppMode; emoji: string; label: string; color: string; desc: string }[] = [
    { key: 'learning',   emoji: '🧠', label: 'Learning',   color: '#8B5CF6', desc: 'Concepts: AST, parser, resolver, tracing, null bubbling' },
    { key: 'production', emoji: '🚀', label: 'Production',  color: '#EF4444', desc: 'Engineering: auth, rate limiting, depth limits, complexity' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
      {/* Divider */}
      <span style={{ width: 1, height: 22, background: '#E5E7EB', display: 'inline-block' }} />

      {/* Label */}
      <span style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        Mode
      </span>

      {/* Toggle pill */}
      <motion.div
        style={{
          display: 'flex',
          background: 'var(--bg-base)',
          border: 'var(--border-2)',
          borderRadius: 10,
          padding: 3,
          gap: 2,
          position: 'relative',
        }}
        title={MODES.find(m => m.key === mode)?.desc}
      >
        {MODES.map(m => (
          <motion.button
            key={m.key}
            onClick={() => setMode(m.key)}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '5px 11px',
              borderRadius: 7,
              border: 'none',
              background: mode === m.key ? m.color : 'transparent',
              color: mode === m.key ? '#fff' : '#6B7280',
              fontSize: 11.5,
              fontWeight: 800,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{m.emoji}</span>
            <span className="gs-tab-label">{m.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Live indicator badge */}
      <AnimatePresence mode="wait">
        <motion.span
          key={mode}
          initial={{ opacity: 0, scale: 0.8, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            fontSize: 9.5,
            fontWeight: 900,
            padding: '2px 7px',
            borderRadius: 100,
            border: `2px solid ${isLearning ? '#8B5CF6' : '#EF4444'}`,
            color: isLearning ? '#8B5CF6' : '#EF4444',
            background: isLearning ? '#F5F3FF' : '#FEF2F2',
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {isLearning ? 'Concepts' : 'Engineering'}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── Inner app (needs ModeProvider to be a parent) ───────────────────────────
function AppInner() {
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

        {/* Mode Toggle — always visible */}
        <ModeToggle />
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
            : tab === 'graphql'
              ? <FakeDemo domain={domain} />
              : tab === 'deeper'
                ? <GoingDeeper />
                : <ChallengesView />
          }
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Root export (wraps in ModeProvider) ─────────────────────────────────────
export default function App() {
  return (
    <ModeProvider>
      <AppInner />
    </ModeProvider>
  );
}
