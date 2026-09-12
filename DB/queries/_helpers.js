const { FieldValue } = require('firebase-admin/firestore');
const { firestore } = require('../config/firebase');

const collectionRef = (name) => firestore.collection(name);
const timestamps = (data) => ({ ...data, updatedAt: FieldValue.serverTimestamp() });
const withCreatedTimestamp = (data) => ({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
const readDoc = (snapshot) => (snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null);
const requireUserId = (userId) => {
	if (!userId || typeof userId !== 'string') throw new Error('A Firebase Auth userId is required for this operation.');
	return userId;
};

module.exports = { collectionRef, timestamps, withCreatedTimestamp, readDoc, requireUserId };
