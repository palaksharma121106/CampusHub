import { AlertCircle, Eye, EyeOff, Shield, UserCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
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

  const doLogin = async (loginEmail: string, loginPass: string) => {
    setError(null)
    setLoading(true)
    try {
      const user = await login(loginEmail.trim(), loginPass)
      if (isAdmin && user.role !== 'admin') {
        logout()
        setError('This account does not have administrator access.')
        return
      }
      const from = (location.state as { from?: string } | null)?.from
      navigate(
        from && from.startsWith(user.role === 'admin' ? '/admin' : '/app')
          ? from
          : user.role === 'admin'
            ? '/admin'
            : '/app',
        { replace: true },
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await doLogin(email, password)
  }

  return (
    <AuthLayout
      aside={portal}
      title={isAdmin ? 'Administrator Sign in' : 'Student Sign in'}
      subtitle={
        isAdmin
          ? 'Sign in to manage Mody University academic content, documents and analytics.'
          : 'Sign in to access courses, syllabus, voice AI assistant and student services.'
      }
    >
      {/* Portal Selection Tabs */}
      <div className="mb-6 flex rounded-xl border bg-muted/60 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-all',
            !isAdmin
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <UserCheck className="h-4 w-4 text-teal-600" />
          <span>Student Portal</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/login')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-all',
            isAdmin
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Shield className="h-4 w-4 text-navy-800" />
          <span>Admin Portal</span>
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@university.edu"
          />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={!email || !password}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isAdmin ? (
          <>
            Not an administrator?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Student login
            </Link>
          </>
        ) : (
          <>
            New to CampusHub?{' '}
            <Link to="/register" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </AuthLayout>
  )
}
