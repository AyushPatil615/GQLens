import { queries, StudentRow, CourseRow } from '../db/database';
import { emitTrace } from '../tracer';

// ─── Context type ────────────────────────────────────────────────────
export interface AppContext {
  requestId: string;
}

// ─── Resolvers ───────────────────────────────────────────────────────
export const resolvers = {
  Query: {
    student(_: unknown, args: { id: string }, ctx: AppContext): StudentRow | undefined {
      // Emit DB query event with simulated latency window
      const t = Date.now();
      const row = queries.getStudent.get(args.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `Looking up student id="${args.id}" in the database.`,
        ts:      t,
      });
      return row;
    },

    students(_: unknown, __: unknown, ctx: AppContext): StudentRow[] {
      const t = Date.now();
      const rows = queries.getAllStudents.all();
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: 'Fetching all students from the database.',
        ts:      t,
      });
      return rows;
    },
  },

  Student: {
    // Resolve the nested courses field
    courses(parent: StudentRow, _: unknown, ctx: AppContext): CourseRow[] {
      const t = Date.now();
      const rows = queries.getCoursesForStudent.all(parent.id);
      // Note: the db:query event for courses is emitted here,
      // and the resolve:courses event is emitted by the tracing plugin.
      // We emit a separate inner-db event so the timeline is accurate.
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `Looking up courses for student id="${parent.id}".`,
        ts:      t,
      });
      return rows;
    },
  },
};
