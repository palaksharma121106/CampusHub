import { AlertCircle, CheckCircle2, FileText, FileUp, Loader2, RefreshCw, ShieldCheck, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactElement } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/form'
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/misc'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useAsync } from '@/hooks/useAsync'
import { cn, formatBytes, formatRelative } from '@/lib/utils'
import { errorMessage } from '@/services/api'
import { adminApi } from '@/services/campus'
import type { UploadedDocument } from '@/types'

const CATEGORIES = ['Academics', 'Examinations', 'Hostel', 'Fees', 'Library', 'Medical', 'Administration', 'General']
const MAX_MB = 20
const statusBadge: Record<UploadedDocument['status'], ReactElement> = {
  pending: <Badge variant="outline"><Loader2 className="h-3 w-3 animate-spin" />Queued</Badge>,
  processing: <Badge variant="warning"><Loader2 className="h-3 w-3 animate-spin" />Indexing</Badge>,
  indexed: <Badge variant="success"><CheckCircle2 className="h-3 w-3" />Indexed</Badge>,
  failed: <Badge variant="destructive"><AlertCircle className="h-3 w-3" />Failed</Badge>,
}

export function validateFile(file: File): string | null {
  if (!/\.(pdf|docx)$/i.test(file.name)) return 'Only PDF and DOCX files are supported.'
  const allowedTypes = file.name.toLowerCase().endsWith('.pdf')
    ? ['application/pdf', 'application/octet-stream']
    : [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream',
        'application/zip',
      ]
  if (file.type && !allowedTypes.includes(file.type)) return 'The file type does not match its extension.'
  if (file.size > MAX_MB * 1024 * 1024) return `File is larger than ${MAX_MB} MB.`
  if (file.size === 0) return 'File is empty.'
  return null
}

