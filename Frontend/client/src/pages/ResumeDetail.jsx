import { useEffect, useState } from 'react'
import { ArrowLeft, Copy, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteResumeDocument, forkResumeVersion, subscribeToUserDocument } from '../lib/firestore'
import { formatActivityDate } from '../hooks/useDashboardActivity.js'
import ResumeBuilder from '../components/ResumeBuilder.jsx'
import './Dashboard.css'

export default function ResumeDetail() {
  const { resumeId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [resume, setResume] = useState(undefined)
  const [forked, setForked] = useState(false)

  useEffect(() => {
    return subscribeToUserDocument('resumes', resumeId, user?.uid, setResume, () => setResume(null))
  }, [resumeId, user?.uid])

  if (resume === undefined) {
    return (
      <main className="detail-page">
        <p>Loading this resume...</p>
      </main>
    )
  }

  if (resume === null) {
    return (
      <main className="detail-page">
        <p>This resume is not available in your account.</p>
        <button className="quiet-link" onClick={() => navigate('/')}>
          <ArrowLeft size={15} /> Back to your dashboard
        </button>
      </main>
    )
  }

  const handleFork = async () => {
    const newId = await forkResumeVersion(user.uid, resume.resumeData, (resume.version || 1) + 1)
    setForked(true)
    if (newId) navigate(`/resume/${newId}`)
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this resume? This cannot be undone.')) return
    try {
      await deleteResumeDocument(user.uid, resume.id)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Failed to delete resume:', err)
    }
  }

  return (
    <main className="detail-page" style={{ paddingTop: '28px' }}>
      <button className="back-link" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Your dashboard
      </button>
      <header className="detail-header" style={{ marginTop: '24px', marginBottom: '28px' }}>
        <div>
          <span className="kicker">Resume version {resume.version || 1}</span>
          <h1>{resume.resumeData?.basics?.targetRole || 'Untitled resume'}</h1>
          <p>Last edited {formatActivityDate(resume.updatedAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="outline-button delete-button" onClick={handleDelete} title="Delete resume">
            <Trash2 size={15} /> Delete resume
          </button>
          <button className="outline-button" onClick={handleFork}>
            <Copy size={15} /> {forked ? 'New version created' : 'Fork new version'}
          </button>
        </div>
      </header>

      <div className="detail-builder" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
        <ResumeBuilder initialResume={resume.resumeData} resumeId={resume.id} />
      </div>
    </main>
  )
}
