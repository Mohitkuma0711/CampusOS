import { Check, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import './JobTitleSkillSuggestions.css'

const commonRoles = ['Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'DevOps Engineer', 'Machine Learning Engineer', 'Cybersecurity Analyst']
const serviceUrl = (import.meta.env.VITE_ML_API_URL || 'http://localhost:5001').replace(/\/$/, '')

export default function JobTitleSkillSuggestions({ onConfirm, onDismiss }) {
  const [jobTitle, setJobTitle] = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedCount = selected.size
  const core = suggestions?.core || []
  const niceToHave = suggestions?.nice_to_have || []
  const allCoreSelected = core.length > 0 && core.every((skill) => selected.has(skill))
  const titleIsValid = jobTitle.trim().length > 0
  const selectedSkills = useMemo(() => [...selected], [selected])

  const getSuggestions = async (event) => {
    event.preventDefault()
    if (!titleIsValid) return
    setLoading(true); setError(''); setSuggestions(null); setSelected(new Set())
    try {
      const response = await fetch(`${serviceUrl}/api/llm/title-skill-suggestions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobTitle: jobTitle.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not suggest skills right now.')
      setSuggestions(data)
    } catch (requestError) {
      setError(requestError.message || 'Could not suggest skills right now.')
    } finally { setLoading(false) }
  }

  const toggle = (skill) => setSelected((current) => {
    const next = new Set(current)
    next.has(skill) ? next.delete(skill) : next.add(skill)
    return next
  })

  const toggleAllCore = () => setSelected((current) => {
    const next = new Set(current)
    core.forEach((skill) => allCoreSelected ? next.delete(skill) : next.add(skill))
    return next
  })

  return <section className="title-skill-suggestions" aria-label="Job title skill suggestions">
    <div className="title-skill-heading"><Sparkles size={16} /><div><strong>Tailor skills by job title</strong><p>Start with a role now; add a job description later for a precise match.</p></div></div>
    <form onSubmit={getSuggestions} className="title-skill-form"><input list="common-job-titles" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Frontend Developer" aria-label="Job title" /><datalist id="common-job-titles">{commonRoles.map((role) => <option key={role} value={role} />)}</datalist><button className="outline-button" disabled={!titleIsValid || loading}>{loading ? 'Finding skills…' : 'Suggest skills'}</button></form>
    {error && <p className="title-skill-error" role="alert">{error}</p>}
    {suggestions && <div className="title-skill-results"><div className="skill-group"><div className="skill-group-heading"><div><span>CORE</span><h3>Expected in most postings</h3></div><button type="button" className="text-button" onClick={toggleAllCore}>{allCoreSelected ? 'Clear core' : 'Select all core skills'}</button></div><div className="skill-chips">{core.map((skill) => <button type="button" key={skill} className={selected.has(skill) ? 'skill-chip selected' : 'skill-chip'} onClick={() => toggle(skill)} aria-pressed={selected.has(skill)}>{selected.has(skill) && <Check size={13} />}{skill}</button>)}</div></div><div className="skill-group"><div className="skill-group-heading"><div><span>NICE TO HAVE</span><h3>Helpful differentiators</h3></div></div><div className="skill-chips">{niceToHave.map((skill) => <button type="button" key={skill} className={selected.has(skill) ? 'skill-chip selected' : 'skill-chip'} onClick={() => toggle(skill)} aria-pressed={selected.has(skill)}>{selected.has(skill) && <Check size={13} />}{skill}</button>)}</div></div><div className="title-skill-actions"><button type="button" className="primary-button" disabled={!selectedCount} onClick={() => onConfirm(selectedSkills)}>Add {selectedCount || ''} selected skill{selectedCount === 1 ? '' : 's'}</button>{onDismiss && <button type="button" className="text-button" onClick={onDismiss}>Close</button>}</div></div>}
  </section>
}
