<p align="center">
  <h1 align="center">⬡ GraphScope</h1>
  <p align="center">
    <strong>An interactive, visual 3D GraphQL learning platform that streams real execution traces from Apollo Server + PostgreSQL/SQLite.</strong>
  </p>
  <p align="center">
    <a href="https://graph-ql-omega.vercel.app">
      <img src="https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-graph--ql--omega.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
    </a>
  </p>
  <p align="center">
    <a href="https://graph-ql-omega.vercel.app">🌐 Try Live App</a> •
    <a href="#-what-is-graphscope">What is GraphScope</a> •
    <a href="#-the-learning-problem-it-solves">Problem It Solves</a> •
    <a href="#-the-3-act-student-journey">3-Act Journey</a> •
    <a href="#-what-is-graphql-core-theory">GraphQL Theory</a> •
    <a href="#-what-the-interactive-ui-shows">UI Breakdown</a> •
    <a href="#%EF%B8%8F-architecture--how-it-works">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-distributed-cloud-deployment">Cloud Deployment</a> •
    <a href="#-license">License</a>
  </p>
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/GraphQL-v16.14-e535ab?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL">
  <img src="https://img.shields.io/badge/Apollo%20Server-v4-311C87?style=for-the-badge&logo=apollo-graphql&logoColor=white" alt="Apollo Server">
  <img src="https://img.shields.io/badge/React-v18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Three.js-v0.18-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/PostgreSQL-v16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/SQLite-v3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/TypeScript-v5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

---

## 🌟 What is GraphScope?

**GraphScope** is an open-source interactive learning playground built for developers who learn best by watching real systems execute in front of them.

GraphScope runs a **real Apollo Server v4 backend** (connected to local SQLite or cloud Supabase PostgreSQL) and streams every execution step to the browser over Server-Sent Events (SSE) in real time. The UI animates each step as it happens, explains what the step does, and shows the exact JSON that came back. No mocking, no fake timers — the pipeline you see is the pipeline that ran.

---

## 🧠 The Learning Problem It Solves

Most GraphQL tutorials explain concepts with static diagrams or code blocks. A developer reads *"the resolver fetches data from the database"* but has no mental model of *when* that happens, *what triggered it*, or *what happens if they remove a field from the query*.

GraphScope makes the abstract concrete:

- **You see the pipeline light up step by step** as the server actually processes your query.
- **You toggle a field off** (e.g. `courses`) and watch the Courses Resolver go dark — because the server literally never called it.
- **You watch a 3D rocket travel planet-to-planet** through execution phases (*Client Planet -> Parser Gas Giant -> Validator Moon -> Resolver Lava World -> Database Cyber Core*).
- **You see the live N+1 problem** stream separate SQL queries in red, then toggle DataLoader ON to watch them condense into 1 batched query in green.
- **You read plain-English explanations** of each step, written for someone who has never heard the word "resolver" before.
- **You see the actual JSON response** returned from the server, shaped identically to the query you wrote.

---

## 🎬 The 3-Act Student Journey

```text
 🍊 The Problem (REST) ────────► ✨ The Solution (GraphQL) ────────► ⚡ Going Deeper
 (Waterfall requests)           (3D Solar System + Pipeline)        (N+1 & DataLoader)
```

1. **🍊 The Problem (REST)**: Interactive restaurant metaphor & real network waterfall demonstrating why REST APIs struggle with relational data, overfetching, and underfetching.
2. **✨ The Solution (GraphQL)**: Live Query Builder & Mutation Editor. Includes a procedural **3D Solar System** where a rocket travels planet-to-planet through GraphQL execution stages.
3. **⚡ Going Deeper**: Interactive **N+1 Problem & DataLoader Visualizer**. Demonstrates the #1 GraphQL performance pitfall live by streaming real database queries in real-time.

---

## 📖 What is GraphQL? (Core Theory)

**GraphQL** is an open-source query language for APIs and a server-side runtime for executing queries using a type system you define for your data. Created by Facebook (Meta) in 2012 and open-sourced in 2015, GraphQL was designed to solve the rigidity, over-fetching, and under-fetching issues inherent in traditional REST APIs.

### 1. Core Pillars of GraphQL

- 🎯 **Declarative Data Fetching**: The client specifies *precisely* what data it needs in a single query string, and the server returns a JSON response shaped identically to the request.
- 🔗 **Single HTTP Endpoint**: Instead of navigating dozens of REST endpoints (`GET /api/users`, `GET /api/users/1/posts`, `GET /api/comments`), GraphQL exposes a single endpoint (typically `POST /graphql`).
- 🛡️ **Strongly Typed Schema**: The API contract is explicitly written in GraphQL Schema Definition Language (SDL). Every field, object type, argument, and return type is strictly checked at validation time.
- ⚙️ **Resolver-Driven Architecture**: The server maps schema fields to individual JavaScript/TypeScript functions called **resolvers**. Resolvers fetch data from any data source (SQL databases, NoSQL, microservices, or REST endpoints).

