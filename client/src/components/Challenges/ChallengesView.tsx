import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../../context/SoundContext';

// ─── Types ──────────────────────────────────────────────────────────────
interface Challenge {
  id: string;
  emoji: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  difficultyColor: string;
  concept: string;
  scenario: string;
  code?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  followUp?: string;
}

// ─── Challenge data ──────────────────────────────────────────────────────
const CHALLENGES: Challenge[] = [
  {
    id: 'n1-count',
    emoji: '😱',
    title: 'The N+1 Trap',
    difficulty: 'Beginner',
    difficultyColor: '#86EFAC',
    concept: 'N+1 Problem',
    scenario: 'You run the following query against a GraphQL API with NO DataLoader:',
    code: `query {
  students {          # returns 5 students
    name
    courses {         # nested list
      title
    }
  }
}`,
    question: 'How many database queries will this produce?',
    options: ['1 query total', '2 queries total', '6 queries total (1 + 5)', '5² = 25 queries'],
    correctIndex: 2,
    explanation: '✅ Correct! Without DataLoader, GraphQL fires **1 query to fetch all students**, then **1 separate query per student** to fetch their courses. That is 1 + 5 = **6 queries**. With 100 students it would be 101!',
    followUp: 'This is called the N+1 problem. DataLoader fixes it by batching all the course lookups into a single IN (...) query.',
  },
  {
    id: 'exec-order',
    emoji: '⚙️',
    title: 'Execution Order',
    difficulty: 'Beginner',
    difficultyColor: '#86EFAC',
    concept: 'GraphQL Execution Lifecycle',
    scenario: 'You send a GraphQL query to a server.',
    code: `query {
  user(id: "1") {
    name
    posts { title }
  }
}`,
    question: 'Which step happens FIRST after the server receives the query string?',
    options: [
      'The resolver functions run',
      'The query is parsed into an AST',
      'The schema is validated',
      'The database is queried',
    ],
    correctIndex: 1,
    explanation: '✅ Correct! The very first thing GraphQL does is **parse** the raw query text into an Abstract Syntax Tree (AST). Only after a successful parse does it validate the AST against the schema, then execute resolvers.',
    followUp: 'Order: Parse → Validate → Field Collection → Execute Resolvers → completeValue() → Response',
  },
  {
    id: 'null-propagation',
    emoji: '🕳️',
    title: 'Null Propagation',
    difficulty: 'Intermediate',
    difficultyColor: '#FDB97D',
    concept: 'Null & Error Propagation',
    scenario: 'Your schema defines:',
    code: `type Query {
  user: User              # nullable
}
type User {
  name: String!           # non-null
  email: String           # nullable
}`,
    question: 'If the "name" resolver throws an error, what does GraphQL return?',
    options: [
      '{ "data": { "user": { "name": null, "email": "..." } } }',
      '{ "data": { "user": null }, "errors": [...] }',
      '{ "data": null, "errors": [...] }',
      'A 500 HTTP error with no data',
    ],
    correctIndex: 1,
    explanation: '✅ Correct! Because `name` is `String!` (non-null), it cannot be null. GraphQL **propagates the error upward** to the nearest nullable parent — `user` — and sets it to null. The `errors` array contains the error detail. The response still returns HTTP 200!',
    followUp: 'If `user` were also non-null (User!), the null would bubble up further to `data`, making `data: null`.',
  },
  {
    id: 'fragment-dedup',
    emoji: '🧩',
    title: 'Fragments & Field Deduplication',
    difficulty: 'Intermediate',
    difficultyColor: '#FDB97D',
    concept: 'Fragments & Field Collection',
    scenario: 'You have two fragments that both request the same field:',
    code: `fragment UserBasic on User { name email }
fragment UserEmail on User { email phone }

query {
  user(id: "1") {
    ...UserBasic
    ...UserEmail
  }
}`,
    question: 'How many times does GraphQL resolve the "email" field?',
    options: [
      '2 times — once per fragment',
      '1 time — GraphQL deduplicates overlapping fields',
      '0 times — fragments are cached from schema',
      'Depends on the resolver implementation',
    ],
    correctIndex: 1,
    explanation: '✅ Correct! During the **Field Collection** phase, GraphQL merges the selection sets of all fragments and deduplicates overlapping fields. `email` is only resolved **once**, even though it appears in both fragments.',
    followUp: 'This is why you can use fragments freely without worrying about double-fetching the same fields.',
  },
  {
    id: 'introspection',
    emoji: '🔍',
    title: 'Schema Introspection',
    difficulty: 'Advanced',
    difficultyColor: '#C4B5FD',
    concept: 'Introspection',
    scenario: 'You send this special query to a GraphQL API:',
    code: `query {
  __schema {
    types {
      name
      kind
    }
  }
}`,
    question: 'What does this query return?',
    options: [
      'All data in the database',
      'A list of all type names and their kinds defined in the schema',
      'A runtime error — double underscore fields are forbidden',
      'Only the Query root type',
    ],
    correctIndex: 1,
    explanation: '✅ Correct! `__schema` is a special **introspection** field built into every GraphQL server. It lets clients (and tools like GraphiQL) discover the full schema: types, fields, arguments, deprecations, and more — all at runtime.',
    followUp: 'This is how GraphQL playground tools (Apollo Studio, GraphiQL) auto-complete your queries — they use introspection to read the schema.',
  },
];

