import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────
export interface EventStep {
  step:    string;
  ms:      number;
  caption: string;
}

type Phase = 'idle' | 'running' | 'complete';

// ─── Hook ─────────────────────────────────────────────────────────────
export function useGraphQLTrace(query: string) {
  const [phase, setPhase]   = useState<Phase>('idle');
  const [steps, setSteps]   = useState<EventStep[]>([]);
  const esRef               = useRef<EventSource | null>(null);

  // Always keep a fresh ref to the query so runQuery (memoized) sees latest value
  const queryRef = useRef(query);
  useEffect(() => { queryRef.current = query; }, [query]);

  const isRunning  = phase === 'running';
  const isComplete = phase === 'complete';

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setPhase('idle');
    setSteps([]);
  }, []);

  const runQuery = useCallback(async () => {
    if (isRunning) return;
    reset();

    const requestId = crypto.randomUUID();
    setPhase('running');
    setSteps([]);

    // 1. Open SSE connection BEFORE sending the query
    const es = new EventSource(`/events?requestId=${requestId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as EventStep & { step: string };

        if (event.step === '__done__') {
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
      console.warn('[GraphScope] SSE connection error');
      es.close();
    };

    // Small delay to ensure SSE is ready before query fires
    await new Promise(resolve => setTimeout(resolve, 80));

    // 2. Send the actual GraphQL query (always uses latest query via ref)
    try {
      await fetch('/graphql', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-request-id':  requestId,
        },
        body: JSON.stringify({ query: queryRef.current }),
      });
    } catch (err) {
      console.error('[GraphScope] GraphQL request failed:', err);
      setPhase('idle');
      es.close();
    }
  }, [isRunning, reset]);

  return { steps, isRunning, isComplete, runQuery, reset };
}
