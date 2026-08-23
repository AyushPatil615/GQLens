import { motion } from 'framer-motion';
import {
  SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward, RotateCcw,
} from 'lucide-react';

interface Props {
  currentIndex:   number;
  totalSteps:     number;
  isPaused:       boolean;
  isComplete:     boolean;
  isRunning:      boolean;
  debuggerIsAtEnd: boolean;
  playbackSpeed:  0.5 | 1 | 2;
  onPrev:         () => void;
  onNext:         () => void;
  onPlay:         () => void;
  onPause:        () => void;
  onRestart:      () => void;
  onJumpEnd:      () => void;
  onSpeedChange:  (s: 0.5 | 1 | 2) => void;
}

const SPEEDS: (0.5 | 1 | 2)[] = [0.5, 1, 2];

export function DebuggerControls({
  currentIndex, totalSteps, isPaused, isComplete, isRunning,
  debuggerIsAtEnd, playbackSpeed,
  onPrev, onNext, onPlay, onPause, onRestart, onJumpEnd, onSpeedChange,
}: Props) {
  const atStart   = currentIndex <= 0;
  const atEnd     = debuggerIsAtEnd || currentIndex >= totalSteps - 1;
  const hasSteps  = totalSteps > 0;
  const isPlaying = !isPaused && isComplete && !debuggerIsAtEnd;

  // Progress %
  const pct = hasSteps ? Math.round(((currentIndex + 1) / totalSteps) * 100) : 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: '12px 16px',
      background: '#FFF',
      border: '2.5px solid #000',
      borderRadius: 14,
      boxShadow: '4px 4px 0 #000',
    }}>
      {/* Progress bar */}
      <div style={{
        height: 5, borderRadius: 99,
        background: '#F3F4F6',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            borderRadius: 99,
          }}
        />
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Restart */}
        <ControlBtn
          onClick={onRestart}
          disabled={!hasSteps}
          title="Restart"
          accent={false}
        >
          <RotateCcw size={13} strokeWidth={2.5} />
        </ControlBtn>

        {/* Jump to start */}
        <ControlBtn onClick={onPrev} disabled={atStart || !hasSteps} title="Previous step" accent={false}>
          <ChevronLeft size={15} strokeWidth={2.5} />
        </ControlBtn>

        {/* Play / Pause — primary */}
        <ControlBtn
          onClick={isPlaying ? onPause : onPlay}
          disabled={!isComplete || debuggerIsAtEnd}
          title={isPlaying ? 'Pause' : 'Play'}
          accent
        >
          {isPlaying
            ? <Pause   size={15} strokeWidth={2.5} />
            : <Play    size={15} strokeWidth={2.5} />
          }
        </ControlBtn>

        {/* Next */}
        <ControlBtn onClick={onNext} disabled={atEnd || !hasSteps} title="Next step" accent={false}>
          <ChevronRight size={15} strokeWidth={2.5} />
        </ControlBtn>

        {/* Jump to end */}
        <ControlBtn onClick={onJumpEnd} disabled={atEnd || !hasSteps} title="Jump to end" accent={false}>
          <SkipForward size={13} strokeWidth={2.5} />
        </ControlBtn>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Speed pills */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 1,
          background: '#F3F4F6', borderRadius: 8,
          padding: 2,
          border: '1.5px solid #E5E7EB',
        }}>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                padding:      '3px 8px',
                borderRadius: 6,
                border:       'none',
                background:   playbackSpeed === s ? '#000' : 'transparent',
                color:        playbackSpeed === s ? '#fff' : '#6B7280',
                fontSize:     10, fontWeight: 800,
                cursor:       'pointer',
                fontFamily:   'var(--font-mono)',
                transition:   'background 0.15s, color 0.15s',
              }}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Step counter */}
        <div style={{
          fontSize: 10, fontWeight: 800,
          color: '#374151', fontFamily: 'var(--font-mono)',
          minWidth: 52, textAlign: 'right',
        }}>
          {hasSteps ? `${currentIndex + 1} / ${totalSteps}` : '— / —'}
        </div>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#7C3AED',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }}
          />
          Executing query…
        </div>
      )}
    </div>
  );
}

// ── Reusable control button ──────────────────────────────────────────────────
function ControlBtn({
  children, onClick, disabled, title, accent,
}: {
  children: React.ReactNode;
  onClick:  () => void;
  disabled: boolean;
  title:    string;
  accent:   boolean;
}) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.92 }}
      onClick={disabled ? undefined : onClick}
      title={title}
      style={{
        width:        32, height: 32,
        borderRadius: 8,
        border:       accent ? '2px solid #000' : '2px solid #D1D5DB',
        background:   accent ? '#000' : '#FFF',
        color:        accent ? '#FFF' : disabled ? '#D1D5DB' : '#374151',
        display:      'flex', alignItems: 'center', justifyContent: 'center',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        flexShrink:   0,
        boxShadow:    accent && !disabled ? '2px 2px 0 #374151' : 'none',
        transition:   'background 0.12s, color 0.12s, border-color 0.12s',
        opacity:      disabled ? 0.4 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}
