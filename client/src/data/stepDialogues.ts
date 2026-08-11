// ─── Step Dialogues ───────────────────────────────────────────────────
// This legacy export is kept for backwards compatibility.
// FakeDemo now reads step dialogues from the domain config (domains.ts).

export type StepDialogue = {
  step:           string;
  color:          string;
  icon:           string;
  label:          string;
  sublabel:       string;   // short text shown under the label in PipelineVisualizer
  stepNumber:     number;
  totalSteps:     number;
  whatHappens:    string;
  whatItTakes:    string;
  whenYouSeeThis: string;
  codeExample:    string;
};

export const STEP_DIALOGUES: StepDialogue[] = [
  {
    step: 'parse',
    color: '#38bdf8',
    icon: '◈',
    label: 'Parser',
    sublabel: 'Reads & tokenizes query text',
    stepNumber: 1,
    totalSteps: 6,
    whatHappens:
      'GraphQL reads your raw query text and converts it into a structured tree called an AST (Abstract Syntax Tree). Think of it like grammar checking — turning words into a meaning the computer can walk through.',
    whatItTakes: 'Your query as a plain text string — exactly as you typed it.',
    whenYouSeeThis:
      'This happens on every single query, always first. If your query has a typo — like a missing } or {{ — this step catches it immediately and returns a syntax error before anything else runs. No resolver is called, no database is touched.',
    codeExample: `query {\n  student(id: "1") {\n    name\n    age\n    courses {\n      title\n    }\n  }\n}`,
  },
  {
    step: 'validate',
    color: '#a78bfa',
    icon: '✦',
    label: 'Validator',
    sublabel: 'Checks fields in the schema',
    stepNumber: 2,
    totalSteps: 6,
    whatHappens:
      "GraphQL checks your parsed query against the schema — the blueprint that defines what data exists and what fields are allowed. It's asking: \"Is this a real field? Does this type actually exist in our system?\"",
    whatItTakes:
      'The parsed query tree (from step 1) + the GraphQL schema definition you wrote.',
    whenYouSeeThis:
      "If you ask for a field that doesn't exist — like student { phone } but phone isn't in the schema — this step rejects it instantly. Zero database calls are made. This is one of GraphQL's biggest advantages over REST: type safety before execution.",
    codeExample: `type Student {\n  name: String\n  age: Int\n  courses: [Course]\n  # phone doesn't exist → validation fails\n}`,
  },
  {
    step: 'resolve:Student',
    color: '#e535ab',
    icon: '⬡',
    label: 'Student Resolver',
    sublabel: 'Finds student data',
    stepNumber: 3,
    totalSteps: 6,
    whatHappens:
      'GraphQL calls your resolver function for the student field. A resolver is just a JavaScript function you write. GraphQL calls it automatically whenever that field is requested in a query.',
    whatItTakes:
      "• parent — null here (it's a top-level query field)\n• args — { id: \"1\" } (the argument from your query)\n• context — shared resources like your DB connection and logged-in user",
    whenYouSeeThis:
      'Every field in your schema has a resolver behind it. When you ask for student, GraphQL knows exactly which function to call to get that data. This is the heart of GraphQL — resolvers are what make the schema come alive with real data.',
    codeExample: `const resolvers = {\n  Query: {\n    student: (parent, args, context) => {\n      // args.id = "1" (from your query)\n      return context.db.findStudent(args.id)\n    }\n  }\n}`,
  },
  {
    step: 'db:query',
    color: '#fb923c',
    icon: '◉',
    label: 'Database Lookup',
    sublabel: 'Reads row from SQLite',
    stepNumber: 4,
    totalSteps: 6,
    whatHappens:
      'Your resolver ran a database query to find the student row. GraphQL itself never touches the database — your resolver code does. This means you can use any database, REST API, or data source behind a resolver.',
    whatItTakes:
      '• Student ID from the resolver args (id: "1")\n• A database connection — usually passed through context',
    whenYouSeeThis:
      "In production, this is usually the slowest step. If many fields each trigger their own separate DB call, you get the N+1 problem. That's why tools like DataLoader exist — to batch and cache DB calls. For now, it's one clean lookup.",
    codeExample: `SELECT id, name, age\nFROM students\nWHERE id = '1'\nLIMIT 1\n\n-- Returns: { id: "1", name: "Alex", age: 21 }`,
  },
  {
    step: 'resolve:courses',
    color: '#e535ab',
    icon: '⬡',
    label: 'Courses Resolver',
    sublabel: 'Finds student enrollments',
    stepNumber: 5,
    totalSteps: 6,
    whatHappens:
      'Because you asked for courses { title }, GraphQL calls another resolver — this time for the nested courses field on Student. Every nested field gets its own resolver function.',
    whatItTakes:
      '• parent — the Student object returned from the previous step\n• args — {} (no arguments for this field)\n• context — same shared context (DB connection, etc.)',
    whenYouSeeThis:
      'This nested resolver pattern is what makes GraphQL powerful for relationships. The parent argument passes data downward — here, the courses resolver gets the full Student object and uses student.id to fetch enrollments. Each field is independently resolved.',
    codeExample: `const resolvers = {\n  Student: {\n    courses: (student, args, context) => {\n      // student = { id: "1", name: "Alex", age: 21 }\n      return context.db.getCourses(student.id)\n    }\n  }\n}`,
  },
  {
    step: 'respond',
    color: '#4ade80',
    icon: '✓',
    label: 'JSON Response',
    sublabel: 'Returns data to your app',
    stepNumber: 6,
    totalSteps: 6,
    whatHappens:
      "GraphQL takes all the resolved field values and assembles them into a JSON object that exactly mirrors the shape of your query. Not a field more, not a field less.",
    whatItTakes: 'All the resolved values from every resolver that ran during this request.',
    whenYouSeeThis:
      "This is GraphQL's most important feature: you asked for name, age, and course titles — that's exactly what you get back. Unused fields are never fetched, never sent. This eliminates over-fetching and makes your API usage predictable and efficient.",
    codeExample: `{\n  "data": {\n    "student": {\n      "name": "Alex Rivera",\n      "age": 21,\n      "courses": [\n        { "title": "Intro to Computer Science" },\n        { "title": "Web Development" }\n      ]\n    }\n  }\n}`,
  },
];
