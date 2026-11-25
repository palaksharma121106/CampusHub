import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, Search, UserCircle2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import type { NavGroup } from '@/config/navigation'
import { useAuth } from '@/context/AuthContext'
import { cn, initials } from '@/lib/utils'

function Sidebar({ nav, onNavigate, portal }: { nav: NavGroup[]; onNavigate?: () => void; portal: 'student' | 'admin' }) {
  return (
    <div className="flex h-full flex-col bg-navy-950 text-white">
      <div className="flex h-20 items-center gap-2 border-b border-white/10 px-5">
        <Link to={portal === 'admin' ? '/admin' : '/app'} onClick={onNavigate}>
          <Logo inverted />
        </Link>
        {portal === 'admin' && (
          <span className="ml-auto rounded-md bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
            Admin
          </span>
        )}
      </div>
      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {nav.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-300/70">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/app' || to === '/admin'}
                  onClick={onNavigate}
                  className={({ isActive }) => cn('nav-link', isActive && 'active')}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('h-4 w-4', isActive ? 'text-teal-300' : 'text-navy-300')} />
                      <span>{label}</span>
                      {to.endsWith('assistant') && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-[11px] text-navy-300/80 leading-relaxed">
        <p className="font-semibold text-white/90">Mody University</p>
        <p className="text-navy-400">Lakshmangarh, Rajasthan</p>
      </div>
    </div>
  )
}

export function AppShell({ nav, portal }: { nav: NavGroup[]; portal: 'student' | 'admin' }) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 2) navigate(`/app/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar nav={nav} portal={portal} />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <button
                className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-white/70 hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar nav={nav} portal={portal} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>

          {/* College pill branding in top bar */}
          <div className="hidden items-center gap-2 rounded-lg border bg-muted/60 px-2.5 py-1 text-xs md:flex">
            <img src="/mody-emblem.png" alt="" className="h-4 w-4 rounded-full" />
            <span className="font-semibold text-foreground">Mody University</span>
            <span className="text-muted-foreground">· Science & Technology</span>
          </div>

          {portal === 'student' ? (
            <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, faculty, facilities…"
                aria-label="Global search"
                className="h-10 w-full rounded-lg border border-transparent bg-muted pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </form>
          ) : (
            <p className="hidden text-sm font-medium text-muted-foreground sm:block">
              CampusHub Administration Console
            </p>
          )}

          <div className="ml-auto flex items-center gap-2">
            {portal === 'student' && (
              <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
                <Link to="/app/assistant">Ask CampusHub</Link>
              </Button>
            )}
            <Link
              to={portal === 'admin' ? '/admin' : '/app/profile'}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                {user ? initials(user.full_name) : <UserCircle2 />}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-tight">{user?.full_name}</span>
                <span className="block text-xs capitalize text-muted-foreground">{user?.role}</span>
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout()
                navigate('/')
              }}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
