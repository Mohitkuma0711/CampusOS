import { ArrowLeft, Compass, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="content placeholder-page" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: '16px' }}>
        <Sparkles size={16} /> 404 Error
      </div>
      <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', margin: '0 0 16px', letterSpacing: '-0.04em' }}>
        Page not found
      </h1>
      <p className="lead" style={{ maxWidth: '480px', margin: '0 auto 32px' }}>
        The page or section you were looking for doesn't exist or has moved. Let's get you back on track.
      </p>
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
        <button className="primary-button" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button className="outline-button" onClick={() => navigate('/resume')}>
          <Compass size={16} /> Resume Builder
        </button>
      </div>
    </main>
  )
}
