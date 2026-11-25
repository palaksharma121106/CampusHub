import { AlertCircle, Eye, EyeOff, Shield, Sparkles, UserCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/services/api'

import { AuthLayout } from './AuthLayout'

export default function Login({ portal = 'student' }: { portal?: 'student' | 'admin' }) {
  const { login, logout, loginAsDemo } = useAuth()
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

  const handleInstantDemoLogin = async (targetRole: 'student' | 'admin') => {
    const targetEmail = targetRole === 'admin' ? 'admin@campushub.demo' : 'aarav.student@campushub.demo'
    const targetPass = targetRole === 'admin' ? 'Admin@12345' : 'Student@123'
    setEmail(targetEmail)
    setPassword(targetPass)
    if (loginAsDemo) {
      loginAsDemo(targetRole)
      navigate(targetRole === 'admin' ? '/admin' : '/app', { replace: true })
      return
    }
    await doLogin(targetEmail, targetPass)
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

      {/* 1-Click Instant Demo Login Banner */}
      <div className="mb-6 rounded-xl border border-teal-500/30 bg-teal-50/50 p-3.5 dark:bg-teal-950/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-200">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>Try without typing credentials</span>
          </div>
          <span className="rounded bg-teal-200/60 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
            Quick demo
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="accent"
          className="mt-2.5 w-full justify-center text-xs font-semibold"
          onClick={() => handleInstantDemoLogin(isAdmin ? 'admin' : 'student')}
        >
          ⚡ Instant 1-Click Login as {isAdmin ? 'Campus Administrator' : 'Student (Aarav Gupta)'}
        </Button>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isAdmin ? 'admin@campushub.demo' : 'aarav.student@campushub.demo'}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              placeholder={isAdmin ? 'Admin@12345' : 'Student@123'}
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

      {/* Interactive Clickable Demo Credentials */}
      <div className="mt-6 rounded-xl border bg-muted/50 p-3.5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Demo Accounts</p>
          <span className="text-[11px] text-teal-600 font-medium">Click to auto-fill</span>
        </div>
        <div className="mt-2.5 space-y-2">
          <button
            type="button"
            onClick={() => {
              setEmail('aarav.student@campushub.demo')
              setPassword('Student@123')
              if (isAdmin) navigate('/login')
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-teal-400 hover:bg-teal-50/40',
              !isAdmin && 'border-teal-500/40 bg-teal-50/20',
            )}
          >
            <div>
              <p className="font-medium text-foreground">Student: Aarav Gupta</p>
              <p className="font-mono text-[11px] text-muted-foreground">aarav.student@campushub.demo</p>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]">Student@123</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('admin@campushub.demo')
              setPassword('Admin@12345')
              if (!isAdmin) navigate('/admin/login')
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-teal-400 hover:bg-teal-50/40',
              isAdmin && 'border-teal-500/40 bg-teal-50/20',
            )}
          >
            <div>
              <p className="font-medium text-foreground">Administrator: Campus Admin</p>
              <p className="font-mono text-[11px] text-muted-foreground">admin@campushub.demo</p>
            </div>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]">Admin@12345</span>
          </button>
        </div>
      </div>

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
