import { useState, useRef, useCallback, useEffect } from 'react';
import { getApiBaseUrl } from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────
export interface EventStep {
  step:    string;
  ms:      number;
  caption: string;
}

type Phase = 'idle' | 'running' | 'complete' | 'error';

const TIMEOUT_MS = 30_000; // 30s — allows for Render cloud backend wakeups

// ─── Hook ─────────────────────────────────────────────────────────────
export function useGraphQLTrace(query: string, domainId = 'education') {
  const [phase, setPhase]               = useState<Phase>('idle');
  const [allSteps, setAllSteps]         = useState<EventStep[]>([]);
  const [responseData, setResponseData] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  // ── Step Debugger state ──────────────────────────────────────────────
  const [debuggerMode, setDebuggerMode]         = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 = not started
  const [isPaused, setIsPaused]                 = useState(false);
  const [playbackSpeed, setPlaybackSpeed]       = useState<0.5 | 1 | 2>(1);

  // Auto-play interval ref
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const esRef      = useRef<EventSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always keep a fresh ref to the query so runQuery (memoized) sees latest value
  const queryRef = useRef(query);
  useEffect(() => { queryRef.current = query; }, [query]);

  const isRunning  = phase === 'running';
  const isComplete = phase === 'complete';
  const isError    = phase === 'error';

  // ── Derived: visible steps based on debugger mode ────────────────────
  const steps: EventStep[] = debuggerMode
    ? allSteps.slice(0, currentStepIndex + 1)
    : allSteps;

  const debuggerIsAtEnd = debuggerMode && currentStepIndex >= allSteps.length - 1;

  // ── Auto-play logic ──────────────────────────────────────────────────
  function clearAutoPlay() {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }

  function startAutoPlay() {
    clearAutoPlay();
    const intervalMs = Math.round(700 / playbackSpeed);
    autoPlayRef.current = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= allSteps.length - 1) {
          clearAutoPlay();
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
  }

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    clearAutoPlay();
    setPhase('idle');
    setAllSteps([]);
    setResponseData(null);
    setErrorMsg(null);
    setCurrentStepIndex(-1);
    setIsPaused(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debugger controls ────────────────────────────────────────────────
  const stepNext = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(prev + 1, allSteps.length - 1));
  }, [allSteps.length]);

  const stepPrev = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    clearAutoPlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    startAutoPlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSteps.length, playbackSpeed]);

  const jumpToStep = useCallback((index: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(index, allSteps.length - 1)));
  }, [allSteps.length]);

  // When all steps are loaded and debugger mode is on, start auto-play from step 0
  useEffect(() => {
    if (debuggerMode && phase === 'complete' && allSteps.length > 0 && currentStepIndex === -1) {
      setCurrentStepIndex(0);
      if (!isPaused) startAutoPlay();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, allSteps.length, debuggerMode]);

  // Cleanup on unmount
  useEffect(() => () => clearAutoPlay(), []);

  const runQuery = useCallback(async (overrideQuery?: string) => {
    if (isRunning) return;
    reset();

    const requestId = crypto.randomUUID();
    setPhase('running');
    setAllSteps([]);
    setResponseData(null);
    setErrorMsg(null);
    setCurrentStepIndex(-1);

    // ── Timeout watchdog ─────────────────────────────────────────────
    timeoutRef.current = setTimeout(() => {
      esRef.current?.close();
      esRef.current = null;
      setPhase('error');
      setErrorMsg('Server did not respond in time. Make sure the backend is running on port 4000.');
    }, TIMEOUT_MS);

    const baseUrl = getApiBaseUrl();

    // 1. Open SSE connection BEFORE sending the query
    const es = new EventSource(`${baseUrl}/events?requestId=${requestId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as EventStep & { step: string };

        if (event.step === '__done__') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPhase('complete');
          es.close();
          esRef.current = null;
          return;
        }

        setAllSteps(prev => {
          const exists = prev.findIndex(s => s.step === event.step);
          if (exists >= 0) {
            const next = [...prev];
            next[exists] = event;
            return next;
          }
          return [...prev, event];
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      console.warn('[GraphScope] SSE connection error');
      setPhase('error');
      setErrorMsg('Could not connect to the server.');
      es.close();
    };

    // Small delay to ensure SSE is ready before query fires
    await new Promise(resolve => setTimeout(resolve, 80));

    // 2. Send the actual GraphQL query and capture the response
    try {
      const res = await fetch(`${baseUrl}/graphql`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-request-id':  requestId,
          'x-domain-id':   domainId,
        },
        body: JSON.stringify({ query: overrideQuery ?? queryRef.current }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      }

      const json = await res.json();
      // Store the actual data payload (not errors wrapper)
      setResponseData(json.data ?? json);

    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[GraphScope] GraphQL request failed:', msg);
      setPhase('error');
      setErrorMsg(`Failed to reach the server: ${msg}`);
      es.close();
    }
  }, [isRunning, reset, domainId]);

  return {
    // Core trace
    steps,
    allSteps,
    isRunning, isComplete, isError,
    errorMsg, responseData,
    runQuery, reset,
    // Debugger
    debuggerMode, setDebuggerMode,
    currentStepIndex, setCurrentStepIndex,
    isPaused, playbackSpeed, setPlaybackSpeed,
    debuggerIsAtEnd,
    stepNext, stepPrev, pause, resume, jumpToStep,
  };
}