// ─── Badge component ─────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 800, color: '#000',
      background: color, border: '2px solid #000',
      borderRadius: 999, padding: '2px 10px',
    }}>
      {label}
    </span>
  );
}

// ─── Single challenge card ────────────────────────────────────────────────
function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const { playSound }           = useSound();

  const isCorrect = selected === challenge.correctIndex;

  function handleSelect(i: number) {
    if (revealed) return;
    playSound('click');
    setSelected(i);
  }

  function handleReveal() {
    if (selected === null) return;
    if (isCorrect) {
      playSound('complete');
    } else {
      playSound('error');
    }
    setRevealed(true);
  }

  function handleReset() {
    playSound('reset');
    setSelected(null);
    setRevealed(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{
        background: '#fff',
        border: 'var(--border)',
        boxShadow: 'var(--shadow-md)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div style={{
        padding: '12px 18px',
        background: '#f9f5f0',
        borderBottom: 'var(--border-2)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 26 }}>{challenge.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#000' }}>{challenge.title}</div>
          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Concept: {challenge.concept}</div>
        </div>
        <Badge label={challenge.difficulty} color={challenge.difficultyColor} />
        {revealed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: 20,
              filter: isCorrect ? 'none' : 'grayscale(0.3)',
            }}
          >
            {isCorrect ? '🏆' : '💡'}
          </motion.span>
        )}
      </div>

      <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Scenario */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', lineHeight: 1.65 }}>
          {challenge.scenario}
        </div>

        {/* Code block */}
        {challenge.code && (
          <div style={{
            background: '#1e1b4b',
            border: '2.5px solid #000',
            boxShadow: '3px 3px 0 #000',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <div style={{
              padding: '6px 12px', background: '#312e81',
              borderBottom: '2px solid #3730a3',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.2)' }} />
              ))}
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#a5b4fc', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>
                challenge.graphql
              </span>
            </div>
            <pre style={{
              margin: 0, padding: '14px 16px',
              fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.9,
              color: '#e0e7ff', overflowX: 'auto',
            }}>
              {challenge.code}
            </pre>
          </div>
        )}

        {/* Question */}
        <div style={{
          padding: '10px 14px',
          background: '#EEF2FF',
          border: '2.5px solid #818CF8',
          boxShadow: '3px 3px 0 #818CF8',
          borderRadius: 9,
          fontSize: 13, fontWeight: 800, color: '#000',
        }}>
          ❓ {challenge.question}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {challenge.options.map((opt, i) => {
            let bg = '#f9f5f0';
            let border = '2.5px solid #000';
            let shadow = 'none';
            let icon = <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #d1d5db', display: 'inline-block', flexShrink: 0 }} />;

            if (selected === i) {
              bg = '#EEF2FF';
              border = '2.5px solid #818CF8';
              shadow = '3px 3px 0 #818CF8';
              icon = <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#818CF8', border: '2px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 900, flexShrink: 0 }}>●</span>;
            }
            if (revealed && i === challenge.correctIndex) {
              bg = '#f0fdf4';
              border = '2.5px solid #86EFAC';
              shadow = '3px 3px 0 #86EFAC';
              icon = <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#86EFAC', border: '2px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 9, fontWeight: 900, flexShrink: 0 }}>✓</span>;
            }
            if (revealed && selected === i && i !== challenge.correctIndex) {
              bg = '#fef2f2';
              border = '2.5px solid #FCA5A5';
              shadow = '3px 3px 0 #FCA5A5';
              icon = <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#FCA5A5', border: '2px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 9, fontWeight: 900, flexShrink: 0 }}>✗</span>;
            }

            return (
              <motion.button
                key={i}
                onClick={() => handleSelect(i)}
                whileHover={!revealed ? { x: -2, y: -2, boxShadow: '5px 5px 0 #000' } : {}}
                whileTap={!revealed ? { x: 0, y: 0 } : {}}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: bg,
                  border,
                  boxShadow: shadow,
                  borderRadius: 9,
                  cursor: revealed ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background 0.15s, border-color 0.15s',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {icon}
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#000' }}>{opt}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Action buttons */}
        {!revealed ? (
          <motion.button
            whileHover={selected !== null ? { x: -3, y: -3, boxShadow: '8px 8px 0 #000' } : {}}
            whileTap={selected !== null ? { x: 0, y: 0 } : {}}
            onClick={handleReveal}
            disabled={selected === null}
            style={{
              padding: '11px 20px',
              background: selected !== null ? '#000' : '#e5e7eb',
              border: 'var(--border)',
              boxShadow: selected !== null ? '5px 5px 0 #000' : 'none',
              borderRadius: 9,
              color: selected !== null ? '#fff' : '#9CA3AF',
              fontSize: 13, fontWeight: 900,
              cursor: selected !== null ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s',
            }}
          >
            {selected === null ? 'Select an answer first' : '🎯 Check Answer'}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 #000' }}
            whileTap={{ x: 0, y: 0 }}
            onClick={handleReset}
            style={{
              padding: '9px 20px',
              background: '#f3f4f6',
              border: 'var(--border)',
              boxShadow: '3px 3px 0 #000',
              borderRadius: 9,
              color: '#000', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            ↺ Try Again
          </motion.button>
        )}

        {/* Explanation */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '14px 16px',
                background: isCorrect ? '#f0fdf4' : '#fefce8',
                border: `2.5px solid ${isCorrect ? '#86EFAC' : '#FDB97D'}`,
                boxShadow: `3px 3px 0 ${isCorrect ? '#86EFAC' : '#FDB97D'}`,
                borderRadius: 10,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#000', lineHeight: 1.65 }}>
                  {challenge.explanation}
                </div>
                {challenge.followUp && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: 7,
                    fontSize: 11.5, fontWeight: 600, color: '#374151', lineHeight: 1.6,
                  }}>
                    💡 <strong>Pro tip:</strong> {challenge.followUp}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Score tracker ──────────────────────────────────────────────────────
// ─── Main view ─────────────────────────────────────────────────────────
const FLOATERS = [
  { char: '🏆', top: '8%',    left: '2%',  size: 28 },
  { char: '⚡', top: '6%',    right: '3%', size: 24 },
  { char: '🎯', top: '38%',   left: '1.5%',size: 22 },
  { char: '🧩', bottom: '22%',right: '3%', size: 20 },
];

export function ChallengesView() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(circle, #d4c5b5 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflowX: 'hidden',
    }}>
      {/* Floaters */}
      <div className="gs-floaters" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {FLOATERS.map((f, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            style={{
              position: 'absolute', fontSize: f.size,
              top: (f as any).top, left: (f as any).left,
              right: (f as any).right, bottom: (f as any).bottom,
            }}
          >
            {f.char}
          </motion.span>
        ))}
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '44px 24px 32px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ fontSize: 48, marginBottom: 14, display: 'inline-block' }}
        >
          🎯
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 'clamp(26px, 4.5vw, 48px)',
            fontWeight: 900, color: '#000',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-1px', lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Interactive Challenges
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            width: 240, height: 4, margin: '0 auto 18px',
            background: 'linear-gradient(to right, #87CEEF, #C4B5FD, #FDA4AF, #FDB97D, #86EFAC)',
            borderRadius: 99,
          }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 15.5, color: 'var(--text-mid)',
            maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.65, fontWeight: 600,
          }}
        >
          Test your GraphQL knowledge with real-world scenarios.
          Pick an answer, then reveal the <strong style={{ color: '#000' }}>full explanation</strong>.
        </motion.p>

        {/* Difficulty legend */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {[
            { label: 'Beginner',     color: '#86EFAC' },
            { label: 'Intermediate', color: '#FDB97D' },
            { label: 'Advanced',     color: '#C4B5FD' },
          ].map(d => (
            <span key={d.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 999,
              border: '2px solid #000', boxShadow: '2px 2px 0 #000',
              background: d.color, fontSize: 11, fontWeight: 800, color: '#000',
            }}>
              {d.label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Challenge cards */}
      <div style={{
        padding: '0 24px 52px',
        maxWidth: 840, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {CHALLENGES.map((c, i) => (
          <ChallengeCard key={c.id} challenge={c} index={i} />
        ))}
      </div>
    </div>
  );
}
