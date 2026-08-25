import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bug, Play, ChevronDown } from 'lucide-react';
import { useGraphQLTrace } from '../../hooks/useGraphQLTrace';
import { useSound } from '../../context/SoundContext';
import { StepList }           from './StepList';
import { StepDetail }         from './StepDetail';
import { DebuggerControls }   from './DebuggerControls';

// ── Preset queries ────────────────────────────────────────────────────────────
const PRESETS = [
  {
    id:    'students',
    label: 'List Students',
    icon:  '👥',
    desc:  'Basic query — shows parse, validate, auth context, DB query, respond',
    query: `{
  students {
    id
    name
    age
  }
}`,
  },
  {
    id:    'nested',
    label: 'Nested Query',
    icon:  '🔗',
    desc:  'Nested fields — shows resolver:info and multiple DB queries',
    query: `{
  student(id: "1") {
    name
    courses {
      title
    }
  }
}`,
  },
  {
    id:    'auth',
    label: 'Auth Check',
    icon:  '🔐',
    desc:  'Protected field — shows auth context read and rejection',
    query: `{
  me {
    id
    name
    role
  }
}`,
  },
  {
    id:    'mutation',
    label: 'Login Mutation',
    icon:  '🔑',
    desc:  'Mutation — shows auth:login and auth:token:issued steps',
    query: `mutation {
  login(username: "alice", password: "admin123") {
    token
    user {
      name
      role
    }
  }
}`,
  },
  {
    id:    'n1',
    label: 'N+1 Problem',
    icon:  '💸',
    desc:  'N+1 mode — watch individual DB queries fire per student',
    query: `{
  studentsN1 {
    id
    name
    courses {
      title
    }
  }
}`,
  },
] as const;

type PresetId = typeof PRESETS[number]['id'];

