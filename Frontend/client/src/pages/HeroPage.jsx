import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import CareerHero3D from '../components/CareerHero3D.jsx'

const destinations = {
  resume: '/resume',
  interview: '/interview',
  test: '/tests',
  mentorship: '/mentorship',
  match: '/opportunities',
}

export default function HeroPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.displayName?.split(' ')[0] || 'there'
  const goTo = (section) => navigate(destinations[section] || '/resume')

  return <main className="content"><section className="career-hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15} /> Welcome to CareerOS</div><h1>Build your next<br /><em>career move.</em></h1><p>Hi, {firstName}. Shape your resume, practice the conversation, and turn your progress into opportunities.</p><div className="hero-actions"><button className="primary-button" onClick={() => goTo('resume')}>Start your resume <ArrowRight size={16} /></button><span>Choose any part of the workspace to begin.</span></div></div><CareerHero3D onSelect={goTo} /></section></main>
}
