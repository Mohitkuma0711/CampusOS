// Firestore collection: mentorshipBookings. Required fields are marked required: true.
module.exports = {
  collection: 'mentorshipBookings',
  fields: {
    userId: { type: 'string', required: true },
    studentId: { type: 'string', required: true },
    mentorId: { type: 'string', required: true },
    slotId: { type: 'string', required: true },
    status: { type: 'string', required: true, enum: ['requested', 'confirmed', 'cancelled', 'completed'] },
    notes: { type: 'string', required: false },
    createdAt: { type: 'timestamp', required: true },
    updatedAt: { type: 'timestamp', required: true },
  },
  references: [
    { field: 'userId', collection: 'users', kind: 'logical reference' },
    { field: 'studentId', collection: 'users', kind: 'logical reference' },
    { field: 'mentorId', collection: 'users', kind: 'logical reference' },
    { field: 'slotId', collection: 'mentorshipSlots', kind: 'logical reference' },
  ],
};
