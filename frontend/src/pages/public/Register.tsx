import { AlertCircle } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { errorMessage } from '@/services/api'
import { publicApi } from '@/services/campus'

import { AuthLayout } from './AuthLayout'

const initial = { full_name: '', email: '', enrollment_no: '', department_id: '', program_id: '', year_of_study: '1', phone: '', password: '', confirm: '' }

export function validateRegistration(f: typeof initial) {
  const errors: Partial<Record<keyof typeof initial, string>> = {}
  if (f.full_name.trim().length < 2) errors.full_name = 'Enter your full name'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = 'Enter a valid email address'
  if (!/^[A-Za-z0-9\-/]{3,30}$/.test(f.enrollment_no)) errors.enrollment_no = '3–30 letters, digits, "-" or "/"'
  if (f.password.length < 8 || !/\d/.test(f.password) || !/[A-Za-z]/.test(f.password)) errors.password = 'At least 8 characters with a letter and a number'
  if (f.confirm !== f.password) errors.confirm = 'Passwords do not match'
  return errors
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { data: options } = useAsync(() => publicApi.registrationOptions(), [])
  const [form, setForm] = useState(initial)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const errors = useMemo(() => validateRegistration(form), [form])
  const set = (k: keyof typeof initial) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'department_id' ? { program_id: '' } : {}) }))
  const programs = options?.programs.filter((p) => !form.department_id || String(p.department_id) === form.department_id) ?? []

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length) return
    setLoading(true)
    setError(null)
    try {
      await register({
        full_name: form.full_name.trim(), email: form.email.trim(), password: form.password, enrollment_no: form.enrollment_no.trim(),
        department_id: form.department_id ? Number(form.department_id) : null, program_id: form.program_id ? Number(form.program_id) : null,
        year_of_study: Number(form.year_of_study), phone: form.phone.trim() || null,
      })
      navigate('/app', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }
  const err = (k: keyof typeof initial) => (touched ? errors[k] : undefined)

  return (
    <AuthLayout title="Create your student account" subtitle="Register with your college details to access CampusHub.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <Field label="Full name" htmlFor="full_name" error={err('full_name')}><Input id="full_name" value={form.full_name} onChange={set('full_name')} autoComplete="name" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address" htmlFor="email" error={err('email')}><Input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
          <Field label="Enrollment number" htmlFor="enrollment_no" error={err('enrollment_no')}><Input id="enrollment_no" value={form.enrollment_no} onChange={set('enrollment_no')} placeholder="e.g. 22BCS101" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" htmlFor="department_id">
            <Select id="department_id" value={form.department_id} onChange={set('department_id')}>
              <option value="">Select department</option>
              {options?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Programme" htmlFor="program_id">
            <Select id="program_id" value={form.program_id} onChange={set('program_id')}>
              <option value="">Select programme</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Year of study" htmlFor="year_of_study">
            <Select id="year_of_study" value={form.year_of_study} onChange={set('year_of_study')}>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
          </Field>
          <Field label="Phone (optional)" htmlFor="phone"><Input id="phone" value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={err('password')}><Input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
          <Field label="Confirm password" htmlFor="confirm" error={err('confirm')}><Input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link></p>
    </AuthLayout>
  )
}
