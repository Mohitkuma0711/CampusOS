# CareerOS

A full-stack career development platform.

## Project Structure

- `Frontend/client/`: React frontend (Vite)
- `Backend/server/`: Node.js Express backend (Core APIs)
- `Backend/ml-service/`: Flask service (AI/ML endpoints)
- `Models/`: Shared Mongoose persistence models
- `DB/`: Firebase/Firestore config, collection contracts, query layer, and security rules
- `env/`: centralized local environment files and service-specific templates

## Setup Instructions

## Local setup

1. Copy the relevant templates in `env/` to their active service filenames. See [`env/README.md`](env/README.md).
2. Install shared model dependencies: `cd Models && npm install`.
3. Install DB dependencies: `cd DB && npm install`.
4. Start the API: `cd Backend/server && npm install && npm run dev` (port `5000`).
5. Start the ML service: `cd Backend/ml-service && .venv/bin/python app.py` (port `5001`).
6. Start the client: `cd Frontend/client && npm install && npm run dev` (Vite port `5173`).

Health checks:

- API: `GET http://localhost:5000/api/health`
- ML service: `GET http://localhost:5001/health`

The client exposes Firebase login helpers through `src/context/AuthContext.jsx`. The API verifies Firebase ID tokens on `GET /api/users/me` and creates the matching MongoDB user document on first access.

Resume builder routes:

- Client: `http://localhost:5173/resume`
- API: authenticated `GET /api/resumes/draft` and `PUT /api/resumes/draft`

Firestore details, collection schemas, logical references, and migration boundaries are documented in [DB/README.md](DB/README.md). Firestore rules are in [DB/firestore.rules](DB/firestore.rules).

## Engineering handoff

- [System architecture](docs/ARCHITECTURE.md) — runtime boundaries, request flow, data ownership, auth, environments, and failure isolation.
- [LLM architecture](docs/LLM_ARCHITECTURE.md) — local Ollama/API routing and task failure contracts.
- [Conventions](docs/CONVENTIONS.md) — naming, commits, branches, and dependency boundaries.
- `env/` — per-service environment templates; browser-safe Firebase settings are separated from server secrets.
