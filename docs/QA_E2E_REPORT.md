# CareerOS pre-demo E2E verification

Date: 2026-09-11  
Scope: current workspace after the Firebase dashboard, Firestore boundary, and Ollama work  
Method: live local services, browser route checks, endpoint smoke tests, source inspection, build/diagnostic checks

## Executive result

**Demo readiness: fail.** Authentication protection, service startup, local JSON generation, and the resume builder shell are present. The requested end-to-end product loops are not complete: ATS, mock interview, tests, mentorship, Firestore persistence from the client, persona branching, and several dashboard detail flows are either placeholders or disconnected from the active UI.

## Test environment evidence

- Frontend started from `Frontend/client` on `http://127.0.0.1:5177/`.
- Node API started on `http://127.0.0.1:5000`.
- Flask ML service started on `http://127.0.0.1:5001`.
- Flask startup detected `qwen2.5:7b` and `llama3.1:8b` through Ollama.
- `GET /health` on the ML service returned `UP`.
- The available `/api/llm/ats-check` endpoint returned parseable JSON.
- Frontend production build passed; Node, Python, and DB diagnostics passed.

## Results by requested flow

| Flow | Result | Evidence and failure note |
| --- | --- | --- |
| 1. Auth flow | **PARTIAL / BLOCKED** | `ProtectedRoute` blocks `/` and `/resume` in a fresh browser session; direct navigation landed on `/signin` before dashboard content. Real Google redirect, refresh persistence, and switching between two Google accounts were not executable without two test accounts and a configured Firebase Auth browser session. Code includes `signInWithRedirect`, `getRedirectResult`, and `onAuthStateChanged`. Defect: `/dashboard` and `/resume-builder` are not registered route aliases; direct visits produce an unmatched-route blank state instead of a redirect. |
| 2. Fresher resume-to-dashboard loop | **FAIL** | `ResumeBuilder.jsx` has no fresher/experienced gating question, no internship/training branch, and no ATS UI. The builder saves through `Frontend/client/src/lib/firestore.js` only when Firestore is configured, but there is no completed ATS report persistence or end-to-end dashboard producer. The dashboard listener exists, but it cannot show the requested loop without documents being created. |
| 3. Experienced resume loop | **FAIL** | The builder has repeatable education/experience/project arrays, but no experience-level branch, no explicit `add another job` flow tied to a persona gate, and no prompt templates such as `resume_feedback_experienced_v1.txt`. The ML service uses a generic `_prompt_for()` string in `llm_routes.py`; no versioned fresher/experienced prompt directory exists. |
| 4. Mock interview | **FAIL** | `/interview` renders `FeaturePlaceholder`. There is no question-generation UI, answer submission, differentiated feedback, session completion, or Firestore summary write. `/api/llm/mock-interview-feedback` exists, but it is not connected to a client workflow and requires the API provider by default. |
| 5. Test generator and mentorship | **FAIL** | `/tests` and `/mentorship` render placeholders. There is no difficulty-aware test generation UI, answer scoring, slot booking UI, or double-booking transaction/conflict check exercised by the app. Query helpers exist for mentorship data, but no route/service connects them to the client. |
| 6. Local LLM resilience | **PARTIAL / PASS AT CLIENT BOUNDARY** | With `OLLAMA_HOST=http://127.0.0.1:1`, the client raised `LocalLLMUnavailableError` quickly; it did not hang. Normal Ollama startup and structured JSON generation passed. API fallback was not fully demonstrable because no API key/provider was configured. The current Flask routes do not translate provider errors into a consistent user-facing `AI feedback temporarily unavailable` response, and no frontend AI feature consumes that state. |
| 7. Cross-cutting checks | **PARTIAL / FAIL** | Firestore listeners filter by `userId == currentUser.uid`, and DB query helpers enforce required user IDs. However, the active resume builder writes directly through the browser Firestore helper rather than exclusively through the requested `DB/queries/` boundary. No direct Firestore document spot-check was possible without a configured authenticated test user. Loading states exist for protected auth, dashboard sync, and resume detail; placeholder feature routes have no feature loading state because no feature workflow exists. |

