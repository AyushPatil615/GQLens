# GraphScope

> Watch a GraphQL query travel through resolvers, step by step — with plain-English explanations at every stage.

**For:** Bootcamp grads, junior devs, and self-taught learners who are new to GraphQL.

---

## What is this?

GraphScope shows you _exactly_ what happens when a GraphQL query runs — from parsing to database to response — with animated visualizations and subtitle-style captions that assume zero GraphQL knowledge.

## Project Structure

```
graphql_learner/
├── client/          # React + TypeScript + Tailwind frontend (Vite)
└── server/          # Node.js + Apollo Server + SQLite backend
```

## Getting Started

### Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd server
npm install
npm run dev
# → http://localhost:4000
```

## Build Phases

| Phase | Status | Description |
|---|---|---|
| Phase 0 | ✅ Done | Foundation & Setup |
| Phase 1 | 🔜 Next | Fake Demo (hardcoded event log + animations) |
| Phase 2 | ⏳ Later | User Testing & Iteration |
| Phase 3 | ⏳ Later | Real Apollo Server + SQLite + Instrumentation |
| Phase 4 | ⏳ Later | Full UI Build |
| Phase 5 | ⏳ Later | Polish & Ship |

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS v4 |
| Animations | Framer Motion + React Flow |
| Backend | Node.js + Apollo Server + Express |
| Database | SQLite (via better-sqlite3) |

---

*GraphScope v1 — Beginner-first GraphQL visualizer*
