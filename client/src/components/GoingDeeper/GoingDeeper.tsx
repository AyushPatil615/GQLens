import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { N1Visualizer }          from '../N1Visualizer/N1Visualizer';
import { NullBubbleDemo }        from '../NullBubble/NullBubbleDemo';
import { AuthFlowDemo }          from '../AuthFlow/AuthFlowDemo';
import { AdvancedQueriesDemo }   from '../AdvancedQueries/AdvancedQueriesDemo';
import { ResolveInfoInspector }  from '../ResolveInfo/ResolveInfoInspector';
import { AdvancedTypesDemo }     from '../AdvancedTypes/AdvancedTypesDemo';
import { EmbeddedGraphiQL }      from '../GraphiQL/EmbeddedGraphiQL';
import { StepDebugger }          from '../StepDebugger/StepDebugger';
import { FederationDemo }        from '../Federation/FederationDemo';
import { useAppMode }            from '../../context/ModeContext';
import { useSound }              from '../../context/SoundContext';

// ── Section registry ─────────────────────────────────────────────────────────
type SectionId =
  | 'n1' | 'null' | 'auth' | 'queries'
  | 'resolve' | 'types' | 'graphiql' | 'debugger' | 'federation';

interface Section {
  id:        SectionId;
  num:       number;
  icon:      string;
  label:     string;
  sublabel:  string;
  badge:     'learning' | 'production';
  color:     string;   // accent color
  component: React.ComponentType;
}

