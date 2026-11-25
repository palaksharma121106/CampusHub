import { ChevronDown, Database, FileText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import type { Source } from '@/types'

export function SourceList({ sources, highlight }: { sources: Source[]; highlight?: number | null }) {
  const [open, setOpen] = useState(true)
  if (!sources.length) return null
  return (
    <div className="mt-3 border-t pt-3">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
        Sources ({sources.length}) <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <ol className="mt-2 grid gap-2 sm:grid-cols-2">
          {sources.map((s) => {
            const Icon = s.source_type === 'document' ? FileText : Database
            const body = (
              <>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-navy-900 text-[10px] font-semibold text-white">{s.number}</span>
                  <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="truncate text-xs font-medium text-foreground">{s.title}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {s.source_type === 'document' ? 'Uploaded document' : 'College database'}
                  {s.section ? ` · ${s.section}` : ''}{s.page ? ` · page ${s.page}` : ''}
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{s.excerpt}</p>
              </>
            )
            const cls = cn('block rounded-lg border bg-background p-2.5 transition-colors', highlight === s.number && 'border-accent ring-1 ring-accent/30', s.link && 'hover:border-accent/60')
            return <li key={s.number}>{s.link ? <Link to={s.link} className={cls}>{body}</Link> : <div className={cls}>{body}</div>}</li>
          })}
        </ol>
      )}
    </div>
  )
}
