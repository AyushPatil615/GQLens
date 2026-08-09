import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STEP_DIALOGUES } from '../../data/stepDialogues';
import { useGraphQLTrace } from '../../hooks/useGraphQLTrace';
import { PipelineVisualizer } from '../PipelineVisualizer/PipelineVisualizer';
import { ExecutionTimeline } from '../ExecutionTimeline/ExecutionTimeline';
import { StepDialoguePanel } from './StepDialoguePanel';

// ─── Field state ──────────────────────────────────────────────────────
interface Fields { name: boolean; age: boolean; courses: boolean }

function buildQuery(f: Fields): string {
  const lines = [
    '    name',
    f.age     ? '    age'                               : null,
    f.courses ? '    courses {\n      title\n    }' : null,
  ].filter(Boolean).join('\n');
  return `query {\n  student(id: "1") {\n${lines}\n  }\n}`;
}

// ─── Design tokens ────────────────────────────────────────────────────
const STEP_COLORS: Record<string, string> = {
  'parse':           '#87CEEF',
  'validate':        '#C4B5FD',
  'resolve:Student': '#FDA4AF',
  'db:query':        '#FDB97D',
  'resolve:courses': '#FCA5A5',
  'respond':         '#86EFAC',
};

const FLOATERS = [
  { char: '⬡', color: '#87CEEF', top: '12%',   left:   '2.5%',  size: 28 },
  { char: '●', color: '#C4B5FD', top: '8%',    right:  '3.5%',  size: 18 },
  { char: '✦', color: '#FDA4AF', top: '38%',   left:   '1.5%',  size: 22 },
  { char: '▲', color: '#FDB97D', top: '44%',   right:  '2%',    size: 16 },
  { char: '⬡', color: '#86EFAC', bottom: '22%', left:  '2%',    size: 20 },
  { char: '●', color: '#FCA5A5', bottom: '30%', right: '3%',    size: 14 },
  { char: '✦', color: '#87CEEF', bottom: '10%', right: '5%',    size: 18 },
  { char: '⬡', color: '#C4B5FD', bottom: '16%', left: '3.5%',  size: 14 },
];

const COMPLETE_CAPTION = 'All done! The query traveled through every resolver and came back as JSON.';

