// Firestore collection: jobListings. Required fields are marked required: true.
module.exports = {
  collection: 'jobListings',
  fields: {
    title: { type: 'string', required: true },
    company: { type: 'string', required: true },
    description: { type: 'string', required: true },
    location: { type: 'string', required: true },
    skills: { type: 'array<string>', required: true },
    sourceUrl: { type: 'string', required: false },
    ownerId: { type: 'string', required: false },
    createdAt: { type: 'timestamp', required: true },
  },
  references: [{ field: 'ownerId', collection: 'users', kind: 'optional logical reference' }],
};
