import { CheckCircle2, KeyRound, UserCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/form'
import { PageHeader } from '@/components/ui/misc'
import { useAuth } from '@/context/AuthContext'
import { formatDate, initials } from '@/lib/utils'
import { errorMessage } from '@/services/api'
import { authApi } from '@/services/campus'

function Notice({ ok, text }: { ok: boolean; text: string }) {
  return <p role="status" className={`flex items-center gap-1.5 text-sm ${ok ? 'text-emerald-700' : 'text-destructive'}`}>{ok && <CheckCircle2 className="h-4 w-4" />}{text}</p>
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.full_name ?? '')
  const [phone, setPhone] = useState(user?.student?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwSaving, setPwSaving] = useState(false)
  if (!user) return null
  const s = user.student

  const save = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try { setUser(await authApi.updateMe({ full_name: name.trim(), phone: phone.trim() || null })); setMsg({ ok: true, text: 'Profile updated' }) }
    catch (err) { setMsg({ ok: false, text: errorMessage(err) }) } finally { setSaving(false) }
  }
  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setPwMsg(null)
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'New passwords do not match' })
    setPwSaving(true)
    try { await authApi.changePassword(pw.current, pw.next); setPw({ current: '', next: '', confirm: '' }); setPwMsg({ ok: true, text: 'Password changed' }) }
    catch (err) { setPwMsg({ ok: false, text: errorMessage(err) }) } finally { setPwSaving(false) }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Account" title="My profile" icon={UserCircle2} description="Your student details and account settings." />
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-900 text-2xl font-semibold text-white">{initials(user.full_name)}</span>
            <p className="mt-4 font-semibold">{user.full_name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <dl className="mt-5 w-full space-y-2 border-t pt-4 text-left text-sm">
              {[['Enrollment no.', s?.enrollment_no], ['Department', s?.department_name], ['Programme', s?.program_name], ['Year', s ? `Year ${s.year_of_study}` : null], ['Member since', formatDate(user.created_at)]]
                .filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal details</CardTitle><CardDescription>Academic details can only be changed by the administration.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={save} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="pname"><Input id="pname" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required /></Field>
                  <Field label="Phone" htmlFor="pphone"><Input id="pphone" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
                </div>
                <div className="flex items-center gap-3"><Button type="submit" loading={saving}>Save changes</Button>{msg && <Notice {...msg} />}</div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Change password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={changePw} className="space-y-4">
                <Field label="Current password" htmlFor="cur"><Input id="cur" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required autoComplete="current-password" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password" htmlFor="new" hint="Min. 8 characters with a letter and a number"><Input id="new" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required autoComplete="new-password" /></Field>
                  <Field label="Confirm new password" htmlFor="conf"><Input id="conf" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required autoComplete="new-password" /></Field>
                </div>
                <div className="flex items-center gap-3"><Button type="submit" variant="outline" loading={pwSaving}>Update password</Button>{pwMsg && <Notice {...pwMsg} />}</div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
