// Firestore collection: atsReports. Required fields are marked required: true.
module.exports = {
  collection: 'atsReports',
  fields: {
    userId: { type: 'string', required: true },
    resumeId: { type: 'string', required: true },
    jobDescriptionId: { type: 'string', required: false },
    score: { type: 'number', required: true },
    keywordGaps: { type: 'array<string>', required: true },
    acceptedSuggestionHistory: { type: 'array<map>', required: true },
    createdAt: { type: 'timestamp', required: true },
  },
  references: [
    { field: 'userId', collection: 'users', kind: 'logical reference' },
    { field: 'resumeId', collection: 'resumes', kind: 'logical reference' },
    { field: 'jobDescriptionId', collection: 'jobListings', kind: 'optional logical reference' },
  ],
};
