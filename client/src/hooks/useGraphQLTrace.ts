import { useState, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────
export interface EventStep {
  step:    string;
  ms:      number;
  caption: string;
}

const GRAPHQL_QUERY = `
  query {
    student(id: "1") {
      name
      age
      courses {
        title
      }
    }
  }
`.trim();

type Phase = 'idle' | 'running' | 'complete';

// ─── Hook ─────────────────────────────────────────────────────────────
export function useGraphQLTrace() {
  const [phase, setPhase]   = useState<Phase>('idle');
  const [steps, setSteps]   = useState<EventStep[]>([]);
  const esRef               = useRef<EventSource | null>(null);

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
          // All events received — mark complete
          setPhase('complete');
          es.close();
          esRef.current = null;
          return;
        }

        setSteps(prev => {
          // Deduplicate: if the same step already appeared, update it
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

    // Small delay to ensure SSE connection is established before query fires
    await new Promise(resolve => setTimeout(resolve, 80));

    // 2. Send the actual GraphQL query
    try {
      await fetch('/graphql', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-request-id':  requestId,
        },
        body: JSON.stringify({ query: GRAPHQL_QUERY }),
      });
    } catch (err) {
      console.error('[GraphScope] GraphQL request failed:', err);
      setPhase('idle');
      es.close();
    }
  }, [isRunning, reset]);

  return { steps, isRunning, isComplete, runQuery, reset };
}
