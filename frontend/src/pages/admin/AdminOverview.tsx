import { Activity, BookOpen, Cpu, Database, FileText, GraduationCap, Mic, MessageSquareText, RefreshCw, Target, Timer, Users, UserSquare2 } from 'lucide-react'
import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader, Skeleton, StatCard } from '@/components/ui/misc'
import { useToast } from '@/components/ui/toast'
import { useAsync } from '@/hooks/useAsync'
import { formatRelative } from '@/lib/utils'
import { errorMessage } from '@/services/api'
import { adminApi } from '@/services/campus'
import type { ActivityItem } from '@/types'

interface Analytics {
  daily: { date: string; answered: number; unanswered: number }[]
  input_modes: { mode: string; count: number }[]
  documents_by_category: { category: string; count: number }[]
  top_questions: { question: string; count: number }[]
}
const COLORS = ['#0f9b8e', '#13254a', '#5eead4', '#94a3b8', '#f59e0b']
const tooltipStyle = { borderRadius: 10, border: '1px solid hsl(220 20% 90%)', fontSize: 12 }

export default function AdminOverview() {
  const toast = useToast()
  const [reindexing, setReindexing] = useState(false)
  const stats = useAsync(() => adminApi.stats(), [])
  const analytics = useAsync(() => adminApi.analytics(14) as Promise<Analytics>, [])
  const activity = useAsync(() => adminApi.activity(10) as Promise<ActivityItem[]>, [])
  const s = stats.data

  const reindex = async () => {
    setReindexing(true)
    try { const r = await adminApi.reindexRecords(); toast.success(`Re-indexed ${r.records_indexed} database records`); stats.reload() }
    catch (e) { toast.error(errorMessage(e)) } finally { setReindexing(false) }
  }
  const daily = analytics.data?.daily.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) })) ?? []

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Dashboard" description="Institution content, knowledge base and assistant usage at a glance."
        actions={<Button variant="outline" onClick={reindex} loading={reindexing}><RefreshCw />Re-index database records</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s ? (<>
          <StatCard label="Registered students" value={s.students} icon={Users} />
          <StatCard label="Assistant queries" value={s.queries} icon={MessageSquareText} tone="teal" hint={`${s.queries_this_week} in the last 7 days`} />
          <StatCard label="Answer rate" value={`${s.answer_rate}%`} icon={Target} tone="teal" hint="Queries answered from official sources" />
          <StatCard label="Indexed documents" value={`${s.indexed_documents} / ${s.documents}`} icon={FileText} tone="amber" hint={`${s.vector_count} vectors in FAISS`} />
        </>) : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Assistant queries</CardTitle><CardDescription>Answered vs. unanswered, last 14 days</CardDescription></CardHeader>
          <CardContent className="h-72">
            {analytics.data ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="ans" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f9b8e" stopOpacity={0.35} /><stop offset="100%" stopColor="#0f9b8e" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 92%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="answered" name="Answered" stroke="#0f9b8e" strokeWidth={2} fill="url(#ans)" />
                  <Area type="monotone" dataKey="unanswered" name="Unanswered" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Input mode</CardTitle><CardDescription>Voice vs. typed questions</CardDescription></CardHeader>
          <CardContent className="h-72">
            {analytics.data && analytics.data.input_modes.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.data.input_modes} dataKey="count" nameKey="mode" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {analytics.data.input_modes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12, textTransform: 'capitalize' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : analytics.data ? <p className="pt-20 text-center text-sm text-muted-foreground">No queries yet</p> : <Skeleton className="h-full" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Most asked questions</CardTitle></CardHeader>
          <CardContent className="h-72">
            {analytics.data && analytics.data.top_questions.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.data.top_questions.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 92%)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="question" width={220} tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v: string) => (v.length > 34 ? `${v.slice(0, 34)}…` : v)} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Times asked" fill="#13254a" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : analytics.data ? <p className="pt-20 text-center text-sm text-muted-foreground">No queries yet</p> : <Skeleton className="h-full" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-accent" />Recent activity</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-4">
              {activity.data?.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
                  <p className="text-sm">{a.summary}</p>
                  <p className="text-xs text-muted-foreground">{a.user_name ?? 'System'} · {formatRelative(a.created_at)}</p>
                </li>
              ))}
              {activity.data?.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s && (<>
          <StatCard label="Programmes / courses" value={`${s.programs} / ${s.courses}`} icon={GraduationCap} tone="slate" />
          <StatCard label="Faculty members" value={s.faculty} icon={UserSquare2} tone="slate" />
          <StatCard label="Voice queries" value={s.voice_queries} icon={Mic} tone="slate" />
          <StatCard label="Avg. response time" value={`${s.avg_response_ms} ms`} icon={Timer} tone="slate" />
        </>)}
      </div>
      {s && (
        <div className="surface flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" />Generator: <Badge variant={s.generator === 'gemini' ? 'success' : 'warning'}>{s.generator}</Badge></span>
          <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" />Embeddings: {s.embedder}</span>
          <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{s.announcements} announcements</span>
          {s.generator !== 'gemini' && <span>Set <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> on the server to enable Gemini generation.</span>}
        </div>
      )}
    </div>
  )
}
