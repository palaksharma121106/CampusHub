import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'

export function AuthLayout({
  title,
  subtitle,
  children,
  aside,
}: {
  title: string
  subtitle: string
  children: ReactNode
  aside?: 'student' | 'admin'
}) {
  const points =
    aside === 'admin'
      ? [
          'Manage academic programmes, syllabus & courses',
          'Upload & index official documents for AI RAG pipeline',
          'Monitor query history & assistant usage analytics',
          'Manage departments, students and faculty records',
        ]
      : [
          'Instant voice & text college AI assistant',
          'Search programmes, unit-wise syllabus & fee details',
          'Access faculty directory, library & medical information',
          'Reliable answers grounded in official college records',
        ]

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col">
        <div className="grid-bg absolute inset-0 opacity-[0.07]" />
        <div className="relative flex items-center justify-between">
          <Link to="/">
            <Logo inverted />
          </Link>
        </div>

        <div className="relative my-auto max-w-md pt-8">
          <div className="mb-6 inline-block rounded-2xl bg-white p-3 shadow-lg">
            <img
              src="/mody-logo.png"
              alt="Mody University of Science and Technology"
              className="h-14 w-auto object-contain"
            />
          </div>

          <p className="eyebrow !text-teal-300">
            {aside === 'admin' ? 'Administration Portal' : 'Student & Scholar Portal'}
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            {aside === 'admin'
              ? 'Keep institutional information verified, current and accessible.'
              : 'Every answer about Mody University, one question away.'}
          </h2>
          <ul className="mt-8 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-navy-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-auto border-t border-white/10 pt-4 text-xs text-navy-400 flex justify-between items-center">
          <span>Mody University of Science and Technology</span>
          <span>Lakshmangarh · Rajasthan</span>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col gap-3 lg:hidden">
            <Link to="/" className="inline-block">
              <Logo />
            </Link>
            <div className="rounded-xl bg-muted/70 p-2.5 inline-flex items-center gap-3">
              <img
                src="/mody-logo.png"
                alt="Mody University"
                className="h-8 w-auto object-contain"
              />
              <span className="text-[11px] font-medium text-muted-foreground leading-tight">
                Mody University of Science and Technology
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
