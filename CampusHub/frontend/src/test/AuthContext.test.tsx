import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from '@/context/AuthContext'
import { tokenStore } from '@/services/api'
import type { User } from '@/types'

const authApiMocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  me: vi.fn(),
  register: vi.fn(),
}))

vi.mock('@/services/campus', () => ({ authApi: authApiMocks }))

const admin: User = {
  id: 1,
  email: 'admin@example.com',
  full_name: 'Campus Administrator',
  role: 'admin',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  student: null,
}

const student: User = {
  ...admin,
  id: 2,
  email: 'student@example.com',
  full_name: 'Student',
  role: 'student',
}

function Harness() {
  const auth = useAuth()
  return (
    <>
      <output data-testid="role">{auth.user?.role ?? 'none'}</output>
      <button onClick={() => void auth.login('user@example.com', 'password').catch(() => undefined)}>Login</button>
      <button onClick={auth.logout}>Logout</button>
    </>
  )
}

function renderAuth() {
  return render(<AuthProvider><Harness /></AuthProvider>)
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('clears legacy automatic demo tokens instead of restoring a demo role', async () => {
    tokenStore.set('demo-admin-token')
    renderAuth()
    await waitFor(() => expect(tokenStore.get()).toBeNull())
    expect(screen.getByTestId('role')).toHaveTextContent('none')
    expect(authApiMocks.me).not.toHaveBeenCalled()
  })

  it('clears one session before switching to another account', async () => {
    authApiMocks.login
      .mockResolvedValueOnce({ access_token: 'admin-token', user: admin })
      .mockResolvedValueOnce({ access_token: 'student-token', user: student })
    const user = userEvent.setup()
    renderAuth()

    await user.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('admin'))
    expect(tokenStore.get()).toBe('admin-token')

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(authApiMocks.logout).toHaveBeenCalledWith('admin-token')
    expect(screen.getByTestId('role')).toHaveTextContent('none')
    expect(tokenStore.get()).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('student'))
    expect(tokenStore.get()).toBe('student-token')
  })

  it('does not authenticate locally when the backend login request fails', async () => {
    authApiMocks.login.mockRejectedValueOnce(new Error('server unavailable'))
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => expect(authApiMocks.login).toHaveBeenCalledOnce())
    expect(screen.getByTestId('role')).toHaveTextContent('none')
    expect(tokenStore.get()).toBeNull()
  })
})
