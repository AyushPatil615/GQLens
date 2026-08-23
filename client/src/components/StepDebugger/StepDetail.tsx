import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanText, BadgeCheck, ShieldAlert, KeyRound, LogIn, Ticket, Layers,
  Puzzle, Database, TableProperties, Zap, PencilLine, Droplets, Bomb,
  CheckCircle2, Send, AlertTriangle, Cpu, Clock, MessageSquare,
} from 'lucide-react';
import type { EventStep } from '../../hooks/useGraphQLTrace';
import { getStepMeta } from './stepMeta';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  ScanText, BadgeCheck, ShieldAlert, KeyRound, LogIn, Ticket, Layers,
  Puzzle, Database, TableProperties, Zap, PencilLine, Droplets, Bomb,
  CheckCircle2, Send, AlertTriangle, Cpu,
};

function StepIcon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const Icon = ICON_MAP[name] ?? Cpu;
  return <Icon size={size} strokeWidth={2} color={color} />;
}

interface Props {
  step:         EventStep | null;
  stepIndex:    number;
  totalSteps:   number;
}

export function StepDetail({ step, stepIndex, totalSteps }: Props) {
  if (!step) {
    return (
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12,
        padding: 24,
        background: '#FAFAFA',
        border: '2px dashed #E5E7EB',
        borderRadius: 14,
        minHeight: 280,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: '#F3F4F6', border: '2px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Cpu size={22} color="#D1D5DB" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#9CA3AF', marginBottom: 4 }}>
            No step selected
          </div>
          <div style={{ fontSize: 11, color: '#D1D5DB', fontWeight: 600 }}>
            Execute a query and step through execution
          </div>
        </div>
      </div>
    );
  }

  const meta = getStepMeta(step.step);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.step + stepIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', gap: 14,
          padding: 20,
          background: meta.color,
          border: `2.5px solid ${meta.textColor}`,
          borderRadius: 14,
          boxShadow: `4px 4px 0 ${meta.textColor}`,
          minHeight: 280,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: meta.textColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `2px 2px 0 rgba(0,0,0,0.2)`,
          }}>
            <StepIcon name={meta.lucideIcon} size={22} color="#fff" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Phase badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: meta.textColor,
              color: '#fff',
              fontSize: 9, fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              {meta.phase}
            </div>
            {/* Step ID */}
            <div style={{
              fontSize: 15, fontWeight: 900,
              color: meta.textColor,
              fontFamily: 'var(--font-mono)',
              wordBreak: 'break-all',
            }}>
              {step.step}
            </div>
          </div>

          {/* Step counter */}
          <div style={{
            background: meta.textColor, color: '#fff',
            fontSize: 10, fontWeight: 800,
            padding: '4px 8px', borderRadius: 6,
            fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>
            {String(stepIndex + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </div>
        </div>

        {/* Explanation */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          border: `1.5px solid ${meta.textColor}`,
          borderRadius: 10,
          padding: '12px 14px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: meta.textColor,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <MessageSquare size={11} color={meta.textColor} strokeWidth={2.5} />
            What's happening
          </div>
          <p style={{
            fontSize: 12, lineHeight: 1.65, color: '#1F2937',
            fontWeight: 600, fontFamily: 'var(--font-sans)',
            margin: 0,
          }}>
            {meta.explanation}
          </p>
        </div>

        {/* Caption from server */}
        {step.caption && (
          <div style={{
            background: 'rgba(255,255,255,0.5)',
            border: `1.5px solid ${meta.textColor}`,
            borderRadius: 10,
            padding: '10px 14px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: meta.textColor,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Layers size={11} color={meta.textColor} strokeWidth={2.5} />
              Server trace
            </div>
            <code style={{
              fontSize: 11, color: '#1F2937',
              fontFamily: 'var(--font-mono)', lineHeight: 1.5,
              display: 'block', wordBreak: 'break-word',
            }}>
              {step.caption}
            </code>
          </div>
        )}

        {/* Timing */}
        {step.ms > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 'auto',
          }}>
            <Clock size={11} color={meta.textColor} strokeWidth={2.5} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: meta.textColor,
              fontFamily: 'var(--font-mono)',
            }}>
              {step.ms.toFixed(2)}ms
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
