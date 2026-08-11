import { motion } from 'framer-motion';
import type { StepDialogue } from '../../data/stepDialogues';

// The visualizer derives its node list from the domain's stepDialogues.
// This makes it fully domain-agnostic — no hardcoded Education step IDs.

interface Props {
  stepDialogues: StepDialogue[];
  activeStepId: string | null;
  completedStepIds: string[];
  isComplete?: boolean;
  selectedStepId?: string | null;
  onStepClick?: (stepId: string) => void;
}

export function PipelineVisualizer({
  stepDialogues,
  activeStepId, completedStepIds,
  isComplete = false, selectedStepId = null, onStepClick,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {stepDialogues.map((node, index) => {
        const isActive    = node.step === activeStepId;
        const isCompleted = completedStepIds.includes(node.step);
        const isSelected  = node.step === selectedStepId;
        const isPending   = !isActive && !isCompleted;
        const isClickable = isComplete && isCompleted && !!onStepClick;

        return (
          <div key={node.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

            {/* ── Node pill ── */}
            <motion.div
              onClick={isClickable ? () => onStepClick!(node.step) : undefined}
              whileHover={isClickable ? { x: -2, y: -2, boxShadow: '5px 5px 0 #000' } : {}}
              whileTap={isClickable ? { x: 0, y: 0, boxShadow: '2px 2px 0 #000' } : {}}
              animate={{
                opacity: isPending ? 0.22 : 1,
                scale:   isActive ? 1.03 : 1,
              }}
              transition={{ duration: 0.25 }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 24,
                background: isPending ? '#f3f4f6' : node.color,
                border: isSelected
                  ? '3px solid #000'
                  : isActive
                  ? '3px solid #000'
                  : isCompleted
                  ? '2px solid #000'
                  : '2px solid #d1d5db',
                boxShadow: isSelected
                  ? '4px 4px 0 #000'
                  : isActive
                  ? '3px 3px 0 #000'
                  : isCompleted
                  ? '2px 2px 0 #000'
                  : 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'background 0.25s ease, border-color 0.25s, box-shadow 0.15s',
              }}
            >
              {/* Icon */}
              <span style={{
                fontSize: 13, fontWeight: 900,
                color: isPending ? '#9ca3af' : '#000',
                width: 20, textAlign: 'center', flexShrink: 0,
              }}>
                {isCompleted && !isActive ? '✓' : node.icon}
              </span>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 800,
                  color: isPending ? '#9ca3af' : '#000',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {node.label}
                </div>
                <div style={{
                  fontSize: 9.5, color: isPending ? '#c4c4c4' : '#374151',
                  fontFamily: 'var(--font-sans)', fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {node.sublabel}
                </div>
              </div>

              {/* Indicators */}
              {isActive && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#000', flexShrink: 0 }}
                />
              )}
              {isClickable && !isSelected && (
                <span style={{ fontSize: 10, color: '#374151', flexShrink: 0, fontWeight: 700 }}>ⓘ</span>
              )}
              {isSelected && (
                <span style={{ fontSize: 10, color: '#000', flexShrink: 0, fontWeight: 900 }}>◀</span>
              )}
            </motion.div>

            {/* ── Connector arrow ── */}
            {index < stepDialogues.length - 1 && (
              <motion.div
                animate={{ opacity: isCompleted ? 1 : 0.3 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontSize: 14, fontWeight: 900,
                  color: '#000', lineHeight: 1,
                  padding: '3px 0',
                  userSelect: 'none',
                }}
              >
                ↓
              </motion.div>
            )}
          </div>
        );
      })}

      {isComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-grey)',
            textAlign: 'center', marginTop: 10, lineHeight: 1.5,
          }}
        >
          ⓘ Click any step<br />to read its explanation
        </motion.p>
      )}
    </div>
  );
}
