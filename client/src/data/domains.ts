// ─── Domain Config System ──────────────────────────────────────────────────
// Every domain the visualizer supports must export a DomainConfig.
// The core pipeline (PipelineVisualizer, ExecutionTimeline, StepDialoguePanel)
// never reads this file — it's used only by App.tsx and FakeDemo.tsx.

import type { StepDialogue } from './stepDialogues';
import type { MutationOperationConfig } from './mutations';
import { educationMutations, healthcareMutations } from './mutations';

export type DomainId = 'education' | 'healthcare';

export interface FieldConfig {
  key: string;          // maps to a property in the built query
  label: string;        // shown on the toggle pill
  color: string;        // pill background when checked
  locked?: boolean;     // can't be toggled off (e.g. 'name')
  defaultOn: boolean;
  // If the field expands to a selection set, supply the inner fields string
  nestedSelection?: string;  // e.g. "title" or "date\n      doctor { name specialty }"
}

export interface DomainConfig {
  id: DomainId;
  name: string;          // "Education" | "Healthcare"
  emoji: string;
  description: string;   // short tagline shown in the switcher tooltip
  // ── Query shape ──────────────────────────────────────────────────
  rootField: string;     // 'student' | 'patient'
  rootArg: string;       // 'id: "1"' | 'id: "p1"'
  // ── Field toggles ────────────────────────────────────────────────
  fields: FieldConfig[];
  // ── Pipeline colors (per step id) ────────────────────────────────
  stepColors: Record<string, string>;
  // ── Step dialogues (right-panel content) ─────────────────────────
  stepDialogues: StepDialogue[];
  // ── Available mutations for this domain ───────────────────
  mutations: MutationOperationConfig[];
}

