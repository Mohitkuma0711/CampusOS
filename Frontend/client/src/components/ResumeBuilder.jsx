import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Download, Edit3, GraduationCap, Briefcase, Plus, RotateCcw, SkipForward, Sparkles, Target, Mail, Phone, MapPin, Globe, Award, BookOpen } from 'lucide-react'
import './ResumeBuilder.css'
import { useAuth } from '../context/AuthContext.jsx'
import { getActiveDraft, saveResumeDraft, saveResumeVersion } from '../lib/firestore.js'
import JobTitleSkillSuggestions from './JobTitleSkillSuggestions.jsx'

const emptyResume = {
  experienceLevel: null,
  basics: { name: '', targetRole: '', email: '', phone: '', location: '', summary: '' },
  education: [],
  internships: [],
  experience: [],
  projects: [],
  skills: { skills: '', certifications: '', coursework: '', links: '' },
}

function mergeWithDefault(data) {
  if (!data) return clone(emptyResume)
  return {
    ...emptyResume,
    ...data,
    basics: { ...emptyResume.basics, ...(data.basics || {}) },
    skills: { ...emptyResume.skills, ...(data.skills || {}) },
    education: Array.isArray(data.education) ? data.education : [],
    internships: Array.isArray(data.internships) ? data.internships : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
  }
}

const allBasicsQuestions = [
  ['name', 'What should we call you?', 'Your full name', false],
  ['targetRole', 'What role are you aiming for?', 'e.g. Frontend Developer, Data Analyst', false],
  ['email', 'What email should employers use?', 'you@example.com', false],
  ['phone', 'What is the best phone number to reach you?', '+91 98765 43210', true],
  ['location', 'Where are you based?', 'City, Country', true],
  ['summary', 'Write a short professional summary (2-3 lines)', 'Brief overview of your experience and goals', true],
]

