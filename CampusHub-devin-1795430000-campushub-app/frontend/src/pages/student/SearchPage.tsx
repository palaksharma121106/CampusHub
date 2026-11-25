import { ArrowRight, Mic, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/misc'
import { useAsync } from '@/hooks/useAsync'
import { publicApi } from '@/services/campus'
import type { SearchResult } from '@/types'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  useEffect(() => setInput(q), [q])
  const { data, loading, error } = useAsync(async () => (q.length >= 2 ? publicApi.search(q) : null), [q])

  const grouped = (data?.results ?? []).reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r)
    return acc
  }, {})
  const submit = (e: FormEvent) => { e.preventDefault(); if (input.trim().length >= 2) setParams({ q: input.trim() }) }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Global search" title={q ? `Results for “${q}”` : 'Search CampusHub'} icon={Search}
        description="Search across programmes, courses, faculty, facilities, contacts and notices." />
      <form onSubmit={submit} className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={input} onChange={(e) => setInput(e.target.value)} aria-label="Search query" placeholder="e.g. machine learning, hostel, library…"
          className="h-12 w-full rounded-xl border bg-card pl-10 pr-28 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30" />
        <Button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2">Search</Button>
      </form>
      {loading && q && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
      {error && <EmptyState title="Search failed" description={error} />}
      {!loading && data && data.results.length === 0 && (
        <EmptyState title="No matching records" description="Nothing in the directory matched your search. The AI assistant can also search uploaded documents."
          action={<Button asChild variant="accent"><Link to={`/app/assistant?q=${encodeURIComponent(q)}`}><Mic />Ask the assistant</Link></Button>} />
      )}
      {!loading && Object.entries(grouped).map(([type, items]) => (
        <section key={type} className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{type} · {items.length}</h2>
          <div className="surface divide-y">
            {items.map((r) => (
              <Link key={`${r.type}-${r.id}`} to={`${r.link}?q=${encodeURIComponent(r.title.slice(0, 60))}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.title}</p>
                  {r.subtitle && <p className="line-clamp-1 text-sm text-muted-foreground">{r.subtitle.replace(/^\[Demo data\]\s*/, '')}</p>}
                </div>
                <Badge variant="outline">{r.type}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      ))}
      {!loading && data && data.results.length > 0 && (
        <div className="surface flex flex-col items-center justify-between gap-3 p-5 sm:flex-row">
          <p className="text-sm text-muted-foreground">Need a direct answer instead of a list?</p>
          <Button asChild variant="accent"><Link to={`/app/assistant?q=${encodeURIComponent(q)}`}><Mic />Ask the AI assistant</Link></Button>
        </div>
      )}
    </div>
  )
}
