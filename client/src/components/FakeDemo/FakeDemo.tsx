import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STEP_DIALOGUES } from '../../data/fakeData';
import { useGraphQLTrace } from '../../hooks/useGraphQLTrace';
import { PipelineVisualizer } from '../PipelineVisualizer/PipelineVisualizer';
import { ExecutionTimeline } from '../ExecutionTimeline/ExecutionTimeline';
import { StepDialoguePanel } from './StepDialoguePanel';

const COMPLETE_CAPTION = 'All done! The query traveled through every resolver and came back as JSON.';

const STEP_COLORS: Record<string, string> = {
  'parse':           '#87CEEF',
  'validate':        '#C4B5FD',
  'resolve:Student': '#FDA4AF',
  'db:query':        '#FDB97D',
  'resolve:courses': '#FCA5A5',
  'respond':         '#86EFAC',
};

const FLOATERS = [
  { char: '⬡', color: '#87CEEF', top: '12%',  left:  '2.5%', size: 28 },
  { char: '●', color: '#C4B5FD', top: '8%',   right: '3.5%', size: 18 },
  { char: '✦', color: '#FDA4AF', top: '38%',  left:  '1.5%', size: 22 },
  { char: '▲', color: '#FDB97D', top: '44%',  right: '2%',   size: 16 },
  { char: '⬡', color: '#86EFAC', bottom: '22%', left: '2%',  size: 20 },
  { char: '●', color: '#FCA5A5', bottom: '30%', right: '3%', size: 14 },
  { char: '✦', color: '#87CEEF', bottom: '10%', right: '5%', size: 18 },
  { char: '⬡', color: '#C4B5FD', bottom: '16%', left: '3.5%', size: 14 },
];

