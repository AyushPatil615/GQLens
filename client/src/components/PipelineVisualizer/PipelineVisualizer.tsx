import { motion } from 'framer-motion';

interface PipelineNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  icon: string;
}

const NODES: PipelineNode[] = [
  { id: 'parse',           label: 'Parser',            sublabel: 'Reads & tokenizes the query text',   color: '#38bdf8', icon: '◈' },
  { id: 'validate',        label: 'Validator',          sublabel: 'Checks fields exist in the schema',  color: '#a78bfa', icon: '✦' },
  { id: 'resolve-student', label: 'Student Resolver',   sublabel: 'A function that finds student data', color: '#e535ab', icon: '⬡' },
  { id: 'db',              label: 'Database',           sublabel: 'Reads a row from SQLite',            color: '#fb923c', icon: '◉' },
  { id: 'resolve-courses', label: 'Courses Resolver',   sublabel: 'A function that finds enrollments',  color: '#e535ab', icon: '⬡' },
  { id: 'respond',         label: 'JSON Response',      sublabel: 'Sends the data back to your app',    color: '#4ade80', icon: '✓' },
];

// Maps fakeData step ids → pipeline node ids
const STEP_TO_NODE: Record<string, string> = {
  'parse':           'parse',
  'validate':        'validate',
  'resolve:Student': 'resolve-student',
  'db:query':        'db',
  'resolve:courses': 'resolve-courses',
  'respond':         'respond',
};

interface Props {
  activeStepId: string | null;
  completedStepIds: string[];
}

export function PipelineVisualizer({ activeStepId, completedStepIds }: Props) {
  const activeNodeId    = activeStepId ? (STEP_TO_NODE[activeStepId] ?? null) : null;
  const completedNodeIds = completedStepIds
    .map(id => STEP_TO_NODE[id])
    .filter(Boolean);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      padding: '8px 0',
    }}>
      {NODES.map((node, index) => {
        const isActive    = node.id === activeNodeId;
        const isCompleted = completedNodeIds.includes(node.id);
        const isPending   = !isActive && !isCompleted;

        const nextNode = NODES[index + 1];

        return (
          <div
            key={node.id}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
          >
            {/* ─── Node card ─── */}
            <motion.div
              animate={{
                opacity: isPending ? 0.3 : 1,
                scale:   isActive  ? 1.02 : 1,
                boxShadow: isActive
                  ? `0 0 28px ${node.color}50, 0 0 8px ${node.color}30`
                  : isCompleted
                  ? `0 0 6px ${node.color}15`
                  : '0 0 0px transparent',
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 12,
                background: isActive
                  ? `linear-gradient(135deg, ${node.color}18, ${node.color}06)`
                  : isCompleted
                  ? `${node.color}08`
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  isActive
                    ? node.color + '55'
                    : isCompleted
                    ? node.color + '28'
                    : 'rgba(255,255,255,0.05)'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Icon bubble */}
              <motion.div
                animate={{
                  background: isActive || isCompleted
                    ? `${node.color}25`
                    : 'rgba(255,255,255,0.04)',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width: 34, height: 34,
                  borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                  color: isActive || isCompleted ? node.color : '#334155',
                  flexShrink: 0,
                  transition: 'color 0.3s ease',
                }}
              >
                {isCompleted && !isActive ? '✓' : node.icon}
              </motion.div>

              {/* Text */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 600,
                  color: isActive ? node.color : isCompleted ? '#94a3b8' : '#334155',
                  fontFamily: 'var(--font-sans)',
                  transition: 'color 0.3s ease',
                }}>
                  {node.label}
                </div>
                <div style={{
                  fontSize: 10.5, marginTop: 2,
                  color: isActive ? '#64748b' : '#1e293b',
                  fontFamily: 'var(--font-sans)',
                  transition: 'color 0.3s ease',
                }}>
                  {node.sublabel}
                </div>
              </div>

              {/* Active pulse dot */}
              {isActive && (
                <motion.div
                  animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: node.color,
                    boxShadow: `0 0 10px ${node.color}`,
                    flexShrink: 0,
                  }}
                />
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
                style={{
                  width: 2, height: 18,
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