### 2. Key Terminology

| Concept | Description | Example |
|---|---|---|
| **Schema Definition (SDL)** | The contract defining object types, fields, and queries available on the server. | `type Student { id: ID!, name: String!, age: Int }` |
| **Query** | A read-only operation requested by the client. | `query { student(id: "1") { name } }` |
| **Mutation** | A write operation used to insert, update, or delete data on the server. | `mutation { enrollStudent(studentId: "1", courseId: "c1") { success } }` |
| **Subscription** | A real-time WebSocket/Event connection for server-push updates. | `subscription { studentEnrolled { id } }` |
| **Resolver** | A server-side function that populates data for a specific schema field. | `Query: { student: (_, args) => db.find(args.id) }` |
| **DataLoader** | A batching & caching utility to solve N+1 database queries. | `new DataLoader(keys => db.getBatched(keys))` |
| **AST (Abstract Syntax Tree)** | The parsed tree representation of raw query string used during validation & execution. | Internal object generated by `graphql-js` parser |

### 3. GraphQL vs. REST Comparison

| Dimension | REST API | GraphQL API |
|---|---|---|
| **Endpoint Structure** | Multiple URLs (`/students`, `/courses`) | Single URL (`/graphql`) |
| **Data Fetching Control** | Server decides returned fields | Client decides returned fields |
| **Network Requests** | Often requires multiple waterfall round trips | Single request for deeply nested graph data |
| **Over-Fetching** | High (returns unneeded object properties) | Zero (only returns requested fields) |
| **Under-Fetching** | High (requires follow-up requests for relational data) | Zero (relationships resolved in one tree execution) |
| **Type Safety** | Optional (requires OpenAPI/Swagger schemas) | Built-in (strict schema validation before execution) |

---

## 🖥️ What the Interactive UI Shows

### Tab 1 — The Problem (REST)

An animated waterfall showing what fetching the same data looks like over REST:

```text
GET /api/students/1      → 45ms  → { id, name, age }
GET /api/courses/c1      → 38ms  → { id, title }
GET /api/courses/c3      → 35ms  → { id, title }
                                   ─────────────
                                   118ms  ·  3 requests
```

Each request animates sequentially — the next one can't start until the previous one returns. After all three complete, the GraphQL equivalent plays:

```text
POST /graphql { student(id:"1") { name age courses { title } } }
                                   ─────────────
                                   21ms  ·  1 request
```

The comparison cards then show the concrete numbers: **5.6× faster, 3× fewer requests, 0 over-fetching**.

---

### Tab 2 — The Solution (GraphQL Demo)

#### Column 1 — Query Builder & Mutation Editor
- Live code editor for queries & mutations.
- Field toggles for `name`, `age`, and `courses { title }`.
- Domain switcher to toggle between **Education** (`students`, `courses`) and **Healthcare** (`patients`, `doctors`).
- Side-by-side SQL Data Diff panel showing `Before` vs `After` snapshots when running mutations.

#### Column 2 — 3D Solar System & Execution Pipeline
- Procedural **Three.js 3D Solar System** with animated rocket flight curve.
- 5 Execution nodes: `Parser` -> `Validator` -> `Student Resolver` -> `Database Lookup` -> `Courses Resolver` -> `JSON Response`.
- Nodes light up in real time over SSE. Gray nodes visually prove skipped resolvers.

#### Column 3 — Step Dialogue Panel
- Explains *How it works*, *What it takes*, *In context*, and *Code example* for whichever step is active.
- Displays the real JSON response from the server when execution finishes.

---

### Tab 3 — ⚡ Going Deeper (N+1 & DataLoader)

- **Context Banner**: Explains why GraphQL has a hidden performance trap ($1 + N$ queries).
- **Interactive Switcher**: Toggle DataLoader **OFF** (4 separate DB queries in red) vs **ON** (2 batched DB queries in green).
- Live streaming database query timeline showing exact SQL statements executed by Apollo Server.

---

## 🏗️ Architecture & How It Works

The execution pipeline and 3D visualizer are driven by **real server events**, not pre-scripted timers.

```
Browser (Vite Client :5173)                 Server (Apollo + Express :4000)
  │                                                      │
  ├─ 1. EventSource /events?requestId=UUID ────────────► │ SSE Client Register (Keep-Alive)
  │                                                      │
  ├─ 2. Wait 80ms (ensures SSE ready)                    │
  │                                                      │
  ├─ 3. POST /graphql (Header: x-request-id) ──────────► │ Apollo Execution Engine
  │                                                      │  ├─ ◈ Parser Hook
  │ ◄── SSE event: { step: "parse", ms: 1 } ─────────────┤  ├─ ✦ Validator Hook
  │ ◄── SSE event: { step: "validate", ms: 6 } ──────────┤  ├─ ⬡ Query.student Resolver
  │ ◄── SSE event: { step: "db:query", ms: 8 } ──────────┤  ├─ ◉ Database Query (Postgres/SQLite)
  │ ◄── SSE event: { step: "resolve:courses" } ──────────┤  ├─ ⬡ Student.courses Resolver
  │ ◄── SSE event: { step: "__done__" } ─────────────────┘  └─ ✓ Response Assembly
  │                                                      │
  └◄── HTTP 200 JSON Response ───────────────────────────┘
```

