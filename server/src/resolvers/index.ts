import {
  educationQueries, healthcareQueries,
  educationMutations, healthcareMutations,
} from '../db/database';
import type {
  StudentRow, CourseRow, PatientRow, AppointmentRow, DoctorRow,
  EnrollmentSnapshot, AppointmentSnapshot, CourseWithStudentId,
} from '../db/database';
import { emitTrace } from '../tracer';
import { issueToken } from '../auth/jwt';
import type { GraphQLResolveInfo } from 'graphql';

// ─── Context type ────────────────────────────────────────────────────
export interface AuthUser {
  id:   string;
  name: string;
  role: 'ADMIN' | 'VIEWER';
}

export interface AppContext {
  requestId: string;
  dataLoaderEnabled: boolean;
  user: AuthUser | null; // null = unauthenticated
}

// ─── Demo users (hardcoded for the auth learning demo) ───────────────
const DEMO_USERS: Record<string, { id: string; name: string; role: 'ADMIN' | 'VIEWER'; password: string }> = {
  alice:   { id: 'u1', name: 'Alice (Admin)',  role: 'ADMIN',  password: 'admin123' },
  bob:     { id: 'u2', name: 'Bob (Viewer)',   role: 'VIEWER', password: 'view123'  },
  charlie: { id: 'u3', name: 'Charlie (Guest)',role: 'VIEWER', password: 'guest123' },
};

