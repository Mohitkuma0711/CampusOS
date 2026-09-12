# Shared contracts

This boundary contains versioned contracts shared by client and server, such as the conversational resume shape, API error codes, collection-name constants, and generated validation types. Keep runtime-specific adapters out of this folder: browser Firebase code belongs in the client, Admin Firestore code belongs in `DB`, and Python models belong in `Backend/ml-service`.

Target contents:

```text
shared/
├── contracts/       # resume, ATS, interview, test, mentorship shapes
├── constants/       # stable route/status/collection constants
└── README.md
```