// ─── Field toggle pill ─────────────────────────────────────────────────
function FieldPill({
  label, checked, locked, color, onToggle,
}: {
  label: string; checked: boolean; locked?: boolean; color: string; onToggle?: () => void;
}) {
  return (
    <motion.button
      onClick={locked ? undefined : onToggle}
      whileHover={locked ? {} : { y: -1 }}
      whileTap={locked ? {} : { scale: 0.96 }}
      title={locked ? 'name is always required' : `Toggle ${label}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px',
        borderRadius: 999,
        border: '2px solid #000',
        background: checked ? color : '#f3f4f6',
        boxShadow: checked ? '2px 2px 0 #000' : 'none',
        cursor: locked ? 'default' : 'pointer',
        fontSize: 11.5, fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        color: '#000',
        opacity: locked ? 0.6 : 1,
        transition: 'background 0.15s, box-shadow 0.15s',
      }}
    >
      <span style={{
        width: 12, height: 12, borderRadius: 2,
        border: '2px solid #000',
        background: checked ? '#000' : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </span>
      {label}
      {locked && <span style={{ fontSize: 9, opacity: 0.7 }}>🔒</span>}
    </motion.button>
  );
}

// ─── Main component ────────────────────────────────────────────────────
export function FakeDemo() {
  const [fields, setFields] = useState<Fields>({ name: true, age: true, courses: true });
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const query = buildQuery(fields);

  // Track whether fields changed after the last run (to show "run with new fields" hint)
  const queryAtLastRunRef = useRef<string | null>(null);
  const fieldsChangedSinceRun =
    queryAtLastRunRef.current !== null && queryAtLastRunRef.current !== query;

  // ── Real backend hook ───────────────────────────────────────────────
  const { steps, isRunning, isComplete, isError, errorMsg, responseData, runQuery, reset: resetTrace } = useGraphQLTrace(query);

  const totalMs    = steps.reduce((s, e) => s + e.ms, 0);
  const activeStep = !isComplete && steps.length > 0 ? steps[steps.length - 1] : null;
  const caption    = isComplete ? COMPLETE_CAPTION : (activeStep?.caption ?? '');

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
    queryAtLastRunRef.current = null;
  }

  function handleRunQuery() {
    queryAtLastRunRef.current = query;
    runQuery();
  }

  // ── Button label ────────────────────────────────────────────────────
  const btnShadow = isRunning ? 'none' : '5px 5px 0 #000';
  const btnLabel = isRunning
    ? '⟳  Executing…'
    : isError
      ? '↺  Try Again'
      : isComplete
        ? (fieldsChangedSinceRun ? '▶  Run with new fields' : '↺  Run Again')
        : '▶  Run Query';
  const btnBg = isRunning ? '#FDB97D' : isError ? '#FCA5A5' : isComplete ? '#86EFAC' : '#FF6B6B';

  function toggleField(key: keyof Fields) {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  }

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
      <div className="gs-floaters" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
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


      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '44px 24px 28px', position: 'relative', zIndex: 1 }}>
        <motion.h1
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(26px, 4.5vw, 48px)',
            fontWeight: 900, color: '#000',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-1px', lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          GraphQL, Explained Step by Step
        </motion.h1>

        {/* Rainbow underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          style={{
            width: 260, height: 4, margin: '0 auto 18px',
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
      <div className="gs-three-col" style={{
        padding: '0 24px 24px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── COL 1: Query panel + Field picker ── */}
        <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

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

            {/* Dynamic code display */}
            <div style={{
              margin: 0, padding: '16px 20px',
              fontFamily: 'var(--font-mono)', fontSize: 12.5,
              lineHeight: 1.9, background: '#fff',
              color: '#374151',
            }}>
              <div><span style={{ color: '#7c3aed', fontWeight: 700 }}>query</span> {'{'}</div>
              <div>{'  '}<span style={{ color: '#0369a1', fontWeight: 600 }}>student</span>{'(id: '}<span style={{ color: '#15803d' }}>"1"</span>{')'} {'{'}</div>
              <div>{'    '}<span style={{ color: '#000', fontWeight: 600 }}>name</span></div>

              <AnimatePresence initial={false}>
                {fields.age && (
                  <motion.div
                    key="age"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div>{'    '}<span style={{ color: '#000', fontWeight: 600 }}>age</span></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {fields.courses && (
                  <motion.div
                    key="courses"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div>{'    '}<span style={{ color: '#0369a1', fontWeight: 600 }}>courses</span> {'{'}</div>
                    <div>{'      '}<span style={{ color: '#000', fontWeight: 600 }}>title</span></div>
                    <div>{'    }'}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>{'  }'}</div>
              <div>{'}'}</div>
            </div>

            {/* ── Field picker ── */}
            <div style={{
              borderTop: 'var(--border-2)',
              background: '#f9f5f0',
              padding: '12px 14px',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 8,
              }}>
                Fields to fetch
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <FieldPill
                  label="name" checked={fields.name} locked color="#FDA4AF"
                />
                <FieldPill
                  label="age" checked={fields.age} color="#C4B5FD"
                  onToggle={() => toggleField('age')}
                />
                <FieldPill
                  label="courses" checked={fields.courses} color="#FDB97D"
                  onToggle={() => toggleField('courses')}
                />
              </div>

              {/* Insight tip — shows when courses is off */}
              <AnimatePresence>
                {!fields.courses && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      marginTop: 10, padding: '8px 10px',
                      background: '#FEF9C3',
                      border: '2px solid #000',
                      boxShadow: '2px 2px 0 #000',
                      borderRadius: 8,
                      fontSize: 11, fontWeight: 600, color: '#000',
                      lineHeight: 1.5,
                    }}>
                      💡 <strong>Watch the pipeline!</strong> Courses Resolver will be <em>skipped</em> — GraphQL only runs what you ask for.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Run button */}
          {/* Error banner */}
          <AnimatePresence>
            {isError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  padding: '12px 14px',
                  background: '#FEE2E2',
                  border: '2px solid #000',
                  boxShadow: '3px 3px 0 #000',
                  borderRadius: 10,
                  fontSize: 12, fontWeight: 600, color: '#000',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 4 }}>⚠️ Server unreachable</div>
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={!isRunning ? { x: -3, y: -3, boxShadow: '8px 8px 0 #000' } : {}}
            whileTap={!isRunning ? { x: 0, y: 0, boxShadow: '2px 2px 0 #000' } : {}}
            onClick={(isComplete || isError) ? (fieldsChangedSinceRun ? handleRunQuery : reset) : handleRunQuery}
            disabled={isRunning}
            style={{
              width: '100%', padding: '15px 24px',
              background: btnBg,
              border: 'var(--border)',
              boxShadow: btnShadow,
              borderRadius: 10,
              color: '#000',
              fontSize: 15, fontWeight: 900,
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
            ) : btnLabel}
          </motion.button>

          {/* Step badge pills — shows which steps fired */}
          <AnimatePresence>
            {(isRunning || isComplete) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
              >
                {steps.map((step) => {
                  const c = STEP_COLORS[step.step] || '#e5e7eb';
                  return (
                    <motion.span
                      key={step.step}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 9px', borderRadius: 999,
                        background: c,
                        border: '2px solid #000',
                        boxShadow: '2px 2px 0 #000',
                        fontFamily: 'var(--font-mono)',
                        color: '#000',
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
          flex: '1 1 220px', minWidth: 0,
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
          responseData={responseData}
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
          activeIndex={steps.length}
          caption={caption}
          isComplete={isComplete}
          totalMs={totalMs}
        />
      </div>
    </div>
  );
}