// ─── Query Builder ────────────────────────────────────────────────────────
export function buildDomainQuery(
  domain: DomainConfig,
  activeKeys: Record<string, boolean>,
): string {
  const lines = domain.fields
    .filter(f => activeKeys[f.key])
    .map(f =>
      f.nestedSelection
        ? `    ${f.key} {\n      ${f.nestedSelection}\n    }`
        : `    ${f.key}`,
    )
    .join('\n');
  return `query {\n  ${domain.rootField}(${domain.rootArg}) {\n${lines}\n  }\n}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATION DOMAIN
// ─────────────────────────────────────────────────────────────────────────────
const educationStepDialogues: StepDialogue[] = [
  {
    step: 'parse',
    color: '#87CEEF',
    icon: '◈',
    label: 'Parser',
    sublabel: 'Reads & tokenizes query text',
    stepNumber: 1, totalSteps: 6,
    whatHappens:
      'GraphQL reads your raw query text and converts it into a structured tree called an AST (Abstract Syntax Tree). Think of it like grammar checking — turning words into a meaning the computer can walk through.',
    whatItTakes: 'Your query as a plain text string — exactly as you typed it.',
    whenYouSeeThis:
      'This happens on every single query, always first. If your query has a typo — like a missing } — this step catches it immediately and returns a syntax error before anything else runs. No resolver is called, no database is touched.',
    codeExample: `query {\n  student(id: "1") {\n    name\n    age\n    courses {\n      title\n    }\n  }\n}`,
  },
  {
    step: 'validate',
    color: '#C4B5FD',
    icon: '✦',
    label: 'Validator',
    sublabel: 'Checks fields in the schema',
    stepNumber: 2, totalSteps: 6,
    whatHappens:
      "GraphQL checks your parsed query against the schema — the blueprint that defines what data exists and what fields are allowed. It's asking: \"Is this a real field? Does this type actually exist?\"",
    whatItTakes:
      'The parsed query tree (from step 1) + the GraphQL schema definition.',
    whenYouSeeThis:
      "If you ask for a field that doesn't exist — like student { phone } but phone isn't in the schema — this step rejects it instantly. Zero database calls are made. This is one of GraphQL's biggest advantages over REST: type safety before execution.",
    codeExample: `type Student {\n  name: String\n  age: Int\n  courses: [Course]\n  # phone doesn't exist → validation fails\n}`,
  },
  {
    step: 'resolve:Student',
    color: '#FDA4AF',
    icon: '⬡',
    label: 'Student Resolver',
    sublabel: 'Finds student data',
    stepNumber: 3, totalSteps: 6,
    whatHappens:
      'GraphQL calls your resolver function for the student field. A resolver is just a JavaScript function you write. GraphQL calls it automatically whenever that field is requested.',
    whatItTakes:
      '• parent — null here (top-level query field)\n• args — { id: "1" } (the argument from your query)\n• context — shared resources like your DB connection',
    whenYouSeeThis:
      'Every field in your schema has a resolver behind it. When you ask for student, GraphQL knows exactly which function to call. This is the heart of GraphQL — resolvers make the schema come alive with real data.',
    codeExample: `const resolvers = {\n  Query: {\n    student: (parent, args, context) => {\n      return context.db.findStudent(args.id)\n    }\n  }\n}`,
  },
  {
    step: 'db:query',
    color: '#FDB97D',
    icon: '◉',
    label: 'Database Lookup',
    sublabel: 'Reads row from SQLite',
    stepNumber: 4, totalSteps: 6,
    whatHappens:
      'Your resolver ran a database query to find the student row. GraphQL itself never touches the database — your resolver code does. This means you can use any database or data source behind a resolver.',
    whatItTakes:
      '• Student ID from the resolver args (id: "1")\n• A database connection — usually passed through context',
    whenYouSeeThis:
      "In production, this is usually the slowest step. If many fields each trigger their own DB call, you get the N+1 problem. That's why DataLoader exists — to batch DB calls.",
    codeExample: `SELECT id, name, age\nFROM students\nWHERE id = '1'\n\n-- Returns: { id: "1", name: "Alex", age: 21 }`,
  },
  {
    step: 'resolve:courses',
    color: '#FCA5A5',
    icon: '⬡',
    label: 'Courses Resolver',
    sublabel: 'Finds student enrollments',
    stepNumber: 5, totalSteps: 6,
    whatHappens:
      'Because you asked for courses { title }, GraphQL calls another resolver — this time for the nested courses field on Student. Every nested field gets its own resolver function.',
    whatItTakes:
      '• parent — the Student object returned from step 3\n• args — {} (no arguments)\n• context — same shared DB connection',
    whenYouSeeThis:
      'The parent argument passes data downward — here the courses resolver uses student.id to fetch enrollments. Each field is independently resolved, which is why unchecking courses makes this node go dark.',
    codeExample: `const resolvers = {\n  Student: {\n    courses: (student, args, context) => {\n      return context.db.getCourses(student.id)\n    }\n  }\n}`,
  },
  {
    step: 'respond',
    color: '#86EFAC',
    icon: '✓',
    label: 'JSON Response',
    sublabel: 'Returns data to your app',
    stepNumber: 6, totalSteps: 6,
    whatHappens:
      "GraphQL takes all the resolved field values and assembles them into a JSON object that exactly mirrors the shape of your query. Not a field more, not a field less.",
    whatItTakes: 'All the resolved values from every resolver that ran during this request.',
    whenYouSeeThis:
      "This is GraphQL's most important feature: you asked for name, age, and course titles — that's exactly what you get back. Unused fields are never fetched, never sent.",
    codeExample: `{\n  "data": {\n    "student": {\n      "name": "Alex Rivera",\n      "age": 21,\n      "courses": [\n        { "title": "Intro to Computer Science" },\n        { "title": "Web Development" }\n      ]\n    }\n  }\n}`,
  },
];

