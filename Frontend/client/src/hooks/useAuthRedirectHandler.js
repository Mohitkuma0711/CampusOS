import { useEffect, useState } from 'react'
import { getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'

export default function useAuthRedirectHandler() {
  const navigate = useNavigate()
  const [redirectError, setRedirectError] = useState('')

  useEffect(() => {
    if (!auth) return undefined

    let active = true
    getRedirectResult(auth)
      .then((result) => {
        if (active && result?.user) {
          navigate('/hero', { replace: true })
        }
      })
      .catch((error) => {
        if (active) setRedirectError(error.message || 'Redirect sign-in could not be completed.')
        console.error('Redirect sign-in error:', error.code, error.message)
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
