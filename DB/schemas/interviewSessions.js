// Firestore collection: interviewSessions. Required fields are marked required: true.
module.exports = {
  collection: 'interviewSessions',
  fields: {
    userId: { type: 'string', required: true },
    role: { type: 'string', required: true },
    questionSet: { type: 'array<map>', required: true },
    answers: { type: 'array<map>', required: true },
    sessionSummary: { type: 'map', required: false },
    status: { type: 'string', required: true, enum: ['in_progress', 'completed'] },
    createdAt: { type: 'timestamp', required: true },
    completedAt: { type: 'timestamp', required: false },
  },
  references: [{ field: 'userId', collection: 'users', kind: 'logical reference' }],
};
