import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { BriefcaseBusiness, CalendarDays, Compass, LayoutDashboard, MessageCircle, Sparkles, Target, Trophy } from 'lucide-react'
import DashboardHome from './pages/DashboardHome.jsx'
import HeroPage from './pages/HeroPage.jsx'
import ResumeDetail from './pages/ResumeDetail.jsx'
import SignInPage from './pages/SignInPage.jsx'
import ComingSoon from './pages/ComingSoon.jsx'
import NotFound from './pages/NotFound.jsx'
import ResumeBuilder from './components/ResumeBuilder.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './App.css'

const navItems = [
  { to: '/', label: 'Your activity', icon: LayoutDashboard },
  { to: '/resume', label: 'Resume builder', icon: Sparkles },
  { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { to: '/interview', label: 'Mock interview', icon: MessageCircle },
  { to: '/tests', label: 'Skill tests', icon: Trophy },
  { to: '/mentorship', label: 'Mentorship', icon: CalendarDays },
]

function AppShell() {
  return (
    <div className="app-shell">
      <aside>
        <NavLink className="brand" to="/hero" aria-label="CareerOS home">
          <span>CO</span>
          <strong>Career<span>OS</span></strong>
        </NavLink>
        <p className="welcome">Your career workspace</p>
        <nav>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <NavLink to="/explore">
            <Compass size={18} />
            Explore
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <Target size={18} />
          <p>Your work stays tied to your account.</p>
        </div>
        <div className="user-chip">
          <div className="avatar">CO</div>
          <div>
            <strong>CareerOS member</strong>
            <small>Private workspace</small>
          </div>
        </div>
      </aside>
      <div className="page">
        <header>
          <span className="date">Your activity</span>
          <div className="header-actions">
            <span className="sync-label">Live sync on</span>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/hero" element={<HeroPage />} />
          <Route path="/resume" element={<ResumeBuilder />} />
          <Route path="/resume/:resumeId" element={<ResumeDetail />} />
          <Route path="/ats" element={<ComingSoon moduleId="ats" />} />
          <Route path="/opportunities" element={<ComingSoon moduleId="opportunities" />} />
          <Route path="/interview" element={<ComingSoon moduleId="interview" />} />
          <Route path="/interview/:sessionId" element={<ComingSoon moduleId="interview" />} />
          <Route path="/tests" element={<ComingSoon moduleId="tests" />} />
          <Route path="/mentorship" element={<ComingSoon moduleId="mentorship" />} />
          <Route path="/explore" element={<ComingSoon moduleId="explore" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
