import { BarChart3, Bookmark, Coffee, ListChecks, Search, Sparkles, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { isFollowUpDue, useApp } from './lib/store'
import Discover from './pages/Discover'
import Insights from './pages/Insights'
import Onboarding from './pages/Onboarding'
import PersonPage from './pages/Person'
import Pipeline from './pages/Pipeline'
import Profile from './pages/Profile'
import Saved from './pages/Saved'
import SearchPage from './pages/Search'

const NAV = [
  { to: '/', label: 'Discover', icon: Sparkles },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/pipeline', label: 'Pipeline', icon: ListChecks },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export default function App() {
  const s = useApp()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname, s.onboarded])
  if (!s.onboarded) return <Onboarding />
  const due = Object.values(s.outreach).filter((o) => s.saved[o.personId] && isFollowUpDue(o)).length

  return (
    <ToastProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-paper px-4 py-6 lg:flex">
          <div className="mb-8 flex items-center gap-2 px-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-white"><Coffee size={17} /></span>
            <span className="font-display text-[17px] font-semibold leading-none">Coffee Chat<br />Finder</span>
          </div>
          <nav className="flex flex-col gap-0.5" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-sand text-ink' : 'text-ink-soft hover:bg-sand/60 hover:text-ink'}`}>
                <Icon size={17} />
                {label}
                {label === 'Pipeline' && due > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">{due}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-dashed border-line p-3 text-xs leading-relaxed text-ink-faint">
            <b className="text-ink-soft">Demo data mode.</b> All profiles are fictional. Nothing is sent anywhere, and nothing leaves this browser.
          </div>
        </aside>

        <div className="min-w-0 pb-24 lg:pb-12">
          <header className="flex items-center gap-2 border-b border-line px-4 py-3 lg:hidden">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-white"><Coffee size={15} /></span>
            <span className="font-display text-base font-semibold">Coffee Chat Finder</span>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-10">
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/person/:id" element={<PersonPage />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Discover />} />
            </Routes>
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${isActive ? 'text-accent-deep' : 'text-ink-faint'}`}>
              <Icon size={19} />
              {label}
              {label === 'Pipeline' && due > 0 && <span className="absolute right-3 top-1 h-2 w-2 rounded-full bg-accent" />}
            </NavLink>
          ))}
        </nav>
      </div>
    </ToastProvider>
  )
}
