// ─── Mutation Operation Config System ────────────────────────────────────────
// Each domain declares its available mutations here.
// MutationDemo reads these configs to build the UI — no domain-specific code
// in the component itself.

import type { StepDialogue } from './stepDialogues';

export interface MutationArgOption {
  value: string;
  label: string;
}

export interface MutationArgConfig {
  key:     string;            // e.g. 'studentId'
  label:   string;            // e.g. 'Student'
  options: MutationArgOption[];
}

export interface MutationOperationConfig {
  id:            string;            // 'enrollStudent'
  label:         string;            // 'Enroll Student'
  emoji:         string;            // '📚'
  operationType: 'add' | 'remove';  // controls diff row highlight color
  args:          MutationArgConfig[];
  /** Build the GQL mutation string from current arg selections */
  buildMutation: (args: Record<string, string>) => string;
  /** Table name shown in the Diff Panel header */
  diffTableLabel: string;
  /** Column header labels for the snapshot rows */
  diffColumns: { key: string; label: string }[];
  /** Which snapshot field maps to a diff key for add/remove detection */
  diffKey: string;  // 'courseId' | 'id'  — field that changes between before/after
  stepDialogues: StepDialogue[];
  stepColors:    Record<string, string>;
}

// ─── Shared mutation pipeline colors ─────────────────────────────────────────
const MUTATION_STEP_COLORS: Record<string, string> = {
  'parse':   '#87CEEF',
  'validate':'#C4B5FD',
  'db:write':'#FDB97D',
  'respond': '#86EFAC',
};

// ─── Shared mutation pipeline dialogues ───────────────────────────────────────
function buildMutationStepDialogues(
  resolverStep: string,
  resolverLabel: string,
  resolverColor: string,
  resolverSublabel: string,
  resolverWhatHappens: string,
  resolverCodeExample: string,
  dbWriteCaption: string,
): StepDialogue[] {
  return [
    {
      step: 'parse',
      color: '#87CEEF',
      icon: '◈',
      label: 'Parser',
      sublabel: 'Reads & tokenizes mutation text',
      stepNumber: 1, totalSteps: 5,
      whatHappens:
        'GraphQL reads your raw mutation text and converts it into a structured AST (Abstract Syntax Tree) — the exact same parsing step that runs for queries. Mutations are just operations that modify data.',
      whatItTakes: 'Your mutation as a plain text string.',
      whenYouSeeThis:
        'Always the first step. A typo or syntax error here stops everything before any database write happens.',
      codeExample: 'mutation {\n  enrollStudent(\n    studentId: "1"\n    courseId: "c2"\n  ) {\n    success\n    message\n  }\n}',
    },
    {
      step: 'validate',
      color: '#C4B5FD',
      icon: '✦',
      label: 'Validator',
      sublabel: 'Checks mutation fields in schema',
      stepNumber: 2, totalSteps: 5,
      whatHappens:
        'GraphQL checks that the mutation name exists in the schema, the argument types are correct, and every field in the selection set is valid. No write happens yet.',
      whatItTakes: 'The parsed mutation AST + the schema definition.',
      whenYouSeeThis:
        "If you pass the wrong argument type (e.g. a String where an ID is expected), this step rejects it before any database code runs. Mutations get full schema validation, just like queries.",
      codeExample: 'type Mutation {\n  enrollStudent(\n    studentId: ID!   # must be a non-null ID\n    courseId:  ID!   # must be a non-null ID\n  ): MutationPayload!\n}',
    },
    {
      step: resolverStep,
      color: resolverColor,
      icon: '⬡',
      label: resolverLabel,
      sublabel: resolverSublabel,
      stepNumber: 3, totalSteps: 5,
      whatHappens: resolverWhatHappens,
      whatItTakes:
        '• parent — null (top-level mutation field)\n• args — the argument values from your mutation\n• context — shared resources like your DB connection',
      whenYouSeeThis:
        "The mutation resolver runs exactly like a query resolver — it's just a JavaScript function. The difference is it writes data, not just reads it.",
      codeExample: resolverCodeExample,
    },
    {
      step: 'db:write',
      color: '#FDB97D',
      icon: '◉',
      label: 'Database Write',
      sublabel: dbWriteCaption,
      stepNumber: 4, totalSteps: 5,
      whatHappens:
        'Your resolver executed a SQL write operation — an INSERT or DELETE. GraphQL does not touch the database directly; your resolver code does. This step also captures a before and after snapshot so the diff panel can show exactly what changed.',
      whatItTakes:
        '• The mutation arguments from the resolver\n• A database connection (passed through context)',
      whenYouSeeThis:
        'This is the only step that actually changes persistent state. Before and after snapshots are captured here — they become the diff data sent back to the client.',
      codeExample: '-- Before snapshot captured first\nSELECT * FROM enrollments WHERE student_id = \'1\';\n\n-- Then the write happens\nINSERT INTO enrollments (student_id, course_id)\nVALUES (\'1\', \'c2\');\n\n-- After snapshot captured last\nSELECT * FROM enrollments WHERE student_id = \'1\';',
    },
    {
      step: 'respond',
      color: '#86EFAC',
      icon: '✓',
      label: 'JSON Response',
      sublabel: 'Returns mutation result + diff data',
      stepNumber: 5, totalSteps: 5,
      whatHappens:
        'GraphQL assembles the mutation result into a JSON object. For mutations, this includes the success flag, a message, and the before/after data snapshots — which is what powers the diff panel you see on the right.',
      whatItTakes: 'All resolved values from the mutation resolver.',
      whenYouSeeThis:
        "Unlike REST (which might return 204 No Content), GraphQL mutations always return structured data. You can ask for as much or as little as you want — including the updated state of the record.",
      codeExample: '{\n  "data": {\n    "enrollStudent": {\n      "success": true,\n      "message": "Student enrolled successfully.",\n      "before": [ ... ],\n      "after":  [ ... ]\n    }\n  }\n}',
    },
  ];
}