const SECTIONS: Section[] = [
  {
    id: 'debugger', num: 1,
    icon: '🐛', label: 'Step Debugger',
    sublabel: 'Walk through real execution step-by-step',
    badge: 'learning', color: '#6366F1',
    component: StepDebugger,
  },
  {
    id: 'n1', num: 2,
    icon: '⚡', label: 'N+1 & DataLoader',
    sublabel: 'The #1 GraphQL performance trap',
    badge: 'learning', color: '#F59E0B',
    component: N1Visualizer,
  },
  {
    id: 'null', num: 3,
    icon: '💥', label: 'Null Propagation',
    sublabel: 'How errors bubble through your schema',
    badge: 'learning', color: '#EF4444',
    component: NullBubbleDemo,
  },
  {
    id: 'auth', num: 4,
    icon: '🔐', label: 'Auth & Context',
    sublabel: 'JWT, context creation, role-based access',
    badge: 'production', color: '#8B5CF6',
    component: AuthFlowDemo,
  },
  {
    id: 'queries', num: 5,
    icon: '🔗', label: 'Advanced Queries',
    sublabel: 'Fragments, aliases, variables, directives',
    badge: 'learning', color: '#0EA5E9',
    component: AdvancedQueriesDemo,
  },
  {
    id: 'resolve', num: 6,
    icon: '📋', label: 'ResolveInfo Inspector',
    sublabel: 'What every resolver knows at runtime',
    badge: 'production', color: '#10B981',
    component: ResolveInfoInspector,
  },
  {
    id: 'types', num: 7,
    icon: '🧩', label: 'Advanced Types',
    sublabel: 'Enum, Interface, Union, Input, Directive',
    badge: 'learning', color: '#F97316',
    component: AdvancedTypesDemo,
  },
  {
    id: 'graphiql', num: 8,
    icon: '🛠', label: 'GraphiQL Studio',
    sublabel: 'Live schema explorer & query IDE',
    badge: 'production', color: '#EC4899',
    component: EmbeddedGraphiQL,
  },
  {
    id: 'federation', num: 9,
    icon: '🌐', label: 'Federation & Subgraphs',
    sublabel: 'One API across many services',
    badge: 'production', color: '#4F46E5',
    component: FederationDemo,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function GoingDeeper() {
  const { mode }                = useAppMode();
  const { playSound }           = useSound();
  const isLearning              = mode === 'learning';
  const [activeId, setActiveId] = useState<SectionId>('debugger');

  function handleSelectSection(id: SectionId) {
    if (id !== activeId) {
      playSound('step');
      setActiveId(id);
    }
  }

  const active    = SECTIONS.find(s => s.id === activeId)!;
  const Active    = active.component;

  return (
    <div style={{
      minHeight:        '100vh',
      background:       'var(--bg-base)',
      backgroundImage:  'radial-gradient(circle, #d4c5b5 1.5px, transparent 1.5px)',
      backgroundSize:   '28px 28px',
      display:          'flex',
      flexDirection:    'column',
    }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom:  '2px solid #E5E7EB',
        background:    'rgba(255,248,240,0.92)',
        backdropFilter:'blur(8px)',
        padding:       '16px 28px',
        display:       'flex',
        alignItems:    'center',
        gap:           14,
        position:      'sticky',
        top:           0,
        zIndex:        20,
      }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <div>
          <h1 style={{
            fontSize: 18, fontWeight: 900, color: '#000',
            margin: 0, letterSpacing: '-0.3px',
          }}>
            Going Deeper
          </h1>
          <p style={{
            fontSize: 11, color: '#6B7280',
            fontWeight: 600, margin: 0,
          }}>
            {SECTIONS.length} interactive modules — click any topic to explore
          </p>
        </div>

        {/* Mode badge */}
        <div style={{
          marginLeft: 'auto',
          padding: '5px 12px',
          borderRadius: 20,
          border: `2px solid ${isLearning ? '#8B5CF6' : '#EF4444'}`,
          background: isLearning ? '#F5F3FF' : '#FEF2F2',
          fontSize: 11, fontWeight: 800,
          color: isLearning ? '#7C3AED' : '#B91C1C',
        }}>
          {isLearning ? '🧠 Learning Mode' : '🚀 Production Mode'}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{
        display:   'flex',
        flex:      1,
        minHeight: 0,
      }}>

        {/* ── Left Sidebar (learning path) ── */}
        <nav style={{
          width:         260,
          flexShrink:    0,
          borderRight:   '2px solid #E5E7EB',
          background:    '#FFF',
          overflowY:     'auto',
          padding:       '16px 12px',
          display:       'flex',
          flexDirection: 'column',
          gap:           4,
          position:      'sticky',
          top:           65,            // below the sticky header
          height:        'calc(100vh - 65px)',
        }}>

          <div style={{
            fontSize: 9, fontWeight: 900, color: '#9CA3AF',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            padding: '4px 8px', marginBottom: 8,
          }}>
            Learning Path
          </div>

          {SECTIONS.map((s, i) => {
            const isActive  = s.id === activeId;
            const isBadgeLearning = s.badge === 'learning';

            return (
              <motion.button
                key={s.id}
                onClick={() => handleSelectSection(s.id)}
                whileTap={{ scale: 0.97 }}
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           10,
                  padding:       '9px 10px',
                  borderRadius:  10,
                  border:        isActive ? `2px solid ${s.color}` : '2px solid transparent',
                  background:    isActive ? `${s.color}18` : 'transparent',
                  cursor:        'pointer',
                  textAlign:     'left',
                  width:         '100%',
                  fontFamily:    'var(--font-sans)',
                  transition:    'background 0.15s, border-color 0.15s',
                  boxShadow:     isActive ? `2px 2px 0 ${s.color}` : 'none',
                }}
              >
                {/* Number badge */}
                <div style={{
                  width:          26, height: 26, borderRadius: 7,
                  background:     isActive ? s.color : '#F3F4F6',
                  display:        'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink:     0,
                  fontSize:       11, fontWeight: 900,
                  color:          isActive ? '#FFF' : '#9CA3AF',
                  fontFamily:     'var(--font-mono)',
                  transition:     'background 0.15s, color 0.15s',
                }}>
                  {i + 1 < 10 ? `0${i + 1}` : i + 1}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize:     12, fontWeight: 800,
                    color:        isActive ? s.color : '#374151',
                    whiteSpace:   'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    transition:   'color 0.15s',
                  }}>
                    {s.icon} {s.label}
                  </div>
                  <div style={{
                    fontSize:     9.5, color: '#9CA3AF', fontWeight: 600,
                    whiteSpace:   'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginTop:    2,
                  }}>
                    {s.sublabel}
                  </div>
                </div>

                {/* Mode badge dot */}
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: isBadgeLearning ? '#8B5CF6' : '#EF4444',
                  opacity: (isLearning && isBadgeLearning) || (!isLearning && !isBadgeLearning) ? 1 : 0.25,
                }} />
              </motion.button>
            );
          })}

          {/* Legend */}
          <div style={{
            marginTop: 'auto', paddingTop: 16,
            borderTop: '1px solid #F3F4F6',
            display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            {[
              { color: '#8B5CF6', label: 'Concept (Learning)' },
              { color: '#EF4444', label: 'Engineering (Production)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, fontWeight: 600, color: '#9CA3AF' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* ── Content panel ── */}
        <div style={{
          flex:      1,
          overflowY: 'auto',
          padding:   '28px 32px 48px',
          minWidth:  0,
        }}>

          {/* Section header */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          12,
            marginBottom: 24,
            paddingBottom: 18,
            borderBottom: `3px solid ${active.color}`,
          }}>
            <div style={{
              width:      44, height: 44, borderRadius: 12,
              background: active.color,
              display:    'flex', alignItems: 'center', justifyContent: 'center',
              fontSize:   20,
              boxShadow:  `3px 3px 0 rgba(0,0,0,0.15)`,
              flexShrink: 0,
            }}>
              {active.icon}
            </div>
            <div>
              <h2 style={{
                fontSize: 20, fontWeight: 900, color: '#000',
                margin: 0, letterSpacing: '-0.3px',
              }}>
                {active.label}
              </h2>
              <p style={{
                fontSize: 12, color: '#6B7280',
                fontWeight: 600, margin: 0, marginTop: 2,
              }}>
                {active.sublabel}
              </p>
            </div>

            {/* Badge */}
            <div style={{
              marginLeft: 'auto',
              padding: '5px 12px',
              borderRadius: 20,
              border: `2px solid ${active.badge === 'learning' ? '#8B5CF6' : '#EF4444'}`,
              background: active.badge === 'learning' ? '#F5F3FF' : '#FEF2F2',
              fontSize: 10, fontWeight: 800,
              color: active.badge === 'learning' ? '#7C3AED' : '#B91C1C',
              flexShrink: 0,
            }}>
              {active.badge === 'learning' ? '🧠 Concept' : '🚀 Engineering'}
            </div>
          </div>

          {/* Animated section content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Active />
            </motion.div>
          </AnimatePresence>

          {/* Bottom navigation */}
          <div style={{
            display:       'flex',
            justifyContent:'space-between',
            alignItems:    'center',
            marginTop:     40,
            paddingTop:    20,
            borderTop:     '2px solid #E5E7EB',
          }}>
            {(() => {
              const idx   = SECTIONS.findIndex(s => s.id === activeId);
              const prev  = SECTIONS[idx - 1];
              const next  = SECTIONS[idx + 1];
              return (
                <>
                  {prev ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectSection(prev.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px',
                        border: `2px solid ${prev.color}`,
                        borderRadius: 10,
                        background: '#FFF',
                        cursor: 'pointer',
                        fontSize: 12, fontWeight: 800,
                        color: prev.color,
                        boxShadow: `2px 2px 0 ${prev.color}`,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      ← {prev.icon} {prev.label}
                    </motion.button>
                  ) : <div />}

                  {/* Progress dots */}
                  <div style={{ display: 'flex', gap: 5 }}>
                    {SECTIONS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSection(s.id)}
                        style={{
                          width: s.id === activeId ? 20 : 8,
                          height: 8, borderRadius: 99,
                          background: s.id === activeId ? active.color : '#E5E7EB',
                          border: 'none', cursor: 'pointer',
                          transition: 'all 0.2s',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>

                  {next ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectSection(next.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px',
                        border: `2px solid ${next.color}`,
                        borderRadius: 10,
                        background: next.color,
                        cursor: 'pointer',
                        fontSize: 12, fontWeight: 800,
                        color: '#FFF',
                        boxShadow: `2px 2px 0 rgba(0,0,0,0.2)`,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {next.icon} {next.label} →
                    </motion.button>
                  ) : (
                    <div style={{
                      padding: '8px 14px',
                      border: '2px solid #10B981',
                      borderRadius: 10,
                      background: '#10B981',
                      fontSize: 12, fontWeight: 800, color: '#FFF',
                      boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                      fontFamily: 'var(--font-sans)',
                    }}>
                      ✓ All topics covered!
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
