import { ChevronLeft, ChevronRight, Info, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { EmptyState, PageHeader, SearchInput, Skeleton } from '@/components/ui/misc'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { resources, type Query, type ResourceClient, type ResourceKey } from '@/services/campus'

export interface FilterDef {
  param: string
  label: string
  options?: { value: string; label: string }[]
  /** Load options from another resource, e.g. departments → id/name. */
  from?: { resource: ResourceKey; label: (item: never) => string }
}

export interface InfoDirectoryProps<T> {
  resource: ResourceKey
  title: string
  eyebrow: string
  description: string
  icon: LucideIcon
  render: (item: T) => ReactNode
  filters?: FilterDef[]
  baseParams?: Query
  pageSize?: number
  layout?: 'grid' | 'list'
  searchPlaceholder?: string
  aside?: ReactNode
}

function FilterSelect({ def, value, onChange }: { def: FilterDef; value: string; onChange: (v: string) => void }) {
  const { data } = useAsync(async () => {
    if (def.options) return def.options
    if (!def.from) return []
    const page = await resources[def.from.resource].list({ page_size: 100 })
    return (page.items as { id: number }[]).map((i) => ({ value: String(i.id), label: def.from!.label(i as never) }))
  }, [def.param])
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label={def.label} className="w-full sm:w-52">
      <option value="">All {def.label.toLowerCase()}</option>
      {data?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  )
}

export function InfoDirectory<T extends { id: number }>({
  resource, title, eyebrow, description, icon, render, filters = [], baseParams, pageSize = 12, layout = 'grid', searchPlaceholder, aside,
}: InfoDirectoryProps<T>) {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const debounced = useDebounce(q)
  const page = Number(params.get('page') ?? 1)
  const filterValues = Object.fromEntries(filters.map((f) => [f.param, params.get(f.param) ?? '']))

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }
  useEffect(() => { if ((params.get('q') ?? '') !== debounced) update({ q: debounced }) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const key = params.toString()
  const { data, loading, error, reload } = useAsync(
    () => (resources[resource] as unknown as ResourceClient<T>).list({ ...baseParams, ...filterValues, q: params.get('q') ?? undefined, page, page_size: pageSize }),
    [resource, key],
  )
  const items = (data?.items ?? []) as unknown as T[]
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} icon={icon} />
      {aside}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`} className="flex-1" />
        {filters.map((f) => <FilterSelect key={f.param} def={f} value={filterValues[f.param]} onChange={(v) => update({ [f.param]: v })} />)}
      </div>
      {error ? (
        <EmptyState icon={Info} title="Couldn't load this section" description={error} action={<Button variant="outline" onClick={reload}>Try again</Button>} />
      ) : loading && !data ? (
        <div className={cn('grid gap-4', layout === 'grid' && 'md:grid-cols-2 xl:grid-cols-3')}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No results found" description="Try a different search term or clear the filters." />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">{data?.total} result{data?.total === 1 ? '' : 's'}</p>
          <div className={cn('grid gap-4 transition-opacity', layout === 'grid' && 'md:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
            {items.map((item) => <div key={item.id}>{render(item)}</div>)}
          </div>
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}><ChevronLeft />Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => update({ page: String(page + 1) })}>Next<ChevronRight /></Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function InfoCard({ title, subtitle, badges, children, footer, className }: {
  title: ReactNode; subtitle?: ReactNode; badges?: ReactNode; children?: ReactNode; footer?: ReactNode; className?: string
}) {
  return (
    <article className={cn('surface flex h-full flex-col p-5 transition-shadow hover:shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {badges && <div className="flex shrink-0 flex-wrap justify-end gap-1">{badges}</div>}
      </div>
      {children && <div className="mt-3 flex-1 space-y-2">{children}</div>}
      {footer && <div className="mt-4 border-t pt-3">{footer}</div>}
    </article>
  )
}

export const stripDemo = (text: string | null | undefined) => (text ?? '').replace(/^\[Demo data\]\s*/i, '')