// ─── Education mutations ──────────────────────────────────────────────────────
export const educationMutations: MutationOperationConfig[] = [
  {
    id:            'enrollStudent',
    label:         'Enroll Student',
    emoji:         '📚',
    operationType: 'add',
    diffTableLabel: 'enrollments',
    diffKey: 'courseId',
    diffColumns: [
      { key: 'studentName', label: 'Student' },
      { key: 'courseName',  label: 'Course'  },
    ],
    args: [
      {
        key: 'studentId',
        label: 'Student',
        options: [
          { value: '1',  label: 'Alex Rivera' },
          { value: '2',  label: 'Priya Nair' },
          { value: '3',  label: 'Jordan Lee' },
        ],
      },
      {
        key: 'courseId',
        label: 'Course',
        options: [
          { value: 'c1', label: 'Intro to Computer Science' },
          { value: 'c2', label: 'Data Structures' },
          { value: 'c3', label: 'Web Development' },
          { value: 'c4', label: 'Algorithms' },
        ],
      },
    ],
    buildMutation: (args) =>
      `mutation {\n  enrollStudent(\n    studentId: "${args.studentId}"\n    courseId:  "${args.courseId}"\n  ) {\n    success\n    message\n    before { courseId studentName courseName }\n    after  { courseId studentName courseName }\n  }\n}`,
    stepColors: {
      ...MUTATION_STEP_COLORS,
      'resolve:enrollStudent': '#FDA4AF',
    },
    stepDialogues: buildMutationStepDialogues(
      'resolve:enrollStudent',
      'Enroll Resolver',
      '#FDA4AF',
      'Writes enrollment to database',
      'GraphQL calls the enrollStudent resolver — a JavaScript function that receives studentId and courseId from your mutation arguments. It captures a before-snapshot, runs the INSERT, captures an after-snapshot, and returns all three.',
      'const resolvers = {\n  Mutation: {\n    enrollStudent: (_, { studentId, courseId }, ctx) => {\n      const before = ctx.db.getEnrollments(studentId);\n      ctx.db.enroll(studentId, courseId);\n      const after = ctx.db.getEnrollments(studentId);\n      return { success: true, before, after };\n    }\n  }\n}',
      'Runs INSERT INTO enrollments',
    ),
  },
  {
    id:            'unenrollStudent',
    label:         'Unenroll Student',
    emoji:         '✂️',
    operationType: 'remove',
    diffTableLabel: 'enrollments',
    diffKey: 'courseId',
    diffColumns: [
      { key: 'studentName', label: 'Student' },
      { key: 'courseName',  label: 'Course'  },
    ],
    args: [
      {
        key: 'studentId',
        label: 'Student',
        options: [
          { value: '1',  label: 'Alex Rivera' },
          { value: '2',  label: 'Priya Nair' },
          { value: '3',  label: 'Jordan Lee' },
        ],
      },
      {
        key: 'courseId',
        label: 'Course',
        options: [
          { value: 'c1', label: 'Intro to Computer Science' },
          { value: 'c2', label: 'Data Structures' },
          { value: 'c3', label: 'Web Development' },
          { value: 'c4', label: 'Algorithms' },
        ],
      },
    ],
    buildMutation: (args) =>
      `mutation {\n  unenrollStudent(\n    studentId: "${args.studentId}"\n    courseId:  "${args.courseId}"\n  ) {\n    success\n    message\n    before { courseId studentName courseName }\n    after  { courseId studentName courseName }\n  }\n}`,
    stepColors: {
      ...MUTATION_STEP_COLORS,
      'resolve:unenrollStudent': '#FDA4AF',
    },
    stepDialogues: buildMutationStepDialogues(
      'resolve:unenrollStudent',
      'Unenroll Resolver',
      '#FDA4AF',
      'Runs DELETE on enrollments',
      'GraphQL calls the unenrollStudent resolver. It captures the before-snapshot, runs DELETE, captures the after-snapshot, and returns the diff. The row removed will appear as a red "-" line in the diff panel.',
      'const resolvers = {\n  Mutation: {\n    unenrollStudent: (_, { studentId, courseId }, ctx) => {\n      const before = ctx.db.getEnrollments(studentId);\n      ctx.db.unenroll(studentId, courseId);\n      const after = ctx.db.getEnrollments(studentId);\n      return { success: true, before, after };\n    }\n  }\n}',
      'Runs DELETE FROM enrollments',
    ),
  },
];

