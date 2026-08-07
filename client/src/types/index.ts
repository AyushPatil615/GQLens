// ─── GraphScope Shared Types ───────────────────────────────────────
// These types are used across components for the event log and step system

export type StepId =
  | 'parse'
  | 'validate'
  | 'resolve:Student'
  | 'resolve:courses'
  | 'resolve:teacher'
  | 'db:query'
  | 'respond';

export interface EventStep {
  step: StepId | string;
  ms: number;
  caption: string;
}

export interface PipelineNode {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
}

export type AppPhase =
  | 'intro'        // "Feel the pain" — REST waterfall
  | 'contrast'     // GraphQL vs REST contrast
  | 'builder'      // Progressive query builder
  | 'pipeline'     // Narrated pipeline execution
  | 'compare';     // Timeline comparison
