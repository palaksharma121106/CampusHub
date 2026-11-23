import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'

export function AuthLayout({ title, subtitle, children, aside }: { title: string; subtitle: string; children: ReactNode; aside?: 'student' | 'admin' }) {
  const points = aside === 'admin'
    ? ['Manage academic and campus records', 'Upload and index official documents', 'Monitor assistant usage analytics']
    : ['Ask questions by voice or text', 'Answers cite official sources', 'All campus information in one place']
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col">
        <div className="grid-bg absolute inset-0 opacity-[0.07]" />
        <Link to="/" className="relative"><Logo inverted /></Link>
        <div className="relative mt-auto max-w-md">
          <p className="eyebrow !text-teal-300">{aside === 'admin' ? 'Administration portal' : 'Student portal'}</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            {aside === 'admin' ? 'Keep institutional information accurate and accessible.' : 'Your campus, answered — instantly.'}
          </h2>
          <ul className="mt-8 space-y-3">
            {points.map((p) => <li key={p} className="flex items-center gap-3 text-sm text-navy-200"><CheckCircle2 className="h-4 w-4 text-teal-400" />{p}</li>)}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-navy-400">Demonstration deployment · data is illustrative</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-block lg:hidden"><Logo /></Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
