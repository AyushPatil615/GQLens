import { useState, useRef, useCallback } from 'react';
import type { EventStep } from './useGraphQLTrace';
import { getApiBaseUrl } from '../config/api';

// ─── Snapshot row types (mirror server return types) ─────────────────────────
export interface EnrollmentSnapshot {
  studentId:   string;
  courseId:    string;
  studentName: string;
  courseName:  string;
}

export interface AppointmentSnapshot {
  id:          string;
  patientId:   string;
  doctorId:    string;
  date:        string;
  patientName: string;
  doctorName:  string;
}

export type SnapshotRow = Record<string, string>;

export interface MutationResult {
  success:  boolean;
  message:  string;
  before:   SnapshotRow[];
  after:    SnapshotRow[];
}

type Phase = 'idle' | 'running' | 'complete' | 'error';

const TIMEOUT_MS = 30_000; // 30s to allow for Render free tier wakeups

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMutationTrace(domainId = 'education') {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [steps, setSteps]         = useState<EventStep[]>([]);
  const [result, setResult]       = useState<MutationResult | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const esRef                     = useRef<EventSource | null>(null);
  const timeoutRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep the current mutation string in a ref so runMutation closure stays stable
  const mutationRef               = useRef<string>('');

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
    setResult(null);
    setErrorMsg(null);
  }, []);

  const runMutation = useCallback(async (mutationText: string) => {
    if (isRunning) return;
    reset();

    mutationRef.current = mutationText;

    const requestId = crypto.randomUUID();
    const baseUrl = getApiBaseUrl();
    setPhase('running');
    setSteps([]);
    setResult(null);
    setErrorMsg(null);

    // ── Timeout watchdog ──────────────────────────────────────────────
    timeoutRef.current = setTimeout(() => {
      esRef.current?.close();
      esRef.current = null;
      setPhase('error');
      setErrorMsg('Server did not respond in time.');
    }, TIMEOUT_MS);

    // 1. Open SSE connection BEFORE sending the mutation
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
      console.warn('[GQLens] SSE connection error');
      setPhase('error');
      setErrorMsg('Could not connect to the server.');
      es.close();
    };

    // Small delay so SSE is ready before mutation fires
    await new Promise(resolve => setTimeout(resolve, 80));

    // 2. Send the GraphQL mutation
    try {
      const res = await fetch(`${baseUrl}/graphql`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-request-id':  requestId,
          'x-domain-id':   domainId,
        },
        body: JSON.stringify({ query: mutationRef.current }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      }

      const json = await res.json();

      if (json.errors?.length) {
        throw new Error(json.errors[0].message);
      }

      // Extract the mutation payload (first key under data)
      const data = json.data ?? {};
      const mutationKey = Object.keys(data)[0];
      const payload = mutationKey ? data[mutationKey] : null;
      setResult(payload ?? null);

    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[GQLens] Mutation request failed:', msg);
      setPhase('error');
      setErrorMsg(`Failed: ${msg}`);
      es.close();
    }
  }, [isRunning, reset, domainId]);

  return { steps, isRunning, isComplete, isError, errorMsg, result, runMutation, reset };
}
