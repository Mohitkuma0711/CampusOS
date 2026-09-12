import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ArrowRight, 
  BriefcaseBusiness, 
  CalendarDays, 
  Check, 
  CheckCircle2, 
  Compass, 
  Layers, 
  MessageCircle, 
  Search, 
  Sparkles, 
  Target, 
  Trophy, 
  Zap 
} from 'lucide-react'
import './ComingSoon.css'

const MODULE_DATA = {
  ats: {
    tag: 'ATS Optimization Engine',
    title: 'Precision ATS Scoring & Keyword Gap Analysis',
    description: 'Compare your resumes against any job description. Uncover missing keywords, verify parser readability, and boost your callback rate with AI-driven scoring.',
    icon: Target,
    features: [
      {
        icon: Search,
        title: 'Keyword Gap Analysis',
        description: 'Instantly identifies hard and soft skills present in the target job posting that are missing from your resume.'
      },
      {
        icon: Zap,
        title: 'Semantic Match Score',
        description: 'Deep neural scoring that evaluates whether your phrasing conveys the depth of experience recruiters look for.'
      },
      {
        icon: CheckCircle2,
        title: 'Parser Diagnostics',
        description: 'Checks section headers, contact info extraction, and table layout safety across standard ATS systems.'
      }
    ]
  },
  interview: {
    tag: 'AI Mock Interview',
    title: 'Simulate High-Stakes Technical & Behavioral Rounds',
    description: 'Practice real-time role-tailored questions. Get immediate, constructive critique on your clarity, depth, and STAR framework storytelling.',
    icon: MessageCircle,
    features: [
      {
        icon: Sparkles,
        title: 'Dynamic Follow-Up Logic',
        description: 'Questions adapt based on your answers, just like a senior engineering lead or hiring manager in an actual round.'
      },
      {
        icon: CheckCircle2,
        title: 'STAR Method Scoring',
        description: 'Structured breakdown evaluating Situation, Task, Action, and Result in every behavioral response.'
      },
      {
        icon: Zap,
        title: 'Comprehensive Transcript Feedback',
        description: 'Review full recordings, time spent per response, and specific suggested revisions after each session.'
      }
    ]
  },
  tests: {
    tag: 'Skill Verification',
    title: 'Adaptive Practice Tests & Skill Benchmarks',
    description: 'Validate your knowledge across Data Structures, System Design, Frontend, Machine Learning, and Cloud infrastructure with measurable credentials.',
    icon: Trophy,
    features: [
      {
        icon: Layers,
        title: 'Adaptive Difficulty',
        description: 'Questions scale from fundamental concepts to advanced architectural edge cases based on your accuracy.'
      },
      {
        icon: Zap,
        title: 'Timed Challenge Environment',
        description: 'Real exam conditions with countdown timers and immediate explanations for wrong answers.'
      },
      {
        icon: CheckCircle2,
        title: 'Verifiable Signal Badges',
        description: 'Add verified test scores directly to your CareerOS resume versions to stand out to hiring partners.'
      }
    ]
  },
  mentorship: {
    tag: '1-on-1 Guidance',
    title: 'Connect with Experienced Industry Mentors',
    description: 'Book focused 1-on-1 sessions with working engineers and leaders to unblock your portfolio, review code, or prepare for upcoming interviews.',
    icon: CalendarDays,
    features: [
      {
        icon: CheckCircle2,
        title: 'Vetted Practitioner Network',
        description: 'Mentors from top tech companies and high-growth startups ready to share actionable guidance.'
      },
      {
        icon: Zap,
        title: 'Seamless Calendar Booking',
        description: 'View real-time slot availability, pick a time that works across timezones, and receive calendar invites.'
      },
      {
        icon: Sparkles,
        title: 'Session Agenda Worksheets',
        description: 'Submit your resume, question list, or code repo ahead of time so your 30-minute chat is 100% high-impact.'
      }
    ]
  },
  opportunities: {
    tag: 'Career Matching',
    title: 'Intelligent Role Discovery Tailored to Your Profile',
    description: 'Stop sifting through hundreds of irrelevant listings. Let CareerOS match you directly with open positions where your verified skills stand out.',
    icon: BriefcaseBusiness,
    features: [
      {
        icon: Zap,
        title: 'AI Fit Scoring',
        description: 'Every job listing is scored against your active resume so you know your compatibility before applying.'
      },
      {
        icon: CheckCircle2,
        title: 'Company & Culture Intel',
        description: 'Detailed tech stack insights, team size, and transparent compensation data alongside listings.'
      },
      {
        icon: Search,
        title: 'Application Pipeline',
        description: 'Track your application status, interview schedules, and follow-ups in one consolidated dashboard.'
      }
    ]
  },
  explore: {
    tag: 'Career Explorer',
    title: 'Map Pathways, Bridge Skill Gaps, and Level Up',
    description: 'Explore the tech landscape. Discover the most in-demand specializations, compare career trajectories, and understand the fastest route to your next level.',
    icon: Compass,
    features: [
      {
        icon: Sparkles,
        title: 'Skill Bridge Analysis',
        description: 'See the exact 3-4 skills that bridge you from your current role to your dream target role.'
      },
      {
        icon: Layers,
        title: 'Trajectory Forecasting',
        description: 'Compare progression timelines, typical compensation milestones, and market demand projections.'
      },
      {
        icon: CheckCircle2,
        title: 'Curated Roadmaps',
        description: 'Step-by-step learning modules and project ideas tailored for rapid portfolio building.'
      }
    ]
  }
}

