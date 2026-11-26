import { api } from '@/services/api'
import type {
  AdminStudent, Announcement, AskResponse, ChatMessage, ChatSessionSummary, Contact, Course, Department, Facility, Faculty, Fee,
  LibraryResource, MedicalFacility, Page, Program, SearchResult, Subject, SyllabusUnit, UploadedDocument, User,
} from '@/types'

export type Query = Record<string, string | number | boolean | undefined | null>

const clean = (params: Query = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export const resource = <T,>(path: string) => ({
  list: (params?: Query) => api.get<Page<T>>(path, { params: clean(params) }).then((r) => r.data),
  get: (id: number) => api.get<T>(`${path}/${id}`).then((r) => r.data),
  create: (data: Partial<T> | Record<string, unknown>) => api.post<T>(path, data).then((r) => r.data),
  update: (id: number, data: Partial<T> | Record<string, unknown>) => api.put<T>(`${path}/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`${path}/${id}`),
})

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', { email, password }).then((r) => r.data),
  logout: (token: string) =>
    api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }),
  register: (data: Record<string, unknown>) =>
    api.post<{ access_token: string; user: User }>('/auth/register', data).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  updateMe: (data: Record<string, unknown>) => api.put<User>('/auth/me', data).then((r) => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
}

export const FALLBACK_REGISTRATION_OPTIONS: {
  departments: { id: number; name: string }[]
  programs: { id: number; name: string; department_id: number }[]
} = {
  departments: [
    { id: 1, name: 'Computer Science & Engineering' },
    { id: 2, name: 'Electronics & Communication Engineering' },
    { id: 3, name: 'Mechanical Engineering' },
    { id: 4, name: 'School of Management' },
    { id: 5, name: 'Applied Sciences & Humanities' },
    { id: 6, name: 'School of Legal Studies' },
  ],
  programs: [
    { id: 1, name: 'B.Tech Computer Science & Engineering', department_id: 1 },
    { id: 2, name: 'B.Tech CSE (Artificial Intelligence & ML)', department_id: 1 },
    { id: 3, name: 'M.Tech Computer Science', department_id: 1 },
    { id: 4, name: 'Ph.D. Computer Science', department_id: 1 },
    { id: 5, name: 'B.Tech Electronics & Communication', department_id: 2 },
    { id: 6, name: 'B.Tech Mechanical Engineering', department_id: 3 },
    { id: 7, name: 'Bachelor of Business Administration (BBA)', department_id: 4 },
    { id: 8, name: 'Master of Business Administration (MBA)', department_id: 4 },
    { id: 9, name: 'B.Sc. (Hons.) Applied Sciences', department_id: 5 },
    { id: 10, name: 'M.Sc. Applied Sciences', department_id: 5 },
    { id: 11, name: 'B.A. LL.B. (Hons.)', department_id: 6 },
    { id: 12, name: 'BBA LL.B. (Hons.)', department_id: 6 },
  ],
}

export const publicApi = {
  overview: () => api.get<Record<string, number | string>>('/public/overview').then((r) => r.data),
  registrationOptions: async () => {
    try {
      const data = await api
        .get<typeof FALLBACK_REGISTRATION_OPTIONS>('/public/registration-options', { timeout: 5000 })
        .then((r) => r.data)
      if (data?.departments?.length) return data
    } catch {
      // Fallback to seeded university departments & programmes when backend is offline
    }
    return FALLBACK_REGISTRATION_OPTIONS
  },
  search: (q: string) => api.get<{ query: string; results: SearchResult[] }>('/search', { params: { q } }).then((r) => r.data),
}

export const assistantApi = {
  ask: (question: string, session_id: number | null, input_mode: 'text' | 'voice') =>
    api.post<AskResponse>('/assistant/ask', { question, session_id, input_mode }).then((r) => r.data),
  suggestions: () => api.get<string[]>('/assistant/suggestions').then((r) => r.data),
  popular: () => api.get<{ question: string; count: number }[]>('/assistant/popular').then((r) => r.data),
  recent: () => api.get<{ question: string; answered: boolean; created_at: string }[]>('/assistant/recent').then((r) => r.data),
  sessions: () => api.get<ChatSessionSummary[]>('/assistant/sessions').then((r) => r.data),
  session: (id: number) =>
    api.get<ChatSessionSummary & { messages: ChatMessage[] }>(`/assistant/sessions/${id}`).then((r) => r.data),
  deleteSession: (id: number) => api.delete(`/assistant/sessions/${id}`),
}

export const adminApi = {
  stats: () => api.get<Record<string, number | string>>('/admin/stats').then((r) => r.data),
  analytics: (days = 14) => api.get('/admin/analytics', { params: { days } }).then((r) => r.data),
  activity: (limit = 12) => api.get('/admin/activity', { params: { limit } }).then((r) => r.data),
  queries: (params: Query) => api.get('/admin/queries', { params: clean(params) }).then((r) => r.data),
  reindexRecords: () => api.post<{ records_indexed: number }>('/admin/reindex-records').then((r) => r.data),
  documents: {
    list: () => api.get<UploadedDocument[]>('/admin/documents').then((r) => r.data),
    upload: (file: File, title: string, category: string, onProgress?: (pct: number) => void) => {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      form.append('category', category)
      return api.post<UploadedDocument>('/admin/documents', form, {
        onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
      }).then((r) => r.data)
    },
    update: (id: number, data: Partial<UploadedDocument>) => api.put<UploadedDocument>(`/admin/documents/${id}`, data).then((r) => r.data),
    replace: (id: number, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<UploadedDocument>(`/admin/documents/${id}/replace`, form).then((r) => r.data)
    },
    reindex: (id: number) => api.post<UploadedDocument>(`/admin/documents/${id}/reindex`).then((r) => r.data),
    remove: (id: number) => api.delete(`/admin/documents/${id}`),
  },
}

export const resources = {
  departments: resource<Department>('/departments'),
  programs: resource<Program>('/programs'),
  courses: resource<Course>('/courses'),
  subjects: resource<Subject>('/subjects'),
  syllabus: resource<SyllabusUnit>('/syllabus'),
  faculty: resource<Faculty>('/faculty'),
  fees: resource<Fee>('/fees'),
  library: resource<LibraryResource>('/library'),
  facilities: resource<Facility>('/facilities'),
  medical: resource<MedicalFacility>('/medical'),
  contacts: resource<Contact>('/contacts'),
  announcements: resource<Announcement>('/announcements'),
  students: resource<AdminStudent>('/admin/students'),
}
export type ResourceKey = keyof typeof resources
export type ResourceClient<T> = ReturnType<typeof resource<T>>