function buildSections(level, profile = {}) {
  const basicsQuestions = []

  // Skip asking for name if already fetched from Google
  if (!profile.name) {
    basicsQuestions.push(['name', 'What should we call you?', 'Your full name', false])
  }

  // Personalize targetRole question with first name if known
  const firstName = profile.name ? profile.name.trim().split(' ')[0] : ''
  basicsQuestions.push([
    'targetRole',
    firstName ? `Hi ${firstName}, what target role are you aiming for?` : 'What role are you aiming for?',
    'e.g. Frontend Developer, Data Analyst, ML Engineer',
    false,
  ])

  // Skip asking for email if already fetched from Google
  if (!profile.email) {
    basicsQuestions.push(['email', 'What email should employers use?', 'you@example.com', false])
  }

  basicsQuestions.push(['phone', 'What is the best phone number to reach you?', '+91 98765 43210', true])
  basicsQuestions.push(['location', 'Where are you based?', 'City, Country', true])
  basicsQuestions.push(['summary', 'Write a short professional summary (2-3 lines)', 'Brief overview of your experience and goals', true])

  const base = [
    { key: 'basics', label: 'Basics', questions: basicsQuestions },
  ]

  if (level === 'experienced') {
    base.push(
      { key: 'experience', label: 'Experience', repeatable: true, questions: [
        ['company', 'Where did you work?', 'Company name', false],
        ['role', 'What was your role there?', 'Job title', false],
        ['dates', 'When were you there?', 'e.g. May 2022 – Present', false],
        ['description', 'What did you accomplish in that role?', 'Use outcomes and impact when possible', false],
      ], details: [['achievements', 'Any extra achievement or metric to add?', 'Optional detail', true]] },
      { key: 'education', label: 'Education', repeatable: true, questions: [
        ['school', 'Which college or university did you study at?', 'School or university name', false],
        ['degree', 'What degree and year?', 'e.g. B.Tech Computer Science, 2021', false],
        ['gpa', 'Any GPA or CGPA you\'d like to include?', 'Optional', true],
      ], details: [['achievements', 'Any academic achievements worth highlighting?', 'Awards, honors, or leadership', true]] },
      { key: 'projects', label: 'Projects', repeatable: true, questions: [
        ['name', 'What project should we include?', 'Project name', false],
        ['description', 'What did you build or solve?', 'Short project description', false],
        ['link', 'Is there a link someone can explore?', 'GitHub, demo, or portfolio URL', true],
      ], details: [['technologies', 'Which technologies did you use?', 'e.g. React, Python, Figma', true]] },
      { key: 'skills', label: 'Skills', questions: [
        ['skills', 'Which skills do you want employers to notice?', 'Separate skills with commas', false],
        ['certifications', 'Do you have any certifications?', 'Optional', true],
        ['coursework', 'Any relevant coursework to include?', 'Optional', true],
        ['links', 'Any portfolio or professional links?', 'Optional', true],
      ] },
    )
  } else {
    // Fresher: Education and Projects first, optional Internships, no full Experience
    base.push(
      { key: 'education', label: 'Education', repeatable: true, questions: [
        ['school', 'Which college or university are you at (or were you at)?', 'School or university name', false],
        ['degree', 'What degree and expected graduation year?', 'e.g. B.Tech AI & ML, 2026', false],
        ['gpa', 'Any GPA or CGPA you\'d like to include?', 'Optional', true],
      ], details: [['achievements', 'Any academic achievements worth highlighting?', 'Awards, honors, dean\'s list, leadership', true]] },
      { key: 'projects', label: 'Projects', repeatable: true, questions: [
        ['name', 'What project should we include?', 'Project name', false],
        ['description', 'What did you build or solve?', 'Short project description', false],
        ['link', 'Is there a link someone can explore?', 'GitHub, demo, or portfolio URL', true],
      ], details: [['technologies', 'Which technologies did you use?', 'e.g. React, Python, TensorFlow', true]] },
      { key: 'internships', label: 'Internships & Training', repeatable: true, optional: true, questions: [
        ['organization', 'Where did you intern or train?', 'Organization name', false],
        ['role', 'What was your role?', 'e.g. Summer Intern, Research Trainee', false],
        ['dates', 'When was this?', 'e.g. Jun 2025 – Aug 2025', false],
        ['description', 'What did you work on?', 'Brief description of your contribution', false],
      ] },
      { key: 'skills', label: 'Skills', questions: [
        ['skills', 'Which skills do you want employers to notice?', 'Separate skills with commas', false],
        ['certifications', 'Do you have any certifications?', 'Optional', true],
        ['coursework', 'Any relevant coursework to include?', 'Optional', true],
        ['links', 'Any portfolio or professional links?', 'Optional', true],
      ] },
    )
  }
  return base
}

const clone = (value) => JSON.parse(JSON.stringify(value))

