// ── Step metadata map ────────────────────────────────────────────────────────
// Maps server-emitted step IDs → display info for the Step Debugger UI.
// Icons are Lucide React icon names (imported in components that use this).

export interface StepMeta {
  lucideIcon:  string;   // Lucide icon component name
  phase:       string;
  phaseColor:  string;
  color:       string;   // pill background
  textColor:   string;   // pill text / icon color
  explanation: string;
}

const STEP_META: Record<string, StepMeta> = {
  parse: {
    lucideIcon: 'ScanText',
    phase: 'Parse', phaseColor: '#BFDBFE', color: '#DBEAFE', textColor: '#1D4ED8',
    explanation:
      'The parser reads your raw query string character by character and converts it into an ' +
      'Abstract Syntax Tree (AST). Every field, argument, and directive becomes a node. ' +
      'A syntax error here stops execution entirely — no resolver ever runs.',
  },
  validate: {
    lucideIcon: 'BadgeCheck',
    phase: 'Validate', phaseColor: '#BBF7D0', color: '#DCFCE7', textColor: '#15803D',
    explanation:
      'Apollo runs the GraphQL validation rules against your schema — every field must exist, ' +
      'types must match, and required arguments must be present. ' +
      'Validation errors are returned before any database work happens.',
  },
  'security:complexity': {
    lucideIcon: 'ShieldAlert',
    phase: 'Security', phaseColor: '#FECACA', color: '#FEE2E2', textColor: '#B91C1C',
    explanation:
      'GQLens calculates a complexity score — each field adds cost, nested lists multiply it. ' +
      'If the score exceeds the configured limit the request is rejected immediately. ' +
      'This protects the server from expensive denial-of-service queries.',
  },
  'auth:context:read': {
    lucideIcon: 'KeyRound',
    phase: 'Auth', phaseColor: '#E9D5FF', color: '#F3E8FF', textColor: '#7C3AED',
    explanation:
      'The context builder runs on every request. It inspects the Authorization header, ' +
      'verifies the JWT signature, and attaches the decoded user to ctx. ' +
      'Every resolver then reads ctx.user without re-verifying the token.',
  },
  'auth:login': {
    lucideIcon: 'LogIn',
    phase: 'Auth', phaseColor: '#E9D5FF', color: '#F3E8FF', textColor: '#7C3AED',
    explanation:
      'The login resolver looks up the username in DEMO_USERS and compares the password. ' +
      'A real app would bcrypt-compare against a hashed password in the database. ' +
      'If credentials fail, a GraphQL error is thrown — no token is issued.',
  },
  'auth:token:issued': {
    lucideIcon: 'Ticket',
    phase: 'Auth', phaseColor: '#E9D5FF', color: '#F3E8FF', textColor: '#7C3AED',
    explanation:
      'A signed JWT is created containing the user\'s id, name, and role. ' +
      'The client stores this and sends it as: Authorization: Bearer <token>. ' +
      'The server verifies the signature on each request — no session storage needed.',
  },
  'resolver:info': {
    lucideIcon: 'Layers',
    phase: 'Resolver', phaseColor: '#BAE6FD', color: '#E0F2FE', textColor: '#0369A1',
    explanation:
      'Every resolver receives a GraphQLResolveInfo object containing fieldName, returnType, ' +
      'parentType, path, and the selection set. Smart resolvers use this to query only the ' +
      'DB columns that were actually requested — avoiding over-fetching.',
  },
  'resolver:advanced-types': {
    lucideIcon: 'Puzzle',
    phase: 'Resolver', phaseColor: '#BAE6FD', color: '#E0F2FE', textColor: '#0369A1',
    explanation:
      'The union resolver uses __typename to tell Apollo which concrete type each result is, ' +
      'so the correct resolvers run for StudentNode vs CourseNode. ' +
      'This is how GraphQL Union types work at runtime.',
  },
  'db:query': {
    lucideIcon: 'Database',
    phase: 'Database', phaseColor: '#FED7AA', color: '#FFEDD5', textColor: '#C2410C',
    explanation:
      'A SQL SELECT query runs against the SQLite database. The resolver awaits the result ' +
      'before returning data to Apollo. Each resolver fetches only the data its field needs — ' +
      'this is the resolver-per-field model that makes GraphQL flexible.',
  },
  'db:query:students': {
    lucideIcon: 'TableProperties',
    phase: 'Database', phaseColor: '#FED7AA', color: '#FFEDD5', textColor: '#C2410C',
    explanation:
      'All students are fetched in one query. Without DataLoader, requesting courses for each ' +
      'student would fire N additional queries — one per student. ' +
      'That is the N+1 problem in action.',
  },
  'db:query:batched': {
    lucideIcon: 'Zap',
    phase: 'DataLoader', phaseColor: '#A7F3D0', color: '#D1FAE5', textColor: '#065F46',
    explanation:
      'DataLoader collected all individual load() calls from the current tick and merged them ' +
      'into a single WHERE id IN (1,2,3…) query. ' +
      'This collapses N queries into 1 — the DataLoader solution to the N+1 problem.',
  },
  'db:write': {
    lucideIcon: 'PencilLine',
    phase: 'Database', phaseColor: '#FED7AA', color: '#FFEDD5', textColor: '#C2410C',
    explanation:
      'A SQL INSERT, UPDATE, or DELETE runs against the database. Mutations change server state. ' +
      'GQLens captures before and after snapshots so you can see exactly what changed.',
  },
  'null:bubble:nullable': {
    lucideIcon: 'Droplets',
    phase: 'Null Propagation', phaseColor: '#FEF08A', color: '#FEF9C3', textColor: '#854D0E',
    explanation:
      'A resolver returned null for a nullable field (Int). GraphQL sets that field to null ' +
      'but preserves all sibling fields — the error is added to the errors array. ' +
      'Nullable fields act as "blast shields" that contain failures.',
  },
  'null:bubble:nonnull': {
    lucideIcon: 'Bomb',
    phase: 'Null Bubble ↑', phaseColor: '#FECACA', color: '#FEE2E2', textColor: '#B91C1C',
    explanation:
      'A resolver threw for a non-null field (Int!). Because null is forbidden here, ' +
      'GraphQL\'s completeValue() propagates null upward to the nearest nullable parent — ' +
      'discarding all sibling fields. This is the null bubbling cascade.',
  },
  'resolve:age:ok': {
    lucideIcon: 'CheckCircle2',
    phase: 'Resolver', phaseColor: '#BBF7D0', color: '#DCFCE7', textColor: '#15803D',
    explanation:
      'The age resolver returned successfully. When all non-null fields resolve correctly, ' +
      'completeValue() builds the full response without any null propagation. ' +
      'This is the happy path.',
  },
  respond: {
    lucideIcon: 'Send',
    phase: 'Response', phaseColor: '#BBF7D0', color: '#DCFCE7', textColor: '#15803D',
    explanation:
      'All resolvers have completed. Apollo\'s completeValue() has assembled the final JSON ' +
      'response applying all null-propagation rules. The HTTP response is sent back with data ' +
      '(and any partial errors) in the standard GraphQL envelope.',
  },
};

const PREFIX_META: { prefix: string; meta: StepMeta }[] = [
  {
    prefix: 'db:query:n1:',
    meta: {
      lucideIcon: 'AlertTriangle',
      phase: 'N+1 Query', phaseColor: '#FECACA', color: '#FEE2E2', textColor: '#B91C1C',
      explanation:
        'This is one individual N+1 query — a separate SQL call fired for each parent row. ' +
        'Watch how these multiply as more students are returned. ' +
        'DataLoader solves this by batching all of them into a single query.',
    },
  },
];

export function getStepMeta(stepId: string): StepMeta {
  if (STEP_META[stepId]) return STEP_META[stepId];
  for (const { prefix, meta } of PREFIX_META) {
    if (stepId.startsWith(prefix)) return meta;
  }
  if (stepId.startsWith('db:')) return STEP_META['db:query'];
  if (stepId.startsWith('auth:')) return STEP_META['auth:context:read'];
  if (stepId.startsWith('resolver:')) return STEP_META['resolver:info'];
  return {
    lucideIcon: 'Cpu', phase: 'Execution',
    phaseColor: '#E5E7EB', color: '#F9FAFB', textColor: '#374151',
    explanation: 'A step in the GraphQL execution pipeline.',
  };
}
