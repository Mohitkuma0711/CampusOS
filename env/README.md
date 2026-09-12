# Environment configuration

Keep local secrets in this folder only. They are not committed to source control.

| Service | Active file | Template |
| --- | --- | --- |
| Vite client | `.env` | `frontend.env.example` |
| Express API | `server.env` | `server.env.example` |
| Flask ML service | `ml-service.env` | `ml-service.env.example` |
| Firebase/Firestore scripts | `database.env` | `database.env.example` |

Copy the corresponding template to its active filename before starting a service. Never expose server-only values (such as `GEMINI_API_KEY`, MongoDB credentials, or Firebase Admin credentials) in the client `.env` file.
