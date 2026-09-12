const { collectionRef, withCreatedTimestamp, timestamps, readDoc, requireUserId } = require('./_helpers');

const bookings = () => collectionRef('mentorshipBookings');

async function createMentorshipBooking(userId, data) {
  requireUserId(userId);
  const reference = bookings().doc();
  await reference.set(withCreatedTimestamp({ ...data, userId, studentId: data.studentId || userId, status: data.status || 'requested' }));
  return readDoc(await reference.get());
}

async function getBookingsByStudent(studentId) {
  requireUserId(studentId);
  const snapshot = await bookings().where('studentId', '==', studentId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(readDoc);
}

async function updateMentorshipBooking(userId, bookingId, data) {
  requireUserId(userId);
  await bookings().doc(bookingId).set(timestamps({ ...data, userId }), { merge: true });
  return readDoc(await bookings().doc(bookingId).get());
}

module.exports = { createMentorshipBooking, getBookingsByStudent, updateMentorshipBooking };
