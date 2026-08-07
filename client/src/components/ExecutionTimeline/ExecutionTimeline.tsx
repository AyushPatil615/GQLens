import { motion, AnimatePresence } from 'framer-motion';

type EventStep = { step: string; ms: number; caption: string };

const STEP_COLORS: Record<string, string> = {
  'parse':           '#87CEEF',
  'validate':        '#C4B5FD',
  'resolve:Student': '#FDA4AF',
  'db:query':        '#FDB97D',
  'resolve:courses': '#FCA5A5',
  'respond':         '#86EFAC',
};

const STEP_LABELS: Record<string, string> = {
  'parse':           'Parse',
  'validate':        'Validate',
  'resolve:Student': 'Student Resolver',
  'db:query':        'Database Query',
  'resolve:courses': 'Courses Resolver',
  'respond':         'Respond',
};

const STEP_ICONS: Record<string, string> = {
  'parse': '◈', 'validate': '✦',
  'resolve:Student': '⬡', 'db:query': '◉',
  'resolve:courses': '⬡', 'respond': '✓',
};

interface Props {
  steps: EventStep[];
  activeIndex: number;
  caption: string;
  isComplete: boolean;
  totalMs: number;
}

export function ExecutionTimeline({ steps, activeIndex, caption, isComplete, totalMs }: Props) {
  const maxMs = Math.max(...steps.map(s => s.ms));

  return (
    <div style={{
      background: '#fff',
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: 'var(--border-2)',
        background: '#f9f5f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#000' }}>
            ⏱ Execution Timeline
          </span>
        </div>
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                fontSize: 11, fontWeight: 800,
                padding: '4px 12px', borderRadius: 999,
                background: '#86EFAC',
                border: 'var(--border-2)',
                boxShadow: 'var(--shadow-sm)',
                color: '#000',
              }}
            >
              ✓ {totalMs}ms total
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bars ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step, index) => {
          const color    = STEP_COLORS[step.step] || '#e5e7eb';
          const label    = STEP_LABELS[step.step] || step.step;
          const icon     = STEP_ICONS[step.step] || '●';
          const shouldShow = isComplete || index < activeIndex;
          const isActive   = !isComplete && index === activeIndex;
          const barWidth   = `${Math.max(4, (step.ms / maxMs) * 100)}%`;

          return (
            <div key={step.step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Label */}
              <div style={{
                width: 145, display: 'flex', alignItems: 'center', gap: 6,
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  width: 18, textAlign: 'center', color: '#000',
                }}>
                  {icon}
                </span>
                <span style={{
                  fontSize: 11.5, fontWeight: 700,
                  color: shouldShow ? '#000' : '#c4c4c4',
                  transition: 'color 0.3s ease',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {label}
                </span>
              </div>

              {/* Bar track */}
              <div style={{
                flex: 1, height: 14,
                background: '#f3f4f6',
                border: '2px solid #000',
                borderRadius: 999,
                overflow: 'hidden',
                boxShadow: '2px 2px 0 #000',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: shouldShow ? barWidth : 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: isActive ? 0 : 0 }}
                  style={{
                    height: '100%',
                    background: color,
                    borderRadius: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Shimmer for active bar */}
                  {isActive && (
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      }}
                    />
                  )}
                </motion.div>
              </div>

              {/* ms value */}
              <div style={{
                width: 38, textAlign: 'right', flexShrink: 0,
                fontSize: 11, fontWeight: 700,
                color: shouldShow ? '#374151' : '#e5e7eb',
                transition: 'color 0.3s ease',
                fontFamily: 'var(--font-mono)',
              }}>
                {shouldShow ? `${step.ms}ms` : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Caption ── */}
      <AnimatePresence>
        {caption && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '12px 20px',
              borderTop: 'var(--border-2)',
              background: '#f9f5f0',
              fontSize: 12, fontWeight: 600,
              color: '#374151', lineHeight: 1.6,
            }}
          >
            {caption}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
