import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const links = [
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
      <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {home ? <Button asChild><Link to={home}>Open dashboard</Link></Button> : (<>
              <Button asChild variant="ghost"><Link to="/login">Log in</Link></Button>
              <Button asChild><Link to="/register">Get started</Link></Button>
            </>)}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</Button>
        </div>
        {open && (
          <div className="border-t bg-card px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {links.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium">{l.label}</a>)}
              <div className="flex gap-2 pt-2">
                {home ? <Button asChild className="flex-1"><Link to={home}>Open dashboard</Link></Button> : (<>
                  <Button asChild variant="outline" className="flex-1"><Link to="/login">Log in</Link></Button>
                  <Button asChild className="flex-1"><Link to="/register">Get started</Link></Button>
                </>)}
              </div>
            </div>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  )
}
