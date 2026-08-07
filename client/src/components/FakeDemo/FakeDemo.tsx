import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAKE_EVENT_LOG } from '../../data/fakeData';
import { PipelineVisualizer } from '../PipelineVisualizer/PipelineVisualizer';
import { ExecutionTimeline } from '../ExecutionTimeline/ExecutionTimeline';

type RunPhase = 'idle' | 'running' | 'complete';

const STEP_DELAY_MS = 950; // ms between each step firing

const COMPLETE_CAPTION =
  'All done! The query traveled through every resolver and came back as JSON — in under 50ms.';

export function FakeDemo() {
  const [runPhase, setRunPhase]         = useState<RunPhase>('idle');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const steps  = FAKE_EVENT_LOG;
  const totalMs = steps.reduce((sum, s) => sum + s.ms, 0);

  const isRunning  = runPhase === 'running';
  const isComplete = runPhase === 'complete';

  // Which step is currently animating
  const activeStep =
    !isComplete && activeStepIndex >= 0 && activeStepIndex < steps.length
      ? steps[activeStepIndex]
      : null;

  // Caption shown in the timeline
  const caption = isComplete ? COMPLETE_CAPTION : (activeStep?.caption ?? '');

  // Completed step IDs for the pipeline
  const completedStepIds: string[] = isComplete
    ? steps.map(s => s.step)
    : Array.from({ length: Math.max(0, activeStepIndex) }, (_, i) => steps[i].step);

  const activeStepId = isComplete ? null : (activeStep?.step ?? null);

  // ─── Animation control ──────────────────────────────────────────
  function clearAllTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function runQuery() {
    if (isRunning) return;
    clearAllTimeouts();
    setRunPhase('running');
    setActiveStepIndex(0);

    steps.forEach((_, index) => {
      const t = setTimeout(() => {
        setActiveStepIndex(index);
      }, index * STEP_DELAY_MS);
      timeoutsRef.current.push(t);
    });

    // Mark complete after last step finishes
    const doneTimeout = setTimeout(() => {
      setRunPhase('complete');
      setActiveStepIndex(steps.length); // past last → all bars filled
    }, steps.length * STEP_DELAY_MS);
    timeoutsRef.current.push(doneTimeout);
  }

  function reset() {
    clearAllTimeouts();
    setRunPhase('idle');
    setActiveStepIndex(-1);
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* ── Header ── */}
      <header style={{
        padding: '14px 32px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-surface)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #e535ab 0%, #7c5cfc 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: '0 0 16px rgba(229,53,171,0.35)',
        }}>⬡</div>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
          GraphScope
        </span>
        <span style={{
          marginLeft: 6, fontSize: 11, color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          padding: '2px 8px', borderRadius: 999,
          background: 'rgba(229,53,171,0.08)',
          border: '1px solid rgba(229,53,171,0.2)',
        }}>
          Phase 1 — Fake Demo
        </span>
      </header>

      {/* ── Hero intro ── */}
      <div style={{ textAlign: 'center', padding: '44px 32px 28px' }}>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.6rem)',
            fontWeight: 700, marginBottom: 14,
            background: 'linear-gradient(135deg, #f1f5f9 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}
        >
          Watch your query execute
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontSize: 15.5, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}
        >
          Click <strong style={{ color: 'var(--text-primary)' }}>Run Query</strong> to see exactly what
          happens inside GraphQL — step by step, explained in plain English.
        </motion.p>
      </div>

      {/* ── Main two-column layout ── */}
      <div style={{
        display: 'flex', gap: 20, padding: '0 28px 24px',
        maxWidth: 1080, margin: '0 auto', width: '100%',
        flexWrap: 'wrap',
      }}>

        {/* ── LEFT: Query Panel ── */}
        <div style={{ flex: '0 0 330px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Query editor card */}
          <motion.div
            animate={{
              borderColor: isRunning
                ? 'rgba(229,53,171,0.45)'
                : isComplete
                ? 'rgba(74,222,128,0.35)'
                : 'rgba(255,255,255,0.07)',
              boxShadow: isRunning
                ? '0 0 24px rgba(229,53,171,0.12)'
                : isComplete
                ? '0 0 20px rgba(74,222,128,0.08)'
                : '0 0 0px transparent',
            }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
            {/* Fake editor title bar */}
            <div style={{
              padding: '9px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-elevated)',
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>
                query.graphql
              </span>
            </div>

            {/* Query syntax */}
            <pre style={{
              margin: 0, padding: '20px 22px',
              fontFamily: 'var(--font-mono)', fontSize: 13.5,
              lineHeight: 1.8, color: '#64748b', overflow: 'auto',
              background: 'transparent',
            }}>
              <span style={{ color: '#a78bfa' }}>query</span>{' {\n'}
              {'  '}<span style={{ color: '#38bdf8' }}>student</span>
              {'(id: '}<span style={{ color: '#4ade80' }}>"1"</span>{')'}{' {\n'}
              {'    '}<span style={{ color: '#f1f5f9' }}>name</span>{'\n'}
              {'    '}<span style={{ color: '#f1f5f9' }}>age</span>{'\n'}
              {'    '}<span style={{ color: '#38bdf8' }}>courses</span>{' {\n'}
              {'      '}<span style={{ color: '#f1f5f9' }}>title</span>{'\n'}
              {'    }\n'}
              {'  }\n'}
              {'}'}
            </pre>
          </motion.div>

          {/* Run button */}
          <motion.button
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.96 }}
            onClick={isComplete ? reset : runQuery}
            disabled={isRunning}
            style={{
              width: '100%', padding: '13px 20px',
              borderRadius: 12, border: 'none',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              background: isRunning
                ? 'rgba(229,53,171,0.08)'
                : isComplete
                ? 'linear-gradient(135deg, #22c55e, #4ade80)'
                : 'linear-gradient(135deg, #e535ab, #7c5cfc)',
              color: isRunning ? 'rgba(229,53,171,0.5)' : '#fff',
              fontSize: 14.5, fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: isRunning
                ? 'none'
                : isComplete
                ? '0 4px 20px rgba(74,222,128,0.35)'
                : '0 4px 20px rgba(229,53,171,0.4)',
              transition: 'background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease',
            }}
          >
            {isRunning ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  ⟳
                </motion.span>
                Executing…
              </>
            ) : isComplete ? (
              '↺  Run Again'
            ) : (
              '▶  Run Query'
            )}
          </motion.button>

          {/* Step progress pills */}
          <AnimatePresence>
            {(isRunning || isComplete) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
              >
                {steps.map((step, index) => {
                  const stepColors: Record<string, string> = {
                    'parse': '#38bdf8', 'validate': '#a78bfa',
                    'resolve:Student': '#e535ab', 'db:query': '#fb923c',
                    'resolve:courses': '#e535ab', 'respond': '#4ade80',
                  };
                  const c = stepColors[step.step] || '#94a3b8';
                  const done   = isComplete || index < activeStepIndex;
                  const active = !isComplete && index === activeStepIndex;
                  return (
                    <motion.span
                      key={step.step}
                      animate={{ opacity: done || active ? 1 : 0.2 }}
                      style={{
                        fontSize: 10, fontWeight: 500,
                        padding: '3px 8px', borderRadius: 999,
                        background: done ? `${c}18` : 'transparent',
                        border: `1px solid ${active ? c : done ? c + '35' : 'rgba(255,255,255,0.07)'}`,
                        color: done || active ? c : '#1e293b',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {step.step}
                    </motion.span>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Pipeline Visualizer ── */}
        <div style={{
          flex: 1, minWidth: 260,
          background: 'var(--bg-surface)',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          padding: '18px 20px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 16, fontFamily: 'var(--font-sans)',
          }}>
            Execution Pipeline
          </div>

          {/* Idle placeholder */}
          {runPhase === 'idle' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: 13, color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', textAlign: 'center',
                padding: '30px 0',
              }}
            >
              Hit <strong style={{ color: 'var(--text-secondary)' }}>Run Query</strong> to watch the pipeline light up ↙
            </motion.p>
          )}

          <PipelineVisualizer
            activeStepId={activeStepId}
            completedStepIds={completedStepIds}
          />
        </div>
      </div>

      {/* ── Bottom: Execution Timeline ── */}
      <div style={{ padding: '0 28px 52px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
        <ExecutionTimeline
          steps={steps}
          activeIndex={isComplete ? steps.length : activeStepIndex}
          caption={caption}
          isComplete={isComplete}
          totalMs={totalMs}
        />
      </div>
    </div>
  );
}