export default function AdminDocuments() {
  const toast = useToast()
  const docs = useAsync(() => adminApi.documents.list(), [])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Academics')
  const [progress, setProgress] = useState<number | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const [deleting, setDeleting] = useState<UploadedDocument | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Poll while any document is still being processed in the background.
  const active = docs.data?.some((d) => d.status === 'pending' || d.status === 'processing')
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => adminApi.documents.list().then(docs.setData).catch(() => undefined), 2000)
    return () => clearInterval(t)
  }, [active, docs.setData])

  const pick = (f: File | undefined) => {
    if (!f) return
    const err = validateFile(f)
    setFileError(err)
    setFile(err ? null : f)
    if (!err && !title) setTitle(f.name.replace(/\.(pdf|docx)$/i, '').replace(/[-_]+/g, ' '))
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }

  const upload = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setProgress(0)
    try {
      await adminApi.documents.upload(file, title.trim() || file.name, category, setProgress)
      toast.success('Uploaded — indexing has started')
      setFile(null); setTitle(''); if (inputRef.current) inputRef.current.value = ''
      docs.reload()
    } catch (err) { toast.error(errorMessage(err)) } finally { setProgress(null) }
  }
  const reindex = async (d: UploadedDocument) => {
    try { await adminApi.documents.reindex(d.id); toast.success(`Re-indexing “${d.title}”`); docs.reload() } catch (e) { toast.error(errorMessage(e)) }
  }
  const toggleVerified = async (d: UploadedDocument) => {
    try { await adminApi.documents.update(d.id, { is_verified: !d.is_verified }); docs.reload() } catch (e) { toast.error(errorMessage(e)) }
  }
  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try { await adminApi.documents.remove(deleting.id); toast.success('Document and its vectors deleted'); setDeleting(null); docs.reload() }
    catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Knowledge base" title="Documents" icon={FileText}
        description="Upload official PDF and DOCX documents. Each file is extracted, split into passages, embedded and indexed in FAISS for the AI assistant."
        actions={<Button variant="outline" onClick={docs.reload} aria-label="Refresh"><RefreshCw /></Button>} />

      <Card>
        <CardHeader><CardTitle>Upload a document</CardTitle><CardDescription>PDF or DOCX, up to {MAX_MB} MB.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={upload} className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <label onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
              className={cn('flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors', drag ? 'border-accent bg-accent-soft/40' : 'border-border hover:border-accent/50 hover:bg-muted/40')}>
              <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only"
                onChange={(e) => pick(e.target.files?.[0])} aria-label="Choose document" data-testid="file-input" />
              {file ? (<><FileUp className="h-8 w-8 text-accent" /><p className="mt-2 font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatBytes(file.size)} · click to change</p></>)
                : (<><UploadCloud className="h-8 w-8 text-muted-foreground" /><p className="mt-2 font-medium">Drop a file here or click to browse</p><p className="text-xs text-muted-foreground">PDF or DOCX</p></>)}
              {fileError && <p className="mt-2 text-sm text-destructive" role="alert">{fileError}</p>}
            </label>
            <div className="space-y-4">
              <Field label="Title" htmlFor="doc-title"><Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Academic Regulations 2025" /></Field>
              <Field label="Category" htmlFor="doc-cat">
                <Select id="doc-cat" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
              </Field>
              {progress !== null && (
                <div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div><p className="text-xs text-muted-foreground">Uploading… {progress}%</p></div>
              )}
              <Button type="submit" className="w-full" disabled={!file} loading={progress !== null}><UploadCloud />Upload & index</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="surface overflow-hidden">
        {docs.loading && !docs.data ? <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          : !docs.data?.length ? <div className="p-6"><EmptyState icon={FileText} title="No documents yet" description="Upload your first official document to power the assistant." /></div> : (
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Document</TH><TH className="hidden md:table-cell">Category</TH><TH>Status</TH><TH className="hidden lg:table-cell">Pages / chunks</TH><TH className="hidden md:table-cell">Verified</TH><TH className="hidden lg:table-cell">Updated</TH><TH className="text-right">Actions</TH></TR></THead>
              <TBody>
                {docs.data.map((d) => (
                  <TR key={d.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase', d.file_type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}>{d.file_type}</span>
                        <div className="min-w-0"><p className="truncate font-medium">{d.title}</p><p className="truncate text-xs text-muted-foreground">{d.original_filename} · {formatBytes(d.file_size)}</p></div>
                      </div>
                      {d.status === 'failed' && d.error_message && <p className="mt-1 text-xs text-destructive">{d.error_message}</p>}
                    </TD>
                    <TD className="hidden md:table-cell"><Badge variant="outline">{d.category}</Badge></TD>
                    <TD>{statusBadge[d.status]}</TD>
                    <TD className="hidden text-muted-foreground lg:table-cell">{d.page_count ?? '—'} / {d.chunk_count}</TD>
                    <TD className="hidden md:table-cell">
                      <button onClick={() => toggleVerified(d)} className={cn('inline-flex items-center gap-1 text-xs font-medium', d.is_verified ? 'text-emerald-700' : 'text-muted-foreground hover:text-foreground')} title="Toggle verified">
                        <ShieldCheck className="h-3.5 w-3.5" />{d.is_verified ? 'Verified' : 'Unverified'}
                      </button>
                    </TD>
                    <TD className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{formatRelative(d.updated_at)}</TD>
                    <TD className="whitespace-nowrap text-right">
                      <Button variant="ghost" size="icon" onClick={() => reindex(d)} disabled={d.status === 'processing' || d.status === 'pending'} aria-label={`Re-index ${d.title}`} title="Re-index"><RefreshCw /></Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleting(d)} aria-label={`Delete ${d.title}`} title="Delete"><Trash2 /></Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
      </div>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={remove} loading={busy} title="Delete document?"
        description={deleting ? `“${deleting.title}” and all of its indexed passages will be removed from the knowledge base. The assistant will no longer cite it.` : ''} />
    </div>
  )
}
