const { collectionRef, withCreatedTimestamp, timestamps, readDoc, requireUserId } = require('./_helpers');

const attempts = () => collectionRef('testAttempts');

async function createTestAttempt(userId, data) {
  requireUserId(userId);
  const reference = attempts().doc();
  await reference.set(withCreatedTimestamp({ ...data, userId }));
  return readDoc(await reference.get());
}

async function saveTestAnswers(userId, attemptId, answers) {
  requireUserId(userId);
  await attempts().doc(attemptId).set(timestamps({ userId, answers }), { merge: true });
  return readDoc(await attempts().doc(attemptId).get());
}

async function finishTestAttempt(userId, attemptId, score) {
  requireUserId(userId);
  await attempts().doc(attemptId).set(timestamps({ userId, score }), { merge: true });
  return readDoc(await attempts().doc(attemptId).get());
}

module.exports = { createTestAttempt, saveTestAnswers, finishTestAttempt };
