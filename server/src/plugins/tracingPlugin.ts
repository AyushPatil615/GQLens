import type { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { emitTrace, emitDone } from '../tracer';

// Root-level resolver fields we want to surface in the pipeline visualizer.
// Pattern: { Query/Mutation field name → step id that gets emitted }
const ROOT_RESOLVER_STEPS: Record<string, string> = {
  // Queries
  student: 'resolve:Student',
  patient: 'resolve:Patient',
  // Mutations
  enrollStudent:       'resolve:enrollStudent',
  unenrollStudent:     'resolve:unenrollStudent',
  scheduleAppointment: 'resolve:scheduleAppointment',
  cancelAppointment:   'resolve:cancelAppointment',
};

// Nested resolver fields we want to surface.
// Pattern: { Parent type → { field name → step id } }
const NESTED_RESOLVER_STEPS: Record<string, Record<string, string>> = {
  Student: { courses:       'resolve:courses'       },
  Patient: { appointments:  'resolve:appointments'  },
};

// Human-readable captions per step id (used for any domain).
const STEP_CAPTIONS: Record<string, string> = {
  'resolve:Student':      'Ran the Student resolver — a function that knows how to find student data.',
  'resolve:Patient':      'Ran the Patient resolver — a function that knows how to find patient data.',
  'resolve:courses':      'Ran the Courses resolver — fetching which classes this student is enrolled in.',
  'resolve:appointments': 'Ran the Appointments resolver — fetching this patient\'s scheduled appointments.',
  'resolve:enrollStudent':       'Ran the enrollStudent resolver — the function that writes a new enrollment row.',
  'resolve:unenrollStudent':     'Ran the unenrollStudent resolver — the function that removes the enrollment row.',
  'resolve:scheduleAppointment': 'Ran the scheduleAppointment resolver — inserts a new appointment into the database.',
  'resolve:cancelAppointment':   'Ran the cancelAppointment resolver — removes the appointment from the database.',
};

export function createTracingPlugin(): ApolloServerPlugin {
  return {
    async requestDidStart(reqCtx: GraphQLRequestContext<{ requestId?: string }>) {
      const requestId = (reqCtx.request.http?.headers.get('x-request-id')) ?? '';
      if (!requestId) return {};

      const requestStart = Date.now();

      return {
        // ── Parse ──────────────────────────────────────────────────
        async parsingDidStart() {
          const t = Date.now();
          return async () => {
            emitTrace(requestId, {
              step:    'parse',
              ms:      Date.now() - t,
              caption: 'GraphQL read your query text and converted it into a structured tree (AST).',
              ts:      t,
            });
          };
        },

        // ── Validate ────────────────────────────────────────────────
        async validationDidStart() {
          const t = Date.now();
          return async () => {
            emitTrace(requestId, {
              step:    'validate',
              ms:      Date.now() - t,
              caption: 'Checked that every field in your query actually exists in the schema.',
              ts:      t,
            });
          };
        },

        // ── Execution ───────────────────────────────────────────────
        async executionDidStart() {
          return {
            willResolveField({ info }) {
              const typeName  = info.parentType.name;
              const fieldName = info.fieldName;
              const t = Date.now();

              return () => {
                // Root query or mutation resolver
                if (typeName === 'Query' || typeName === 'Mutation') {
                  const stepId = ROOT_RESOLVER_STEPS[fieldName];
                  if (stepId) {
                    emitTrace(requestId, {
                      step:    stepId,
                      ms:      Date.now() - t,
                      caption: STEP_CAPTIONS[stepId] ?? `Ran the ${fieldName} resolver.`,
                      ts:      t,
                    });
                  }
                }

                // Nested resolver (courses on Student, appointments on Patient, …)
                const nestedByType = NESTED_RESOLVER_STEPS[typeName];
                if (nestedByType) {
                  const stepId = nestedByType[fieldName];
                  if (stepId) {
                    emitTrace(requestId, {
                      step:    stepId,
                      ms:      Date.now() - t,
                      caption: STEP_CAPTIONS[stepId] ?? `Ran the ${fieldName} nested resolver.`,
                      ts:      t,
                    });
                  }
                }
              };
            },
          };
        },

        // ── Response ────────────────────────────────────────────────
        async willSendResponse() {
          emitTrace(requestId, {
            step:    'respond',
            ms:      Date.now() - requestStart,
            caption: 'All done! Building the JSON response to send back to your app.',
            ts:      Date.now(),
          });
          emitDone(requestId);
        },
      };
    },
  };
}
