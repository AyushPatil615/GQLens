import { Response } from 'express';

// ─── SSE Client Registry ────────────────────────────────────────────
// Maps requestId → Express Response (SSE long-lived connection)
const clients = new Map<string, Response>();

export function registerClient(requestId: string, res: Response): void {
  clients.set(requestId, res);
}

export function removeClient(requestId: string): void {
  clients.delete(requestId);
}

// ─── Emit an event to a specific client ────────────────────────────
export interface ResolveInfoSnapshot {
  fieldName:      string;
  returnType:     string;
  parentType:     string;
  path:           unknown;
  selectedFields: string[];
  argKeys:        string[];
}

export interface TraceEvent {
  step:    string;   // e.g. 'parse', 'validate', 'resolver:info', 'db:query', 'respond'
  ms:      number;   // duration of this step in ms
  caption: string;   // human-readable description
  ts:      number;   // absolute timestamp (ms since epoch)
  info?:   ResolveInfoSnapshot; // present only for resolver:info events
}

export function emitTrace(requestId: string, event: TraceEvent): void {
  const res = clients.get(requestId);
  if (!res) return;
  try {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch {
    // client disconnected mid-stream — ignore
    clients.delete(requestId);
  }
}

// ─── Signal that the query is fully complete ────────────────────────
export function emitDone(requestId: string): void {
  const res = clients.get(requestId);
  if (!res) return;
  try {
    res.write(`data: ${JSON.stringify({ step: '__done__', ms: 0, caption: '', ts: Date.now() })}\n\n`);
  } catch {
    clients.delete(requestId);
  }
}