// ─── Resolvers ───────────────────────────────────────────────────────
export const resolvers = {
  // ── Education queries ────────────────────────────────────────────
  Query: {
    // ── Auth demo: me query ─────────────────────────────────────────
    async me(_: unknown, __: unknown, ctx: AppContext) {
      emitTrace(ctx.requestId, {
        step:    'auth:context:read',
        ms:      0,
        caption: ctx.user
          ? `✅ context.user = { id: "${ctx.user.id}", name: "${ctx.user.name}", role: "${ctx.user.role}" } — resolved from Authorization header.`
          : '❌ context.user = null — no valid Authorization: Bearer token found in request headers.',
        ts:      Date.now(),
      });
      if (!ctx.user) throw new Error('Unauthenticated: provide an Authorization: Bearer <token> header.');
      return ctx.user;
    },

    async student(_: unknown, args: { id: string }, ctx: AppContext, info: GraphQLResolveInfo): Promise<StudentRow | undefined> {
      const t = Date.now();
      const row = await educationQueries.getStudent(args.id);

      // Capture GraphQLResolveInfo fields for the inspector demo
      type FieldNode = import('graphql').FieldNode;
      const selectedFields = (info.fieldNodes[0]?.selectionSet?.selections ?? [])
        .filter((s): s is FieldNode => s.kind === 'Field')
        .map(s => s.name.value);

      emitTrace(ctx.requestId, {
        step:    'resolver:info',
        ms:      Date.now() - t,
        caption: `resolver:info captured for field "${info.fieldName}"`,
        ts:      t,
        info: {
          fieldName:      info.fieldName,
          returnType:     String(info.returnType),
          parentType:     String(info.parentType),
          path:           info.path,
          selectedFields,
          argKeys:        Object.keys(info.variableValues),
        },
      });

      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `Looking up student id="${args.id}" in the database.`,
        ts:      t,
      });
      return row;
    },

    async students(_: unknown, __: unknown, ctx: AppContext): Promise<StudentRow[]> {
      const t = Date.now();
      const rows = await educationQueries.getAllStudents();
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: 'Fetching all students from the database.',
        ts:      t,
      });
      return rows;
    },

    // ── N+1 Demo query ─────────────────────────────────────────────
    async studentsWithCourses(
      _: unknown,
      args: { useDataLoader?: boolean },
      ctx: AppContext,
    ) {
      // Use arg if provided, otherwise fall back to context flag
      const useBatch = args.useDataLoader ?? ctx.dataLoaderEnabled;

      // Step 1 — always fetch all students first
      const t0 = Date.now();
      const students = await educationQueries.getAllStudents();
      emitTrace(ctx.requestId, {
        step:    'db:query:students',
        ms:      Date.now() - t0,
        caption: `SELECT * FROM students  →  ${students.length} rows returned`,
        ts:      t0,
      });

      if (useBatch) {
        // ── DataLoader path: ONE batched query for all courses ──────
        const studentIds = students.map(s => s.id);
        const t1 = Date.now();
        const allCourseRows: CourseWithStudentId[] =
          await educationQueries.getBatchedCoursesForStudents(studentIds);
        emitTrace(ctx.requestId, {
          step:    'db:query:batched',
          ms:      Date.now() - t1,
          caption: `SELECT courses WHERE student_id IN (${studentIds.map(id => `'${id}'`).join(', ')})  →  ${allCourseRows.length} rows (all students, 1 query)`,
          ts:      t1,
        });

        // Group courses by student_id
        const courseMap = new Map<string, CourseRow[]>();
        for (const row of allCourseRows) {
          const arr = courseMap.get(row.student_id) ?? [];
          arr.push({ id: row.id, title: row.title, instructor: row.instructor });
          courseMap.set(row.student_id, arr);
        }
        return students.map(s => ({
          id:      s.id,
          name:    s.name,
          courses: courseMap.get(s.id) ?? [],
        }));
      } else {
        // ── N+1 path: one query PER student ─────────────────────────
        const result = [];
        for (let idx = 0; idx < students.length; idx++) {
          const s = students[idx];
          const t = Date.now();
          const courses = await educationQueries.getCoursesForStudent(s.id);
          emitTrace(ctx.requestId, {
            step:    `db:query:n1:${idx + 1}`,
            ms:      Date.now() - t,
            caption: `SELECT courses WHERE student_id = '${s.id}' (for "${s.name}")  →  ${courses.length} rows`,
            ts:      t,
          });
          result.push({ id: s.id, name: s.name, courses });
        }
        return result;
      }
    },

    // ── Healthcare queries ─────────────────────────────────────────
    async patient(_: unknown, args: { id: string }, ctx: AppContext): Promise<PatientRow | undefined> {
      const t = Date.now();
      const row = await healthcareQueries.getPatient(args.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `Looking up patient id="${args.id}" in the database.`,
        ts:      t,
      });
      return row;
    },

    async patients(_: unknown, __: unknown, ctx: AppContext): Promise<PatientRow[]> {
      const t = Date.now();
      const rows = await healthcareQueries.getAllPatients();
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: 'Fetching all patients from the database.',
        ts:      t,
      });
      return rows;
    },

    // ── Null Propagation Demo resolvers ─────────────────────────────
    async studentNullable(
      _: unknown,
      args: { id: string; failAge?: boolean },
      ctx: AppContext,
    ) {
      const t = Date.now();
      const row = await educationQueries.getStudent(args.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `[Null Demo] Looking up student id="${args.id}" — age field is nullable (Int).`,
        ts:      t,
      });
      if (!row) return null;
      // Return parent object; age resolver will run separately
      return { ...row, _failAge: args.failAge ?? false };
    },

    async studentNonNull(
      _: unknown,
      args: { id: string; failAge?: boolean },
      ctx: AppContext,
    ) {
      const t = Date.now();
      const row = await educationQueries.getStudent(args.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `[Null Demo] Looking up student id="${args.id}" — age field is NON-NULL (Int!).`,
        ts:      t,
      });
      if (!row) return null;
      return { ...row, _failAge: args.failAge ?? false };
    },

    // ── Advanced Types Demo ───────────────────────────────────────
    async advancedTypesDemo(
      _: unknown,
      args: { input: { term: string; maxResults?: number }; role?: string },
      ctx: AppContext,
    ) {
      const term       = (args.input.term ?? '').toLowerCase();
      const maxResults = args.input.maxResults ?? 5;
      const role       = args.role ?? 'VIEWER';

      // Role → Permission mapping (demonstrates enum-based business logic)
      const permissionMap: Record<string, string[]> = {
        ADMIN:  ['READ', 'WRITE', 'DELETE'],
        VIEWER: ['READ'],
        GUEST:  [],
      };
      const permissions = permissionMap[role] ?? [];

      // Fetch both students and courses from the database
      const t = Date.now();
      const [allStudents, allCourses] = await Promise.all([
        educationQueries.getAllStudents(),
        educationQueries.getAllCourses ? educationQueries.getAllCourses() : [],
      ]);

      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `[Advanced Types] Searching students & courses for term "${term}" — union type SearchResult will mix StudentNode and CourseNode`,
        ts:      t,
      });

      // Filter by term and tag with __typename for union resolution
      const studentResults = allStudents
        .filter((s: StudentRow) => s.name.toLowerCase().includes(term))
        .slice(0, maxResults)
        .map((s: StudentRow) => ({ __typename: 'StudentNode', id: s.id, name: s.name, age: s.age }));

      const courseResults = (allCourses as CourseRow[])
        .filter((c: CourseRow) => c.title.toLowerCase().includes(term))
        .slice(0, maxResults)
        .map((c: CourseRow) => ({ __typename: 'CourseNode', id: c.id, name: c.title, title: c.title }));

      const results = [...studentResults, ...courseResults].slice(0, maxResults);

      emitTrace(ctx.requestId, {
        step:    'resolver:advanced-types',
        ms:      0,
        caption: `Role: ${role} (${permissions.length} permissions) | Found ${studentResults.length} students + ${courseResults.length} courses matching "${term}"`,
        ts:      Date.now(),
      });

      return { role, permissions, results, term: args.input.term, total: results.length };
    },
  },

  // ── SearchResult union discriminator ─────────────────────────────
  SearchResult: {
    __resolveType(obj: { __typename?: string }) {
      return obj.__typename ?? null;
    },
  },


  // ── Mutations ────────────────────────────────────────────────────
  Mutation: {
    // ── Auth demo: login mutation ────────────────────────────────
    async login(
      _: unknown,
      args: { username: string; password: string },
      ctx: AppContext,
    ) {
      const user = DEMO_USERS[args.username.toLowerCase()];
      emitTrace(ctx.requestId, {
        step:    'auth:login',
        ms:      0,
        caption: user && user.password === args.password
          ? `✅ Login successful for "${args.username}" — issuing JWT token with role="${user.role}".`
          : `❌ Login failed for "${args.username}" — invalid credentials.`,
        ts:      Date.now(),
      });
      if (!user || user.password !== args.password) {
        throw new Error(`Invalid credentials for user "${args.username}".`);
      }
      const token = await issueToken({ userId: user.id, name: user.name, role: user.role });
      emitTrace(ctx.requestId, {
        step:    'auth:token:issued',
        ms:      0,
        caption: `🔑 Token issued. Client should send: Authorization: Bearer ${token.slice(0, 40)}...`,
        ts:      Date.now(),
      });
      return { token, user: { id: user.id, name: user.name, role: user.role } };
    },

    async enrollStudent(
      _: unknown,
      args: { studentId: string; courseId: string },
      ctx: AppContext,
    ) {
      const before: EnrollmentSnapshot[] = await educationMutations.getEnrollmentSnapshot(args.studentId);
      const t = Date.now();
      await educationMutations.enroll(args.studentId, args.courseId);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `INSERT INTO enrollments (student_id, course_id) VALUES ('${args.studentId}', '${args.courseId}')`,
        ts:      t,
      });
      const after: EnrollmentSnapshot[] = await educationMutations.getEnrollmentSnapshot(args.studentId);
      return { success: true, message: 'Student enrolled successfully.', before, after };
    },

    async unenrollStudent(
      _: unknown,
      args: { studentId: string; courseId: string },
      ctx: AppContext,
    ) {
      const before: EnrollmentSnapshot[] = await educationMutations.getEnrollmentSnapshot(args.studentId);
      const t = Date.now();
      await educationMutations.unenroll(args.studentId, args.courseId);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `DELETE FROM enrollments WHERE student_id='${args.studentId}' AND course_id='${args.courseId}'`,
        ts:      t,
      });
      const after: EnrollmentSnapshot[] = await educationMutations.getEnrollmentSnapshot(args.studentId);
      return { success: true, message: 'Student unenrolled successfully.', before, after };
    },

    async scheduleAppointment(
      _: unknown,
      args: { patientId: string; doctorId: string; date: string },
      ctx: AppContext,
    ) {
      const before: AppointmentSnapshot[] = await healthcareMutations.getAppointmentSnapshot(args.patientId);
      const t = Date.now();
      await healthcareMutations.scheduleAppointment(args.patientId, args.doctorId, args.date);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `INSERT INTO appointments (patient_id='${args.patientId}', doctor_id='${args.doctorId}', date='${args.date}')`,
        ts:      t,
      });
      const after: AppointmentSnapshot[] = await healthcareMutations.getAppointmentSnapshot(args.patientId);
      return { success: true, message: 'Appointment scheduled successfully.', before, after };
    },

    async cancelAppointment(
      _: unknown,
      args: { appointmentId: string },
      ctx: AppContext,
    ) {
      // Need patient_id BEFORE deleting to fetch after-snapshot
      const existing = await healthcareMutations.getAppointmentPatientId(args.appointmentId);
      if (!existing) return { success: false, message: 'Appointment not found.', before: [], after: [] };

      const before: AppointmentSnapshot[] = await healthcareMutations.getAppointmentSnapshot(existing.patient_id);
      const t = Date.now();
      await healthcareMutations.cancelAppointment(args.appointmentId);
      emitTrace(ctx.requestId, {
        step:    'db:write',
        ms:      Date.now() - t,
        caption: `DELETE FROM appointments WHERE id='${args.appointmentId}'`,
        ts:      t,
      });
      const after: AppointmentSnapshot[] = await healthcareMutations.getAppointmentSnapshot(existing.patient_id);
      return { success: true, message: 'Appointment cancelled.', before, after };
    },
  },

  // ── Education nested resolvers ───────────────────────────────────
  Student: {
    async courses(parent: StudentRow, _: unknown, ctx: AppContext, info: GraphQLResolveInfo): Promise<CourseRow[]> {
      const t = Date.now();
      const rows = await educationQueries.getCoursesForStudent(parent.id);

      type FieldNode = import('graphql').FieldNode;
      const selectedFields = (info.fieldNodes[0]?.selectionSet?.selections ?? [])
        .filter((s): s is FieldNode => s.kind === 'Field')
        .map(s => s.name.value);

      emitTrace(ctx.requestId, {
        step:    'resolver:info',
        ms:      Date.now() - t,
        caption: `resolver:info captured for nested field "${info.fieldName}"`,
        ts:      t,
        info: {
          fieldName:      info.fieldName,
          returnType:     String(info.returnType),
          parentType:     String(info.parentType),
          path:           info.path,
          selectedFields,
          argKeys:        [],
        },
      });

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
    async appointments(parent: PatientRow, _: unknown, ctx: AppContext): Promise<AppointmentRow[]> {
      const t = Date.now();
      const rows = await healthcareQueries.getAppointmentsForPatient(parent.id);
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
    async doctor(parent: AppointmentRow): Promise<DoctorRow | undefined> {
      return healthcareQueries.getDoctor(parent.doctor_id);
    },
  },

  // ── Null Propagation Demo — field-level resolvers ─────────────────
  // These are deliberately separate types so the schema can be Int vs Int!
  // The _failAge flag is threaded from the parent query resolver.

  StudentNullable: {
    async age(parent: StudentRow & { _failAge?: boolean }, _: unknown, ctx: AppContext): Promise<number | null> {
      if (parent._failAge) {
        emitTrace(ctx.requestId, {
          step:    'null:bubble:nullable',
          ms:      0,
          caption: '💥 age resolver threw an error! Because age is Int (nullable), GraphQL returns age: null and keeps all sibling fields.',
          ts:      Date.now(),
        });
        // Returning null is safe for Int (nullable)
        return null;
      }
      emitTrace(ctx.requestId, {
        step:    'resolve:age:ok',
        ms:      0,
        caption: `age resolver returned ${parent.age} successfully.`,
        ts:      Date.now(),
      });
      return parent.age;
    },
    async courses(parent: StudentRow, _: unknown, ctx: AppContext): Promise<CourseRow[]> {
      const t = Date.now();
      const rows = await educationQueries.getCoursesForStudent(parent.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `[Null Demo] Courses resolved normally for "${parent.name}" — siblings are unaffected.`,
        ts:      t,
      });
      return rows;
    },
  },

  StudentNonNull: {
    async age(parent: StudentRow & { _failAge?: boolean }, _: unknown, ctx: AppContext): Promise<number> {
      if (parent._failAge) {
        emitTrace(ctx.requestId, {
          step:    'null:bubble:nonnull',
          ms:      0,
          caption: '💥 age resolver threw! Because age is Int! (non-null), null BUBBLES UP — completeValue() makes the entire student null. Sibling fields are discarded.',
          ts:      Date.now(),
        });
        throw new Error('Simulated age resolver failure — demonstrates non-null bubbling (completeValue)');
      }
      emitTrace(ctx.requestId, {
        step:    'resolve:age:ok',
        ms:      0,
        caption: `age resolver returned ${parent.age} successfully.`,
        ts:      Date.now(),
      });
      return parent.age;
    },
    async courses(parent: StudentRow, _: unknown, ctx: AppContext): Promise<CourseRow[]> {
      const t = Date.now();
      const rows = await educationQueries.getCoursesForStudent(parent.id);
      emitTrace(ctx.requestId, {
        step:    'db:query',
        ms:      Date.now() - t,
        caption: `[Null Demo] Courses resolver ran, but because age! failed, completeValue() discards this data too.`,
        ts:      t,
      });
      return rows;
    },
  },
};

