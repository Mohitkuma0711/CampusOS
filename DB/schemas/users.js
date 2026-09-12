// Firestore collection: users. Required fields are marked required: true.
module.exports = {
  collection: 'users',
  fields: {
    firebaseAuthUid: { type: 'string', required: true, unique: true },
    profile: { type: 'map', required: true },
    experienceLevel: { type: 'string', required: true, enum: ['fresher', 'experienced'] },
    email: { type: 'string', required: false },
    createdAt: { type: 'timestamp', required: true },
    updatedAt: { type: 'timestamp', required: true },
  },
  references: [],
};