## Auth-specific checks

### Fresh session

**PASS for route protection.** Opening `/` and `/resume` directly while unauthenticated resulted in `/signin` with no dashboard flash.

**BLOCKED for Google redirect.** A real `signInWithRedirect` round trip requires Firebase Auth enabled for Google and a browser test account. The code path is present in `AuthContext.jsx` and `useAuthRedirectHandler.js`, but it was not falsely marked as a live pass without credentials.

### Direct route coverage

- `/` -> protected and redirects to `/signin`.
- `/resume` -> protected and redirects to `/signin`.
- `/dashboard` -> **unmatched route**, no redirect.
- `/resume-builder` -> **unmatched route**, no redirect.

This should be fixed before demo links or bookmarks use those aliases.

## Data ownership findings

- The Firestore rules and query modules enforce logical ownership for user documents.
- The dashboard uses realtime `onSnapshot` listeners for resumes, ATS reports, interviews, tests, and bookings.
- The active client resume save path writes directly to Firestore from `lib/firestore.js`; this conflicts with the stated rule that route handlers and application code should use `/DB/queries/` as the only Firestore boundary.
- The Node server still exposes Mongo-backed `/api/resumes/draft` and `/api/users/me`, while the dashboard reads Firestore. This creates two resume/user paths and means the currently exercised resume flow is not a single persistence loop.

## Loading and error-state audit

1. **Covered:** `ProtectedRoute` renders `Checking your CareerOS session...` while auth resolves.
2. **Covered:** Dashboard renders `Syncing your activity...` while listeners initialize.
3. **Covered:** Resume detail renders `Loading this resume...` while its document listener resolves.
4. **Missing:** ATS checker loading/error UI because no ATS checker page exists.
5. **Missing:** Mock interview question-generation, answer-submit, and completion loading/error UI.
6. **Missing:** Test generation and scoring loading/error UI.
7. **Missing:** Mentorship availability, booking, and conflict-error UI.
8. **Missing:** A consistent frontend rendering of `LocalLLMUnavailableError` or API fallback failure.
9. **Defect:** Unmatched paths such as `/dashboard` produce a blank route state rather than a not-found page or protected redirect.

## Prioritized bug list

### P0: blocks the requested demo

1. Implement actual client workflows for ATS, mock interview, tests, and mentorship; current routes are placeholders.
2. Add fresher/experienced branching to the conversational resume builder, including internship/training for freshers and full experience loops for experienced users.
3. Connect completed workflows to Firestore writes and dashboard listeners, including ATS reports, interview summaries, test attempts, and mentorship bookings.
4. Choose one resume persistence owner for the active flow. Either route writes through authenticated Node/`DB/queries/` adapters or explicitly make the browser Firestore layer the owner; do not maintain disconnected Mongo and Firestore draft paths.

### P1: security and navigation correctness

5. Add aliases or a not-found route for `/dashboard` and `/resume-builder`; direct protected URLs must never land on an unmatched blank screen.
6. Add server-side orchestration that derives UID from the verified Firebase token and passes it to all write services; do not trust body `userId` values.
7. Add integration tests using Firebase Emulator Suite so ownership, realtime updates, and double-booking conflicts can be verified without real accounts.

### P2: resilience and demo polish

8. Add versioned prompt templates and schemas for fresher/experienced resume feedback and persona-adapted interview questions.
9. Translate ML provider failures into stable API states and visible retry UI.
10. Add loading, empty, and error states to every feature route.

## Recommended next verification gate

Do not call this demo-ready until a Firebase Emulator Suite test run proves: two users cannot read each other's documents, a resume/ATS write appears through `onSnapshot`, a fork creates a new version, and two booking attempts for one slot result in exactly one confirmed booking.
