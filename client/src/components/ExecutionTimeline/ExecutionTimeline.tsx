import { motion, AnimatePresence } from 'framer-motion';

type EventStep = { step: string; ms: number; caption: string };

const STEP_COLORS: Record<string, string> = {
  'parse':           '#38bdf8',
  'validate':        '#a78bfa',
  'resolve:Student': '#e535ab',
  'db:query':        '#fb923c',
  'resolve:courses': '#e535ab',
  'respond':         '#4ade80',
};

const STEP_LABELS: Record<string, string> = {
  'parse':           'Parse',
  'validate':        'Validate',
  'resolve:Student': 'Student Resolver',
  'db:query':        'Database Query',
  'resolve:courses': 'Courses Resolver',
  'respond':         'Send Response',
};

interface Props {
  steps: EventStep[];
  activeIndex: number;   // -1=idle, 0..n-1=running, n=complete
  caption: string;
  isComplete: boolean;
  totalMs: number;
}

export function ExecutionTimeline({ steps, activeIndex, caption, isComplete, totalMs }: Props) {
  const maxMs = Math.max(...steps.map(s => s.ms));

  const isBarFilled = (index: number) => isComplete || index < activeIndex;
  const isBarActive = (index: number) => !isComplete && index === activeIndex;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 16,
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-elevated)',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          fontFamily: 'var(--font-sans)',
        }}>
          ⏱ Execution Timeline
        </span>

        <AnimatePresence>
          {isComplete && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                fontSize: 12, fontWeight: 600, color: '#4ade80',
                background: 'rgba(74,222,128,0.12)',
                padding: '4px 12px', borderRadius: 999,
                border: '1px solid rgba(74,222,128,0.3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ✓ {totalMs}ms total
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((step, index) => {
            const color = STEP_COLORS[step.step] || '#94a3b8';
            const label = STEP_LABELS[step.step] || step.step;
            const filled = isBarFilled(index);
            const active = isBarActive(index);
            const barWidthPct = (step.ms / maxMs) * 75;

            return (
              <div key={step.step} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Step label */}
                <div style={{
                  width: 150,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  textAlign: 'right',
                  flexShrink: 0,
                  color: active ? color : filled ? '#64748b' : '#1e293b',
                  fontFamily: 'var(--font-sans)',
                  transition: 'color 0.3s ease',
                }}>
                  {label}
                </div>

                {/* Bar track */}
                <div style={{
                  flex: 1,
                  height: 10,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {(filled || active) && (
                    <motion.div
                      key={`bar-${step.step}`}
                      initial={{ width: '0%' }}
                      animate={{ width: `${barWidthPct}%` }}
                      transition={{ duration: 0.55, ease: 'easeOut', delay: active ? 0.05 : 0 }}
                      style={{
                        height: '100%',
                        borderRadius: 999,
                        background: active
                          ? `linear-gradient(90deg, ${color}, ${color}bb)`
                          : color + '80',
                        boxShadow: active ? `0 0 10px ${color}90` : 'none',
                      }}
                    />
                  )}

                  {/* Active shimmer */}
                  {active && (
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '40%', height: '100%',
                        background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
                        borderRadius: 999,
                      }}
                    />
                  )}
                </div>

                {/* ms label */}
                <div style={{
                  width: 40, fontSize: 11, textAlign: 'right', flexShrink: 0,
                  color: filled || active ? '#475569' : '#1e293b',
                  fontFamily: 'var(--font-mono)',
                  transition: 'color 0.3s ease',
                }}>
                  {(filled || active) ? `${step.ms}ms` : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Caption */}
        <AnimatePresence mode="wait">
          {caption && (
            <motion.div
              key={caption}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              style={{
                marginTop: 20,
                padding: '14px 18px',
                background: isComplete
                  ? 'rgba(74,222,128,0.06)'
                  : 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                border: isComplete
                  ? '1px solid rgba(74,222,128,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
                fontSize: 13.5,
                color: isComplete ? '#86efac' : '#94a3b8',
                lineHeight: 1.65,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {isComplete ? '✅ ' : '💬 '}
              {caption}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
