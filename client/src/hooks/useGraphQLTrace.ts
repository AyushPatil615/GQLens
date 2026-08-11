import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────
export interface EventStep {
  step:    string;
  ms:      number;
  caption: string;
}

type Phase = 'idle' | 'running' | 'complete' | 'error';

const TIMEOUT_MS = 10_000; // 10 s — if server never responds, show error

// ─── Hook ─────────────────────────────────────────────────────────────
export function useGraphQLTrace(query: string, domainId = 'education') {
  const [phase, setPhase]             = useState<Phase>('idle');
  const [steps, setSteps]             = useState<EventStep[]>([]);
  const [responseData, setResponseData] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const esRef                         = useRef<EventSource | null>(null);
  const timeoutRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always keep a fresh ref to the query so runQuery (memoized) sees latest value
  const queryRef = useRef(query);
  useEffect(() => { queryRef.current = query; }, [query]);

  const isRunning  = phase === 'running';
  const isComplete = phase === 'complete';
  const isError    = phase === 'error';

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setPhase('idle');
    setSteps([]);
    setResponseData(null);
    setErrorMsg(null);
  }, []);

  const runQuery = useCallback(async () => {
    if (isRunning) return;
    reset();

    const requestId = crypto.randomUUID();
    setPhase('running');
    setSteps([]);
    setResponseData(null);
    setErrorMsg(null);

    // ── Timeout watchdog ─────────────────────────────────────────────
    timeoutRef.current = setTimeout(() => {
      esRef.current?.close();
      esRef.current = null;
      setPhase('error');
      setErrorMsg('Server did not respond in time. Make sure the backend is running on port 4000.');
    }, TIMEOUT_MS);

    // 1. Open SSE connection BEFORE sending the query
    const es = new EventSource(`/events?requestId=${requestId}`);
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

        setSteps(prev => {
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
      setErrorMsg('Could not connect to the server. Is it running on port 4000?');
      es.close();
    };

    // Small delay to ensure SSE is ready before query fires
    await new Promise(resolve => setTimeout(resolve, 80));

    // 2. Send the actual GraphQL query and capture the response
    try {
      const res = await fetch('/graphql', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-request-id':  requestId,
          'x-domain-id':   domainId,
        },
        body: JSON.stringify({ query: queryRef.current }),
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
  }, [isRunning, reset]);

  return { steps, isRunning, isComplete, isError, errorMsg, responseData, runQuery, reset };
}
