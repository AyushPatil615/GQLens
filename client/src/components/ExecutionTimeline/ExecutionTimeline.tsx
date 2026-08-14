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
  allSteps?: EventStep[];           // full set (for debugger mode)
  activeIndex: number;
  caption: string;
  isComplete: boolean;
  totalMs: number;
  // ── Debugger mode ────────────────────────────────
  debuggerMode?: boolean;
  currentStepIndex?: number;        // which step is "active" in debugger
  isPaused?: boolean;
  playbackSpeed?: 0.5 | 1 | 2;
  debuggerIsAtEnd?: boolean;
  onStepNext?: () => void;
  onStepPrev?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onSpeedChange?: (s: 0.5 | 1 | 2) => void;
  onJumpToStep?: (i: number) => void;
  onToggleDebugger?: () => void;
}

export function ExecutionTimeline({
  steps, allSteps,
  activeIndex, caption, isComplete, totalMs,
  debuggerMode = false,
  currentStepIndex = -1,
  isPaused = false,
  playbackSpeed = 1,
  debuggerIsAtEnd = false,
  onStepNext, onStepPrev, onPause, onResume, onSpeedChange, onJumpToStep, onToggleDebugger,
}: Props) {
  const displaySteps = debuggerMode ? (allSteps ?? steps) : steps;
  const maxMs = displaySteps.length > 0 ? Math.max(...displaySteps.map(s => s.ms)) : 1;

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
        padding: '12px 16px',
        borderBottom: 'var(--border-2)',
        background: '#f9f5f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#000' }}>
            ⏱ Execution Timeline
          </span>
          {/* Debugger mode toggle */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onToggleDebugger}
            title={debuggerMode ? 'Switch to live mode' : 'Switch to Step Debugger mode'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 999,
              border: '2px solid #000',
              background: debuggerMode ? '#C4B5FD' : '#f3f4f6',
              boxShadow: debuggerMode ? '2px 2px 0 #000' : 'none',
              fontSize: 10.5, fontWeight: 800, color: '#000',
              cursor: 'pointer',
            }}
          >
            {debuggerMode ? '🐛 Debugger ON' : '🐛 Step Debugger'}
          </motion.button>
        </div>

        <AnimatePresence>
          {isComplete && !debuggerMode && (
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
          {debuggerMode && isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: 10.5, fontWeight: 700, color: '#374151',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Step {Math.max(0, currentStepIndex + 1)} / {displaySteps.length}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Debugger Toolbar ── */}
      <AnimatePresence>
        {debuggerMode && isComplete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '10px 16px',
              background: '#1e1b4b',
              borderBottom: 'var(--border-2)',
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            }}>
              {/* Step back */}
              <ToolbarBtn
                emoji="⏮"
                label="Step Back"
                onClick={onStepPrev}
                disabled={currentStepIndex <= 0}
              />

              {/* Play / Pause */}
              {isPaused || debuggerIsAtEnd ? (
                <ToolbarBtn
                  emoji="▶"
                  label="Play"
                  onClick={onResume}
                  highlight
                  disabled={debuggerIsAtEnd}
                />
              ) : (
                <ToolbarBtn
                  emoji="⏸"
                  label="Pause"
                  onClick={onPause}
                />
              )}

              {/* Step next */}
              <ToolbarBtn
                emoji="⏭"
                label="Step Over"
                onClick={onStepNext}
                disabled={debuggerIsAtEnd}
              />

              {/* Divider */}
              <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

              {/* Speed */}
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc' }}>Speed</span>
              {([0.5, 1, 2] as const).map(s => (
                <motion.button
                  key={s}
                  onClick={() => onSpeedChange?.(s)}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    padding: '3px 9px', borderRadius: 6,
                    border: '2px solid',
                    borderColor: playbackSpeed === s ? '#C4B5FD' : 'rgba(255,255,255,0.2)',
                    background: playbackSpeed === s ? '#C4B5FD' : 'transparent',
                    color: playbackSpeed === s ? '#000' : '#a5b4fc',
                    fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  {s}×
                </motion.button>
              ))}

              {/* Divider */}
              <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

              {/* Jump step indicator pills */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {displaySteps.map((s, i) => {
                  const color = STEP_COLORS[s.step] || '#e5e7eb';
                  const isActive = i === currentStepIndex;
                  const isPast = i < currentStepIndex;
                  return (
                    <motion.button
                      key={s.step}
                      onClick={() => onJumpToStep?.(i)}
                      whileHover={{ scale: 1.08 }}
                      title={`Jump to: ${STEP_LABELS[s.step] || s.step}`}
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${isActive ? '#fff' : isPast ? color : 'rgba(255,255,255,0.2)'}`,
                        background: isActive ? color : isPast ? color : 'transparent',
                        opacity: isPast || isActive ? 1 : 0.35,
                        cursor: 'pointer',
                        fontSize: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#000', fontWeight: 900,
                        boxShadow: isActive ? `0 0 0 2px rgba(255,255,255,0.5)` : 'none',
                      }}
                    >
                      {i + 1}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bars ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displaySteps.map((step, index) => {
          let shouldShow: boolean;
          let isActive: boolean;

          if (debuggerMode) {
            shouldShow = index <= currentStepIndex;
            isActive   = index === currentStepIndex;
          } else {
            shouldShow = isComplete || index < activeIndex;
            isActive   = !isComplete && index === activeIndex;
          }

          const color    = STEP_COLORS[step.step] || '#e5e7eb';
          const label    = STEP_LABELS[step.step] || step.step;
          const icon     = STEP_ICONS[step.step] || '●';
          const barWidth = `${Math.max(4, (step.ms / maxMs) * 100)}%`;

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
                boxShadow: isActive ? `0 0 0 2px ${color}` : '2px 2px 0 #000',
                transition: 'box-shadow 0.25s',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: shouldShow ? barWidth : 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
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
            {debuggerMode && currentStepIndex >= 0 && currentStepIndex < displaySteps.length
              ? displaySteps[currentStepIndex].caption
              : caption}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Toolbar button ─────────────────────────────────────────────────────
function ToolbarBtn({
  emoji, label, onClick, disabled = false, highlight = false,
}: { emoji: string; label: string; onClick?: () => void; disabled?: boolean; highlight?: boolean }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={disabled ? undefined : onClick}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 7,
        border: '2px solid',
        borderColor: highlight ? '#86EFAC' : 'rgba(255,255,255,0.2)',
        background: highlight ? '#86EFAC' : 'rgba(255,255,255,0.08)',
        color: highlight ? '#000' : disabled ? 'rgba(255,255,255,0.25)' : '#fff',
        fontSize: 11, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {emoji} <span style={{ fontSize: 10 }}>{label}</span>
    </motion.button>
  );
}
