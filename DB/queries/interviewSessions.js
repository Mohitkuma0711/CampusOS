const { collectionRef, withCreatedTimestamp, timestamps, readDoc, requireUserId } = require('./_helpers');

const sessions = () => collectionRef('interviewSessions');

async function createInterviewSession(userId, data) {
  requireUserId(userId);
  const reference = sessions().doc();
  await reference.set(withCreatedTimestamp({ ...data, userId, status: data.status || 'in_progress' }));
  return readDoc(await reference.get());
}

async function saveInterviewAnswer(userId, sessionId, answers) {
  requireUserId(userId);
  await sessions().doc(sessionId).set(timestamps({ userId, answers }), { merge: true });
  return readDoc(await sessions().doc(sessionId).get());
}

async function completeInterviewSession(userId, sessionId, sessionSummary) {
  requireUserId(userId);
  await sessions().doc(sessionId).set(timestamps({ userId, sessionSummary, status: 'completed', completedAt: new Date() }), { merge: true });
  return readDoc(await sessions().doc(sessionId).get());
}

module.exports = { createInterviewSession, saveInterviewAnswer, completeInterviewSession };