export const EDUCATION_DOMAIN: DomainConfig = {
  id: 'education',
  name: 'Education',
  emoji: '🎓',
  description: 'Students & Courses · School management schema',
  rootField: 'student',
  rootArg: 'id: "1"',
  fields: [
    { key: 'name',    label: 'name',    color: '#87CEEF', locked: true,  defaultOn: true },
    { key: 'age',     label: 'age',     color: '#C4B5FD',               defaultOn: true },
    { key: 'courses', label: 'courses', color: '#FCA5A5',               defaultOn: true, nestedSelection: 'title' },
  ],
  stepColors: {
    'parse':           '#87CEEF',
    'validate':        '#C4B5FD',
    'resolve:Student': '#FDA4AF',
    'db:query':        '#FDB97D',
    'resolve:courses': '#FCA5A5',
    'respond':         '#86EFAC',
  },
  stepDialogues: educationStepDialogues,
  mutations: educationMutations,
};

// ─────────────────────────────────────────────────────────────────────────────
// HEALTHCARE DOMAIN
// ─────────────────────────────────────────────────────────────────────────────
const healthcareStepDialogues: StepDialogue[] = [
  {
    step: 'parse',
    color: '#87CEEF',
    icon: '◈',
    label: 'Parser',
    sublabel: 'Reads & tokenizes query text',
    stepNumber: 1, totalSteps: 6,
    whatHappens:
      'GraphQL reads your raw query text and converts it into a structured tree called an AST (Abstract Syntax Tree). The same parser runs regardless of domain — healthcare, education, or any other schema.',
    whatItTakes: 'Your query as a plain text string — exactly as you typed it.',
    whenYouSeeThis:
      'This always runs first. A typo or missing bracket causes a syntax error here before any patient data is touched.',
    codeExample: `query {\n  patient(id: "p1") {\n    name\n    age\n    appointments {\n      date\n      doctor { name specialty }\n    }\n  }\n}`,
  },
  {
    step: 'validate',
    color: '#C4B5FD',
    icon: '✦',
    label: 'Validator',
    sublabel: 'Checks fields in the schema',
    stepNumber: 2, totalSteps: 6,
    whatHappens:
      "GraphQL checks your query against the Healthcare schema — verifying that Patient, Doctor, Appointment types and all their fields actually exist. A query for patient { bloodType } would fail here because bloodType isn't in the schema.",
    whatItTakes:
      'The parsed query tree (from step 1) + the GraphQL schema definition for the Healthcare domain.',
    whenYouSeeThis:
      "Type validation is the same mechanism whether you're querying a Student or a Patient — it's schema-level checking before any resolver or database is involved.",
    codeExample: `type Patient {\n  name: String\n  age: Int\n  appointments: [Appointment]\n  # bloodType doesn't exist → validation fails\n}`,
  },
  {
    step: 'resolve:Patient',
    color: '#FDA4AF',
    icon: '⬡',
    label: 'Patient Resolver',
    sublabel: 'Finds patient data',
    stepNumber: 3, totalSteps: 6,
    whatHappens:
      'GraphQL calls your resolver function for the patient field. This is the same resolver-as-function pattern as Education — just with a different data type (Patient instead of Student).',
    whatItTakes:
      '• parent — null here (top-level query field)\n• args — { id: "p1" } (the argument from your query)\n• context — shared resources like your DB connection',
    whenYouSeeThis:
      'This is proof that the GQLens engine is domain-agnostic. The same pipeline, the same step numbering, the same visualizer — only the resolver function and the data shape change.',
    codeExample: `const resolvers = {\n  Query: {\n    patient: (parent, args, context) => {\n      return context.db.findPatient(args.id)\n    }\n  }\n}`,
  },
  {
    step: 'db:query',
    color: '#FDB97D',
    icon: '◉',
    label: 'Database Lookup',
    sublabel: 'Reads row from SQLite',
    stepNumber: 4, totalSteps: 6,
    whatHappens:
      "Your resolver ran a database query on the patients table. GraphQL itself doesn't care what database you use — you could query PostgreSQL, MongoDB, or an external API. The resolver abstracts that away.",
    whatItTakes:
      '• Patient ID from the resolver args (id: "p1")\n• A database connection passed through context',
    whenYouSeeThis:
      "You're seeing the same DB step as Education because it's the same SQLite database, just different tables (patients vs students). This is how domain extraction works in practice.",
    codeExample: `SELECT id, name, age\nFROM patients\nWHERE id = 'p1'\n\n-- Returns: { id: "p1", name: "Sarah Connor", age: 29 }`,
  },
  {
    step: 'resolve:appointments',
    color: '#FCA5A5',
    icon: '⬡',
    label: 'Appointments Resolver',
    sublabel: 'Finds patient appointments',
    stepNumber: 5, totalSteps: 6,
    whatHappens:
      "Because you asked for appointments { date doctor { ... } }, GraphQL calls the nested appointments resolver on Patient. Notice this is structurally identical to how courses resolve on Student — just different data.",
    whatItTakes:
      '• parent — the Patient object returned from step 3\n• args — {} (no arguments for this field)\n• context — same shared DB connection',
    whenYouSeeThis:
      "The nested resolver pattern is universal. Whether it's courses on Student or appointments on Patient, GraphQL uses the parent object to drive the next query — here, patient.id filters the appointments table.",
    codeExample: `const resolvers = {\n  Patient: {\n    appointments: (patient, args, context) => {\n      return context.db.getAppointments(patient.id)\n    }\n  }\n}`,
  },
  {
    step: 'respond',
    color: '#86EFAC',
    icon: '✓',
    label: 'JSON Response',
    sublabel: 'Returns data to your app',
    stepNumber: 6, totalSteps: 6,
    whatHappens:
      "GraphQL assembles all resolved values into a JSON object mirroring the exact shape of your query. The same mechanism that shapes Student data shapes Patient data — domain-agnostic assembly.",
    whatItTakes: 'All resolved values from every resolver that ran during this request.',
    whenYouSeeThis:
      "You asked for name, age, appointments with date and doctor info — that's exactly what you get back. Nothing more. The response shape is your query shape, always.",
    codeExample: `{\n  "data": {\n    "patient": {\n      "name": "Sarah Connor",\n      "age": 29,\n      "appointments": [\n        { "date": "2025-03-12", "doctor": { "name": "Dr. Gregory House", "specialty": "Diagnostic Medicine" } },\n        { "date": "2025-04-05", "doctor": { "name": "Dr. Beverly Crusher", "specialty": "General Medicine" } }\n      ]\n    }\n  }\n}`,
  },
];

