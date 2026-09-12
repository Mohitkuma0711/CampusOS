# CareerOS DB layer

This folder is the only database boundary for Firebase/Firestore. Route handlers and ML modules should import functions from `queries/`; they should never import the Firestore Admin SDK directly. The config module initializes one Admin Firestore instance from environment variables and exports it for all query modules.

## Why Firestore here

Firestore is used for user-facing CareerOS state because resume drafts, interview turns, test attempts, mentorship booking status, and match updates benefit from simple document reads and real-time listeners. The collection contracts in `schemas/` are intentionally explicit even though Firestore is schemaless: they give the team a shared shape, required/optional field expectations, and named logical references.

MongoDB remains the better boundary for bulk or analytical workloads already supported by the original backend. Keep large imported job-listing archives, aggregation-heavy analytics, and operational event history in MongoDB if those workloads outgrow document reads. Do not duplicate the same user-facing resume or booking state in both databases.

## Collections

| Collection | Purpose | Primary logical references |
| --- | --- | --- |
| `users` | Profile and Firebase Auth identity link | `firebaseAuthUid` is the Auth UID |
| `resumes` | Versioned conversational-builder drafts | `userId -> users` |
| `atsReports` | Resume and job-description comparison results | `userId -> users`, `resumeId -> resumes`, optional `jobDescriptionId -> jobListings` |
| `interviewSessions` | Role practice, answers, and feedback | `userId -> users` |
| `testAttempts` | Topic-based assessment attempts | `userId -> users` |
| `mentorshipSlots` | Mentor availability and booking state | `mentorId -> users` |
| `mentorshipBookings` | Student-to-mentor slot reservations | `studentId`, `mentorId -> users`; `slotId -> mentorshipSlots` |
| `jobListings` | Searchable job information | optional `ownerId -> users` |
| `jobMatches` | Per-user match scores and skill gaps | `userId -> users`; `jobListingId -> jobListings` |

Firestore has no foreign-key enforcement. Every reference above is a **logical reference** and must be validated by the query/service layer before writes that depend on another document.

## Local setup

1. Copy `env/database.env.example` to `env/database.env` and provide the Firebase Admin service-account values. Keep the private key out of source control.
2. Install this package's dependency from this directory: `npm install`.
3. Deploy rules with the Firebase CLI from the repository root: `firebase deploy --only firestore:rules` after configuring the target project.

`firestore.rules` makes user-owned documents private to the authenticated owner. Mentorship slots and job listings are publicly readable; writes are limited to the owning mentor/listing owner or an Admin SDK custom claim named `admin`.
