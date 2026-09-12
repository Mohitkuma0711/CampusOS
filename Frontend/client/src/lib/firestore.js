import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../config/firebase'

export function subscribeToUserCollection(collectionName, userId, onData, onError, sortField = 'createdAt') {
  if (!db || !userId) return () => {}
  const reference = query(collection(db, collectionName), where('userId', '==', userId), orderBy(sortField, 'desc'))
  return onSnapshot(reference, (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError)
}

export function subscribeToUserDocument(collectionName, documentId, userId, onData, onError) {
  if (!db || !userId || !documentId) return () => {}
  return onSnapshot(doc(db, collectionName, documentId), (snapshot) => {
    const data = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
    if (data && data.userId !== userId) return onData(null)
    onData(data)
  }, onError)
}

export function subscribeToResumeReports(userId, resumeId, onData, onError) {
  if (!db || !userId || !resumeId) return () => {}
  const reference = query(collection(db, 'atsReports'), where('userId', '==', userId), where('resumeId', '==', resumeId), orderBy('createdAt', 'desc'))
  return onSnapshot(reference, (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError)
}

export async function upsertUserProfile(user) {
  if (!db || !user) return
  const reference = doc(db, 'users', user.uid)
  const existing = await getDoc(reference)
  const isNew = !existing.exists()
  const profile = {
    firebaseAuthUid: user.uid,
    profile: { name: user.displayName || '', email: user.email || '', photoUrl: user.photoURL || '' },
    email: user.email || '',
    lastActive: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (isNew) {
    profile.experienceLevel = null
    profile.createdAt = serverTimestamp()
  }
  await setDoc(reference, profile, { merge: true })
}

export async function updateUserExperienceLevel(userId, level) {
  if (!db || !userId) return
  await updateDoc(doc(db, 'users', userId), { experienceLevel: level, updatedAt: serverTimestamp() })
}

export async function getUserProfile(userId) {
  if (!db || !userId) return null
  const snapshot = await getDoc(doc(db, 'users', userId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function getActiveDraft(userId) {
  if (!db || !userId) return null
  const reference = doc(db, 'resumes', `${userId}_active`)
  const snapshot = await getDoc(reference)
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  if (data.userId !== userId) return null
  return { id: snapshot.id, ...data }
}

export async function saveResumeDraft(userId, resumeData, version = 1) {
  if (!db || !userId) return null
  const reference = doc(db, 'resumes', `${userId}_active`)
  await setDoc(reference, { userId, resumeData, version, isActive: true, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
  return reference.id
}

export async function saveResumeVersion(userId, resumeId, resumeData, version = 1) {
  if (!db || !userId || !resumeId) return null
  await setDoc(doc(db, 'resumes', resumeId), { userId, resumeData, version, isActive: true, updatedAt: serverTimestamp() }, { merge: true })
  return resumeId
}

export async function forkResumeVersion(userId, resumeData, version) {
  if (!db || !userId) return null
  const reference = await addDoc(collection(db, 'resumes'), { userId, resumeData, version, isActive: true, updatedAt: serverTimestamp(), createdAt: serverTimestamp() })
  return reference.id
}

export async function saveResumeVersionWithTag(userId, resumeId, resumeData, version, source) {
  if (!db || !userId || !resumeId) return null
  const updates = { userId, resumeData, version, isActive: true, updatedAt: serverTimestamp() }
  if (source) updates.source = source
  await setDoc(doc(db, 'resumes', resumeId), updates, { merge: true })
  return resumeId
}

export async function createUserScopedDocument(collectionName, userId, data) {
  if (!db || !userId) return null
  return addDoc(collection(db, collectionName), { ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function deleteResumeDocument(userId, resumeId) {
  if (!db || !userId || !resumeId) return false
  const reference = doc(db, 'resumes', resumeId)
  await deleteDoc(reference)
  return true
}
