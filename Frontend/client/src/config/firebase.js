import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let firebaseApp = null
let auth = null
let db = null

// Test mode: when VITE_TEST_MODE=true, export a mock auth object so E2E
// tests can exercise the UI without real Firebase infrastructure.
if (import.meta.env.VITE_TEST_MODE === 'true') {
  console.log('[Firebase] Test mode active — using mock auth.')
  const listeners = []
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    emailVerified: true,
    phoneNumber: null,
    isAnonymous: false,
    providerData: [],
    stsTokenManager: { accessToken: 'mock', expirationTime: Date.now() + 3600_000, refreshToken: 'mock' },
  }
  auth = {
    _listeners: listeners,
    _user: mockUser,
    onAuthStateChanged(callback) {
      listeners.push(callback)
      setTimeout(() => callback(mockUser), 0)
      return () => { const i = listeners.indexOf(callback); if (i >= 0) listeners.splice(i, 1) }
    },
    get currentUser() { return mockUser },
  }
  db = {}
} else {
  const missingVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_APP_ID']
    .filter((name) => !import.meta.env[name])

  if (missingVars.length > 0) {
    console.error(
      `[Firebase] CRITICAL: Missing environment variables: ${missingVars.join(', ')}.\n` +
      `Auth, Firestore, and all Firebase features are disabled.\n` +
      `Set these in env/.env (local) or as build environment variables (CI/deploy).\n` +
      `See env/frontend.env.example for the full list.`
    )
  } else if (firebaseConfig.apiKey.startsWith('your-') || firebaseConfig.apiKey.length < 30) {
    console.error(
      `[Firebase] CRITICAL: VITE_FIREBASE_API_KEY looks like a placeholder ("${firebaseConfig.apiKey.slice(0, 12)}...").\n` +
      `Auth, Firestore, and all Firebase features are disabled.\n` +
      `Replace it with the real API key from the Firebase Console → Project Settings.`
    )
  } else {
    try {
      firebaseApp = initializeApp(firebaseConfig)
      auth = getAuth(firebaseApp)
      db = getFirestore(firebaseApp)
      console.log(`[Firebase] Initialized for project "${firebaseConfig.projectId}".`)
    } catch (error) {
      console.error('[Firebase] Failed to initialize:', error.message)
    }
  }
}

export { firebaseApp, auth, db }
