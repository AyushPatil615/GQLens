import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGraphQLTrace } from '../../hooks/useGraphQLTrace';
import { useMutationTrace } from '../../hooks/useMutationTrace';
import { PipelineVisualizer } from '../PipelineVisualizer/PipelineVisualizer';
import { ExecutionTimeline } from '../ExecutionTimeline/ExecutionTimeline';
import { StepDialoguePanel } from './StepDialoguePanel';
import { MutationBuilder } from '../MutationDemo/MutationBuilder';
import { DataDiffPanel } from '../MutationDemo/DataDiffPanel';
import { PresetQueriesPanel } from './PresetQueriesPanel';
import { Query3DExplorer } from '../Theory3D/Query3DExplorer';
import { N1Visualizer } from '../N1Visualizer/N1Visualizer';
import { DOMAIN_PRESETS } from '../../data/queryExamples';
import type { DomainConfig } from '../../data/domains';
import { buildDomainQuery } from '../../data/domains';
import type { MutationOperationConfig } from '../../data/mutations';

// FLOATERS and COMPLETE_CAPTION stay the same
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
export function FakeDemo({ domain }: { domain: DomainConfig }) {
  // ── Mode: query vs mutation ────────────────────────────────────────
  const [mode, setMode] = useState<'query' | 'mutation'>('query');

  // Active mutation operation (for mutation mode)
  const [activeMutOp, setActiveMutOp] = useState<MutationOperationConfig | null>(
    domain.mutations[0] ?? null
  );

  // Build initial active-field map from the domain config
  const makeDefaultFields = (d: DomainConfig) =>
    Object.fromEntries(d.fields.map(f => [f.key, f.defaultOn])) as Record<string, boolean>;

  const [fields, setFields] = useState<Record<string, boolean>>(() => makeDefaultFields(domain));
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Reset field toggles, mode, and mutation op when domain changes
  useEffect(() => {
    setFields(makeDefaultFields(domain));
    setSelectedStepId(null);
    setMode('query');
    setActiveMutOp(domain.mutations[0] ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain.id]);

  const query = buildDomainQuery(domain, fields);
  const STEP_COLORS    = mode === 'mutation' && activeMutOp ? activeMutOp.stepColors    : domain.stepColors;
  const STEP_DIALOGUES = mode === 'mutation' && activeMutOp ? activeMutOp.stepDialogues : domain.stepDialogues;

  // Editable query text (query mode)
  const [editedQueryText, setEditedQueryText] = useState(query);
  const isQueryCustom = editedQueryText.trim() !== query.trim();

  // Keep in sync when field toggles change (only if user hasn't diverged)
  useEffect(() => {
    if (!isQueryCustom) setEditedQueryText(query);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Reset editedQueryText when domain changes
  useEffect(() => {
    setEditedQueryText(buildDomainQuery(domain, Object.fromEntries(domain.fields.map(f => [f.key, f.defaultOn]))));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain.id]);

  // ── Mutation trace hook ───────────────────────────────────────────
  const {
    steps: mutSteps, isRunning: mutRunning, isComplete: mutComplete,
    isError: mutError, errorMsg: mutErrorMsg, result: mutResult,
    runMutation, reset: mutReset,
  } = useMutationTrace(domain.id);

  // Track whether fields changed after the last run (to show "run with new fields" hint)
  const queryAtLastRunRef = useRef<string | null>(null);
  const fieldsChangedSinceRun =
    queryAtLastRunRef.current !== null && queryAtLastRunRef.current !== query;

  // ── Real backend hook ───────────────────────────────────────────────
  const { steps, isRunning, isComplete, isError, errorMsg, responseData, runQuery, reset: resetTrace } = useGraphQLTrace(query, domain.id);

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
    queryAtLastRunRef.current = editedQueryText;
    runQuery(editedQueryText);
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

  function toggleField(key: string) {
    const fieldCfg = domain.fields.find(f => f.key === key);
    if (fieldCfg?.locked) return;
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
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            fontSize: 15.5, color: 'var(--text-mid)',
            maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.65,
            fontWeight: 600,
          }}
        >
          {mode === 'query'
            ? <>Click <strong style={{ color: '#000' }}>Run Query</strong> to see every step explained — what happens, what it takes, and why it matters.</>
            : <>Select a <strong style={{ color: '#000' }}>write operation</strong>, pick the arguments, then run it to see what changes in the database.</>
          }
        </motion.p>

        {/* ── Mode toggle ── */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-base)',
          border: 'var(--border-2)',
          borderRadius: 12,
          padding: 3,
          gap: 3,
          boxShadow: '3px 3px 0 #000',
        }}>
          {(['query', 'mutation'] as const).map(m => (
            <motion.button
              key={m}
              onClick={() => {
                setMode(m);
                if (m === 'query') mutReset();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '7px 18px',
                borderRadius: 9,
                border: 'none',
                background: mode === m ? '#000' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-mid)',
                fontSize: 12.5, fontWeight: 800,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {m === 'query' ? '🔍 Query' : '✏️ Write'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Three columns ── */}
      <div className="gs-three-col" style={{
        padding: '0 24px 24px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── COL 1: Query builder (query mode) or Mutation builder (mutation mode) ── */}
        <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {mode === 'mutation' ? (
            <MutationBuilder
              operations={domain.mutations}
              onRun={(mutText, op) => {
                setActiveMutOp(op);
                runMutation(mutText);
              }}
              isRunning={mutRunning}
              isComplete={mutComplete}
              isError={mutError}
              onReset={mutReset}
            />
          ) : (
            <>
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
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', border: '1.5px solid #000' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', border: '1.5px solid #000' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', border: '1.5px solid #000' }} />
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#000', marginLeft: 4 }}>
                  {isQueryCustom ? 'custom.graphql' : 'query.graphql'}
                </span>
                {isQueryCustom && (
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    background: '#ede9fe', color: '#7c3aed',
                    border: '1px solid #7c3aed', borderRadius: 4,
                    padding: '1px 5px', marginLeft: 4,
                  }}>CUSTOM</span>
                )}
              </div>
              {isQueryCustom && !isRunning && !isComplete && (
                <button
                  onClick={() => setEditedQueryText(query)}
                  style={{
                    fontSize: 9.5, fontWeight: 800, color: '#7c3aed',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
                  }}
                >↺ Reset</button>
              )}
            </div>

            {/* Editable query textarea */}
            <div style={{
              border: isQueryCustom ? '2px solid #7c3aed' : 'none',
              transition: 'border-color 0.2s',
            }}>
              <textarea
                value={editedQueryText}
                onChange={e => setEditedQueryText(e.target.value)}
                disabled={isRunning || isComplete}
                spellCheck={false}
                style={{
                  width: '100%', display: 'block',
                  minHeight: 160,
                  padding: '16px 20px',
                  fontFamily: 'var(--font-mono)', fontSize: 12.5,
                  lineHeight: 1.9,
                  background: (isRunning || isComplete) ? '#f9fafb' : '#fff',
                  color: '#374151',
                  border: 'none', outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  cursor: (isRunning || isComplete) ? 'not-allowed' : 'text',
                }}
              />
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
                {domain.fields.map(f => (
                  <FieldPill
                    key={f.key}
                    label={f.key}
                    checked={!!fields[f.key]}
                    locked={f.locked}
                    color={f.color}
                    onToggle={f.locked ? undefined : () => toggleField(f.key)}
                  />
                ))}
              </div>

              {/* Insight tip — shows when the nested field is toggled off */}
              {(() => {
                const nestedField = domain.fields.find(f => f.nestedSelection);
                if (!nestedField) return null;
                return (
                  <AnimatePresence>
                    {!fields[nestedField.key] && (
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
                          💡 <strong>Watch the pipeline!</strong> {nestedField.key.charAt(0).toUpperCase() + nestedField.key.slice(1)} Resolver will be <em>skipped</em> — GraphQL only runs what you ask for.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })()}
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

            {/* ── Preset Queries Panel ── */}
            <PresetQueriesPanel
              presets={DOMAIN_PRESETS[domain.id] || DOMAIN_PRESETS.education}
              disabled={isRunning}
              onSelectPreset={(preset) => {
                if (isComplete || isError) {
                  reset();
                }
                setEditedQueryText(preset.query);
              }}
            />
          </>
          )}
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

          {!(mode === 'mutation' ? mutRunning : isRunning) && !(mode === 'mutation' ? mutComplete : isComplete) && (
            <p style={{
              fontSize: 12, color: 'var(--text-grey)',
              textAlign: 'center', padding: '16px 0', fontWeight: 600,
            }}>
              Hit <strong style={{ color: '#000' }}>{mode === 'mutation' ? 'Run Write' : 'Run Query'}</strong><br />to watch the pipeline light up
            </p>
          )}

          <PipelineVisualizer
            stepDialogues={STEP_DIALOGUES}
            activeStepId={mode === 'mutation' ? (mutComplete ? null : (mutSteps[mutSteps.length - 1]?.step ?? null)) : activeStepId}
            completedStepIds={mode === 'mutation'
              ? (mutComplete ? mutSteps.map(s => s.step) : mutSteps.slice(0, Math.max(0, mutSteps.length - 1)).map(s => s.step))
              : completedStepIds
            }
            isComplete={mode === 'mutation' ? mutComplete : isComplete}
            selectedStepId={selectedStepId}
            onStepClick={handleStepClick}
          />
        </div>

        {/* ── COL 3: Step explanation (query mode) or Data Diff (mutation mode) ── */}
        {mode === 'mutation' && activeMutOp ? (
          <DataDiffPanel
            operation={activeMutOp}
            before={(mutResult?.before as Record<string, string>[] | undefined) ?? []}
            after={(mutResult?.after as Record<string, string>[] | undefined) ?? []}
            isComplete={mutComplete}
            isError={mutError}
            errorMsg={mutErrorMsg ?? ''}
            success={mutResult?.success ?? false}
            message={mutResult?.message ?? ''}
          />
        ) : (
          <StepDialoguePanel
            dialogue={activeDialogue}
            isComplete={isComplete}
            responseData={responseData}
          />
        )}
      </div>

      {/* ── 3D Rocket Query Hop Traversal Visualizer ── */}
      <div style={{
        padding: '0 24px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        <Query3DExplorer />
      </div>

      {/* ── N+1 Problem & DataLoader Visualizer ── */}
      <div style={{
        padding: '0 24px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        <N1Visualizer />
      </div>

      {/* ── Timeline ── */}
      <div style={{
        padding: '0 24px 52px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        <ExecutionTimeline
          steps={mode === 'mutation' ? mutSteps : steps}
          activeIndex={mode === 'mutation' ? mutSteps.length : steps.length}
          caption={mode === 'mutation'
            ? (mutComplete ? 'Mutation complete! The database was updated and the diff is ready.' : (mutSteps[mutSteps.length - 1]?.caption ?? ''))
            : caption
          }
          isComplete={mode === 'mutation' ? mutComplete : isComplete}
          totalMs={(mode === 'mutation' ? mutSteps : steps).reduce((s, e) => s + e.ms, 0)}
        />
      </div>
    </div>
  );
}
