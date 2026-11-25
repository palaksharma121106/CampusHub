import { ArrowRight, Bell, BookOpen, Building2, Clock, GraduationCap, HeartPulse, Home, IndianRupee, Library, Mic, Phone, Search, TrendingUp, UserSquare2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatRelative } from '@/lib/utils'
import { assistantApi, resources } from '@/services/campus'

const shortcuts = [
  { to: '/app/programs', label: 'Programs', icon: GraduationCap },
  { to: '/app/courses', label: 'Courses', icon: BookOpen },
  { to: '/app/faculty', label: 'Faculty', icon: UserSquare2 },
  { to: '/app/fees', label: 'Fees', icon: IndianRupee },
  { to: '/app/departments', label: 'Departments', icon: Building2 },
  { to: '/app/syllabus', label: 'Syllabus', icon: BookOpen },
]
const services = [
  { to: '/app/library', label: 'Library', desc: 'Timings, sections & e-resources', icon: Library },
  { to: '/app/medical', label: 'Medical', desc: 'Health centre & emergency', icon: HeartPulse },
  { to: '/app/hostels', label: 'Hostels', desc: 'Blocks, mess & rules', icon: Home },
  { to: '/app/contacts', label: 'Contacts', desc: 'Offices & helplines', icon: Phone },
]
const priorityVariant = { urgent: 'destructive', important: 'warning', normal: 'default' } as const

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const announcements = useAsync(() => resources.announcements.list({ page_size: 5 }), [])
  const popular = useAsync(() => assistantApi.popular(), [])
  const recent = useAsync(() => assistantApi.recent(), [])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const s = user?.student

  const onSearch = (e: FormEvent) => { e.preventDefault(); if (q.trim().length >= 2) navigate(`/app/search?q=${encodeURIComponent(q.trim())}`) }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white sm:p-8">
          <div className="grid-bg absolute inset-0 opacity-[0.06]" />
          <div className="relative">
            <p className="text-sm text-navy-300">{greeting},</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{user?.full_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {s?.program_name && <span className="rounded-md bg-white/10 px-2 py-1">{s.program_name}</span>}
              {s && <span className="rounded-md bg-white/10 px-2 py-1">Year {s.year_of_study}</span>}
              {s && <span className="rounded-md bg-white/10 px-2 py-1">{s.enrollment_no}</span>}
            </div>
            <form onSubmit={onSearch} className="relative mt-6 max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search programmes, faculty, facilities, notices…" aria-label="Search CampusHub"
                className="h-12 w-full rounded-xl border border-white/10 bg-white pl-10 pr-28 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <button type="submit" className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-navy-900 px-4 text-sm font-medium text-white hover:bg-navy-800">Search</button>
            </form>
          </div>
        </div>
        <Link to="/app/assistant" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white shadow-card transition-transform hover:-translate-y-0.5 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/5"><Mic className="h-6 w-6" /></div>
          <div className="relative mt-6">
            <p className="text-lg font-semibold">Ask the AI voice assistant</p>
            <p className="mt-1 text-sm text-teal-50/90">Speak or type any question about academics, fees, hostels or campus services.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">Start a conversation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="surface flex flex-col items-center gap-2 px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><Icon className="h-5 w-5" /></span>
            <span className="text-xs font-medium sm:text-sm">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-accent" />Announcements & notices</CardTitle>
            <Link to="/app/announcements" className="text-xs font-medium text-accent hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="divide-y">
            {announcements.loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="my-3 h-14" />)}
            {announcements.data?.items.map((a) => (
              <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  {a.priority !== 'normal' && <Badge variant={priorityVariant[a.priority]} className="capitalize">{a.priority}</Badge>}
                  <Badge variant="outline">{a.category}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
              </div>
            ))}
            {announcements.data?.items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No announcements right now.</p>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" />Popular questions</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {popular.loading && <Skeleton className="h-24" />}
              {popular.data?.slice(0, 5).map((p) => (
                <Link key={p.question} to={`/app/assistant?q=${encodeURIComponent(p.question)}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted">
                  <span className="line-clamp-1">{p.question}</span><span className="shrink-0 text-xs text-muted-foreground">{p.count}×</span>
                </Link>
              ))}
              {popular.data?.length === 0 && <p className="py-3 text-sm text-muted-foreground">No questions asked yet — be the first!</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" />Your recent queries</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {recent.data?.slice(0, 5).map((r, i) => (
                <Link key={i} to={`/app/assistant?q=${encodeURIComponent(r.question)}`} className="block rounded-lg px-2 py-2 hover:bg-muted">
                  <p className="line-clamp-1 text-sm">{r.question}</p><p className="text-xs text-muted-foreground">{formatRelative(r.created_at)}</p>
                </Link>
              ))}
              {recent.data?.length === 0 && <p className="py-3 text-sm text-muted-foreground">Questions you ask the assistant will show here.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Campus services</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ to, label, desc, icon: Icon }) => (
            <Link key={to} to={to} className="surface group flex items-center gap-4 p-4 transition-shadow hover:shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-teal-700"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block font-medium">{label}</span><span className="block text-xs text-muted-foreground">{desc}</span></span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
