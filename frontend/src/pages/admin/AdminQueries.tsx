import { ChevronLeft, ChevronRight, MessageSquareText, Mic, Keyboard } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { EmptyState, PageHeader, SearchInput, Skeleton } from '@/components/ui/misc'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import { adminApi } from '@/services/campus'
import type { Page, QueryLog } from '@/types'

export default function AdminQueries() {
  const [q, setQ] = useState('')
  const [answered, setAnswered] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(q)
  useEffect(() => setPage(1), [debounced, answered])
  const { data, loading } = useAsync(() => adminApi.queries({ q: debounced, answered, page, page_size: 20 }) as Promise<Page<QueryLog>>, [debounced, answered, page])
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  return (
    <div>
      <PageHeader eyebrow="Analytics" title="Query history" icon={MessageSquareText}
        description="Every question asked to the assistant. Unanswered queries highlight information that should be added to the knowledge base." />
      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Search questions…" className="flex-1" />
          <Select value={answered} onChange={(e) => setAnswered(e.target.value)} className="sm:w-48" aria-label="Answer status">
            <option value="">All queries</option><option value="true">Answered</option><option value="false">Unanswered</option>
          </Select>
        </div>
        {loading && !data ? <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          : !data?.items.length ? <div className="p-6"><EmptyState title="No queries found" /></div> : (
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Question</TH><TH className="hidden md:table-cell">User</TH><TH>Status</TH><TH className="hidden sm:table-cell">Mode</TH><TH className="hidden lg:table-cell">Sources</TH><TH className="hidden lg:table-cell">Time</TH><TH className="hidden md:table-cell">Asked</TH></TR></THead>
              <TBody>
                {data.items.map((l) => (
                  <TR key={l.id}>
                    <TD className="max-w-md"><p className="line-clamp-2">{l.query_text}</p></TD>
                    <TD className="hidden text-muted-foreground md:table-cell">{l.user_name ?? '—'}</TD>
                    <TD>{l.answered ? <Badge variant="success">Answered</Badge> : <Badge variant="warning">Unanswered</Badge>}</TD>
                    <TD className="hidden sm:table-cell"><span className="inline-flex items-center gap-1 text-xs capitalize text-muted-foreground">{l.input_mode === 'voice' ? <Mic className="h-3.5 w-3.5" /> : <Keyboard className="h-3.5 w-3.5" />}{l.input_mode}</span></TD>
                    <TD className="hidden lg:table-cell">{l.source_count}</TD>
                    <TD className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{l.response_time_ms} ms</TD>
                    <TD className="hidden whitespace-nowrap text-muted-foreground md:table-cell">{formatDate(l.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>{data.total} queries</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft /></Button>
              <span>{page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
