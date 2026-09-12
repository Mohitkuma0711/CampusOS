// Firestore collection: testAttempts. Required fields are marked required: true.
module.exports = {
  collection: 'testAttempts',
  fields: {
    userId: { type: 'string', required: true },
    topic: { type: 'string', required: true },
    difficulty: { type: 'string', required: true, enum: ['beginner', 'intermediate', 'advanced'] },
    questions: { type: 'array<map>', required: true },
    answers: { type: 'array<map>', required: true },
    score: { type: 'number', required: true },
    createdAt: { type: 'timestamp', required: true },
  },
  references: [{ field: 'userId', collection: 'users', kind: 'logical reference' }],
};
