import { ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Trash2, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { EmptyState, PageHeader, SearchInput, Skeleton } from '@/components/ui/misc'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { errorMessage } from '@/services/api'
import { resources, type ResourceClient, type ResourceKey } from '@/services/campus'

type Option = { value: string; label: string }
export interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'email' | 'password' | 'datetime'
  required?: boolean
  options?: Option[]
  from?: { resource: ResourceKey; label: (item: never) => string }
  placeholder?: string
  hint?: string
  step?: string
  full?: boolean
  createOnly?: boolean
  defaultValue?: string | boolean
}
export interface ColumnDef<T> { header: string; cell: (item: T) => ReactNode; className?: string }
export interface FilterDef { param: string; label: string; options?: Option[]; from?: FieldDef['from'] }

export interface ResourceManagerProps<T> {
  resource: ResourceKey
  title: string
  singular: string
  description: string
  icon: LucideIcon
  columns: ColumnDef<T>[]
  fields: FieldDef[]
  filters?: FilterDef[]
  toForm?: (item: T) => Record<string, unknown>
  itemLabel: (item: T) => string
}

function useOptions(def: { options?: Option[]; from?: FieldDef['from'] }) {
  return useAsync(async () => {
    if (def.options) return def.options
    if (!def.from) return []
    const page = await resources[def.from.resource].list({ page_size: 200 })
    return (page.items as { id: number }[]).map((i) => ({ value: String(i.id), label: def.from!.label(i as never) }))
  }, [def.from?.resource]).data ?? []
}

function FieldInput({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const options = useOptions(def)
  const id = `f-${def.name}`
  if (def.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-input accent-teal-600" />
        {def.label}
      </label>
    )
  }
  const str = value === null || value === undefined ? '' : String(value)
  let control: ReactNode
  if (def.type === 'textarea') control = <Textarea id={id} value={str} onChange={(e) => onChange(e.target.value)} required={def.required} placeholder={def.placeholder} />
  else if (def.type === 'select') {
    control = (
      <Select id={id} value={str} onChange={(e) => onChange(e.target.value)} required={def.required}>
        <option value="">{def.required ? 'Select…' : 'None'}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    )
  } else {
    const type = def.type === 'datetime' ? 'datetime-local' : def.type ?? 'text'
    control = <Input id={id} type={type} step={def.step} value={def.type === 'datetime' ? str.slice(0, 16) : str} onChange={(e) => onChange(e.target.value)} required={def.required} placeholder={def.placeholder} />
  }
  return <Field label={def.label + (def.required ? ' *' : '')} htmlFor={id} hint={def.hint} className={def.full || def.type === 'textarea' ? 'sm:col-span-2' : undefined}>{control}</Field>
}

function FilterSelect({ def, value, onChange }: { def: FilterDef; value: string; onChange: (v: string) => void }) {
  const options = useOptions(def)
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label={def.label} className="w-full sm:w-48">
      <option value="">All {def.label.toLowerCase()}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  )
}

const toPayload = (fields: FieldDef[], form: Record<string, unknown>, editing: boolean) => {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (editing && f.createOnly) continue
    const v = form[f.name]
    if (f.type === 'checkbox') out[f.name] = Boolean(v)
    else if (v === '' || v === undefined || v === null) out[f.name] = null
    else if (f.type === 'number' || (f.type === 'select' && f.from)) out[f.name] = Number(v)
    else out[f.name] = typeof v === 'string' ? v.trim() : v
  }
  if (!editing) Object.keys(out).forEach((k) => out[k] === null && delete out[k])
  return out
}

