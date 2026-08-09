# GraphScope

> An interactive, visual GraphQL learning tool — built for developers who learn best by watching real systems execute in front of them.

GraphScope runs a **real Apollo Server + SQLite backend** and streams every execution step to the browser over SSE in real time. The UI animates each step as it happens, explains what the step does, and shows the exact JSON that came back. No mocking, no fake timers — the pipeline you see is the pipeline that ran.

---

## The Learning Problem It Solves

Most GraphQL tutorials explain concepts with static diagrams or code blocks. A developer reads "the resolver fetches data from the database" but has no mental model of *when* that happens, *what triggered it*, or *what happens if they remove a field from the query*.

GraphScope makes the abstract concrete:

- **You see the pipeline light up step by step** as the server actually processes your query
- **You toggle a field off** (e.g. `courses`) and watch the Courses Resolver go dark — because the server literally never called it
- **You read a plain-English explanation** of each step, written for someone who has never heard the word "resolver" before
- **You see the actual JSON** that the server returned, shaped exactly like the query you wrote

---

## What the Interactive UI Shows

### Tab 1 — The Problem (REST)

An animated waterfall showing what fetching the same data looks like over REST:

```
GET /api/students/1      → 45ms  → { id, name, age }
GET /api/courses/c1      → 38ms  → { id, title }
GET /api/courses/c3      → 35ms  → { id, title }
                                   ─────────────
                                   118ms  ·  3 requests
```

Each request animates sequentially — the next one can't start until the previous one returns. After all three complete, the GraphQL equivalent plays:

```
POST /graphql { student(id:"1") { name age courses { title } } }
                                   ─────────────
                                   21ms  ·  1 request
```

The comparison cards then show the concrete numbers: **5.6× faster, 3× fewer requests, 0 over-fetching**. A developer who was unsure *why* GraphQL exists now has a visceral answer.

> REST timings in this view are simulated for illustration. The GraphQL timing is real — measured from your actual local server.

---

### Tab 2 — The Solution (GraphQL Demo)

A three-column live demo:

#### Column 1 — Query Builder
A live code editor showing the current GraphQL query. Below it, three field toggles:

| Field | Toggle | Effect |
|---|---|---|
| `name` | 🔒 locked | Always required — anchors the query |
| `age` | ✅ on/off | Toggles the `age` field in the query string |
| `courses` | ✅ on/off | Toggles the `courses { title }` nested selection set |

When you uncheck `courses`, two things happen instantly:
1. The code editor animates the `courses { title }` lines out of the query
2. A yellow tip appears: *"Watch the pipeline! Courses Resolver will be skipped — GraphQL only runs what you ask for."*

Clicking **Run Query** sends the exact string shown in the editor to the real Apollo Server.

#### Column 2 — Execution Pipeline

Six nodes that light up as the server processes the query:

```
◈ Parser           ← reads raw query text → AST
✦ Validator        ← checks fields exist in schema
⬡ Student Resolver ← calls your resolver function
◉ Database         ← runs SELECT against SQLite
⬡ Courses Resolver ← only runs if courses was requested
✓ JSON Response    ← assembles and returns JSON
```

Each node:
- **Gray** = never ran (e.g. Courses Resolver when `courses` is unchecked)
- **Pulsing** = currently executing
- **Colored with ✓** = completed
- **Clickable** (when complete) = opens the step's full explanation in column 3

If you ran the query without `courses`, the Courses Resolver node stays gray. That gray node is the visual proof that GraphQL's "only fetch what you ask for" guarantee is real, not a marketing claim.

#### Column 3 — Step Dialogue Panel

Three states:

**Idle** — Shows a preview of the four explanation sections available for each step (How it works / What it takes / In context / Code example).

**Running** — Auto-shows the explanation for whichever step is currently active. Updates in real time as the pipeline advances.

**Complete** — Shows:
1. The **actual JSON response** from the server (green-tinted code block)
2. A clickable list of all steps that ran — click any to read its full explanation at your own pace

---

## How the Live Tracing Works

The key insight is that the pipeline animation is driven by **real server events**, not pre-scripted timers.

### The flow

```
Browser                                  Server (port 4000)
  │                                             │
  ├─ 1. EventSource /events?requestId=UUID ───► │ SSE handler registers client
  │                                             │ (holds connection open)
  │
  ├─ 2. Wait 80ms (ensures SSE is ready)        │
  │
  ├─ 3. POST /graphql                           │
  │      headers: { x-request-id: UUID }  ───► │ Apollo Server receives query
  │                                             │
  │                                             │ Apollo Plugin fires:
  │ ◄── data: {step:"parse",    ms:1}  ─────── │   parsingDidStart → end callback
  │ ◄── data: {step:"validate", ms:6}  ─────── │   validationDidStart → end callback
  │ ◄── data: {step:"resolve:Student"} ──────── │   willResolveField (Query.student)
  │ ◄── data: {step:"db:query",ms:8}  ─────── │   (emitted from resolver code)
  │ ◄── data: {step:"resolve:courses"} ──────── │   willResolveField (Student.courses)
  │ ◄── data: {step:"respond",  ms:14} ──────── │   willSendResponse
  │ ◄── data: {step:"__done__"}  ────────────── │   emitDone() signals stream end
  │
  │ ◄── HTTP 200 { data: { student: {...} } }── │ GraphQL response body
```

