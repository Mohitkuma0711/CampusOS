import { useEffect, useState } from 'react'
import { getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'

const ERROR_HINTS = {
  'auth/unauthorized-domain':
    'The current domain is not authorized for Firebase Auth. ' +
    'Add it in Firebase Console → Authentication → Settings → Authorized domains.',
  'auth/invalid-api-key':
    'The Firebase API key is invalid. Check VITE_FIREBASE_API_KEY in your build env.',
  'auth/operation-not-allowed':
    'Google sign-in is not enabled for this project. ' +
    'Enable it in Firebase Console → Authentication → Sign-in method.',
  'auth/popup-blocked':
    'Popup was blocked by the browser. Redirect sign-in will be attempted automatically.',
  'auth/network-request-failed':
    'A network error occurred. Check your internet connection and try again.',
}

export default function useAuthRedirectHandler() {
  const navigate = useNavigate()
  const [redirectError, setRedirectError] = useState('')

  useEffect(() => {
    if (!auth) {
      console.warn(
        '[Auth Redirect] Firebase Auth is not initialized. ' +
        'Check that VITE_FIREBASE_* environment variables are set correctly.'
      )
      return undefined
    }

    let active = true
    getRedirectResult(auth)
      .then((result) => {
        if (active && result?.user) {
          navigate('/hero', { replace: true })
        }
      })
      .catch((error) => {
        if (!active) return
        const code = error?.code || 'unknown'
        const message = error?.message || 'Redirect sign-in failed.'
        const hint = ERROR_HINTS[code] || ''

        console.error(
          `[Auth Redirect] Error code: ${code}\n` +
          `[Auth Redirect] Message: ${message}` +
          (hint ? `\n[Auth Redirect] Hint: ${hint}` : '')
        )

        setRedirectError(hint ? `${message} — ${hint}` : message)
      })

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (active && user) {
        navigate('/hero', { replace: true })
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [navigate])

  return redirectError
}
