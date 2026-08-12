import {
  educationQueries, healthcareQueries,
  educationMutations, healthcareMutations,
} from '../db/database';
import type {
  StudentRow, CourseRow, PatientRow, AppointmentRow, DoctorRow,
  EnrollmentSnapshot, AppointmentSnapshot,
} from '../db/database';
import { emitTrace } from '../tracer';

// ─── Context type ────────────────────────────────────────────────────
export interface AppContext {
  requestId: string;
}

// ─── Resolvers ───────────────────────────────────────────────────────
export const resolvers = {
  // ── Education queries ────────────────────────────────────────────
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

    // ── Healthcare queries ─────────────────────────────────────────
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

  // ── Mutations ────────────────────────────────────────────────────
  Mutation: {
    enrollStudent(
      _: unknown,
      args: { studentId: string; courseId: string },
      ctx: AppContext,
    ) {
      const before: EnrollmentSnapshot[] = educationMutations.getEnrollmentSnapshot.all(args.studentId);
      const t = Date.now();
      educationMutations.enroll.run(args.studentId, args.courseId);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `INSERT INTO enrollments (student_id, course_id) VALUES ('${args.studentId}', '${args.courseId}')`,
        ts:      t,
      });
      const after: EnrollmentSnapshot[] = educationMutations.getEnrollmentSnapshot.all(args.studentId);
      return { success: true, message: 'Student enrolled successfully.', before, after };
    },

    unenrollStudent(
      _: unknown,
      args: { studentId: string; courseId: string },
      ctx: AppContext,
    ) {
      const before: EnrollmentSnapshot[] = educationMutations.getEnrollmentSnapshot.all(args.studentId);
      const t = Date.now();
      educationMutations.unenroll.run(args.studentId, args.courseId);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `DELETE FROM enrollments WHERE student_id='${args.studentId}' AND course_id='${args.courseId}'`,
        ts:      t,
      });
      const after: EnrollmentSnapshot[] = educationMutations.getEnrollmentSnapshot.all(args.studentId);
      return { success: true, message: 'Student unenrolled successfully.', before, after };
    },

    scheduleAppointment(
      _: unknown,
      args: { patientId: string; doctorId: string; date: string },
      ctx: AppContext,
    ) {
      const before: AppointmentSnapshot[] = healthcareMutations.getAppointmentSnapshot.all(args.patientId);
      const t = Date.now();
      healthcareMutations.scheduleAppointment.run(args.patientId, args.doctorId, args.date);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `INSERT INTO appointments (patient_id='${args.patientId}', doctor_id='${args.doctorId}', date='${args.date}')`,
        ts:      t,
      });
      const after: AppointmentSnapshot[] = healthcareMutations.getAppointmentSnapshot.all(args.patientId);
      return { success: true, message: 'Appointment scheduled successfully.', before, after };
    },

    cancelAppointment(
      _: unknown,
      args: { appointmentId: string },
      ctx: AppContext,
    ) {
      // Need patient_id BEFORE deleting to fetch after-snapshot
      const existing = healthcareMutations.getAppointmentPatientId.get(args.appointmentId);
      if (!existing) return { success: false, message: 'Appointment not found.', before: [], after: [] };

      const before: AppointmentSnapshot[] = healthcareMutations.getAppointmentSnapshot.all(existing.patient_id);
      const t = Date.now();
      healthcareMutations.cancelAppointment.run(args.appointmentId);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `DELETE FROM appointments WHERE id='${args.appointmentId}'`,
        ts:      t,
      });
      const after: AppointmentSnapshot[] = healthcareMutations.getAppointmentSnapshot.all(existing.patient_id);
      return { success: true, message: 'Appointment cancelled.', before, after };
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
