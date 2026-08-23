import { motion } from 'framer-motion';
import {
  ScanText, BadgeCheck, ShieldAlert, KeyRound, LogIn, Ticket, Layers,
  Puzzle, Database, TableProperties, Zap, PencilLine, Droplets, Bomb,
  CheckCircle2, Send, AlertTriangle, Cpu,
} from 'lucide-react';
import type { EventStep } from '../../hooks/useGraphQLTrace';
import { getStepMeta } from './stepMeta';

// ── Icon resolver ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  ScanText, BadgeCheck, ShieldAlert, KeyRound, LogIn, Ticket, Layers,
  Puzzle, Database, TableProperties, Zap, PencilLine, Droplets, Bomb,
  CheckCircle2, Send, AlertTriangle, Cpu,
};

function StepIcon({ name, size = 14, color }: { name: string; size?: number; color?: string }) {
  const Icon = ICON_MAP[name] ?? Cpu;
  return <Icon size={size} strokeWidth={2.5} color={color} />;
}

interface Props {
  allSteps:    EventStep[];
  currentIndex: number;
  isComplete:  boolean;
  onStepClick: (index: number) => void;
}

export function StepList({ allSteps, currentIndex, isComplete, onStepClick }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 5,
      overflowY: 'auto', maxHeight: 420, paddingRight: 6,
    }}>
      {allSteps.length === 0 && (
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#9CA3AF',
          textAlign: 'center', padding: '32px 16px',
          fontFamily: 'var(--font-sans)',
        }}>
          Execute a query to start debugging
        </div>
      )}

      {allSteps.map((step, idx) => {
        const meta      = getStepMeta(step.step);
        const isActive  = idx === currentIndex;
        const isDone    = idx < currentIndex;
        const isPending = idx > currentIndex;

        return (
          <motion.button
            key={`${step.step}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isPending ? 0.28 : 1, x: 0 }}
            transition={{ duration: 0.18, delay: Math.min(idx * 0.025, 0.3) }}
            onClick={() => !isPending && onStepClick(idx)}
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         9,
              padding:     '8px 11px',
              borderRadius: 10,
              background:   isActive ? meta.color : isDone ? '#FAFAFA' : '#F3F4F6',
              border:       isActive
                ? `2.5px solid ${meta.textColor}`
                : isDone
                ? '2px solid #D1D5DB'
                : '2px dashed #E5E7EB',
              boxShadow:    isActive ? `3px 3px 0 ${meta.textColor}` : 'none',
              cursor:       isPending ? 'default' : 'pointer',
              textAlign:    'left',
              width:        '100%',
              fontFamily:   'var(--font-sans)',
              transition:   'background 0.15s, box-shadow 0.1s',
            }}
          >
            {/* Number / icon badge */}
            <div style={{
              width: 26, height: 26,
              borderRadius: 7,
              background:   isActive ? meta.textColor : isDone ? '#E5E7EB' : '#E5E7EB',
              display:      'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink:   0,
            }}>
              {isDone ? (
                <CheckCircle2 size={13} strokeWidth={2.5} color="#4B5563" />
              ) : isActive ? (
                <StepIcon name={meta.lucideIcon} size={13} color="#fff" />
              ) : (
                <span style={{
                  fontSize: 9, fontWeight: 900, color: '#9CA3AF',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 800,
                color: isActive ? meta.textColor : isDone ? '#374151' : '#9CA3AF',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {step.step}
              </div>
              {!isPending && (
                <div style={{
                  fontSize: 9, fontWeight: 600,
                  color: isActive ? meta.textColor : '#9CA3AF',
                  marginTop: 1,
                }}>
                  {meta.phase}{step.ms > 0 ? ` · ${step.ms.toFixed(1)}ms` : ''}
                </div>
              )}
            </div>

            {/* Active pulse */}
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: meta.textColor, flexShrink: 0,
                }}
              />
            )}
          </motion.button>
        );
      })}

      {isComplete && allSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: 10, fontWeight: 700, color: '#6B7280',
            textAlign: 'center', paddingTop: 8,
          }}
        >
          Click any step to inspect it
        </motion.div>
      )}
    </div>
  );
}