// ── Component ─────────────────────────────────────────────────────────────────
export function StepDebugger() {
  const [presetId,     setPresetId]     = useState<PresetId>('students');
  const [showPresets,  setShowPresets]  = useState(false);

  const { playSound } = useSound();
  const preset = PRESETS.find(p => p.id === presetId)!;

  const trace = useGraphQLTrace(preset.query, 'education');
  const {
    allSteps, isRunning, isComplete, isError, errorMsg,
    runQuery, reset,
    setDebuggerMode,
    currentStepIndex,
    isPaused, playbackSpeed, setPlaybackSpeed,
    debuggerIsAtEnd,
    stepNext, stepPrev, pause, resume, jumpToStep,
  } = trace;

  const currentStep = allSteps[currentStepIndex] ?? null;

  // Sound effect on query completion or error
  const prevCompleteRef = useRef(false);
  useEffect(() => {
    if (isComplete && !prevCompleteRef.current) {
      playSound('complete');
    }
    prevCompleteRef.current = isComplete;
  }, [isComplete, playSound]);

  useEffect(() => {
    if (isError) {
      playSound('error');
    }
  }, [isError, playSound]);

  function handleExecute() {
    playSound('execute');
    setDebuggerMode(true);
    runQuery();
  }

  function handleRestart() {
    playSound('reset');
    reset();
  }

  function handlePresetSelect(id: PresetId) {
    playSound('toggle');
    setPresetId(id);
    setShowPresets(false);
    reset();
  }

  function handleJumpEnd() {
    playSound('step');
    jumpToStep(allSteps.length - 1);
  }

  function handleStepNext() {
    playSound('step');
    stepNext();
  }

  function handleStepPrev() {
    playSound('step');
    stepPrev();
  }

  function handleJumpToStep(idx: number) {
    playSound('step');
    jumpToStep(idx);
  }

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           16,
      fontFamily:    'var(--font-sans)',
    }}>

      {/* ── Header ── */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         12,
        flexWrap:    'wrap',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '2px 2px 0 #374151',
        }}>
          <Bug size={19} color="#fff" strokeWidth={2} />
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#000', margin: 0 }}>
            GraphQL Step Debugger
          </h2>
          <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, margin: 0 }}>
            Execute a query and step through every stage of GraphQL execution
          </p>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Preset selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPresets(v => !v)}
              style={{
                display:     'flex', alignItems: 'center', gap: 6,
                padding:     '8px 12px',
                border:      '2px solid #000',
                borderRadius: 10,
                background:  '#FFF',
                cursor:      'pointer',
                fontSize:    12, fontWeight: 800,
                boxShadow:   '2px 2px 0 #000',
                fontFamily:  'var(--font-sans)',
              }}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
              <ChevronDown size={12} strokeWidth={2.5} />
            </button>

            {showPresets && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position:  'absolute',
                  top:       'calc(100% + 6px)',
                  right:     0,
                  zIndex:    50,
                  background: '#FFF',
                  border:    '2.5px solid #000',
                  borderRadius: 12,
                  boxShadow: '5px 5px 0 #000',
                  minWidth:  240,
                  overflow:  'hidden',
                }}
              >
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id)}
                    style={{
                      display:       'flex', flexDirection: 'column',
                      alignItems:    'flex-start',
                      width:         '100%',
                      padding:       '10px 14px',
                      border:        'none',
                      borderBottom:  '1px solid #F3F4F6',
                      background:    p.id === presetId ? '#F9FAFB' : '#FFF',
                      cursor:        'pointer',
                      fontFamily:    'var(--font-sans)',
                      textAlign:     'left',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#000' }}>
                      {p.icon} {p.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>
                      {p.desc}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Execute button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={isRunning ? undefined : handleExecute}
            disabled={isRunning}
            style={{
              display:     'flex', alignItems: 'center', gap: 6,
              padding:     '8px 16px',
              border:      '2px solid #000',
              borderRadius: 10,
              background:  isRunning ? '#9CA3AF' : '#000',
              color:       '#FFF',
              cursor:      isRunning ? 'not-allowed' : 'pointer',
              fontSize:    12, fontWeight: 900,
              boxShadow:   isRunning ? 'none' : '3px 3px 0 #374151',
              fontFamily:  'var(--font-sans)',
            }}
          >
            {isRunning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }}
                />
                Running…
              </>
            ) : (
              <>
                <Play size={13} strokeWidth={2.5} />
                Execute
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Query preview ── */}
      <div style={{
        background:   '#1E1E1E',
        border:       '2px solid #000',
        borderRadius: 10,
        padding:      '10px 14px',
        boxShadow:    '3px 3px 0 #000',
      }}>
        <pre style={{
          margin: 0, fontSize: 11.5,
          color: '#E5E7EB', fontFamily: 'var(--font-mono)',
          lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {preset.query}
        </pre>
      </div>

      {/* Error */}
      {isError && errorMsg && (
        <div style={{
          padding: '10px 14px', background: '#FEE2E2',
          border: '2px solid #B91C1C', borderRadius: 10,
          fontSize: 12, fontWeight: 700, color: '#B91C1C',
        }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* ── Main debugger layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: 14,
        alignItems: 'flex-start',
      }}>
        {/* Left: step list */}
        <div style={{
          background:   '#FFF',
          border:       '2.5px solid #000',
          borderRadius: 14,
          padding:      12,
          boxShadow:    '4px 4px 0 #000',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 900, color: '#9CA3AF',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 8,
          }}>
            Execution Steps
          </div>
          <StepList
            allSteps={allSteps}
            currentIndex={currentStepIndex}
            isComplete={isComplete}
            onStepClick={handleJumpToStep}
          />
        </div>

        {/* Right: detail */}
        <StepDetail
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={allSteps.length}
        />
      </div>

      {/* ── Controls ── */}
      <DebuggerControls
        currentIndex={currentStepIndex}
        totalSteps={allSteps.length}
        isPaused={isPaused}
        isComplete={isComplete}
        isRunning={isRunning}
        debuggerIsAtEnd={debuggerIsAtEnd}
        playbackSpeed={playbackSpeed}
        onPrev={handleStepPrev}
        onNext={handleStepNext}
        onPlay={resume}
        onPause={pause}
        onRestart={handleRestart}
        onJumpEnd={handleJumpEnd}
        onSpeedChange={setPlaybackSpeed}
      />
    </div>
  );
}
