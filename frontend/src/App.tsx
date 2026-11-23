import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { adminNav, studentNav } from '@/config/navigation'
import { AppShell } from '@/layouts/AppShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import Landing from '@/pages/public/Landing'
import Login from '@/pages/public/Login'
import NotFound from '@/pages/public/NotFound'
import Register from '@/pages/public/Register'

const Dashboard = lazy(() => import('@/pages/student/Dashboard'))
const Assistant = lazy(() => import('@/pages/student/Assistant'))
const SearchPage = lazy(() => import('@/pages/student/SearchPage'))
const Profile = lazy(() => import('@/pages/student/Profile'))
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'))
const AdminDocuments = lazy(() => import('@/pages/admin/AdminDocuments'))
const AdminQueries = lazy(() => import('@/pages/admin/AdminQueries'))
const info = (name: string) => lazy(() => import('@/pages/student/InfoPages').then((m) => ({ default: (m as unknown as Record<string, React.ComponentType>)[name] })))
const manage = (name: string) => lazy(() => import('@/pages/admin/ManagePages').then((m) => ({ default: (m as unknown as Record<string, React.ComponentType>)[name] })))

const infoRoutes: [string, string][] = [
  ['programs', 'ProgramsPage'], ['departments', 'DepartmentsPage'], ['courses', 'CoursesPage'], ['subjects', 'SubjectsPage'],
  ['syllabus', 'SyllabusPage'], ['faculty', 'FacultyPage'], ['fees', 'FeesPage'], ['library', 'LibraryPage'], ['medical', 'MedicalPage'],
  ['hostels', 'HostelsPage'], ['campus', 'CampusPage'], ['contacts', 'ContactsPage'], ['announcements', 'AnnouncementsPage'],
]
const manageRoutes: [string, string][] = [
  ['students', 'ManageStudents'], ['faculty', 'ManageFaculty'], ['departments', 'ManageDepartments'], ['programs', 'ManagePrograms'],
  ['courses', 'ManageCourses'], ['subjects', 'ManageSubjects'], ['syllabus', 'ManageSyllabus'], ['fees', 'ManageFees'], ['library', 'ManageLibrary'],
  ['medical', 'ManageMedical'], ['facilities', 'ManageFacilities'], ['contacts', 'ManageContacts'], ['announcements', 'ManageAnnouncements'],
]
const InfoComponents = Object.fromEntries(infoRoutes.map(([path, name]) => [path, info(name)]))
const ManageComponents = Object.fromEntries(manageRoutes.map(([path, name]) => [path, manage(name)]))

const Fallback = () => <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<Login portal="admin" />} />

        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/app" element={<AppShell nav={studentNav} portal="student" />}>
            <Route index element={<Dashboard />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="profile" element={<Profile />} />
            {infoRoutes.map(([path]) => { const C = InfoComponents[path]; return <Route key={path} path={path} element={<C />} /> })}
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<AppShell nav={adminNav} portal="admin" />}>
            <Route index element={<AdminOverview />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="queries" element={<AdminQueries />} />
            {manageRoutes.map(([path]) => { const C = ManageComponents[path]; return <Route key={path} path={path} element={<C />} /> })}
          </Route>
        </Route>

        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
