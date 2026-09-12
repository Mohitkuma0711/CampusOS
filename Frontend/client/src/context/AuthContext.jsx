import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { getUserProfile, updateUserExperienceLevel, upsertUserProfile } from '../lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [experienceLevel, setExperienceLevelState] = useState(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return undefined
    }
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      setLoading(false)
      if (!nextUser) {
        setExperienceLevelState(null)
        return
      }
      try {
        await upsertUserProfile(nextUser)
        const profile = await getUserProfile(nextUser.uid)
        setExperienceLevelState(profile?.experienceLevel ?? null)
      } catch { /* profile read failed, proceed with null level */ }
    })
  }, [])

  const setExperienceLevel = useCallback(async (level) => {
    if (!user) return
    setExperienceLevelState(level)
    try { await updateUserExperienceLevel(user.uid, level) } catch { /* test mode or offline */ }
  }, [user])

  const handleSignOut = useCallback(async () => {
    setUser(null)
    setExperienceLevelState(null)
    if (auth && typeof auth.signOut === 'function') await auth.signOut()
    else if (auth && typeof signOut === 'function') await signOut(auth)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase Auth is not configured')
    if (import.meta.env.VITE_TEST_MODE === 'true') {
      setUser(auth.currentUser)
      return { user: auth.currentUser }
    }
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      return await signInWithPopup(auth, provider)
    } catch (popupError) {
      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.code === 'auth/popup-closed-by-user' ||
        popupError.code === 'auth/cancelled-popup-request'
      ) {
        return await signInWithRedirect(auth, provider)
      }
      throw popupError
    }
  }, [])

  const value = {
    user,
    loading,
    experienceLevel,
    setExperienceLevel,
    signIn: (email, password) => auth ? signInWithEmailAndPassword(auth, email, password) : Promise.reject(new Error('Firebase Auth is not configured')),
    signUp: (email, password) => auth ? createUserWithEmailAndPassword(auth, email, password) : Promise.reject(new Error('Firebase Auth is not configured')),
    signInWithGoogle,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