function validate(key, value) {
  if (!value.trim()) return 'Add an answer or choose Skip to continue.'
  if (key === 'email' && !/^\S+@\S+\.\S+$/.test(value)) return 'Use a valid email address, like you@example.com.'
  if ((key === 'link' || key === 'links') && value && !/^https?:\/\//.test(value)) return 'Include the full link, starting with https://.'
  return ''
}

/* ——— Gating question ——— */
function ExperienceGate({ onSelect }) {
  return <div className="gate-screen">
    <div className="gate-container">
      <div className="gate-badge"><Sparkles size={17} /></div>
      <span className="gate-tag">CAREEROS</span>
      <h1>Before we start, one important question.</h1>
      <p>This shapes which sections your resume will include and how we weight each area.</p>
      <div className="gate-options">
        <button className="gate-card" onClick={() => onSelect('fresher')}>
          <GraduationCap size={26} />
          <strong>I&apos;m a fresher</strong>
          <span>Student or recent graduate with no full-time work experience. We will focus on education, projects, and skills.</span>
        </button>
        <button className="gate-card" onClick={() => onSelect('experienced')}>
          <Briefcase size={26} />
          <strong>I have work experience</strong>
          <span>You have had at least one full-time role. We will lead with your experience and accomplishments.</span>
        </button>
      </div>
    </div>
  </div>
}

/* ——— Draft prompt ——— */
function DraftPrompt({ draft, onContinue, onStartNew }) {
  const role = draft?.resumeData?.basics?.targetRole
  return <div className="gate-screen">
    <div className="gate-container">
      <div className="gate-badge"><Sparkles size={17} /></div>
      <span className="gate-tag">CAREEROS</span>
      <h1>You have an unfinished resume.</h1>
      <p>{role ? `You were building a resume for "${role}".` : 'You started a resume but haven\'t finished it yet.'} Would you like to continue where you left off?</p>
      <div className="gate-options">
        <button className="gate-card" onClick={onContinue}>
          <Edit3 size={26} />
          <strong>Continue this resume</strong>
          <span>Pick up exactly where you left off. All your previous answers are saved.</span>
        </button>
        <button className="gate-card gate-card-secondary" onClick={onStartNew}>
          <Plus size={26} />
          <strong>Start a new resume</strong>
          <span>Begin from scratch with a blank template. Your previous draft will be replaced.</span>
        </button>
      </div>
    </div>
  </div>
}

/* ——— Section recap ——— */
function SectionRecap({ section, sections, resume, onEdit, onAddDetail, onAddAnother, onContinue, onSkipSection }) {
  const values = section.key === 'basics' ? resume.basics : section.key === 'skills' ? resume.skills : resume[section.key]
  const entries = Array.isArray(values) ? values : [values]
  const nextSection = sections[sections.findIndex((s) => s.key === section.key) + 1]
  const isEmpty = Array.isArray(values) && values.length === 0

  if (isEmpty && section.optional) {
    return <div className="resume-recap">
      <div className="recap-heading"><div><span className="tag">OPTIONAL</span><h2>{section.label}</h2></div></div>
      <p className="recap-skip-note">This section is optional for your profile. You can add it now or skip it.</p>
      <div className="recap-actions">
        <button className="add-detail" onClick={onAddAnother}><Plus size={16} /> Add {section.label.toLowerCase().replace(/s$/, '')}</button>
        <button className="primary-button recap-continue" onClick={onSkipSection}>Skip to {nextSection?.label || 'preview'} <ArrowRight size={16} /></button>
      </div>
    </div>
  }

  return <div className="resume-recap">
    <div className="recap-heading"><div><span className="tag">CAPTURED</span><h2>{section.label} looks good.</h2></div><Check size={20} /></div>
    {entries.map((entry, index) => <div className="recap-item" key={index}><div><strong>{Array.isArray(values) ? (entry.name || entry.company || entry.school || entry.organization || `Entry ${index + 1}`) : section.label}</strong><p>{Object.values(entry).filter(Boolean).join(' · ')}</p></div><button className="inline-edit" onClick={() => onEdit(index)}><Edit3 size={14} /> Edit</button></div>)}
    {section.details && <button className="add-detail" onClick={onAddDetail}><Plus size={16} /> Add more detail</button>}
    {section.repeatable && <button className="add-detail" onClick={onAddAnother}><Plus size={16} /> Add another {section.label.toLowerCase().replace(/s$/, '')}</button>}
    <button className="primary-button recap-continue" onClick={onContinue}>Continue to {nextSection?.label || 'preview'} <ArrowRight size={16} /></button>
  </div>
}

/* ——— Resume preview + PDF ——— */
function ResumePreview({ resume, sections, onEdit, onGoToATS, onTailorSkills, showTitleSkills, onAddSkills, onDismissTitleSkills }) {
  const download = () => window.print()
  const level = resume.experienceLevel
  const hasContact = resume.basics.email || resume.basics.phone || resume.basics.location
  const hasSidebar = resume.skills.skills || resume.skills.certifications || resume.skills.coursework || resume.skills.links

  return <main className="resume-preview-page">
    <div className="preview-toolbar">
      <button className="back-button" onClick={() => onEdit(0)}><ArrowLeft size={16} /> Edit from start</button>
      <div className="preview-section-chips">
        {sections?.map((sec, idx) => (
          <button key={sec.key} className="section-chip" onClick={() => onEdit(idx)}>
            <Edit3 size={12} /> {sec.label}
          </button>
        ))}
      </div>
      <div className="preview-actions">
        <button className="outline-button" onClick={onTailorSkills}><Sparkles size={16} /> Tailor by job title</button>
        <button className="outline-button" onClick={onGoToATS}><Target size={16} /> Check ATS score</button>
        <button className="primary-button" onClick={download}><Download size={16} /> Export PDF</button>
      </div>
    </div>
    {showTitleSkills && <JobTitleSkillSuggestions onConfirm={onAddSkills} onDismiss={onDismissTitleSkills} />}
    <div className="resume-paper">
      {/* ——— Header ——— */}
      <header className="rp-header">
        {resume.basics.name && <h1 className="rp-name">{resume.basics.name}</h1>}
        {resume.basics.targetRole && <p className="rp-headline">{resume.basics.targetRole}</p>}
        {hasContact && <div className="rp-contact">
          {resume.basics.email && <span className="rp-contact-item"><Mail size={12} /> {resume.basics.email}</span>}
          {resume.basics.phone && <span className="rp-contact-item"><Phone size={12} /> {resume.basics.phone}</span>}
          {resume.basics.location && <span className="rp-contact-item"><MapPin size={12} /> {resume.basics.location}</span>}
        </div>}
      </header>

      {/* ——— Two-column body ——— */}
      <div className="rp-body">
        {/* Main column */}
        <div className="rp-main">
          {resume.basics.summary && <RpSection title="Professional Summary">
            <p className="rp-summary-text">{resume.basics.summary}</p>
          </RpSection>}
          {level === 'experienced' && resume.experience.length > 0 && <RpSection title="Professional Experience">
            {resume.experience.map((item, i) => <RpEntry key={i} primary={item.company} secondary={item.role} dates={item.dates} description={item.description || item.achievements} />)}
          </RpSection>}
          <RpSection title="Education">
            {resume.education.map((item, i) => <RpEntry key={i} primary={item.school} secondary={item.degree} dates={item.dates} description={item.gpa ? `GPA: ${item.gpa}` : ''} />)}
          </RpSection>
          <RpSection title="Projects">
            {resume.projects.map((item, i) => <RpEntry key={i} primary={item.name} secondary={item.technologies} dates={item.dates} description={item.description} />)}
          </RpSection>
          {level === 'fresher' && resume.internships.length > 0 && <RpSection title="Internships & Training">
            {resume.internships.map((item, i) => <RpEntry key={i} primary={item.organization} secondary={item.role} dates={item.dates} description={item.description} />)}
          </RpSection>}
        </div>

        {/* Sidebar column */}
        {hasSidebar && <aside className="rp-sidebar">
          {resume.skills.skills && <RpSidebarSection title="Technical Skills">
            {resume.skills.skills.split(',').map((s, i) => <div key={i} className="rp-skill-item"><span className="rp-skill-name">{s.trim()}</span></div>)}
          </RpSidebarSection>}
          {resume.skills.certifications && <RpSidebarSection title="Certifications">
            {resume.skills.certifications.split(',').map((c, i) => <div key={i} className="rp-sidebar-entry"><Award size={11} /> <span>{c.trim()}</span></div>)}
          </RpSidebarSection>}
          {resume.skills.coursework && <RpSidebarSection title="Coursework">
            {resume.skills.coursework.split(',').map((c, i) => <div key={i} className="rp-sidebar-entry"><BookOpen size={11} /> <span>{c.trim()}</span></div>)}
          </RpSidebarSection>}
          {resume.skills.links && <RpSidebarSection title="Online Presence">
            {resume.skills.links.split(',').map((l, i) => <div key={i} className="rp-sidebar-entry"><Globe size={11} /> <span>{l.trim()}</span></div>)}
          </RpSidebarSection>}
        </aside>}
      </div>
    </div>
  </main>
}

function RpSection({ title, children }) {
  return <section className="rp-section">
    <h2 className="rp-section-title">{title}</h2>
    {children}
  </section>
}

function RpSidebarSection({ title, children }) {
  return <div className="rp-sidebar-section">
    <h3 className="rp-sidebar-title">{title}</h3>
    {children}
  </div>
}

function RpEntry({ primary, secondary, dates, description }) {
  return <div className="rp-entry">
    <div className="rp-entry-header">
      <div>
        {primary && <strong className="rp-entry-primary">{primary}</strong>}
        {secondary && <span className="rp-entry-secondary">{secondary}</span>}
      </div>
      {dates && <span className="rp-entry-dates">{dates}</span>}
    </div>
    {description && <p className="rp-entry-desc">{description}</p>}
  </div>
}

function ResumePreviewSection({ title, items, primary, secondary }) {
  if (!items.length) return null
  return <section className="paper-section"><h2>{title}</h2>{items.map((item, index) => <div className="paper-entry" key={index}><div className="paper-entry-header"><strong>{item[primary]}</strong>{item.dates && <span className="paper-dates">{item.dates}</span>}</div><span>{item[secondary]}</span><p>{item.description || item.achievements || item.technologies}</p></div>)}</section>
}

export default function ResumeBuilder({ initialResume, resumeId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, experienceLevel, setExperienceLevel } = useAuth()
  const storageKey = `careeros-resume-draft:${user?.uid || 'anonymous'}`

  const initializedResumeId = useRef(null)

  const [resume, setResume] = useState(() => {
    try {
      const parsed = initialResume || JSON.parse(localStorage.getItem(storageKey)) || clone(emptyResume)
      const r = mergeWithDefault(parsed)
      if (user?.displayName && !r.basics.name) r.basics.name = user.displayName
      if (user?.email && !r.basics.email) r.basics.email = user.email
      if (user?.phoneNumber && !r.basics.phone) r.basics.phone = user.phoneNumber
      return r
    } catch {
      const r = mergeWithDefault(initialResume || emptyResume)
      if (user?.displayName && !r.basics.name) r.basics.name = user.displayName
      if (user?.email && !r.basics.email) r.basics.email = user.email
      return r
    }
  })

  const [sections, setSections] = useState(() =>
    buildSections(resume.experienceLevel || experienceLevel || 'fresher', {
      name: resume.basics.name || user?.displayName,
      email: resume.basics.email || user?.email,
    })
  )
  const [sectionIndex, setSectionIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [itemIndex, setItemIndex] = useState(0)
  const [mode, setMode] = useState('loading') // loading | gate | draft-prompt | questions | recap | preview
  const [detailMode, setDetailMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [activeDraft, setActiveDraft] = useState(null)
  const [showTitleSkills, setShowTitleSkills] = useState(() => new URLSearchParams(location.search).has('skills'))
  const [showJDUpgrade, setShowJDUpgrade] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(location.search).has('skills')) setShowTitleSkills(true)
  }, [location.search])

  // Sync Google user profile details into resume if missing
  useEffect(() => {
    if (user) {
      setResume((current) => {
        let changed = false
        const next = clone(current)
        if (user.displayName && !next.basics.name) {
          next.basics.name = user.displayName
          changed = true
        }
        if (user.email && !next.basics.email) {
          next.basics.email = user.email
          changed = true
        }
        if (user.phoneNumber && !next.basics.phone) {
          next.basics.phone = user.phoneNumber
          changed = true
        }
        return changed ? next : current
      })
      setSections(
        buildSections(resume.experienceLevel || experienceLevel || 'fresher', {
          name: resume.basics.name || user.displayName,
          email: resume.basics.email || user.email,
        })
      )
    }
  }, [user])

  // Check for existing draft on mount or when resumeId changes
  useEffect(() => {
    if (initialResume) {
      if (initializedResumeId.current === resumeId) return
      initializedResumeId.current = resumeId || 'loaded'

      const r = mergeWithDefault(initialResume)
      if (user?.displayName && !r.basics.name) r.basics.name = user.displayName
      if (user?.email && !r.basics.email) r.basics.email = user.email
      setResume(r)
      const level = r.experienceLevel || experienceLevel || 'fresher'
      setSections(buildSections(level, { name: r.basics?.name || user?.displayName, email: r.basics?.email || user?.email }))

      const hasContent = r.basics?.targetRole || r.education?.length > 0 || r.experience?.length > 0 || r.projects?.length > 0 || r.skills?.skills
      if (hasContent) {
        setMode('preview')
      } else {
        setMode('questions')
      }
      return
    }
    let cancelled = false
    async function checkDraft() {
      if (!user) { setMode('gate'); return }
      try {
        let timeoutId
        const timeout = new Promise((resolve) => {
          timeoutId = window.setTimeout(() => resolve(null), 1500)
        })
        const draft = await Promise.race([getActiveDraft(user.uid), timeout])
        window.clearTimeout(timeoutId)
        if (cancelled) return
        if (draft?.resumeData?.basics?.targetRole || draft?.resumeData?.basics?.name) {
          setActiveDraft(draft)
          setMode('draft-prompt')
        } else if (!experienceLevel) {
          setMode('gate')
        } else {
          const r = clone(emptyResume)
          r.experienceLevel = experienceLevel
          if (user?.displayName) r.basics.name = user.displayName
          if (user?.email) r.basics.email = user.email
          if (user?.phoneNumber) r.basics.phone = user.phoneNumber
          setResume(r)
          setSections(buildSections(experienceLevel, { name: user.displayName, email: user.email }))
          setMode('questions')
        }
      } catch {
        if (!cancelled) setMode(experienceLevel ? 'questions' : 'gate')
      }
    }
    checkDraft()
    return () => { cancelled = true }
  }, [initialResume, resumeId, user, experienceLevel])

  // Clear resume state when user signs out
  useEffect(() => {
    if (!user) {
      setResume(clone(emptyResume))
      localStorage.removeItem(storageKey)
    }
  }, [user, storageKey])

  // Handle gating question answer
  const handleGate = async (level) => {
    await setExperienceLevel(level)
    const r = clone(emptyResume)
    r.experienceLevel = level
    if (user?.displayName) r.basics.name = user.displayName
    if (user?.email) r.basics.email = user.email
    if (user?.phoneNumber) r.basics.phone = user.phoneNumber
    setResume(r)
    setSections(buildSections(level, { name: user?.displayName, email: user?.email }))
    setSectionIndex(0)
    setQuestionIndex(0)
    setItemIndex(0)
    setIsEditing(false)
    setMode('questions')
  }

  // Handle draft prompt
  const handleContinueDraft = () => {
    if (activeDraft?.resumeData) {
      const r = clone(activeDraft.resumeData)
      if (!r.internships) r.internships = []
      if (!r.experienceLevel) r.experienceLevel = experienceLevel || 'fresher'
      if (!r.basics.name && user?.displayName) r.basics.name = user.displayName
      if (!r.basics.email && user?.email) r.basics.email = user.email
      setResume(r)
      setSections(buildSections(r.experienceLevel, { name: r.basics?.name || user?.displayName, email: r.basics?.email || user?.email }))
    }
    setMode('questions')
  }

  const handleStartNew = async () => {
    if (!experienceLevel) {
      setMode('gate')
      return
    }
    const r = clone(emptyResume)
    r.experienceLevel = experienceLevel
    if (user?.displayName) r.basics.name = user.displayName
    if (user?.email) r.basics.email = user.email
    if (user?.phoneNumber) r.basics.phone = user.phoneNumber
    setResume(r)
    setSections(buildSections(experienceLevel, { name: user?.displayName, email: user?.email }))
    localStorage.removeItem(storageKey)
    setSectionIndex(0)
    setQuestionIndex(0)
    setItemIndex(0)
    setIsEditing(false)
    setMode('questions')
  }

  const section = sections[sectionIndex]
  const item = section
    ? section.key === 'basics' ? resume.basics
    : section.key === 'skills' ? resume.skills
    : resume[section.key]?.[itemIndex]
    : null
  const questions = detailMode
    ? section?.details
    : (isEditing && section?.key === 'basics' ? allBasicsQuestions : section?.questions)
  const question = questions?.[questionIndex]
  const progress = section ? Math.round(((sectionIndex + questionIndex / Math.max(questions?.length || 1, 1)) / sections.length) * 100) : 0

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!resume.basics.name && !resume.basics.targetRole) return
      localStorage.setItem(storageKey, JSON.stringify(resume))
      if (user) {
        try {
          await (resumeId ? saveResumeVersion(user.uid, resumeId, resume) : saveResumeDraft(user.uid, resume))
        } catch { /* test mode or offline — local save is enough */ }
      }
      setSaved(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [resume, user, resumeId, storageKey])

  const updateAnswer = (value) => setResume((current) => {
    const next = clone(current)
    if (section.key === 'basics' || section.key === 'skills') next[section.key][question[0]] = value
    else { next[section.key][itemIndex] = next[section.key][itemIndex] || {}; next[section.key][itemIndex][question[0]] = value }
    return next
  })

  const addSuggestedSkills = (suggestedSkills) => {
    setResume((current) => {
      const existing = current.skills.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
      const known = new Set(existing.map((skill) => skill.toLowerCase()))
      const additions = suggestedSkills.filter((skill) => !known.has(skill.toLowerCase()))
      return { ...current, skills: { ...current.skills, skills: [...existing, ...additions].join(', ') } }
    })
    setShowTitleSkills(false)
    setShowJDUpgrade(true)
  }

  const answer = item?.[question?.[0]] || ''
  const advance = (skip = false) => {
    if (!skip) {
      const message = question[3] ? '' : validate(question[0], answer)
      if (message) return setError(message)
    }
    setError('')
    if (questionIndex < questions.length - 1) return setQuestionIndex((c) => c + 1)
    if (detailMode) { setDetailMode(false); setQuestionIndex(0); setMode('recap'); return }
    setQuestionIndex(0)
    setMode('recap')
  }

  const beginSection = (index) => {
    setIsEditing(true)
    setSectionIndex(index)
    setQuestionIndex(0)
    setItemIndex(0)
    setMode('questions')
    setDetailMode(false)
    setError('')
  }
  const addItem = () => {
    const key = section.key
    if (!resume[key]) resume[key] = []
    setResume((current) => ({ ...current, [key]: [...(current[key] || []), {}] }))
    setItemIndex((resume[key] || []).length)
    setQuestionIndex(0); setMode('questions'); setError('')
  }
  const addDetail = () => { setDetailMode(true); setQuestionIndex(0); setMode('questions'); setError('') }
  const editItem = (index) => {
    setIsEditing(true)
    setItemIndex(index)
    setQuestionIndex(0)
    setMode('questions')
    setDetailMode(false)
  }
  const continueSection = () => {
    setIsEditing(false)
    if (sectionIndex === sections.length - 1) return setMode('preview')
    setSectionIndex((c) => c + 1); setQuestionIndex(0); setItemIndex(0); setMode('questions'); setDetailMode(false)
  }
  const skipSection = () => {
    setIsEditing(false)
    if (sectionIndex === sections.length - 1) return setMode('preview')
    setSectionIndex((c) => c + 1); setQuestionIndex(0); setItemIndex(0); setMode('questions'); setDetailMode(false)
  }
  const reset = () => {
    setIsEditing(false)
    setResume(clone(emptyResume))
    setSectionIndex(0)
    setQuestionIndex(0)
    setItemIndex(0)
    setMode('gate')
    localStorage.removeItem(storageKey)
  }

  // —— Render modes ——
  if (mode === 'loading') return <main className="resume-builder"><div className="builder-loading">Checking for your resume draft...</div></main>
  if (showTitleSkills && mode !== 'questions' && mode !== 'preview') return <main className="resume-builder"><JobTitleSkillSuggestions onConfirm={addSuggestedSkills} onDismiss={() => setShowTitleSkills(false)} /></main>
  if (mode === 'gate') return <ExperienceGate onSelect={handleGate} />
  if (mode === 'draft-prompt') return <DraftPrompt draft={activeDraft} onContinue={handleContinueDraft} onStartNew={handleStartNew} />
  if (mode === 'preview') return <ResumePreview resume={resume} sections={sections} onEdit={beginSection} onTailorSkills={() => setShowTitleSkills(true)} showTitleSkills={showTitleSkills} onAddSkills={addSuggestedSkills} onDismissTitleSkills={() => setShowTitleSkills(false)} onGoToATS={() => navigate('/ats')} />
  if (mode === 'recap') return <main className="resume-builder"><Progress section={section} progress={progress} saved={saved} level={resume.experienceLevel} onBack={() => setMode('questions')} onReset={reset} /><SectionRecap section={section} sections={sections} resume={resume} onEdit={editItem} onAddDetail={addDetail} onAddAnother={addItem} onContinue={continueSection} onSkipSection={skipSection} /></main>

  // Questions mode
  return <main className="resume-builder">
    <Progress section={section} progress={progress} saved={saved} level={resume.experienceLevel} onBack={() => sectionIndex ? beginSection(sectionIndex - 1) : null} onReset={reset} />
    <div className="conversation">
      {section.key === 'basics' && (resume.basics.name || resume.basics.email) && (
        <div className="google-prefill-badge">
          <Check size={13} />
          <span>Profile synced from Google: <strong>{resume.basics.name}</strong> {resume.basics.email ? `(${resume.basics.email})` : ''}</span>
        </div>
      )}
      <div className="conversation-meta">
        <span>QUESTION {questionIndex + 1} OF {questions.length}</span>
        <span>{section.label}{resume.experienceLevel === 'fresher' && section.optional ? ' · Optional' : ''}</span>
      </div>
      <div className="question-card">
        <div className="question-mark"><Sparkles size={17} /></div>
        <div>
          <span className="tag">CAREEROS</span>
          <h1>{question[1]}</h1>
          <p>Your answer will appear in your resume preview.</p>
        </div>
      </div>
      <div className="answer-area">
        {section.key === 'skills' && question[0] === 'skills' && <><button type="button" className="skill-helper-link" onClick={() => setShowTitleSkills((visible) => !visible)}>Not sure what skills to add? Tell me the job title you&apos;re targeting.</button>{showTitleSkills && <JobTitleSkillSuggestions onConfirm={addSuggestedSkills} onDismiss={() => setShowTitleSkills(false)} />}{showJDUpgrade && <p className="jd-upgrade">Have a specific job posting? <button type="button" onClick={() => navigate('/ats')}>Paste the JD for a more precise match.</button></p>}</>}
        <label htmlFor="resume-answer">Your answer</label>
        <textarea id="resume-answer" autoFocus value={answer} placeholder={question[2]} onChange={(e) => { updateAnswer(e.target.value); setError('') }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); advance() } }} rows={question[0] === 'description' || question[0] === 'achievements' || question[0] === 'summary' ? 4 : 2} />
        {error && <p className="field-error">{error}</p>}
        <div className="answer-actions">
          <button className="skip-button" onClick={() => advance(true)}><SkipForward size={15} /> {question[3] ? 'Skip for now' : 'Clear answer'}</button>
          <button className="primary-button" onClick={() => advance()}>{questionIndex === questions.length - 1 ? 'Review section' : 'Next'} <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  </main>
}

function Progress({ section, progress, saved, level, onBack, onReset }) {
  return <header className="builder-header">
    <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back</button>
    <div className="builder-brand">Career<span>OS</span> <small>Resume builder{level ? ` · ${level === 'fresher' ? 'Fresher' : 'Experienced'}` : ''}</small></div>
    <div className="builder-status">{saved && <><Check size={13} /> Saved</>}<button title="Start over" className="reset-button" onClick={onReset}><RotateCcw size={15} /></button></div>
    <div className="builder-progress"><div><span>{section.label}</span><span>{progress}% complete</span></div><i style={{ width: `${progress}%` }} /></div>
  </header>
}
