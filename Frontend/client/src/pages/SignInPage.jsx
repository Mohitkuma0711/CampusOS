import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LogIn, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import useAuthRedirectHandler from '../hooks/useAuthRedirectHandler.js'
import './Dashboard.css'

export default function SignInPage() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const redirectError = useAuthRedirectHandler()
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  // Redirect to Hero section if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/hero', { replace: true })
    }
  }, [user, navigate])

  const handleGoogleSignIn = async () => {
    setError('')
    setWorking(true)
    try {
      const cred = await signInWithGoogle()
      if (cred?.user) {
        navigate('/hero', { replace: true })
      }
    } catch (authError) {
      setError(authError.message || 'Google sign-in could not be completed.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <main className="sign-in-page">
      <div className="sign-in-panel">
        <div className="brand">
          <span>CO</span>
          <strong>Career<span>OS</span></strong>
        </div>
        <div className="eyebrow">
          <Sparkles size={15} /> Your career, in one place
        </div>
        <h1>Pick up where<br /><em>you left off.</em></h1>
        <p>Your resumes, practice sessions, test progress, and mentor conversations follow you from one focused workspace to the next.</p>
        <button className="google-button" onClick={handleGoogleSignIn} disabled={working}>
          <LogIn size={17} /> {working ? 'Connecting...' : 'Continue with Google'} <ArrowRight size={16} />
        </button>
        {(error || redirectError) && <p className="auth-error" role="alert">{error || redirectError}</p>}
        <small className="privacy-note">Your activity is private to your account and secured by Firebase Auth.</small>
      </div>
      <div className="sign-in-aside">
        <span>CareerOS</span>
        <p>Small steps become<br /><em>a body of work.</em></p>
      </div>
    </main>
  )
}
