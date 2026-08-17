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

  # ─── Combined Query ───────────────────────────────────────────────
  type Query {
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
  }
`;
