# GraphScope v1 — Beginner-First Build Plan

> **Audience for this version:** new coders learning GraphQL for the first
> time — bootcamp grads, junior devs, self-taught learners. Not senior
> engineers debugging production N+1 issues. Every decision below is
> filtered through that lens.

---

## 1. Revised Vision (v1 only)

Help a new coder go from *"I don't get why GraphQL exists"* to *"I can
watch a query travel through resolvers and understand what just
happened"* — using one domain, one growing query, and plain-English
narration at every step.

Everything else in the original full vision (Healthcare, Banking,
Federation, DataLoader, Query Cost Analyzer, Subscriptions) is real and
worth building — just not yet. It lives in `ROADMAP.md`, not in v1.

---

## 2. The Approach: Fake It, Test It, Then Make It Real

This is the most important section. Build in this order, and don't skip
step 1 even though it feels like "not real progress."

### Step 1 — Build the fake demo (1–3 days)
Hardcode **one** query and a **fake** event log. No backend, no Apollo,
no database. Just:

```json
[
  { "step": "parse", "ms": 5, "caption": "Reading your query text and turning it into a structure the computer understands." },
  { "step": "validate", "ms": 4, "caption": "Checking that 'name' and 'age' are real fields that exist on Student." },
  { "step": "resolve:Student", "ms": 12, "caption": "Running the Student resolver to fetch this data." },
  { "step": "db:query", "ms": 15, "caption": "Looking up the student row in the database." },
  { "step": "respond", "ms": 3, "caption": "Building the JSON response to send back." }
]
```

Wire this straight into an animated timeline + a simple resolver
diagram. This tells you, fast and cheap, whether the *visual moment*
is actually compelling — before you invest in a real engine underneath
it.

### Step 2 — Test it on an actual beginner
Show it to one real new coder (bootcamp student, junior dev, someone
in a learning Discord). Don't explain it out loud — just watch. If they
get lost or need you to narrate, the visualization or captions need to
get simpler *before* you write more code. This is cheap to do now and
expensive to discover later.

### Step 3 — Make it real
Once the fake version lands, swap the hardcoded event log for a real
instrumented Apollo Server + SQLite backend. By now you already know
the UI works, so this becomes execution, not a gamble.

### Step 4 — Ship early, ugly, and small
One domain, one growing query, rough styling. A 10-second GIF and a
"Show HN" / r/graphql post beats six months of silent building.

---

## 3. Who It's For (write this down, keep it visible)

- **Primary user:** someone who has written a few REST API calls but
  has never used GraphQL.
- **They don't yet know:** what a resolver is, what over-fetching means,
  why N+1 is a problem, what a schema even does.
- **Design implication:** every animation needs a subtitle-style plain
  English caption. Assume zero prior GraphQL vocabulary.

---

## 4. Revised Learning Flow

Old order (good for engineers) → **New order (for beginners)**:

| Step | What happens | Why it comes here |
|---|---|---|
| 0. **Feel the pain** | Animated REST waterfall: 4 separate network calls to get Student + Courses + Teacher | Beginners must *feel* the problem before the solution makes sense |
| 1. **See one GraphQL query fetch it all** | Same data, 1 request | The contrast is the whole pitch — lead with it |
| 2. **Add one field at a time** | Start with `{ student { name } }`, then add `age`, then `courses { title }` | Gentle on-ramp instead of a full query builder on day one |
| 3. **Watch it execute, narrated** | Parser → Validator → Resolver Tree → DB → JSON, each step captioned in plain English | This is the "aha" moment — the resolver tree *grows* as fields are added |
| 4. **Compare timelines** | REST timeline vs GraphQL timeline, side by side | Reinforces step 0–1 with real numbers |
| 5. *(later, not v1)* Debug / Optimize | DataLoader, query cost, N+1 | Meaningless without lived experience of the problem first — defer to v2 |

---

## 5. v1 Scope

### ✅ In scope
- **1 domain:** Education (Student, Course, Teacher)
- **1 comparison:** REST vs GraphQL, animated side by side
- **1 progressive query builder:** add fields one at a time (checkboxes,
  not a code editor)
- **1 narrated pipeline visualization:** Parser → Validator → Resolver
  Tree → DB → JSON, with plain-English captions
- **1 execution timeline:** ms-by-ms, same as your original sketch
- Real backend (Apollo Server + SQLite), instrumented — but only built
  in Step 3, after the fake version is validated

### ❌ Explicitly cut from v1 (parked in `ROADMAP.md`)
- Healthcare, Business, Banking, and all other domains
- Mutations, Subscriptions, Authentication Flow
- DataLoader Simulator, Query Cost Analyzer, Federation
- Monaco Editor / free-form query editing
- Plugin architecture / generic domain system

Don't build the generic "any domain can plug in" abstraction yet — you'll
guess the interface wrong with only one domain built. Extract it once a
second domain (v2) makes the real requirements obvious.

---

## 6. Minimal Architecture

```
graphscope/
├── engine/
│   ├── schema/            # Education GraphQL schema
│   ├── resolvers/         # real resolvers, wrapped with timing hooks
│   ├── db/                # SQLite + seed data
│   └── instrumentation.ts # emits step events for the timeline/tree
│
├── domains/
│   └── education/
│       ├── schema.graphql
│       ├── seed-data.sql
│       └── example-queries.json
│
├── ui/
│   ├── FakeDemo/           # Step 1 — hardcoded event log, no backend
│   ├── RestVsGraphQL/
│   ├── QueryBuilder/       # progressive, checkbox-based
│   ├── PipelineVisualizer/ # React Flow, narrated captions
│   └── ExecutionTimeline/
│
└── docs/
```

---

## 7. Build Order

1. Sketch the "aha moment" on paper/Figma — query on left, resolver
   tree lighting up on right, timeline ticking below. If this doesn't
   feel exciting as a static image, stop and rethink before coding.
2. Build the **fake demo** (Step 1 above) — hardcoded query + fake
   event log + animated timeline + resolver tree.
3. **Test on a real beginner.** Adjust captions/visuals based on where
   they get confused.
4. Build the real Education schema + SQLite seed data (Student, Course,
   Teacher, enrollments).
5. Stand up a real Apollo Server answering the same example queries —
   confirm via GraphQL Playground before touching UI.
6. Add the instrumentation layer — wrap parser/resolvers to emit a real
   step-by-step event log.
7. Swap the fake event log in your Step-1 UI for the real one.
8. Build the progressive Query Builder (checkboxes → live query string
   → real server).
9. Build the REST vs GraphQL waterfall comparison using the same data.
10. Polish captions, add the "feel the pain" step 0 intro.
11. Ship: deploy, write a README with a GIF, post to r/graphql, GraphQL
    Discords, "Show HN."

---

## 8. Simplified Tech Stack for v1

- **Frontend:** React, TypeScript, Tailwind, React Flow (used for both
  the resolver tree *and* the pipeline diagram — one animation system,
  not two)
- **Backend:** Node.js, Apollo Server, GraphQL
- **DB:** SQLite (simulation only, for v1)
- **Skip for now:** Monaco Editor (checkboxes are faster to build and
  friendlier for beginners than a raw code editor)

---

## 9. Definition of "Done" for v1

You're done with v1 when a new coder who has never used GraphQL can, on
their own, without you narrating out loud:

1. Understand *why* GraphQL exists after seeing the REST waterfall.
2. Add fields to a query and watch the resolver tree grow accordingly.
3. Explain in their own words what a resolver did, from the captions
   alone.

If that's not true yet, it's not the next feature that's missing — it's
the clarity of what you've already built.
