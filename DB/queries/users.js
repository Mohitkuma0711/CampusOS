const { collectionRef, withCreatedTimestamp, timestamps, readDoc, requireUserId } = require('./_helpers');

const users = () => collectionRef('users');

async function createUser(userId, data) {
  requireUserId(userId);
  await users().doc(userId).set(withCreatedTimestamp(data));
  return getUser(userId);
}

async function getUser(userId) {
  requireUserId(userId);
  return readDoc(await users().doc(userId).get());
}

async function updateUser(userId, data) {
  requireUserId(userId);
  await users().doc(userId).set(timestamps(data), { merge: true });
  return getUser(userId);
}

module.exports = { createUser, getUser, updateUser };
