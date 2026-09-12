// Firestore collection: mentorshipSlots. Required fields are marked required: true.
module.exports = {
  collection: 'mentorshipSlots',
  fields: {
    mentorId: { type: 'string', required: true },
    startsAt: { type: 'timestamp', required: true },
    endsAt: { type: 'timestamp', required: true },
    booked: { type: 'boolean', required: true },
    timezone: { type: 'string', required: false },
  },
  references: [{ field: 'mentorId', collection: 'users', kind: 'logical reference' }],
};
