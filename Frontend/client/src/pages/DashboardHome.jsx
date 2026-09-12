import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, FileText, LogOut, MessageCircle, Pencil, Plus, Sparkles, Target, Trash2, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteResumeDocument } from '../lib/firestore.js'
import useDashboardActivity, { formatActivityDate, getTimestamp } from '../hooks/useDashboardActivity.js'
import './Dashboard.css'

function EmptySection({ children, to, label }) {
  const navigate = useNavigate()
  return <div className="empty-section"><p>{children}</p><button className="quiet-link" onClick={() => navigate(to)}>{label} <ArrowRight size={15} /></button></div>
}

function SectionHeading({ eyebrow, title, icon: Icon, badge }) {
  return (
    <div className="dashboard-section-heading">
      <div>
        <span className="section-icon"><Icon size={17} /></span>
        <div>
          <span className="kicker">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {badge && <span className="section-badge">{badge}</span>}
    </div>
  )
}

export default function DashboardHome() {
  const { user, signOut } = useAuth()
  const { activity, loading, error } = useDashboardActivity(user?.uid)
  const [difficulty, setDifficulty] = useState('all')
  const navigate = useNavigate()
  const bestScore = activity.atsReports.reduce((best, report) => Math.max(best, Number(report.score) || 0), 0)
  const completedInterviews = activity.interviewSessions.filter((session) => session.status === 'completed').length
  const filteredTests = useMemo(() => difficulty === 'all' ? activity.testAttempts : activity.testAttempts.filter((attempt) => attempt.difficulty === difficulty), [activity.testAttempts, difficulty])
  const latestReports = activity.atsReports.slice(0, 4)
  const resumeScore = (resume) => activity.atsReports.find((report) => report.resumeId === resume.id)?.score
  const firstName = user?.displayName?.split(' ')[0] || 'there'

  const handleDeleteResume = async (e, resumeId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this resume? This cannot be undone.')) return
    try {
      await deleteResumeDocument(user.uid, resumeId)
    } catch (err) {
      console.error('Failed to delete resume:', err)
    }
  }

  return <main className="dashboard-home"><section className="profile-header"><div className="profile-identity">{user?.photoURL ? <img src={user.photoURL} alt="" className="profile-photo" /> : <div className="profile-photo profile-initials">{firstName[0]}</div>}<div><p className="kicker">Your CareerOS</p><h1>Good to see you, {firstName}.</h1><p>Here is the work you have already put in motion.</p></div></div><button className="quiet-link sign-out-button" onClick={signOut}><LogOut size={15} /> Sign out</button></section><div className="summary-strip"><div><strong>{activity.resumes.length}</strong><span>resumes</span></div><div><strong>{bestScore || '—'}{bestScore ? '%' : ''}</strong><span>best ATS score</span></div><div><strong>{completedInterviews}</strong><span>mock interviews completed</span></div><div className="summary-next"><span>Next useful step</span><button onClick={() => navigate(activity.resumes.length ? `/resume/${activity.resumes[0].id}` : '/resume')}>{activity.resumes.length ? 'Continue your resume' : 'Build your first resume'} <ArrowRight size={14} /></button></div></div><div className="dashboard-skill-action"><Sparkles size={18} /><div><strong>Tailor skills by job title</strong><span>No job description needed — get role-based suggestions in seconds.</span></div><button className="outline-button" onClick={() => navigate('/resume?skills=1')}>Find skills <ArrowRight size={14} /></button></div>{loading && <div className="dashboard-loading" aria-live="polite">Syncing your activity...</div>}{error && <div className="dashboard-error" role="alert">{error}</div>}

    <section className="activity-section resumes-section"><SectionHeading eyebrow="Your documents" title="Resumes" icon={FileText} />{activity.resumes.length ? <div className="resume-list">{activity.resumes.map((resume) => <article className="resume-row" key={resume.id}><div className="resume-mark"><FileText size={18} /></div><div className="resume-row-copy"><strong>{resume.resumeData?.basics?.targetRole || 'Untitled resume'}</strong><span>Version {resume.version || 1} · Edited {formatActivityDate(resume.updatedAt)}</span></div><span className="resume-score">{resumeScore(resume) ? `${resumeScore(resume)}% ATS` : 'Not checked'}</span><div className="resume-actions"><button className="delete-action-btn" onClick={(e) => handleDeleteResume(e, resume.id)} title="Delete resume" aria-label={`Delete ${resume.resumeData?.basics?.targetRole || 'resume'}`}><Trash2 size={16} /></button><button className="row-action" onClick={() => navigate(`/resume/${resume.id}`)} aria-label={`View ${resume.resumeData?.basics?.targetRole || 'resume'}`} title="Open resume"><ArrowRight size={17} /></button></div></article>)}</div> : <EmptySection to="/resume" label="Build your first resume">No resume drafts yet. Start with a guided conversation about your experience.</EmptySection>}</section>

    <section className="activity-section ats-history"><SectionHeading eyebrow="Signals over time" title="ATS reports" icon={Target} badge="Coming Soon" />{latestReports.length ? <div className="ats-history-grid"><div className="score-trend" aria-label="ATS score progression">{latestReports.map((report) => <div className="trend-point" key={report.id} style={{ height: `${Math.max(18, Number(report.score) || 0)}%` }}><strong>{report.score}%</strong><i /></div>)}</div><div className="report-list">{latestReports.map((report) => <div className="report-row" key={report.id}><span>{formatActivityDate(report.createdAt)}</span><strong>{report.score}%</strong><small>{report.keywordGaps?.length || 0} keyword gaps</small></div>)}</div></div> : <EmptySection to="/ats" label="Preview ATS Engine">ATS scoring and keyword gap detection are arriving soon. Preview features and join early access.</EmptySection>}</section>

    <section className="activity-section interview-history"><SectionHeading eyebrow="Practice log" title="Interview sessions" icon={MessageCircle} badge="Coming Soon" />{activity.interviewSessions.length ? <div className="interview-list">{activity.interviewSessions.map((session) => <button className="interview-row" key={session.id} onClick={() => navigate(`/interview/${session.id}`)}><div><strong>{session.role || 'Practice session'}</strong><span>{formatActivityDate(session.createdAt)} · {session.status === 'completed' ? 'Completed' : 'In progress'}</span></div><p>{session.sessionSummary?.headline || session.sessionSummary?.summary || 'Open the session to review your feedback.'}</p><ArrowRight size={17} /></button>)}</div> : <EmptySection to="/interview" label="Preview Mock Interview">AI-powered role practice sessions are in active development. Preview what's coming.</EmptySection>}</section>

    <section className="activity-section tests-history"><div className="section-heading-with-filter"><SectionHeading eyebrow="Knowledge in motion" title="Test attempts" icon={Trophy} badge="Coming Soon" /><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter tests by difficulty"><option value="all">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>{filteredTests.length ? <div className="test-history-list">{filteredTests.map((attempt) => <div className="test-history-row" key={attempt.id}><div><strong>{attempt.topic}</strong><span>{attempt.difficulty} · {formatActivityDate(attempt.createdAt)}</span></div><b>{attempt.score}%</b></div>)}</div> : <EmptySection to="/tests" label="Preview Skill Tests">Adaptive skill assessments and practice benchmarks are arriving soon.</EmptySection>}</section>

    <section className="activity-section mentorship-history"><SectionHeading eyebrow="People in your corner" title="Mentorship" icon={CalendarDays} badge="Coming Soon" />{activity.mentorshipBookings.length ? <div className="booking-list">{activity.mentorshipBookings.map((booking) => <div className="booking-row" key={booking.id}><div className="booking-date"><CalendarDays size={16} /><span>{formatActivityDate(booking.startsAt || booking.createdAt)}</span></div><div><strong>Mentorship conversation</strong><span>{booking.status} · Mentor {booking.mentorId}</span></div><CheckCircle2 size={17} className={booking.status === 'confirmed' ? 'confirmed' : ''} /></div>)}</div> : <EmptySection to="/mentorship" label="Preview Mentorship">1-on-1 practitioner mentorship will open in the next release.</EmptySection>}</section>

    <div className="dashboard-footer-note"><Plus size={16} /> Every new draft, session, score, and booking will appear here automatically.</div>
  </main>
}
