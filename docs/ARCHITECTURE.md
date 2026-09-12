# CareerOS system architecture

Status: engineering handoff

## Architectural position

CareerOS is a split-runtime monorepo: React owns interaction and presentation, Node/Express owns authenticated orchestration and business workflows, Flask owns AI/LLM workloads, Firestore owns realtime user-facing state, and MongoDB remains available for secondary bulk and analytical data. The boundaries are deliberate: each runtime can scale and fail independently without turning an AI timeout into an auth or dashboard outage.

## Target top-level structure

```text
careeros/
├── client/              # React frontend; target name for current Frontend/client
├── server/              # Node.js/Express core API; target name for current Backend/server
├── ml-service/           # Flask AI/LLM deployable; target name for current Backend/ml-service
├── DB/                   # Firebase Auth/Firestore config, schemas, and query layer
├── shared/               # Cross-runtime contracts and constants
├── infra/                # Deployment, CI/CD, and environment templates
├── docs/                 # Architecture and operating decisions
└── scripts/              # Seed, migration, and local operational scripts
```

Current repository mapping:

- `Frontend/client` is the current `client` boundary.
- `Backend/server` is the current `server` boundary.
- `Backend/ml-service` is the current `ml-service` boundary.
- `Models` contains legacy MongoDB models and remains secondary until its data is migrated or explicitly retained.
- `DB` is already the Firestore boundary and must remain separate from feature code.

A future repository cleanup may flatten the first three directories to the target names. That is a mechanical migration, not a reason to blur runtime ownership now.

### Why `ml-service` is separate

`ml-service` uses Python/Flask and has different dependency, CPU/GPU, latency, and deployment characteristics than Node/Express. Independent deployment lets AI workers scale separately, keeps Python model libraries out of the core API image, and isolates an LLM timeout so authentication, resume saves, and dashboard reads remain responsive.

## Client structure

```text
client/src/
├── features/
│   ├── resume-builder/    # UI, state, Firestore/API calls for resume work
│   ├── ats-checker/       # comparison workflow and report display
│   ├── mock-interview/    # transcript, session state, feedback review
│   ├── test-generator/    # generated tests and attempt state
│   ├── mentorship/        # slot discovery and booking flow
│   └── dashboard/         # activity aggregation and profile summary
├── shared/
│   ├── components/        # reusable UI only
│   ├── hooks/             # auth, realtime query, and shared interaction hooks
│   └── lib/               # Firebase client and API wrappers
├── routes/                # route definitions and ProtectedRoute
└── styles/                # tokens and global styles
```

The feature-folder pattern is preferred over flat `components/`, `hooks/`, and `pages/` folders because a feature's UI, state, and API calls stay colocated. A developer working on mock interview can understand that module without hunting through three unrelated top-level folders, and the structure mirrors the five product modules.

## Server structure

```text
server/src/
├── routes/                # HTTP resource declarations
├── controllers/           # thin request/response adapters
├── services/              # reusable business rules and workflows
├── middleware/            # Firebase token verification, validation, errors
├── clients/               # ml-service client and DB query adapters
└── config/                # ports, feature flags, runtime configuration
```

Routes -> controllers -> services keeps HTTP concerns separate from business logic. Resume versioning, booking-conflict checks, and AI job orchestration can then be reused by an admin tool, scheduled job, or queue worker without duplicating route handlers. Controllers do not call Firestore, MongoDB, or Flask directly.

## ML service structure

```text
ml-service/
├── routes/                # Flask blueprints per AI task
├── llm_client.py          # local Ollama/API routing abstraction
├── api_llm_client.py      # remote provider adapter
├── prompts/               # versioned prompt templates
├── schemas/               # Pydantic request/response contracts
├── eval/                  # test_cases.json and run_eval.py
└── cache/                 # SQLite-backed response cache
```

All LLM logic lives here. The Node API sends validated task inputs and authenticated context; Flask returns task results or an explicit delayed/unavailable state. `llm_client.generate()` is the stable seam between task code and Ollama/API provider choice.

## Request flow and failure behavior

```text
React client
  -> Firebase Auth ID token
  -> Node/Express protected route
  -> service layer validates ownership and task input
  -> ml-service task endpoint
  -> llm_client routes to Ollama or API fallback
  -> Node persists result through DB query adapter
  -> Firestore onSnapshot updates the client dashboard
```

1. The client signs in with Firebase Auth and sends the ID token; an expired token fails at the server middleware with `401`, and no user data is read.
2. The server verifies the token, derives `uid` from the verified claims, and ignores any client-supplied `userId` for ownership decisions.
3. The server service calls `ml-service` with a bounded timeout and a correlation ID. A network failure or Flask timeout produces a `feedback delayed` state; it does not block resume saving or dashboard reads.
4. Flask routes the task through local Ollama or the configured API fallback. A missing local model, invalid JSON, or unavailable provider becomes a typed service error with no partial persistence.
5. The server writes successful task output through `DB/queries/` or the Mongo client adapter. A database failure is returned as a retryable error and is logged with the correlation ID.
6. Firestore listeners update the dashboard in realtime. Listener/index failures show a scoped activity error, not a blank authenticated shell.

## Data ownership boundary

Firestore owns realtime, user-facing state: `users`, versioned `resumes`, `atsReports`, `interviewSessions`, `testAttempts`, `mentorshipSlots`, `mentorshipBookings`, `jobMatches`, and the actively browsed `jobListings` subset. This supports simple ownership queries, realtime dashboard updates, and Firebase security rules.

MongoDB is secondary: retain large imported job archives, aggregation-heavy analytics, operational event history, or legacy records while they remain useful. Do not write the same active resume, booking, or dashboard state to both databases. `DB/README.md` is the detailed collection contract; `Models/` is the current legacy Mongo boundary.

## Auth flow

Firebase Auth issues the client ID token. Node middleware verifies that token on every protected route and derives the owner UID from verified claims; it never trusts a client-supplied `userId`. The server upserts `users/{uid}` and passes validated user context to services. `ml-service` never talks to Firebase directly: it receives task input and already-validated context from Node, which keeps identity and authorization in one place.

## Environment strategy

Each deployable unit owns its environment file. Copy the templates in `infra/` into the relevant local service directory; never commit real `.env` files.

Safe for the browser when restricted by Firebase settings:

- Firebase web config (`VITE_FIREBASE_API_KEY`, auth domain, project ID, storage bucket, sender ID, app ID, measurement ID)
- Public API base URLs

Server/ML/DB only:

- Firebase Admin client email and private key
- `MONGODB_URI`
- `LLM_API_KEY` / `OPENAI_API_KEY`
- internal service URLs and admin claims

The Firebase web API key is not an authorization secret, but Firebase Auth domain restrictions and Firestore rules are still required. Admin credentials and LLM keys must never reach Vite or be embedded in client bundles.

## Failure isolation policy

If `ml-service` or Ollama is down, the product remains usable: users can sign in, read the dashboard, save resumes, and retry AI features later. AI surfaces display `AI feedback temporarily unavailable` or `Feedback delayed` with a retry action. Core API health is not defined by model health; expose separate health/readiness signals so operators can distinguish them.

## Operational conventions

- Request IDs cross the client, server, and ML logs.
- Every protected write includes the verified UID at the service/query boundary.
- LLM calls have timeouts, bounded retries, response-schema validation, and provider metadata in logs.
- Firestore composite indexes are checked in with deployment configuration when a realtime query requires them.
- Secrets are injected by the deployment platform; local `.env` files are developer-only.
