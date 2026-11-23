import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProtectedRoute } from '@/components/ProtectedRoute'

const auth = vi.hoisted(() => ({ value: { user: null as null | { role: string }, loading: false } }))
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth.value }))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>student login</p>} />
        <Route path="/admin/login" element={<p>admin login</p>} />
        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/app" element={<p>student area</p>} />
        </Route>
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<p>admin area</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('ProtectedRoute', () => {
  beforeEach(() => { auth.value = { user: null, loading: false } })

  it('sends anonymous users to the matching login page', () => {
    renderAt('/app')
    expect(screen.getByText('student login')).toBeInTheDocument()
    renderAt('/admin')
    expect(screen.getByText('admin login')).toBeInTheDocument()
  })

  it('lets a student into the student area but not the admin area', () => {
    auth.value = { user: { role: 'student' }, loading: false }
    renderAt('/app')
    expect(screen.getByText('student area')).toBeInTheDocument()
    renderAt('/admin')
    expect(screen.getAllByText('student area')).toHaveLength(2)
    expect(screen.queryByText('admin area')).not.toBeInTheDocument()
  })

  it('lets an admin into the admin area', () => {
    auth.value = { user: { role: 'admin' }, loading: false }
    renderAt('/admin')
    expect(screen.getByText('admin area')).toBeInTheDocument()
  })
})
