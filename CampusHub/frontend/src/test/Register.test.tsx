import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import Register from '@/pages/public/Register'

const register = vi.fn()
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ register, user: null, loading: false }) }))
vi.mock('@/services/campus', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/services/campus')>()
  return {
    ...mod,
    publicApi: {
      ...mod.publicApi,
      registrationOptions: vi.fn().mockResolvedValue(mod.FALLBACK_REGISTRATION_OPTIONS),
    },
  }
})

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={<p>student dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('Register', () => {
  it('loads department and programme options and registers a student', async () => {
    register.mockResolvedValueOnce({ role: 'student' })
    renderRegister()

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Computer Science & Engineering' })).toBeInTheDocument()
    })

    await userEvent.type(screen.getByLabelText(/full name/i), 'Ananya Sharma')
    await userEvent.type(screen.getByLabelText(/email address/i), 'ananya@modyuniversity.ac.in')
    await userEvent.type(screen.getByLabelText(/enrollment number/i), '22BCS101')
    await userEvent.selectOptions(screen.getByLabelText(/department/i), '1')
    await userEvent.selectOptions(screen.getByLabelText(/programme/i), '1')
    await userEvent.type(screen.getByLabelText(/^password/i), 'Student@123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Student@123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Ananya Sharma',
        email: 'ananya@modyuniversity.ac.in',
        enrollment_no: '22BCS101',
        department_id: 1,
        program_id: 1,
      }),
    )
    expect(await screen.findByText('student dashboard')).toBeInTheDocument()
  })

  it('shows validation errors when required fields are empty', async () => {
    renderRegister()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Enter your full name')).toBeInTheDocument()
    expect(screen.getByText('Select your department')).toBeInTheDocument()
    expect(screen.getByText('Select your programme')).toBeInTheDocument()
  })
})
