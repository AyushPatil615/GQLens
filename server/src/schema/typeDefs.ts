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
`;
