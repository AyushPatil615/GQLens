import gql from 'graphql-tag';

export const typeDefs = gql`
  # ─── Education Domain ─────────────────────────────────────────────
  type Student {
    id:      ID!
    name:    String!
    age:     Int!
    courses: [Course!]!
  }

  """Student enriched with pre-loaded courses for N+1 demo"""
  type StudentWithCourses {
    id:      ID!
    name:    String!
    courses: [Course!]!
  }

  type Course {
    id:         ID!
    title:      String!
    instructor: String!
  }

  # ─── Healthcare Domain ────────────────────────────────────────────
  type Patient {
    id:           ID!
    name:         String!
    age:          Int!
    appointments: [Appointment!]!
  }

  type Doctor {
    id:        ID!
    name:      String!
    specialty: String!
  }

  type Appointment {
    id:     ID!
    date:   String!
    doctor: Doctor!
  }

  # ─── Mutation payload types ───────────────────────────────────────
  """A row in the enrollments table, enriched with names for display"""
  type EnrollmentRow {
    studentId:  ID!
    courseId:   ID!
    studentName: String!
    courseName:  String!
  }

  """Result returned from enrollStudent / unenrollStudent"""
  type MutationPayload {
    success: Boolean!
    message: String!
    before:  [EnrollmentRow!]!
    after:   [EnrollmentRow!]!
  }

  """A row in the appointments table, enriched for display"""
  type AppointmentRow {
    id:         ID!
    patientId:  ID!
    doctorId:   ID!
    date:       String!
    patientName: String!
    doctorName:  String!
  }

  """Result returned from scheduleAppointment / cancelAppointment"""
  type AppointmentMutationPayload {
    success: Boolean!
    message: String!
    before:  [AppointmentRow!]!
    after:   [AppointmentRow!]!
  }

  # ─── Auth & Context Flow Demo ────────────────────────────────────

  """The authenticated user injected into GraphQL context via the Authorization header."""
  type AuthUser {
    id:   ID!
    name: String!
    role: String!
  }

  """Returned by the login mutation — contains the JWT token and user info."""
  type LoginPayload {
    token: String!
    user:  AuthUser!
  }

  # ─── Null Bubbling Demo ───────────────────────────────────────────

  """Student used for the null propagation demo.
  The age field exists in two flavors: nullable (Int) and non-null (Int!).
  We use two separate demo types so a single query can show both side-by-side."""
  type StudentNullable {
    id:      ID!
    name:    String!
    """Nullable age — if the resolver fails, null stays HERE and siblings survive"""
    age:     Int
    courses: [Course!]!
  }

  type StudentNonNull {
    id:      ID!
    name:    String!
    """Non-null age — if the resolver fails, null BUBBLES UP to the parent object"""
    age:     Int!
    courses: [Course!]!
  }

  """Result wrapper showing nullable behavior"""
  type NullableResult {
    student: StudentNullable
    scenario: String!
    expectation: String!
  }

  """Result wrapper showing non-null bubbling behavior"""
  type NonNullResult {
    student: StudentNonNull
    scenario: String!
    expectation: String!
  }

  # ─── Advanced Types Demo ─────────────────────────────────────────

  """Enum — a fixed set of named constants validated at the schema level."""
  enum Role {
    ADMIN
    VIEWER
    GUEST
  }

  """Enum — permission scope granted by a role"""
  enum Permission {
    READ
    WRITE
    DELETE
  }

  """Interface — a contract that multiple types implement.
  Any type that implements Node MUST provide id and name."""
  interface Node {
    id:   ID!
    name: String!
  }

  """Student implementing the Node interface"""
  type StudentNode implements Node {
    id:   ID!
    name: String!
    age:  Int!
  }

  """Course implementing the Node interface"""
  type CourseNode implements Node {
    id:    ID!
    name:  String!
    title: String!
  }

  """Union — one field can return completely different types.
  The client uses __typename to know which type it received."""
  union SearchResult = StudentNode | CourseNode

  """Input type — structured argument for queries and mutations.
  Unlike output types, input types are ONLY used as arguments."""
  input SearchInput {
    term:       String!
    maxResults: Int
  }

  """Payload returned from the advancedTypesDemo query"""
  type AdvancedTypesPayload {
    role:        Role!
    permissions: [Permission!]!
    results:     [SearchResult!]!
    term:        String!
    total:       Int!
  }

  # ─── Combined Query ───────────────────────────────────────────────
  type Query {
    """Auth Demo — returns the currently logged-in user from context.
    Requires Authorization: Bearer <token> header. Throws if unauthenticated."""
    me: AuthUser

    """Fetch a single student by ID (Education domain)"""
    student(id: ID!): Student

    """Fetch all students"""
    students: [Student!]!

    """N+1 Demo — fetch all students with their courses.
    Pass useDataLoader: true to use batched loading (the fix),
    or false (default) to trigger the N+1 problem."""
    studentsWithCourses(useDataLoader: Boolean): [StudentWithCourses!]!

    """Fetch a single patient by ID (Healthcare domain)"""
    patient(id: ID!): Patient

    """Fetch all patients"""
    patients: [Patient!]!

    """Null Propagation Demo — nullable age field.
    When failAge=true the age resolver throws.
    Because age is Int (nullable), null stays put and name/courses still resolve."""
    studentNullable(id: ID!, failAge: Boolean): StudentNullable

    """Null Propagation Demo — non-null age field.
    When failAge=true the age resolver throws.
    Because age is Int! (non-null), null bubbles up making the entire student null."""
    studentNonNull(id: ID!, failAge: Boolean): StudentNonNull

    """Advanced Types Demo — demonstrates Enum, Interface, Union, and Input types.
    Searches students and courses by term and returns them as a SearchResult union.
    The role determines which Permission enum values are returned."""
    advancedTypesDemo(input: SearchInput!, role: Role): AdvancedTypesPayload!
  }

  # ─── Mutations ────────────────────────────────────────────────────
  type Mutation {
    """Enroll a student in a course (Education domain)"""
    enrollStudent(studentId: ID!, courseId: ID!): MutationPayload!

    """Remove a student from a course (Education domain)"""
    unenrollStudent(studentId: ID!, courseId: ID!): MutationPayload!

    """Schedule an appointment for a patient (Healthcare domain)"""
    scheduleAppointment(patientId: ID!, doctorId: ID!, date: String!): AppointmentMutationPayload!

    """Cancel an existing appointment (Healthcare domain)"""
    cancelAppointment(appointmentId: ID!): AppointmentMutationPayload!

    """Auth Demo — simulate user login. Returns a JWT token + user info.
    Demo credentials: alice/admin123, bob/view123, charlie/guest123"""
    login(username: String!, password: String!): LoginPayload!
  }
`;
