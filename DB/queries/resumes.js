const { collectionRef, withCreatedTimestamp, readDoc, requireUserId } = require('./_helpers');

const resumes = () => collectionRef('resumes');

async function createResume(userId, resumeData, version = 1) {
  requireUserId(userId);
  const reference = resumes().doc();
  await reference.set(withCreatedTimestamp({ userId, resumeData, version, isActive: true }));
  return readDoc(await reference.get());
}

async function getLatestResumeByUser(userId) {
  requireUserId(userId);
  const snapshot = await resumes().where('userId', '==', userId).orderBy('version', 'desc').limit(1).get();
  return snapshot.empty ? null : readDoc(snapshot.docs[0]);
}

async function updateResume(resumeId, data) {
  requireUserId(data.userId);
  await resumes().doc(resumeId).set({ ...data, updatedAt: new Date() }, { merge: true });
  return readDoc(await resumes().doc(resumeId).get());
}

module.exports = { createResume, getLatestResumeByUser, updateResume };