// ─── Healthcare mutations ─────────────────────────────────────────────────────
export const healthcareMutations: MutationOperationConfig[] = [
  {
    id:            'scheduleAppointment',
    label:         'Schedule Appointment',
    emoji:         '📅',
    operationType: 'add',
    diffTableLabel: 'appointments',
    diffKey: 'id',
    diffColumns: [
      { key: 'patientName', label: 'Patient' },
      { key: 'doctorName',  label: 'Doctor'  },
      { key: 'date',        label: 'Date'    },
    ],
    args: [
      {
        key: 'patientId',
        label: 'Patient',
        options: [
          { value: 'p1', label: 'Sarah Connor' },
          { value: 'p2', label: 'John Watson' },
          { value: 'p3', label: 'Elena Gilbert' },
        ],
      },
      {
        key: 'doctorId',
        label: 'Doctor',
        options: [
          { value: 'd1', label: 'Dr. Gregory House' },
          { value: 'd2', label: 'Dr. Beverly Crusher' },
          { value: 'd3', label: 'Dr. Miranda Bailey' },
        ],
      },
      {
        key: 'date',
        label: 'Date',
        options: [
          { value: '2025-06-01', label: 'June 1, 2025' },
          { value: '2025-06-15', label: 'June 15, 2025' },
          { value: '2025-07-01', label: 'July 1, 2025' },
          { value: '2025-07-20', label: 'July 20, 2025' },
        ],
      },
    ],
    buildMutation: (args) =>
      `mutation {\n  scheduleAppointment(\n    patientId: "${args.patientId}"\n    doctorId:  "${args.doctorId}"\n    date:      "${args.date}"\n  ) {\n    success\n    message\n    before { id patientName doctorName date }\n    after  { id patientName doctorName date }\n  }\n}`,
    stepColors: {
      ...MUTATION_STEP_COLORS,
      'resolve:scheduleAppointment': '#FDA4AF',
    },
    stepDialogues: buildMutationStepDialogues(
      'resolve:scheduleAppointment',
      'Schedule Resolver',
      '#FDA4AF',
      'Inserts appointment row',
      'GraphQL calls the scheduleAppointment resolver with patientId, doctorId, and date. It captures the before-snapshot, inserts the new appointment row, and captures the after-snapshot.',
      'const resolvers = {\n  Mutation: {\n    scheduleAppointment: (_, { patientId, doctorId, date }, ctx) => {\n      const before = ctx.db.getAppointments(patientId);\n      ctx.db.schedule(patientId, doctorId, date);\n      const after = ctx.db.getAppointments(patientId);\n      return { success: true, before, after };\n    }\n  }\n}',
      'Runs INSERT INTO appointments',
    ),
  },
  {
    id:            'cancelAppointment',
    label:         'Cancel Appointment',
    emoji:         '🗑️',
    operationType: 'remove',
    diffTableLabel: 'appointments',
    diffKey: 'id',
    diffColumns: [
      { key: 'patientName', label: 'Patient' },
      { key: 'doctorName',  label: 'Doctor'  },
      { key: 'date',        label: 'Date'    },
    ],
    args: [
      {
        key: 'appointmentId',
        label: 'Appointment ID',
        options: [
          // Seed data IDs from database.ts
          { value: 'a1', label: 'Sarah Connor → Dr. House (2025-03-12)' },
          { value: 'a2', label: 'Sarah Connor → Dr. Crusher (2025-04-05)' },
          { value: 'a3', label: 'John Watson → Dr. Bailey (2025-03-20)' },
          { value: 'a4', label: 'John Watson → Dr. House (2025-05-10)' },
          { value: 'a5', label: 'Elena Gilbert → Dr. Grey (2025-04-18)' },
        ],
      },
    ],
    buildMutation: (args) =>
      `mutation {\n  cancelAppointment(\n    appointmentId: "${args.appointmentId}"\n  ) {\n    success\n    message\n    before { id patientName doctorName date }\n    after  { id patientName doctorName date }\n  }\n}`,
    stepColors: {
      ...MUTATION_STEP_COLORS,
      'resolve:cancelAppointment': '#FDA4AF',
    },
    stepDialogues: buildMutationStepDialogues(
      'resolve:cancelAppointment',
      'Cancel Resolver',
      '#FDA4AF',
      'Runs DELETE on appointment',
      'GraphQL calls the cancelAppointment resolver with the appointmentId. It first looks up which patient owns the appointment (to fetch the after-snapshot later), then deletes the row and captures the diff.',
      'const resolvers = {\n  Mutation: {\n    cancelAppointment: (_, { appointmentId }, ctx) => {\n      const { patientId } = ctx.db.getAppointmentPatient(appointmentId);\n      const before = ctx.db.getAppointments(patientId);\n      ctx.db.cancel(appointmentId);\n      const after = ctx.db.getAppointments(patientId);\n      return { success: true, before, after };\n    }\n  }\n}',
      'Runs DELETE FROM appointments',
    ),
  },
];