export function ResourceManager<T extends { id: number }>({ resource, title, singular, description, icon, columns, fields, filters = [], toForm, itemLabel }: ResourceManagerProps<T>) {
  const toast = useToast()
  const api = resources[resource] as unknown as ResourceClient<T>
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)
  const [page, setPage] = useState(1)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<T | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => setPage(1), [debounced, filterValues])
  const { data, loading, error, reload } = useAsync(() => api.list({ q: debounced || undefined, page, page_size: 15, ...filterValues }), [resource, debounced, page, JSON.stringify(filterValues)])
  const items = (data?.items ?? []) as unknown as T[]
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  const openCreate = () => {
    setEditing(null)
    setForm(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? (f.type === 'checkbox' ? false : '')])))
    setFormError(null); setFormOpen(true)
  }
  const openEdit = (item: T) => {
    setEditing(item)
    const src = toForm ? toForm(item) : (item as unknown as Record<string, unknown>)
    setForm(Object.fromEntries(fields.map((f) => [f.name, src[f.name] ?? (f.type === 'checkbox' ? false : '')])))
    setFormError(null); setFormOpen(true)
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setFormError(null)
    try {
      const payload = toPayload(fields, form, Boolean(editing))
      if (editing) await api.update(editing.id, payload); else await api.create(payload)
      toast.success(`${singular} ${editing ? 'updated' : 'created'}`)
      setFormOpen(false); reload()
    } catch (err) { setFormError(errorMessage(err)) } finally { setSaving(false) }
  }
  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try { await api.remove(deleting.id); toast.success(`${singular} deleted`); setDeleting(null); reload() }
    catch (err) { toast.error(errorMessage(err)) } finally { setDeleteBusy(false) }
  }
  const visibleFields = fields.filter((f) => !(editing && f.createOnly))

  return (
    <div>
      <PageHeader eyebrow="Manage" title={title} description={description} icon={icon}
        actions={<><Button variant="outline" onClick={reload} aria-label="Refresh"><RefreshCw /></Button><Button onClick={openCreate}><Plus />Add {singular.toLowerCase()}</Button></>} />
      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder={`Search ${title.toLowerCase()}…`} className="flex-1" />
          {filters.map((f) => <FilterSelect key={f.param} def={f} value={filterValues[f.param] ?? ''} onChange={(v) => setFilterValues((s) => ({ ...s, [f.param]: v }))} />)}
        </div>
        {error ? <div className="p-6"><EmptyState title="Couldn't load records" description={error} action={<Button variant="outline" onClick={reload}>Retry</Button>} /></div>
          : loading && !data ? <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          : items.length === 0 ? <div className="p-6"><EmptyState title={`No ${title.toLowerCase()} found`} description="Adjust the search or add a new record." action={<Button onClick={openCreate}><Plus />Add {singular.toLowerCase()}</Button>} /></div>
          : (
            <Table className={loading ? 'opacity-60' : undefined}>
              <THead><TR className="hover:bg-transparent">{columns.map((c) => <TH key={c.header} className={c.className}>{c.header}</TH>)}<TH className="text-right">Actions</TH></TR></THead>
              <TBody>
                {items.map((item) => (
                  <TR key={item.id}>
                    {columns.map((c) => <TD key={c.header} className={c.className}>{c.cell(item)}</TD>)}
                    <TD className="whitespace-nowrap text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label={`Edit ${itemLabel(item)}`}><Pencil /></Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleting(item)} aria-label={`Delete ${itemLabel(item)}`}><Trash2 /></Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>{data.total} record{data.total === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft /></Button>
              <span>{page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight /></Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen} title={`${editing ? 'Edit' : 'Add'} ${singular.toLowerCase()}`} className="max-w-2xl"
        footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" form="resource-form" loading={saving}>{editing ? 'Save changes' : `Create ${singular.toLowerCase()}`}</Button></>}>
        <form id="resource-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{formError}</p>}
          {visibleFields.map((f) => <FieldInput key={f.name} def={f} value={form[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />)}
        </form>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)} loading={deleteBusy} onConfirm={confirmDelete}
        title={`Delete ${singular.toLowerCase()}?`} description={deleting ? `“${itemLabel(deleting)}” will be permanently removed. Related records may also be affected. This cannot be undone.` : ''} />
    </div>
  )
}