### The Apollo Plugin (`tracingPlugin.ts`)

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

### Why `documentStore: null`?

Apollo Server v4 caches parsed and validated query documents in memory by default. On repeated runs of the same query string, it reuses the cached AST and skips `parsingDidStart` and `validationDidStart` entirely.

Setting `documentStore: null` disables the cache, forcing Apollo to re-parse and re-validate every request so the full pipeline is always visible.

### The SSE Hook (`useGraphQLTrace`)

The client hook opens an `EventSource` to `/events?requestId=UUID`, listens for streaming step notifications, and fires the HTTP request to `/graphql`. The base URL automatically resolves locally or to cloud backend (`VITE_API_URL`).

---

## 📁 Repository Structure

```text
graphql_learner/
├── client/                        # Vite + React 18 Frontend
│   └── src/
│       ├── App.tsx                # 3-Tab Routing (REST | Solution | Going Deeper)
│       ├── index.css              # Design tokens & mobile breakpoints
│       ├── config/api.ts          # Base API URL resolver (local / production)
│       ├── components/
│       │   ├── FakeDemo/          # Query builder, field toggles & visualizer layout
│       │   ├── Theory3D/          # 3D Solar System visualizer (Three.js)
│       │   ├── N1Visualizer/      # N+1 & DataLoader streamer
│       │   ├── GoingDeeper/       # Advanced topics page layout
│       │   ├── MutationDemo/      # Mutation builder & SQL diff panel
│       │   ├── PipelineVisualizer/# Animated node visualizer
│       │   ├── ExecutionTimeline/ # Horizontal execution timeline bars
│       │   └── RestVsGraphQL/     # Animated REST vs GraphQL waterfall comparison
│       ├── data/                  # Schema presets, domain definitions & explanations
│       └── hooks/                 # Custom SSE trace listeners for queries & mutations
│
└── server/                        # Node.js + Apollo Server v4 Backend
    └── src/
        ├── index.ts               # Express app, SSE `/events` route, dynamic CORS
        ├── schema/typeDefs.ts     # GraphQL SDL schema
        ├── resolvers/index.ts     # Async query, mutation & relational resolvers
        ├── db/
        │   ├── database.ts        # Hybrid SQLite / Supabase PostgreSQL adapter
        │   └── seed_postgres.ts   # Cloud database schema migration & seed script
        ├── plugins/tracingPlugin.ts # Apollo plugin emitting SSE execution events
        └── tracer.ts              # SSE client registry & event emitter helper
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | Component UI & dev server |
| **3D Graphics** | Three.js | Procedural planets & rocket flight curve |
| **Animations** | Framer Motion | Node transitions, field line enter/exit, button micro-animations |
| **Styling** | Vanilla CSS | Cream Neobrutalism design system — bold 3px borders, offset shadows |
| **Backend API** | Apollo Server v4 + Express | Real GraphQL execution server & SSE stream (port 4000) |
| **Database** | Supabase (PostgreSQL) / SQLite | Hybrid cloud/local relational database |
| **Live Tracing** | Server-Sent Events (SSE) | One-directional push stream from server to browser per execution step |

---

## ☁️ Distributed Cloud Deployment

GraphScope supports a cloud architecture:

```text
 ┌─────────────────┐       GraphQL / SSE       ┌─────────────────┐
 │   Vercel (UI)   │ ────────────────────────> │ Render / Railway│
 │ React / Vite    │                           │ (Node + Apollo) │
 └─────────────────┘                           └────────┬────────┘
                                                        │ SQL Queries
                                                        ▼
                                               ┌─────────────────┐
                                               │    Supabase     │
                                               │   (Postgres)    │
                                               └─────────────────┘
```

1. **Supabase**: Managed Cloud PostgreSQL Database (Seed with `DATABASE_URL="..." npm run seed:postgres`).
2. **Render / Railway**: Node.js Apollo Server + SSE endpoint.
3. **Vercel**: Static React frontend deployment.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install
```bash
git clone https://github.com/AyushPatil615/GraphQL.git
cd GraphQL

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Run Local Development
Open **two terminal windows**:

**Terminal 1 (Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🎨 Design System

The UI uses **Cream Neobrutalism**:
- Warm cream background (`#FFF8F0`) with a dot grid.
- Bold 3px black borders with offset box shadows (`5px 5px 0 #000`).
- Saturated accent colors (sky blue, lavender, coral, mint).
- Typography: `Nunito` (sans-serif UI) + `JetBrains Mono` (code & stats).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
