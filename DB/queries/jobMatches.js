const { collectionRef, withCreatedTimestamp, readDoc } = require('./_helpers');

const matches = () => collectionRef('jobMatches');

async function saveJobMatch(data) {
  const reference = matches().doc();
  await reference.set(withCreatedTimestamp(data));
  return readDoc(await reference.get());
}

async function getJobMatchesByUser(userId, limit = 20) {
  const snapshot = await matches().where('userId', '==', userId).orderBy('matchScore', 'desc').limit(limit).get();
  return snapshot.docs.map(readDoc);
}

module.exports = { saveJobMatch, getJobMatchesByUser };
