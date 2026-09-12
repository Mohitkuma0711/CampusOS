const { collectionRef, withCreatedTimestamp, readDoc, requireUserId } = require('./_helpers');

const atsReports = () => collectionRef('atsReports');

async function saveATSReport(userId, data) {
  requireUserId(userId);
  const reference = atsReports().doc();
  await reference.set(withCreatedTimestamp({ ...data, userId }));
  return readDoc(await reference.get());
}

async function getATSReportsByResume(userId, resumeId) {
  requireUserId(userId);
  const snapshot = await atsReports().where('userId', '==', userId).where('resumeId', '==', resumeId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(readDoc);
}

module.exports = { saveATSReport, getATSReportsByResume };
