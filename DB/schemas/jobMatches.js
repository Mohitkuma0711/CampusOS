// Firestore collection: jobMatches. Required fields are marked required: true.
module.exports = {
  collection: 'jobMatches',
  fields: {
    userId: { type: 'string', required: true },
    jobListingId: { type: 'string', required: true },
    matchScore: { type: 'number', required: true },
    matchedSkills: { type: 'array<string>', required: true },
    missingSkills: { type: 'array<string>', required: true },
    createdAt: { type: 'timestamp', required: true },
  },
  references: [
    { field: 'userId', collection: 'users', kind: 'logical reference' },
    { field: 'jobListingId', collection: 'jobListings', kind: 'logical reference' },
  ],
};
