import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import Login from '@/pages/public/Login'

const login = vi.fn()
const logout = vi.fn()
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ login, logout, user: null, loading: false }) }))

const renderLogin = (portal: 'student' | 'admin' = 'student') =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login portal={portal} />} />
        <Route path="/app" element={<p>student dashboard</p>} />
        <Route path="/admin" element={<p>admin dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('Login', () => {
  it('does not expose demo accounts or automatic login options', () => {
    renderLogin()
    expect(screen.queryByText(/demo|try without typing|instant.*login/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveAttribute('placeholder', 'name@university.edu')
    expect(screen.getByLabelText('Password')).toHaveAttribute('placeholder', 'Enter your password')
  })

  it('signs a student in and opens the dashboard', async () => {
    login.mockResolvedValueOnce({ role: 'student' })
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email address'), 'aarav.student@campushub.demo')
    await userEvent.type(screen.getByLabelText('Password'), 'Student@123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(login).toHaveBeenCalledWith('aarav.student@campushub.demo', 'Student@123')
    expect(await screen.findByText('student dashboard')).toBeInTheDocument()
  })

  it('signs an administrator in and opens the admin dashboard', async () => {
    login.mockResolvedValueOnce({ role: 'admin' })
    renderLogin('admin')
    await userEvent.type(screen.getByLabelText('Email address'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'a-private-password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('admin dashboard')).toBeInTheDocument()
  })

  it('refuses student accounts on the admin portal', async () => {
    login.mockResolvedValueOnce({ role: 'student' })
    renderLogin('admin')
    await userEvent.type(screen.getByLabelText('Email address'), 'aarav.student@campushub.demo')
    await userEvent.type(screen.getByLabelText('Password'), 'Student@123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/does not have administrator access/i)).toBeInTheDocument()
    await waitFor(() => expect(logout).toHaveBeenCalled())
  })

  it('shows the API error for wrong credentials', async () => {
    login.mockRejectedValueOnce({ isAxiosError: true, response: { data: { detail: 'Incorrect email or password' } } })
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email address'), 'x@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/Incorrect email or password|Something went wrong|unexpected/i)).toBeInTheDocument()
  })
})
