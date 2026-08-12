import gql from 'graphql-tag';

export const typeDefs = gql`
  # ─── Education Domain ─────────────────────────────────────────────
  type Student {
    id:      ID!
    name:    String!
    age:     Int!
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

  # ─── Combined Query ───────────────────────────────────────────────
  type Query {
    """Fetch a single student by ID (Education domain)"""
    student(id: ID!): Student

    """Fetch all students"""
    students: [Student!]!

    """Fetch a single patient by ID (Healthcare domain)"""
    patient(id: ID!): Patient

    """Fetch all patients"""
    patients: [Patient!]!
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
