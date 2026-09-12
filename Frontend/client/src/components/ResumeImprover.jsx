import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Sparkles, X, Zap } from 'lucide-react'
import './ResumeImprover.css'

const serviceUrl = (import.meta.env.VITE_ML_API_URL || 'http://localhost:5001').replace(/\/$/, '')

const CATEGORY_LABELS = {
  weak_bullet: { label: 'Weak / Passive Bullets', color: '#dc2626' },
  missing_metrics: { label: 'Missing Metrics', color: '#d97706' },
  vague_skill: { label: 'Vague / Generic Skills', color: '#7c3aed' },
  formatting: { label: 'Inconsistent Formatting', color: '#2563eb' },
  length_balance: { label: 'Length / Section Balance', color: '#0891b2' },
  grammar_clarity: { label: 'Grammar / Clarity', color: '#059669' },
  other: { label: 'Other', color: '#6b7280' },
}

const CATEGORY_ORDER = ['weak_bullet', 'missing_metrics', 'vague_skill', 'grammar_clarity', 'formatting', 'length_balance', 'other']

export default function ResumeImprover({ resume, onApply, onResumeId, userId, onReRunATS }) {
  const [reviewResult, setReviewResult] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [userInputs, setUserInputs] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(new Set(CATEGORY_ORDER))
  const [runCount, setRunCount] = useState(0)
  const [highlightedFields, setHighlightedFields] = useState(new Set())
  const MAX_RUNS = 3
  const highlightTimer = useRef(null)

  const issues = reviewResult?.issues || []
  const overallScore = reviewResult?.overall_score
  const summary = reviewResult?.summary

  const groupedIssues = useMemo(() => {
    const groups = {}
    for (const cat of CATEGORY_ORDER) groups[cat] = []
    for (const issue of issues) {
      const cat = issue.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(issue)
    }
    return groups
  }, [issues])

  const readyCount = useMemo(() =>
    issues.filter((issue) => !issue.needs_user_input || userInputs[issue.field]).length,
    [issues, userInputs]
  )

  const allSelected = selected.size === readyCount && readyCount > 0

  const runReview = async () => {
    if (runCount >= MAX_RUNS) return
    setLoading(true); setError(''); setReviewResult(null); setSelected(new Set()); setUserInputs({})
    try {
      const response = await fetch(`${serviceUrl}/api/llm/improve-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not run AI review right now.')
      if (!data.issues || !Array.isArray(data.issues)) throw new Error('Invalid response from AI review.')
      setReviewResult(data)
      setRunCount((c) => c + 1)
      // Pre-select all ready issues
      const initialSelected = new Set()
      for (const issue of data.issues) {
        if (!issue.needs_user_input) initialSelected.add(issue.field)
      }
      setSelected(initialSelected)
    } catch (requestError) {
      setError(requestError.message || 'Could not run AI review right now.')
    } finally { setLoading(false) }
  }

  const toggleIssue = (field) => setSelected((current) => {
    const next = new Set(current)
    const issue = issues.find((i) => i.field === field)
    if (issue?.needs_user_input && !userInputs[field]) return current
    next.has(field) ? next.delete(field) : next.add(field)
    return next
  })

  const toggleAll = () => setSelected((current) => {
    if (allSelected) return new Set()
    const next = new Set()
    for (const issue of issues) {
      if (!issue.needs_user_input || userInputs[issue.field]) next.add(issue.field)
    }
    return next
  })

  const toggleCategory = (cat) => setExpandedCategories((current) => {
    const next = new Set(current)
    next.has(cat) ? next.delete(cat) : next.add(cat)
    return next
  })

  const setUserInput = (field, value) => setUserInputs((current) => ({ ...current, [field]: value }))

  const handleApply = () => {
    const acceptedIssues = issues.filter((issue) => selected.has(issue.field))
    if (!acceptedIssues.length) return

    // Build a deep clone and patch each accepted issue
    const patched = JSON.parse(JSON.stringify(resume))
    const changedPaths = []

    for (const issue of acceptedIssues) {
      let value = issue.suggested
      // If user provided input for a needs_user_input issue, substitute it
      if (issue.needs_user_input && userInputs[issue.field]) {
        value = value.replace(/\{user_input\}/gi, userInputs[issue.field]).replace(/your\s+\w+\s+here/gi, userInputs[issue.field])
      }
      setNestedValue(patched, issue.field, value)
      changedPaths.push(issue.field)
    }

    onApply(patched, changedPaths)
    setHighlightedFields(new Set(changedPaths))

    // Clear highlights after 4 seconds
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightedFields(new Set()), 4000)
  }

  useEffect(() => () => { if (highlightTimer.current) clearTimeout(highlightTimer.current) }, [])

  // ─── Render ───
  if (!reviewResult && !loading) {
    return <button className="outline-button improve-it-button" onClick={runReview} disabled={runCount >= MAX_RUNS}
      title={runCount >= MAX_RUNS ? 'Maximum 3 review passes reached' : ''}>
      <Zap size={15} /> Improve it
    </button>
  }

  return <section className="resume-improver" aria-label="AI resume review">
    {/* Header */}
    <div className="improver-header">
      <div className="improver-title"><Sparkles size={16} /><div><strong>AI Resume Review</strong><p>{summary || 'Review complete.'}</p></div></div>
      {overallScore != null && <div className="improver-score"><span className="score-value">{overallScore}</span><span className="score-label">/ 100</span></div>}
    </div>

    {loading && <div className="improver-loading"><div className="improver-spinner" /><p>Analyzing your resume against hiring criteria…</p></div>}

    {error && <div className="improver-error"><AlertTriangle size={14} /> {error} <button onClick={() => setError('')}>Dismiss</button></div>}

    {reviewResult && !loading && <>
      {issues.length === 0 ? (
        <div className="improver-clean"><Check size={18} /><p><strong>Your resume looks great!</strong> No issues found. The AI found no weak bullets, missing metrics, vague skills, or formatting problems.</p></div>
      ) : (
        <div className="improver-issues">
          <div className="improver-toolbar">
            <label className="improver-select-all"><input type="checkbox" checked={allSelected} onChange={toggleAll} /> Select all ({readyCount}/{issues.length})</label>
            <span className="improver-count">{selected.size} of {readyCount} ready</span>
          </div>

          {CATEGORY_ORDER.filter((cat) => groupedIssues[cat]?.length > 0).map((cat) => {
            const catIssues = groupedIssues[cat]
            const meta = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other
            const isExpanded = expandedCategories.has(cat)
            const catSelected = catIssues.filter((i) => selected.has(i.field)).length
            return <div key={cat} className="improver-category">
              <button className="category-header" onClick={() => toggleCategory(cat)}>
                <span className="category-dot" style={{ background: meta.color }} />
                <span className="category-label">{meta.label}</span>
                <span className="category-count">{catSelected}/{catIssues.length}</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isExpanded && <div className="category-issues">
                {catIssues.map((issue) => {
                  const isReady = !issue.needs_user_input || userInputs[issue.field]
                  const isExpanded = selected.has(issue.field) || !isReady
                  return <div key={issue.field} className={`improver-issue ${selected.has(issue.field) ? 'selected' : ''} ${!isReady ? 'needs-input' : ''}`}>
                    <div className="issue-check">
                      <input type="checkbox" checked={selected.has(issue.field)} disabled={!isReady} onChange={() => toggleIssue(issue.field)} />
                    </div>
                    <div className="issue-content">
                      <div className="issue-field-path"><code>{issue.field}</code></div>
                      <div className="issue-comparison">
                        <div className="issue-original"><span className="comparison-label">Original</span><p>{issue.original}</p></div>
                        <div className="issue-suggested"><span className="comparison-label">Suggested</span><p>{issue.suggested}</p></div>
                      </div>
                      {issue.reason && <p className="issue-reason">{issue.reason}</p>}
                      {issue.needs_user_input && <div className="issue-user-input">
                        <label>{issue.user_input_prompt || 'Please provide the correct value:'}</label>
                        <input type="text" value={userInputs[issue.field] || ''} onChange={(e) => setUserInput(issue.field, e.target.value)} placeholder="Enter the real value…" />
                      </div>}
                    </div>
                  </div>
                })}
              </div>}
            </div>
          })}
        </div>
      )}

      <div className="improver-actions">
        <button className="primary-button" disabled={!selected.size} onClick={handleApply}>
          <Check size={14} /> Apply {selected.size || ''} selected fix{selected.size === 1 ? '' : 'es'}
        </button>
        {runCount < MAX_RUNS && <button className="outline-button" onClick={runReview} disabled={loading}>
          <Sparkles size={14} /> Re-run review
        </button>}
        <button className="text-button" onClick={() => { setReviewResult(null); setSelected(new Set()); setUserInputs({}) }}>
          Dismiss
        </button>
      </div>
    </>}
  </section>
}

// ─── Helpers ───

function setNestedValue(obj, path, value) {
  // Handle paths like "experience[0].description" or "basics.summary" or "skills.skills"
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let current = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]
    const nextKey = segments[i + 1]
    if (Array.isArray(current)) {
      const idx = parseInt(key, 10)
      if (isNaN(idx) || idx >= current.length) return
      current = current[idx]
    } else {
      if (!(key in current)) return
      current = current[key]
    }
  }
  const lastKey = segments[segments.length - 1]
  if (Array.isArray(current)) {
    const idx = parseInt(lastKey, 10)
    if (!isNaN(idx) && idx < current.length) current[idx] = value
  } else if (current && typeof current === 'object') {
    current[lastKey] = value
  }
}