export function FakeDemo() {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // ── Real backend hook — replaces fake setTimeout animation ──────────
  const { steps, isRunning, isComplete, runQuery, reset: resetTrace } = useGraphQLTrace();

  const totalMs = steps.reduce((s, e) => s + e.ms, 0);

  // The last arrived step is the "active" one while running
  const activeStep = !isComplete && steps.length > 0 ? steps[steps.length - 1] : null;

  const caption = isComplete ? COMPLETE_CAPTION : (activeStep?.caption ?? '');

  // All steps that have completed = everything except the last one currently running
  const completedStepIds = isComplete
    ? steps.map(s => s.step)
    : steps.slice(0, Math.max(0, steps.length - 1)).map(s => s.step);

  const activeStepId = isComplete ? null : (activeStep?.step ?? null);

  const activeDialogue = isComplete
    ? (selectedStepId ? STEP_DIALOGUES.find(d => d.step === selectedStepId) ?? null : null)
    : (activeStep ? STEP_DIALOGUES.find(d => d.step === activeStep.step) ?? null : null);

  function handleStepClick(stepId: string) {
    if (isComplete) setSelectedStepId(prev => prev === stepId ? null : stepId);
  }

  function reset() {
    resetTrace();
    setSelectedStepId(null);
  }

  const btnColor   = isRunning ? '#FDB97D' : isComplete ? '#86EFAC' : '#FF6B6B';
  const btnText    = isRunning ? '#000' : isComplete ? '#000' : '#fff';
  const btnShadow  = isRunning ? 'none' : '5px 5px 0 #000';
  const btnContent = isRunning ? '⟳  Executing…' : isComplete ? '↺  Run Again' : '▶  Run Query';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(circle, #d4c5b5 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflowX: 'hidden',
    }}>

      {/* ── Floating decorations ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {FLOATERS.map((f, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            style={{
              position: 'absolute',
              color: f.color,
              fontSize: f.size,
              fontWeight: 900,
              opacity: 0.55,
              ...(f as any),
              char: undefined, color: undefined, size: undefined,
              top: (f as any).top,
              left: (f as any).left,
              right: (f as any).right,
              bottom: (f as any).bottom,
            }}
          >
            {f.char}
          </motion.span>
        ))}
      </div>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#fff',
        borderBottom: 'var(--border)',
        padding: '12px 28px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>
            ⬡ GraphScope
          </span>
        </div>
      </header>


      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '44px 24px 28px', position: 'relative', zIndex: 1 }}>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 900,
            color: '#000',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            fontFamily: 'var(--font-sans)',
            marginBottom: 6,
          }}
        >
          GraphQL, Explained Step by Step
        </motion.h1>

        {/* Rainbow underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            height: 5, width: 320, margin: '6px auto 16px',
            background: 'linear-gradient(to right, #87CEEF, #C4B5FD, #FDA4AF, #FDB97D, #FCA5A5, #86EFAC)',
            borderRadius: 99,
          }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            fontSize: 15.5, color: 'var(--text-mid)',
            maxWidth: 480, margin: '0 auto', lineHeight: 1.65,
            fontWeight: 600,
          }}
        >
          Click <strong style={{ color: '#000' }}>Run Query</strong> to see every step explained — what happens, what it takes, and why it matters.
        </motion.p>
      </div>

      {/* ── Three columns ── */}
      <div style={{
        display: 'flex', gap: 18, padding: '0 24px 24px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        flexWrap: 'wrap', alignItems: 'flex-start',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── COL 1: Query panel ── */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Editor card */}
          <div style={{
            background: '#fff',
            border: 'var(--border)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Title bar */}
            <div style={{
              padding: '9px 14px', borderBottom: 'var(--border-2)',
              background: '#f9f5f0',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', border: '1.5px solid #000' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', border: '1.5px solid #000' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', border: '1.5px solid #000' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#000' }}>
                query.graphql
              </span>
            </div>

            {/* Code */}
            <pre style={{
              margin: 0, padding: '18px 20px',
              fontFamily: 'var(--font-mono)', fontSize: 13,
              lineHeight: 1.85, background: '#fff',
              color: '#374151', overflowX: 'auto',
            }}>
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>query</span>{' {\n'}
              {'  '}<span style={{ color: '#0369a1' }}>student</span>
              {'(id: '}<span style={{ color: '#15803d' }}>"1"</span>{')'}{' {\n'}
              {'    '}<span style={{ color: '#000', fontWeight: 600 }}>name</span>{'\n'}
              {'    '}<span style={{ color: '#000', fontWeight: 600 }}>age</span>{'\n'}
              {'    '}<span style={{ color: '#0369a1' }}>courses</span>{' {\n'}
              {'      '}<span style={{ color: '#000', fontWeight: 600 }}>title</span>{'\n'}
              {'    }\n'}
              {'  }\n'}
              {'}'}
            </pre>
          </div>

          {/* Run button */}
          <motion.button
            whileHover={!isRunning ? { x: -3, y: -3, boxShadow: '8px 8px 0 #000' } : {}}
            whileTap={!isRunning ? { x: 0, y: 0, boxShadow: '2px 2px 0 #000' } : {}}
            onClick={isComplete ? reset : runQuery}
            disabled={isRunning}
            style={{
              width: '100%', padding: '15px 24px',
              background: btnColor,
              border: 'var(--border)',
              boxShadow: btnShadow,
              borderRadius: 10,
              color: btnText,
              fontSize: 16, fontWeight: 900,
              fontFamily: 'var(--font-sans)',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {isRunning ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >⟳</motion.span>
                Executing…
              </span>
            ) : btnContent}
          </motion.button>

          {/* Step badge pills */}
          <AnimatePresence>
            {(isRunning || isComplete) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
              >
                {steps.map((step, i) => {
                  const c    = STEP_COLORS[step.step] || '#e5e7eb';
                  const done = isComplete || i < activeStepIndex;
                  const act  = !isComplete && i === activeStepIndex;
                  return (
                    <motion.span
                      key={step.step}
                      animate={{ opacity: done || act ? 1 : 0.25 }}
                      style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 9px', borderRadius: 999,
                        background: done || act ? c : 'transparent',
                        border: `2px solid ${done || act ? '#000' : '#d1d5db'}`,
                        boxShadow: done || act ? '2px 2px 0 #000' : 'none',
                        fontFamily: 'var(--font-mono)',
                        color: '#000',
                        transition: 'all 0.2s ease',
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

        {/* ── COL 2: Pipeline ── */}
        <div style={{
          flex: '0 0 240px',
          background: '#fff',
          border: 'var(--border)',
          boxShadow: 'var(--shadow-md)',
          borderRadius: 12,
          padding: '16px 14px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#000',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 14,
          }}>
            Execution Pipeline
          </div>

          {!isRunning && !isComplete && (
            <p style={{
              fontSize: 12, color: 'var(--text-grey)',
              textAlign: 'center', padding: '16px 0', fontWeight: 600,
            }}>
              Hit <strong style={{ color: '#000' }}>Run Query</strong><br />to watch the pipeline light up
            </p>
          )}

          <PipelineVisualizer
            activeStepId={activeStepId}
            completedStepIds={completedStepIds}
            isComplete={isComplete}
            selectedStepId={selectedStepId}
            onStepClick={handleStepClick}
          />
        </div>

        {/* ── COL 3: Dialogue ── */}
        <StepDialoguePanel
          dialogue={activeDialogue}
          isComplete={isComplete}
        />
      </div>

      {/* ── Timeline ── */}
      <div style={{
        padding: '0 24px 52px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        <ExecutionTimeline
          steps={steps}
          activeIndex={isComplete ? steps.length : steps.length}
          caption={caption}
          isComplete={isComplete}
          totalMs={totalMs}
        />
      </div>
    </div>
  );
}
