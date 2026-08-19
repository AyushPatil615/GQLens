import { useMemo, useState } from 'react';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBaseUrl } from '../../config/api';
import 'graphiql/graphiql.css';

// ─── Preset queries ───────────────────────────────────────────────────────────
const PRESETS = [
  {
    label: '🎓 All Students',
    category: 'Education',
    query: `# Fetch all students with their enrolled courses
query AllStudents {
  students {
    id
    name
    age
    courses {
      id
      title
      instructor
    }
  }
}`,
  },
  {
    label: '🔎 Student by ID',
    category: 'Variables',
    query: `# Use a variable to look up a specific student
query GetStudent($id: ID!) {
  student(id: $id) {
    id
    name
    age
    courses {
      title
    }
  }
}`,
    variables: `{\n  "id": "1"\n}`,
  },
  {
    label: '🔢 Advanced Types',
    category: 'Enum + Union',
    query: `# Enum, Input Type, and Union in one query
query SearchDemo($input: SearchInput!, $role: Role) {
  advancedTypesDemo(input: $input, role: $role) {
    role
    permissions
    term
    total
    results {
      __typename
      ... on StudentNode {
        id
        name
        age
      }
      ... on CourseNode {
        id
        name
        title
      }
    }
  }
}`,
    variables: `{\n  "input": { "term": "a", "maxResults": 5 },\n  "role": "ADMIN"\n}`,
  },
  {
    label: '👤 Me (Auth)',
    category: 'Auth',
    query: `# Requires Authorization: Bearer <token> header
# Get a token first via the login mutation below
query Me {
  me {
    id
    name
    role
  }
}`,
  },
  {
    label: '🔑 Login',
    category: 'Mutation',
    query: `# Login and get a JWT token
# Use the token in the Headers panel:
#   Authorization: Bearer <token>
mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
    user {
      id
      name
      role
    }
  }
}`,
    variables: `{\n  "username": "alice",\n  "password": "admin123"\n}`,
  },
  {
    label: '🏥 Patients',
    category: 'Healthcare',
    query: `# Healthcare domain — patients and their appointments
query AllPatients {
  patients {
    id
    name
    age
    appointments {
      id
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
    label: '💥 Null Bubbling',
    category: 'Demo',
    query: `# Demonstrate null propagation with failAge=true
# nullable (age: Int) — null stays here, siblings survive
query NullableDemo {
  studentNullable(id: "1", failAge: true) {
    id
    name
    age
    courses { title }
  }
}`,
  },
  {
    label: '📌 N+1 vs DataLoader',
    category: 'Demo',
    query: `# Pass useDataLoader: true to batch, false to trigger N+1
# Watch the SSE trace panel for the database query count
query StudentsWithCourses($useDataLoader: Boolean) {
  studentsWithCourses(useDataLoader: $useDataLoader) {
    id
    name
    courses {
      id
      title
    }
  }
}`,
    variables: `{\n  "useDataLoader": true\n}`,
  },
];

// ─── Category colour map ──────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Education:  '#3B82F6',
  Variables:  '#8B5CF6',
  'Enum + Union': '#EC4899',
  Auth:       '#EF4444',
  Mutation:   '#F59E0B',
  Healthcare: '#22C55E',
  Demo:       '#6B7280',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function EmbeddedGraphiQL() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [key, setKey] = useState(0); // force remount GraphiQL on preset change

  const fetcher = useMemo(
    () => createGraphiQLFetcher({ url: `${getApiBaseUrl()}/graphql` }),
    [],
  );

  // Build a minimal Storage object that seeds defaultQuery/defaultVariables
  const storage = useMemo(() => {
    const p = PRESETS[selectedPreset];
    const store: Record<string, string> = {
      'graphiql:query': p.query,
      'graphiql:variables': p.variables ?? '{}',
    };
    return {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      length: Object.keys(store).length,
      key:    (i: number) => Object.keys(store)[i] ?? null,
      clear:  () => { Object.keys(store).forEach(k => delete store[k]); },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function applyPreset(idx: number) {
    setSelectedPreset(idx);
    setKey(k => k + 1); // remount GraphiQL with new storage
  }

  return (
    <div style={{
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 14,
      overflow: 'hidden',
      background: '#0F172A',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: '#0F172A',
        borderBottom: '2px solid #1E293B',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🎮</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
            Embedded GraphiQL — Live Studio
          </div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
            Connected to your live Apollo Server backend · Full schema explorer · Autocomplete
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 100,
          background: '#16A34A22', border: '2px solid #16A34A',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#22C55E',
            display: 'inline-block',
            boxShadow: '0 0 6px #22C55E',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: 10.5, color: '#22C55E', fontWeight: 900 }}>LIVE</span>
        </div>
      </div>

      {/* Preset Toolbar */}
      <div style={{
        padding: '10px 16px',
        background: '#0F172A',
        borderBottom: '2px solid #1E293B',
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 900, color: '#475569',
          textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0,
        }}>
          Quick Start:
        </span>
        {PRESETS.map((p, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.96 }}
            onClick={() => applyPreset(i)}
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              border: `2px solid ${selectedPreset === i ? CAT_COLOR[p.category] ?? '#6B7280' : '#1E293B'}`,
              background: selectedPreset === i ? `${CAT_COLOR[p.category] ?? '#6B7280'}22` : 'transparent',
              color: selectedPreset === i ? CAT_COLOR[p.category] ?? '#fff' : '#64748B',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      {/* Preset hint */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPreset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            padding: '8px 18px',
            background: '#0F172A',
            borderBottom: '1px solid #1E293B',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{
            fontSize: 9.5, fontWeight: 900, padding: '1px 7px', borderRadius: 100,
            border: `1.5px solid ${CAT_COLOR[PRESETS[selectedPreset].category] ?? '#6B7280'}`,
            color: CAT_COLOR[PRESETS[selectedPreset].category] ?? '#fff',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {PRESETS[selectedPreset].category}
          </span>
          <span style={{ fontSize: 11, color: '#475569' }}>
            Press <kbd style={{ background: '#1E293B', color: '#94A3B8', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', border: '1px solid #334155' }}>Ctrl+Enter</kbd> to run · <kbd style={{ background: '#1E293B', color: '#94A3B8', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', border: '1px solid #334155' }}>Ctrl+Space</kbd> for autocomplete · Click <strong style={{ color: '#94A3B8' }}>📖 Docs</strong> to explore the schema
          </span>
        </motion.div>
      </AnimatePresence>

      {/* GraphiQL IDE */}
      <div style={{ height: 600 }}>
        <GraphiQL
          key={key}
          fetcher={fetcher}
          storage={storage}
          defaultEditorToolsVisibility="variables"
        />
      </div>
    </div>
  );
}
