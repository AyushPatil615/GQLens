import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StepDialogue } from '../../data/fakeData';

// Neobrutalism flat colors override (replaces the old glow colors)
const NEO_COLORS: Record<string, string> = {
  'parse':           '#87CEEF',
  'validate':        '#C4B5FD',
  'resolve:Student': '#FDA4AF',
  'db:query':        '#FDB97D',
  'resolve:courses': '#FCA5A5',
  'respond':         '#86EFAC',
};

const RAINBOW_STRIPE =
  'linear-gradient(to right, #87CEEF 16.67%, #C4B5FD 16.67% 33.33%, #FDA4AF 33.33% 50%, #FDB97D 50% 66.67%, #FCA5A5 66.67% 83.33%, #86EFAC 83.33%)';

interface Props {
  dialogue: StepDialogue | null;
  isComplete: boolean;
}

type SectionKey = 'howItWorks' | 'whatItTakes' | 'inContext' | 'code';

export function StepDialoguePanel({ dialogue, isComplete }: Props) {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    howItWorks: true, whatItTakes: true, inContext: true, code: false,
  });

  function toggle(key: SectionKey) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const cardBase: React.CSSProperties = {
    flex: 1, minWidth: 280,
    background: '#fff',
    border: 'var(--border)',
    boxShadow: 'var(--shadow-md)',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  // ── Idle ─────────────────────────────────────────────────────────
  if (!dialogue && !isComplete) {
    return (
      <div style={{ ...cardBase, alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 14 }}>
        <div style={{ fontSize: 40 }}>💬</div>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#000' }}>Step Explanations</div>
        <p style={{ fontSize: 13, color: 'var(--text-grey)', lineHeight: 1.7, fontWeight: 600 }}>
          Run the query and click any step in the pipeline to read a full explanation at your own pace.
        </p>
        {/* Mini preview of what's inside */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 210, marginTop: 8 }}>
          {[
            { emoji: '🔍', label: 'How it works' },
            { emoji: '📥', label: 'What it takes' },
            { emoji: '🌍', label: 'In context' },
            { emoji: '💻', label: 'Code example' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              background: '#f9f5f0',
              border: 'var(--border-2)',
              borderRadius: 8,
              fontSize: 12, fontWeight: 700, color: '#374151',
            }}>
              <span>{s.emoji}</span> {s.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Complete, nothing selected ────────────────────────────────────
  if (isComplete && !dialogue) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...cardBase, alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', gap: 16 }}
      >
        {/* Rainbow stripe */}
        <div style={{ alignSelf: 'stretch', height: 8, background: RAINBOW_STRIPE }} />

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 40 }}
        >
          👆
        </motion.div>

        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#000', marginBottom: 6 }}>
            Query Complete!
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-grey)', lineHeight: 1.75, fontWeight: 600 }}>
            Click any step in the pipeline<br />to read a full explanation<br />at your own pace.
          </div>
        </div>

        {/* Step list preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 220 }}>
          {[
            { color: '#87CEEF', label: 'Parser' },
            { color: '#C4B5FD', label: 'Validator' },
            { color: '#FDA4AF', label: 'Student Resolver' },
            { color: '#FDB97D', label: 'Database' },
            { color: '#FCA5A5', label: 'Courses Resolver' },
            { color: '#86EFAC', label: 'JSON Response' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px',
                background: s.color + '40',
                border: 'var(--border-2)',
                boxShadow: '2px 2px 0 #000',
                borderRadius: 8,
                fontSize: 12, fontWeight: 700, color: '#000',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, border: '1.5px solid #000', flexShrink: 0 }} />
              {s.label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Active step dialogue ──────────────────────────────────────────
  const neoColor = NEO_COLORS[dialogue!.step] || '#e5e7eb';

  const sections: { key: SectionKey; emoji: string; title: string; content: string; isMono?: boolean }[] = [
    { key: 'howItWorks',  emoji: '🔍', title: 'How it works',  content: dialogue!.whatHappens },
    { key: 'whatItTakes', emoji: '📥', title: 'What it takes', content: dialogue!.whatItTakes },
    { key: 'inContext',   emoji: '🌍', title: 'In context',    content: dialogue!.whenYouSeeThis },
    { key: 'code',        emoji: '💻', title: 'Code',          content: dialogue!.codeExample, isMono: true },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dialogue!.step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={cardBase}
      >
        {/* ── Rainbow stripe ── */}
        <div style={{ height: 8, background: RAINBOW_STRIPE, flexShrink: 0 }} />

        {/* ── Step header ── */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: 'var(--border-2)',
          background: neoColor + '30',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#000', fontFamily: 'var(--font-sans)' }}>
              {dialogue!.label}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '3px 9px', borderRadius: 999,
              background: neoColor,
              border: 'var(--border-2)',
              boxShadow: 'var(--shadow-sm)',
              color: '#000',
            }}>
              Step {dialogue!.stepNumber} of {dialogue!.totalSteps}
            </span>
          </div>
        </div>

        {/* ── Sections ── */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {sections.map((section, idx) => (
            <div
              key={section.key}
              style={{ borderBottom: idx < sections.length - 1 ? 'var(--border-2)' : 'none' }}
            >
              {/* Section header — clickable */}
              <button
                onClick={() => toggle(section.key)}
                style={{
                  width: '100%', padding: '11px 18px',
                  background: 'none', border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 14 }}>{section.emoji}</span>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: '#000',
                  fontFamily: 'var(--font-sans)', flex: 1,
                }}>
                  {section.title}
                </span>
                <motion.span
                  animate={{ rotate: expanded[section.key] ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}
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
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {section.isMono ? (
                      <pre style={{
                        margin: '0 16px 14px',
                        padding: '12px 14px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5, lineHeight: 1.7,
                        color: '#374151',
                        background: '#f9f5f0',
                        border: 'var(--border-2)',
                        boxShadow: 'var(--shadow-sm)',
                        borderRadius: 8,
                        overflowX: 'auto',
                        whiteSpace: 'pre',
                      }}>
                        {section.content}
                      </pre>
                    ) : (
                      <p style={{
                        margin: 0, padding: '0 18px 14px',
                        fontSize: 13, color: '#374151',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        lineHeight: 1.75, whiteSpace: 'pre-line',
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
