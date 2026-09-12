# CareerOS engineering conventions

## File and folder naming

- Use `kebab-case` for new files and folders: `resume-detail.jsx`, `firestore-client.js`, `resume-builder/`.
- Use `PascalCase` for React components and component files when the file exports one component: `ProtectedRoute.jsx`, `DashboardHome.jsx`.
- Use `camelCase` for JavaScript functions and variables; use `SCREAMING_SNAKE_CASE` only for true constants.
- Keep feature code colocated under the feature domain instead of creating new global type folders.
- Use explicit collection names from `DB/schemas/`; do not invent collection strings in route handlers.

## Commits

Use Conventional Commits:

```text
<type>(<scope>): <imperative summary>
```

Examples:

- `feat(resume): save conversational drafts by auth uid`
- `fix(auth): reject expired Firebase tokens`
- `docs(architecture): define ML failure isolation`
- `chore(infra): add staging environment template`

Keep the subject under  imperative and concise; explain migration or behavior risk in the body when needed.

## Branches

Use short lowercase names with a type prefix:

- `feature/resume-forking`
- `fix/firestore-index-error`
- `docs/system-architecture`
- `chore/upgrade-ollama-client`

Branches should describe one outcome and should not include credentials, ticket secrets, or personal names.

## Boundaries

- React talks to Node/API clients and Firebase client listeners; it does not import Node Admin SDK code.
- Node controllers do not call Firestore, MongoDB, or `ml-service` directly; services call adapters.
- `ml-service` owns prompts, LLM routing, validation, cache, and AI error semantics.
- `DB/queries/` is the only Firestore access layer; every user-owned operation requires a verified UID.
- Never log Firebase private keys, API keys, raw auth tokens, or full resume/interview content in production logs.
