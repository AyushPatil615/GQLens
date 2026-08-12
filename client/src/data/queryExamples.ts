// ─── Preset Query Library ─────────────────────────────────────────────────────
// Each domain exposes a list of ready-to-run example queries with plain-English
// notes so students can explore without needing to know GraphQL syntax.

export interface QueryPreset {
  id:         string;
  emoji:      string;
  label:      string;   // short title shown on the card
  note:       string;   // plain-English explanation of what this does
  query:      string;   // the actual GQL string that gets loaded into the editor
  tag?:       'basic' | 'nested' | 'multi-field' | 'different-id';
}

// ─── Education presets ────────────────────────────────────────────────────────
export const educationPresets: QueryPreset[] = [
  {
    id:    'edu-1',
    emoji: '👤',
    label: 'Just the name',
    tag:   'basic',
    note:  'The simplest possible query — ask for only one field. GraphQL never sends extra data you didn\'t request.',
    query: `query {
  student(id: "1") {
    name
  }
}`,
  },
  {
    id:    'edu-2',
    emoji: '📋',
    label: 'Name + age',
    tag:   'multi-field',
    note:  'Add a second field. Notice the query shape exactly matches the response shape — that\'s a core GraphQL guarantee.',
    query: `query {
  student(id: "1") {
    name
    age
  }
}`,
  },
  {
    id:    'edu-3',
    emoji: '📚',
    label: 'Student with their courses',
    tag:   'nested',
    note:  'Fetches a nested relationship in a single round-trip. In REST you\'d need two HTTP calls; here you need one query.',
    query: `query {
  student(id: "1") {
    name
    courses {
      title
    }
  }
}`,
  },
  {
    id:    'edu-4',
    emoji: '🎓',
    label: 'Courses with instructors',
    tag:   'nested',
    note:  'Drill deeper into the nested type to also fetch the instructor field on each course.',
    query: `query {
  student(id: "1") {
    name
    courses {
      title
      instructor
    }
  }
}`,
  },
  {
    id:    'edu-5',
    emoji: '📊',
    label: 'Full student profile',
    tag:   'multi-field',
    note:  'Request every available field at once. You control what you get — no fixed endpoint, no over-fetching.',
    query: `query {
  student(id: "1") {
    name
    age
    courses {
      title
      instructor
    }
  }
}`,
  },
  {
    id:    'edu-6',
    emoji: '👩‍🎓',
    label: 'Different student (Priya)',
    tag:   'different-id',
    note:  'Change the id argument to query a completely different student. Same schema, different data.',
    query: `query {
  student(id: "2") {
    name
    age
    courses {
      title
    }
  }
}`,
  },
  {
    id:    'edu-7',
    emoji: '🧑‍💻',
    label: 'Third student (Jordan)',
    tag:   'different-id',
    note:  'Jordan is enrolled in different courses. Same query, different result — the resolver uses the id argument to filter the database.',
    query: `query {
  student(id: "3") {
    name
    courses {
      title
      instructor
    }
  }
}`,
  },
  {
    id:    'edu-8',
    emoji: '🔍',
    label: 'Only course titles (no name)',
    tag:   'nested',
    note:  'You can omit top-level scalar fields and only ask for nested data. GraphQL resolvers run only for the fields you request.',
    query: `query {
  student(id: "1") {
    courses {
      title
    }
  }
}`,
  },
  {
    id:    'edu-9',
    emoji: '⚡',
    label: 'Minimal — age only',
    tag:   'basic',
    note:  'Prove how selective GraphQL is — request a single integer field and nothing else is computed or sent.',
    query: `query {
  student(id: "2") {
    age
  }
}`,
  },
  {
    id:    'edu-10',
    emoji: '📖',
    label: 'All fields, all students',
    tag:   'multi-field',
    note:  'Run the same full-profile query for three students back to back to compare results.',
    query: `# Try changing the id between "1", "2", and "3"
# to compare the three students side by side.
query {
  student(id: "3") {
    name
    age
    courses {
      title
      instructor
    }
  }
}`,
  },
];

