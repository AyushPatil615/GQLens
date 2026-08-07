import { motion } from 'framer-motion';

interface PipelineNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  icon: string;
}

const NODES: PipelineNode[] = [
  { id: 'parse',           label: 'Parser',          sublabel: 'Reads & tokenizes the query text',   color: '#38bdf8', icon: '◈' },
  { id: 'validate',        label: 'Validator',        sublabel: 'Checks fields exist in the schema',  color: '#a78bfa', icon: '✦' },
  { id: 'resolve-student', label: 'Student Resolver', sublabel: 'A function that finds student data', color: '#e535ab', icon: '⬡' },
  { id: 'db',              label: 'Database',         sublabel: 'Reads a row from SQLite',            color: '#fb923c', icon: '◉' },
  { id: 'resolve-courses', label: 'Courses Resolver', sublabel: 'A function that finds enrollments',  color: '#e535ab', icon: '⬡' },
  { id: 'respond',         label: 'JSON Response',    sublabel: 'Sends the data back to your app',   color: '#4ade80', icon: '✓' },
];

const STEP_TO_NODE: Record<string, string> = {
  'parse':           'parse',
  'validate':        'validate',
  'resolve:Student': 'resolve-student',
  'db:query':        'db',
  'resolve:courses': 'resolve-courses',
  'respond':         'respond',
};

// Reverse map: node id → step id (for click callbacks)
const NODE_TO_STEP: Record<string, string> = {
  'parse':           'parse',
  'validate':        'validate',
  'resolve-student': 'resolve:Student',
  'db':              'db:query',
  'resolve-courses': 'resolve:courses',
  'respond':         'respond',
};

interface Props {
  activeStepId: string | null;
  completedStepIds: string[];
  isComplete?: boolean;
  selectedStepId?: string | null;
  onStepClick?: (stepId: string) => void;
}

export function PipelineVisualizer({
  activeStepId,
  completedStepIds,
  isComplete = false,
  selectedStepId = null,
  onStepClick,
}: Props) {
  const activeNodeId     = activeStepId ? (STEP_TO_NODE[activeStepId] ?? null) : null;
  const completedNodeIds = completedStepIds.map(id => STEP_TO_NODE[id]).filter(Boolean);
  const selectedNodeId   = selectedStepId ? (STEP_TO_NODE[selectedStepId] ?? null) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, padding: '8px 0' }}>
      {NODES.map((node, index) => {
        const isActive    = node.id === activeNodeId;
        const isCompleted = completedNodeIds.includes(node.id);
        const isSelected  = node.id === selectedNodeId;
        const isPending   = !isActive && !isCompleted;
        const isClickable = isComplete && isCompleted && !!onStepClick;
        const nextNode    = NODES[index + 1];

        return (
          <div
            key={node.id}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
          >
            {/* ─── Node card ─── */}
            <motion.div
              onClick={isClickable ? () => onStepClick!(NODE_TO_STEP[node.id]) : undefined}
              whileHover={isClickable ? { scale: 1.02, y: -1 } : {}}
              whileTap={isClickable ? { scale: 0.98 } : {}}
              animate={{
                opacity: isPending ? 0.25 : 1,
                scale:   isActive ? 1.02 : 1,
                boxShadow: isSelected
                  ? `0 0 0 2px ${node.color}, 0 0 24px ${node.color}40`
                  : isActive
                  ? `0 0 28px ${node.color}50, 0 0 8px ${node.color}30`
                  : isCompleted
                  ? `0 0 6px ${node.color}15`
                  : '0 0 0px transparent',
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                background: isSelected
                  ? `linear-gradient(135deg, ${node.color}22, ${node.color}0a)`
                  : isActive
                  ? `linear-gradient(135deg, ${node.color}18, ${node.color}06)`
                  : isCompleted
                  ? `${node.color}08`
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  isSelected
                    ? node.color + '80'
                    : isActive
                    ? node.color + '55'
                    : isCompleted
                    ? node.color + '28'
                    : 'rgba(255,255,255,0.05)'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'background 0.3s ease, border-color 0.3s ease',
                position: 'relative',
              }}
            >
              {/* Icon bubble */}
              <motion.div
                animate={{
                  background: isActive || isCompleted ? `${node.color}25` : 'rgba(255,255,255,0.04)',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                  color: isActive || isCompleted ? node.color : '#334155',
                  flexShrink: 0,
                  transition: 'color 0.3s ease',
                }}
              >
                {isCompleted && !isActive ? '✓' : node.icon}
              </motion.div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: isActive ? node.color : isSelected ? node.color : isCompleted ? '#94a3b8' : '#334155',
                  fontFamily: 'var(--font-sans)',
                  transition: 'color 0.3s ease',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {node.label}
                </div>
                <div style={{
                  fontSize: 10, marginTop: 1,
                  color: isActive ? '#475569' : '#1e293b',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {node.sublabel}
                </div>
              </div>

              {/* Active pulse */}
              {isActive && (
                <motion.div
                  animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: node.color,
                    boxShadow: `0 0 10px ${node.color}`,
                    flexShrink: 0,
                  }}
                />
              )}

              {/* "Tap to explore" hint on completed nodes (when query is done) */}
              {isClickable && !isSelected && (
                <div style={{
                  fontSize: 9, color: node.color + '80',
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                  letterSpacing: '0.03em',
                }}>
                  ⓘ
                </div>
              )}

              {/* "Selected" indicator */}
              {isSelected && (
                <div style={{
                  fontSize: 9, color: node.color,
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                  fontWeight: 700,
                }}>
                  ◀
                </div>
              )}
            </motion.div>

            {/* ─── Connector line ─── */}
            {index < NODES.length - 1 && (
              <motion.div
                animate={{
                  background: isCompleted
                    ? `linear-gradient(to bottom, ${node.color}55, ${nextNode.color}55)`
                    : 'rgba(255,255,255,0.05)',
                }}
                transition={{ duration: 0.5 }}
                style={{ width: 2, height: 16, borderRadius: 1 }}
              />
            )}
          </div>
        );
      })}

      {/* Hint text after completion */}
      {isComplete && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 10, color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)', textAlign: 'center',
            marginTop: 12, lineHeight: 1.5,
          }}
        >
          ⓘ Click any step<br />to read its explanation
        </motion.p>
      )}
    </div>
  );
}
