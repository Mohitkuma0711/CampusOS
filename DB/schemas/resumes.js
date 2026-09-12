// Firestore collection: resumes. Required fields are marked required: true.
module.exports = {
  collection: 'resumes',
  fields: {
    userId: { type: 'string', required: true },
    version: { type: 'number', required: true },
    resumeData: { type: 'map', required: true, description: 'Conversational builder saved state' },
    isActive: { type: 'boolean', required: true },
    createdAt: { type: 'timestamp', required: true },
    updatedAt: { type: 'timestamp', required: true },
  },
  references: [{ field: 'userId', collection: 'users', kind: 'logical reference' }],
};
