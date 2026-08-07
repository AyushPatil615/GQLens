import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StepDialogue } from '../../data/fakeData';

interface Props {
  dialogue: StepDialogue | null;
  isComplete: boolean;
}

type SectionKey = 'howItWorks' | 'whatItTakes' | 'inContext' | 'code';

export function StepDialoguePanel({ dialogue, isComplete }: Props) {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    howItWorks:  true,
    whatItTakes: true,
    inContext:   true,
    code:        false,
  });

  function toggle(key: SectionKey) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // ─── Idle state ────────────────────────────────────────────────
  if (!dialogue && !isComplete) {
    return (
      <div style={{
        flex: 1, minWidth: 280,
        background: 'var(--bg-surface)',
        borderRadius: 16,
        border: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center', gap: 12,
      }}>
        <div style={{ fontSize: 36, opacity: 0.2 }}>💬</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', margin: 0 }}>
          Step explanations will appear<br />here as the query runs
        </p>
      </div>
    );
  }

  // ─── Complete but nothing selected yet ──────────────────────────
  if (isComplete && !dialogue) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          flex: 1, minWidth: 280,
          background: 'var(--bg-surface)',
          borderRadius: 16,
          border: '1px solid rgba(74,222,128,0.2)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center', gap: 16,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 38 }}
        >
          👆
        </motion.div>
        <div style={{ fontFamily: 'var(--font-sans)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
            Query complete!
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Click any step in the pipeline<br />to read a full explanation<br />at your own pace.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 220 }}>
          {['Parser', 'Validator', 'Student Resolver', 'Database', 'Courses Resolver', 'JSON Response'].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              style={{
                fontSize: 11, color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ color: '#4ade80', fontSize: 9 }}>ⓘ</span>
              {name}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ─── Active dialogue ─────────────────────────────────────────────

  const sections: { key: SectionKey; icon: string; title: string; content: string; isMono?: boolean }[] = [
    {
      key: 'howItWorks',
      icon: '🔍',
      title: 'How it works',
      content: dialogue!.whatHappens,
    },
    {
      key: 'whatItTakes',
      icon: '📥',
      title: 'What it takes',
      content: dialogue!.whatItTakes,
    },
    {
      key: 'inContext',
      icon: '🌍',
      title: 'In context',
      content: dialogue!.whenYouSeeThis,
    },
    {
      key: 'code',
      icon: '💻',
      title: 'Code',
      content: dialogue!.codeExample,
      isMono: true,
    },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dialogue!.step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          flex: 1, minWidth: 280,
          background: 'var(--bg-surface)',
          borderRadius: 16,
          border: `1px solid ${dialogue!.color}35`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 0 20px ${dialogue!.color}0d`,
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '14px 18px',
          background: `linear-gradient(135deg, ${dialogue!.color}18, ${dialogue!.color}08)`,
          borderBottom: `1px solid ${dialogue!.color}25`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: dialogue!.color + '25',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: dialogue!.color,
            flexShrink: 0,
          }}>
            {dialogue!.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: dialogue!.color,
              fontFamily: 'var(--font-sans)',
            }}>
              {dialogue!.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
              Step {dialogue!.stepNumber} of {dialogue!.totalSteps}
            </div>
          </div>
          {/* Active pulse */}
          <motion.div
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: dialogue!.color,
              boxShadow: `0 0 8px ${dialogue!.color}`,
              flexShrink: 0,
            }}
          />
        </div>

        {/* ── Sections ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {sections.map(section => (
            <div key={section.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Section header — clickable */}
              <button
                onClick={() => toggle(section.key)}
                style={{
                  width: '100%', padding: '10px 18px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 13 }}>{section.icon}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  flex: 1,
                }}>
                  {section.title}
                </span>
                <motion.span
                  animate={{ rotate: expanded[section.key] ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 10, color: 'var(--text-muted)' }}
                >
                  ▼
                </motion.span>
              </button>

              {/* Section content */}
              <AnimatePresence initial={false}>
                {expanded[section.key] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {section.isMono ? (
                      <pre style={{
                        margin: 0, padding: '0 18px 14px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5, lineHeight: 1.7,
                        color: '#64748b',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 8,
                        marginInline: 18,
                        marginBottom: 14,
                        overflowX: 'auto',
                        whiteSpace: 'pre',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        {section.content}
                      </pre>
                    ) : (
                      <p style={{
                        margin: 0, padding: '0 18px 14px',
                        fontSize: 12.5, color: '#64748b',
                        fontFamily: 'var(--font-sans)',
                        lineHeight: 1.7, whiteSpace: 'pre-line',
                      }}>
                        {section.content}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
