type EventStep = { step: string; ms: number; caption: string };


// Hardcoded event log for Phase 1 (Fake Demo)
// This will be replaced by real SSE events from Apollo Server in Phase 3

export const FAKE_EVENT_LOG: EventStep[] = [
  {
    step: 'parse',
    ms: 5,
    caption:
      'Reading your query text and turning it into a structure the computer understands.',
  },
  {
    step: 'validate',
    ms: 4,
    caption:
      "Checking that 'name', 'age', and 'courses' are real fields that exist in the schema.",
  },
  {
    step: 'resolve:Student',
    ms: 12,
    caption: 'Running the Student resolver — a function that knows how to find student data.',
  },
  {
    step: 'db:query',
    ms: 15,
    caption: 'Looking up the student row in the database. This is where the real data lives.',
  },
  {
    step: 'resolve:courses',
    ms: 9,
    caption:
      "Running the Courses resolver — fetching which classes this student is enrolled in.",
  },
  {
    step: 'respond',
    ms: 3,
    caption: 'All done! Building the JSON response to send back to your app.',
  },
];

// Fake REST waterfall for Phase 4 (feel the pain)
export const FAKE_REST_CALLS = [
  { endpoint: 'GET /api/students/1',           ms: 120, label: 'Fetch student profile' },
  { endpoint: 'GET /api/students/1/courses',   ms: 95,  label: 'Fetch enrolled courses' },
  { endpoint: 'GET /api/teachers/42',          ms: 88,  label: 'Fetch teacher info' },
  { endpoint: 'GET /api/courses/7/materials',  ms: 110, label: 'Fetch course materials' },
];

// Example queries for the query builder
export const EXAMPLE_QUERY_FIELDS = {
  student: {
    name: true,
    age: false,
    email: false,
    courses: {
      title: false,
      teacher: {
        name: false,
      },
    },
  },
};
