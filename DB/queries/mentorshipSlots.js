const { collectionRef, timestamps, readDoc } = require('./_helpers');

const slots = () => collectionRef('mentorshipSlots');

async function createMentorshipSlot(mentorId, data) {
  const reference = slots().doc();
  await reference.set({ ...data, mentorId, booked: false });
  return readDoc(await reference.get());
}

async function getAvailableMentorshipSlots() {
  const snapshot = await slots().where('booked', '==', false).orderBy('startsAt').get();
  return snapshot.docs.map(readDoc);
}

async function markSlotBooked(slotId, booked = true) {
  await slots().doc(slotId).set(timestamps({ booked }), { merge: true });
  return readDoc(await slots().doc(slotId).get());
}

module.exports = { createMentorshipSlot, getAvailableMentorshipSlots, markSlotBooked };