export default function ComingSoon({ moduleId = 'ats' }) {
  const navigate = useNavigate()
  const data = MODULE_DATA[moduleId] || MODULE_DATA.ats
  const Icon = data.icon
  const storageKey = `careeros-waitlist-${moduleId}`

  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(() => {
    return localStorage.getItem(storageKey) === 'true'
  })

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    localStorage.setItem(storageKey, 'true')
    setSubscribed(true)
  }

  return (
    <main className="coming-soon-page">
      <header className="cs-header">
        <div className="cs-badge-row">
          <div className="cs-icon-pill">
            <Icon size={22} />
          </div>
          <span className="cs-status-tag">
            <span className="cs-status-dot" />
            Coming Soon · In Active Development
          </span>
        </div>
        <span className="eyebrow">{data.tag}</span>
        <h1>{data.title}</h1>
        <p>{data.description}</p>
      </header>

      {/* Feature Preview Grid */}
      <section className="cs-features-grid">
        {data.features.map((feat, idx) => {
          const FeatIcon = feat.icon
          return (
            <div className="cs-feature-card" key={idx}>
              <div className="cs-feature-icon">
                <FeatIcon size={20} />
              </div>
              <h3>{feat.title}</h3>
              <p>{feat.description}</p>
            </div>
          )
        })}
      </section>

      {/* Waitlist Box */}
      <section className="cs-waitlist-box">
        <div className="cs-waitlist-copy">
          <h2>Be the first to access this module</h2>
          <p>We are rolling out features progressively to CareerOS members. Join the priority waitlist for early preview access.</p>
        </div>
        <div className="cs-waitlist-form">
          {subscribed ? (
            <div className="cs-subscribed-msg">
              <Check size={18} />
              <span>You're on the priority notification list!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="cs-input-group">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="cs-waitlist-input"
              />
              <button type="submit" className="primary-button">
                Notify Me
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer Navigation */}
      <footer className="cs-footer-actions">
        <button className="back-link quiet-link" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
        <div className="cs-action-links">
          <button className="primary-button" onClick={() => navigate('/resume')}>
            Build Your Resume <ArrowRight size={16} />
          </button>
        </div>
      </footer>
    </main>
  )
}
