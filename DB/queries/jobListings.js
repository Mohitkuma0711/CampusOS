const { collectionRef, withCreatedTimestamp, readDoc } = require('./_helpers');

const listings = () => collectionRef('jobListings');

async function createJobListing(data) {
  const reference = listings().doc();
  await reference.set(withCreatedTimestamp(data));
  return readDoc(await reference.get());
}

async function getJobListing(jobListingId) {
  return readDoc(await listings().doc(jobListingId).get());
}

async function getRecentJobListings(limit = 20) {
  const snapshot = await listings().orderBy('createdAt', 'desc').limit(limit).get();
  return snapshot.docs.map(readDoc);
}

module.exports = { createJobListing, getJobListing, getRecentJobListings };
