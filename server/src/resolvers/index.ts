import { educationQueries, healthcareQueries } from '../db/database';
import type { StudentRow, CourseRow, PatientRow, AppointmentRow, DoctorRow } from '../db/database';
import { emitTrace } from '../tracer';

// ─── Context type ────────────────────────────────────────────────────
export interface AppContext {
  requestId: string;
}

// ─── Resolvers ───────────────────────────────────────────────────────
export const resolvers = {
  // ── Education ───────────────────────────────────────────────────
  Query: {
    student(_: unknown, args: { id: string }, ctx: AppContext): StudentRow | undefined {
      const t = Date.now();
      const row = educationQueries.getStudent.get(args.id);
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
      const rows = educationQueries.getAllStudents.all();
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: 'Fetching all students from the database.',
        ts:      t,
      });
      return rows;
    },

    // ── Healthcare ────────────────────────────────────────────────
    patient(_: unknown, args: { id: string }, ctx: AppContext): PatientRow | undefined {
      const t = Date.now();
      const row = healthcareQueries.getPatient.get(args.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `Looking up patient id="${args.id}" in the database.`,
        ts:      t,
      });
      return row;
    },

    patients(_: unknown, __: unknown, ctx: AppContext): PatientRow[] {
      const t = Date.now();
      const rows = healthcareQueries.getAllPatients.all();
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: 'Fetching all patients from the database.',
        ts:      t,
      });
      return rows;
    },
  },

  // ── Education nested resolvers ───────────────────────────────────
  Student: {
    courses(parent: StudentRow, _: unknown, ctx: AppContext): CourseRow[] {
      const t = Date.now();
      const rows = educationQueries.getCoursesForStudent.all(parent.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `Looking up courses for student id="${parent.id}".`,
        ts:      t,
      });
      return rows;
    },
  },

  // ── Healthcare nested resolvers ──────────────────────────────────
  Patient: {
    appointments(parent: PatientRow, _: unknown, ctx: AppContext): AppointmentRow[] {
      const t = Date.now();
      const rows = healthcareQueries.getAppointmentsForPatient.all(parent.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `Looking up appointments for patient id="${parent.id}".`,
        ts:      t,
      });
      return rows;
    },
  },

  Appointment: {
    doctor(parent: AppointmentRow): DoctorRow | undefined {
      return healthcareQueries.getDoctor.get(parent.doctor_id);
    },
  },
};