### The Apollo Plugin

`server/src/plugins/tracingPlugin.ts` implements `ApolloServerPlugin`. Apollo calls lifecycle hooks at each execution stage — the plugin measures elapsed time and emits an SSE event per step:

```ts
async parsingDidStart() {
  const t = Date.now();
  return async () => {            // fired when parsing ENDS
    emitTrace(requestId, {
      step: 'parse',
      ms: Date.now() - t,
      caption: 'GraphQL read your query text and converted it into a structured tree (AST).',
    });
  };
},
```

The `requestId` ties each SSE event to the correct browser tab. Multiple tabs can run queries simultaneously without cross-contamination.

### Why `documentStore: null`

Apollo Server v4 caches parsed/validated query documents in memory by default (its `documentStore`). On repeated runs of the same query string, it reuses the cached AST and **skips** `parsingDidStart` and `validationDidStart` entirely.

For a production API this is a sensible optimization. For a learning tool it's fatal — Parser and Validator appear permanently grayed out after the first run.

Setting `documentStore: null` disables the cache, forcing Apollo to re-parse and re-validate every request, so the full 6-step pipeline is always visible.

### The SSE Hook (`useGraphQLTrace`)

```ts
export function useGraphQLTrace(query: string) {
  // 1. Open EventSource before sending the query
  const es = new EventSource(`/events?requestId=${requestId}`);

  // 2. Collect steps as they arrive
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    if (event.step === '__done__') { setPhase('complete'); es.close(); return; }
    setSteps(prev => [...prev, event]);
  };

  // 3. 80ms later — fire the query
  await fetch('/graphql', {
    headers: { 'x-request-id': requestId },
    body: JSON.stringify({ query }),
  });
}
```

The hook also captures the HTTP response body, surfacing the real JSON in the right panel after the pipeline completes. A 10-second timeout watchdog shows an error banner if the server doesn't respond.

---

## Tech Stack

| Layer | Tech | Purpose |
|---|---|---|
| Frontend | React + TypeScript + Vite | Component UI and dev server (port 5173) |
| Animations | Framer Motion | Pipeline node transitions, field line enter/exit, button micro-animations |
| Styling | Vanilla CSS + CSS variables | Cream Neobrutalism design — bold black borders, offset shadows |
| Backend | Apollo Server v4 + Express | Real GraphQL execution with plugin-based instrumentation |
| Database | SQLite via `better-sqlite3` | Synchronous queries — no async/await complexity in resolvers |
| Live tracing | Server-Sent Events (SSE) | One-directional push from server to browser per execution step |

---

## Project Structure

```
graphql_learner/
├── client/src/
│   ├── App.tsx                          ← Tab routing (REST | GraphQL)
│   ├── index.css                        ← Design tokens + mobile breakpoints
│   ├── components/
│   │   ├── FakeDemo/
│   │   │   ├── FakeDemo.tsx             ← Query builder, field toggles, orchestration
│   │   │   └── StepDialoguePanel.tsx   ← Right column: idle / active / complete states
│   │   ├── PipelineVisualizer/          ← The 6 animated step nodes
│   │   ├── ExecutionTimeline/           ← Horizontal timing bars
│   │   └── RestVsGraphQL/
│   │       └── RestComparison.tsx       ← Animated REST waterfall
│   ├── data/
│   │   └── stepDialogues.ts             ← Educational content per pipeline step
│   └── hooks/
│       └── useGraphQLTrace.ts           ← SSE lifecycle, response capture, timeout
│
└── server/src/
    ├── index.ts                         ← Express app, /graphql, /events, documentStore: null
    ├── schema/typeDefs.ts               ← GraphQL SDL (Student, Course, Query)
    ├── resolvers/index.ts               ← Query.student, Student.courses
    ├── db/database.ts                   ← SQLite init + seed (students, courses, enrollments)
    ├── plugins/tracingPlugin.ts         ← Apollo plugin — emits SSE per lifecycle hook
    └── tracer.ts                        ← SSE client registry + emitTrace / emitDone
```

---

## Running Locally

Two terminals required.

```bash
# Terminal 1 — backend (port 4000)
cd server
npm install
npm run dev

# Terminal 2 — frontend (port 5173)
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

Vite proxies `/graphql` and `/events` to `localhost:4000` — no CORS configuration needed on the client.

---

## Seed Data

The SQLite database is auto-created at `server/data/graphscope.sqlite` on first run. Example data:

- **Alex Rivera** (age 21) — enrolled in *Intro to Computer Science* and *Web Development*
- **Jordan Smith** (age 22) — enrolled in *Data Structures*
- **Morgan Lee** (age 20) — enrolled in *Algorithms*

---

## Design System

The UI uses **Cream Neobrutalism** — a design aesthetic built around:
- Warm cream background (`#FFF8F0`) with a subtle dot grid
- Bold 3px black borders on all cards
- Offset box shadows (`5px 5px 0 #000`) for the "printed on paper" feel
- Saturated but warm accent colors (sky blue, lavender, coral, peach, mint)
- `Nunito` (sans-serif) + `JetBrains Mono` (code)

Every pipeline step has its own assigned color that appears consistently across the pipeline nodes, timeline bars, step badges, and dialogue panel headers.

---

## License

MIT
