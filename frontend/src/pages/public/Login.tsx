import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { useAuth } from '@/context/AuthContext'
import { errorMessage } from '@/services/api'

import { AuthLayout } from './AuthLayout'

export default function Login({ portal = 'student' }: { portal?: 'student' | 'admin' }) {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isAdmin = portal === 'admin'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      if (isAdmin && user.role !== 'admin') {
        logout()
        setError('This account does not have administrator access.')
        return
      }
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from.startsWith(user.role === 'admin' ? '/admin' : '/app') ? from : user.role === 'admin' ? '/admin' : '/app', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout aside={portal} title={isAdmin ? 'Administrator sign in' : 'Welcome back'}
      subtitle={isAdmin ? 'Sign in to manage CampusHub content and documents.' : 'Sign in to your CampusHub student account.'}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <Field label="Email address" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!email || !password}>Sign in</Button>
      </form>
      <div className="mt-6 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo credentials</p>
        {isAdmin ? <p className="mt-1">admin@campushub.demo · Admin@12345</p> : <p className="mt-1">aarav.student@campushub.demo · Student@123</p>}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isAdmin ? <>Not an administrator? <Link to="/login" className="font-medium text-accent hover:underline">Student login</Link></>
          : <>New to CampusHub? <Link to="/register" className="font-medium text-accent hover:underline">Create an account</Link></>}
      </p>
    </AuthLayout>
  )
}