export const HEALTHCARE_DOMAIN: DomainConfig = {
  id: 'healthcare',
  name: 'Healthcare',
  emoji: '🏥',
  description: 'Patients & Doctors · Clinic management schema',
  rootField: 'patient',
  rootArg: 'id: "p1"',
  fields: [
    { key: 'name',         label: 'name',         color: '#87CEEF', locked: true, defaultOn: true },
    { key: 'age',          label: 'age',           color: '#C4B5FD',              defaultOn: true },
    { key: 'appointments', label: 'appointments',  color: '#FCA5A5',              defaultOn: true,
      nestedSelection: 'date\n      doctor { name specialty }' },
  ],
  stepColors: {
    'parse':                '#87CEEF',
    'validate':             '#C4B5FD',
    'resolve:Patient':      '#FDA4AF',
    'db:query':             '#FDB97D',
    'resolve:appointments': '#FCA5A5',
    'respond':              '#86EFAC',
  },
  stepDialogues: healthcareStepDialogues,
  mutations: healthcareMutations,
};

// ─── Domain registry ──────────────────────────────────────────────────────
export const DOMAINS: DomainConfig[] = [EDUCATION_DOMAIN, HEALTHCARE_DOMAIN];

export function getDomain(id: DomainId): DomainConfig {
  return DOMAINS.find(d => d.id === id) ?? EDUCATION_DOMAIN;
}
