import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { FullLogo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const links = [
  { href: '/#login-portals', label: 'Portals & Login' },
  { href: '/#features', label: 'Features' },
  { href: '/#assistant', label: 'Voice Assistant' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#campus', label: 'Campus' },
]

export function PublicLayout() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const home = user ? (user.role === 'admin' ? '/admin' : '/app') : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="container flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 hover:opacity-90 transition-opacity">
            <FullLogo imgClassName="h-9 sm:h-12" />
            <span className="inline-flex items-center border-l border-border pl-2.5 sm:pl-3 text-sm sm:text-base font-extrabold tracking-tight text-navy-950 whitespace-nowrap">
              Campus<span className="text-teal-500">Hub</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 xl:gap-7 lg:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            {home ? (
              <Button asChild variant="accent">
                <Link to={home}>Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="border-teal-500/40 text-teal-800 hover:bg-teal-50 font-medium">
                  <Link to="/login">Student Login</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Link to="/admin/login">Admin Portal</Link>
                </Button>
                <Button asChild size="sm" variant="accent">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {open && (
          <div className="border-t bg-card px-6 py-4 sm:hidden">
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                {home ? (
                  <Button asChild className="w-full">
                    <Link to={home}>Open dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full justify-center border-teal-500/40 text-teal-800">
                      <Link to="/login">Student Login</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-center">
                      <Link to="/admin/login">Admin Portal</Link>
                    </Button>
                    <Button asChild variant="accent" className="w-full justify-center">
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  )
}
