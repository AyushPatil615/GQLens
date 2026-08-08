import gql from 'graphql-tag';

export const typeDefs = gql`
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

  type Query {
    """Fetch a single student by ID"""
    student(id: ID!): Student

    """Fetch all students"""
    students: [Student!]!
  }
`;