// ─── Healthcare presets ───────────────────────────────────────────────────────
export const healthcarePresets: QueryPreset[] = [
  {
    id:    'hc-1',
    emoji: '🏥',
    label: 'Just the patient name',
    tag:   'basic',
    note:  'The simplest query — ask for the bare minimum. The resolver still runs but GraphQL trims the response to exactly what you asked for.',
    query: `query {
  patient(id: "p1") {
    name
  }
}`,
  },
  {
    id:    'hc-2',
    emoji: '📋',
    label: 'Patient name + age',
    tag:   'multi-field',
    note:  'Add the age field. The query shape is a perfect mirror of the JSON you\'ll get back.',
    query: `query {
  patient(id: "p1") {
    name
    age
  }
}`,
  },
  {
    id:    'hc-3',
    emoji: '📅',
    label: 'Patient with appointment dates',
    tag:   'nested',
    note:  'Fetches the appointments relationship. Each appointment is its own object — GraphQL resolves it in one trip.',
    query: `query {
  patient(id: "p1") {
    name
    appointments {
      date
    }
  }
}`,
  },
  {
    id:    'hc-4',
    emoji: '🩺',
    label: 'Appointments with doctor name',
    tag:   'nested',
    note:  'Nest two levels deep: patient → appointments → doctor. In REST this would typically be 3 endpoints.',
    query: `query {
  patient(id: "p1") {
    name
    appointments {
      date
      doctor {
        name
      }
    }
  }
}`,
  },
  {
    id:    'hc-5',
    emoji: '🔬',
    label: 'Doctor specialty included',
    tag:   'nested',
    note:  'Add specialty to the nested doctor object. The doctor resolver only runs when you ask for doctor fields.',
    query: `query {
  patient(id: "p1") {
    name
    appointments {
      date
      doctor {
        name
        specialty
      }
    }
  }
}`,
  },
  {
    id:    'hc-6',
    emoji: '📊',
    label: 'Full patient profile',
    tag:   'multi-field',
    note:  'Every available field in a single query. Compare this to needing multiple REST routes for the same data.',
    query: `query {
  patient(id: "p1") {
    name
    age
    appointments {
      date
      doctor {
        name
        specialty
      }
    }
  }
}`,
  },
  {
    id:    'hc-7',
    emoji: '👤',
    label: 'Different patient (John Watson)',
    tag:   'different-id',
    note:  'Switch to patient p2. Same query structure — the id argument is the only thing that changes.',
    query: `query {
  patient(id: "p2") {
    name
    age
    appointments {
      date
      doctor {
        name
      }
    }
  }
}`,
  },
  {
    id:    'hc-8',
    emoji: '👩‍⚕️',
    label: 'Third patient (Elena Gilbert)',
    tag:   'different-id',
    note:  'Elena has different appointments. The schema stays constant; only the returned data changes.',
    query: `query {
  patient(id: "p3") {
    name
    appointments {
      date
      doctor {
        name
        specialty
      }
    }
  }
}`,
  },
  {
    id:    'hc-9',
    emoji: '⚡',
    label: 'Only appointment dates',
    tag:   'basic',
    note:  'Skip all scalar fields on the patient, go straight for the nested list. GraphQL only resolves what you request.',
    query: `query {
  patient(id: "p2") {
    appointments {
      date
    }
  }
}`,
  },
  {
    id:    'hc-10',
    emoji: '🏷️',
    label: 'Age only — minimal payload',
    tag:   'basic',
    note:  'The response will be just one integer. This demonstrates how GraphQL prevents over-fetching at the field level.',
    query: `query {
  patient(id: "p3") {
    age
  }
}`,
  },
];

export const DOMAIN_PRESETS: Record<string, QueryPreset[]> = {
  education: educationPresets,
  healthcare: healthcarePresets,
};
