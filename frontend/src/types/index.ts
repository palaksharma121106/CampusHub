export type Role = 'admin' | 'student'

export interface StudentProfile {
  id: number
  enrollment_no: string
  year_of_study: number
  phone: string | null
  department_id: number | null
  program_id: number | null
  department_name: string | null
  program_name: string | null
}

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
  student: StudentProfile | null
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

interface Stamped { id: number; updated_at: string }

export interface Department extends Stamped {
  name: string; code: string; description: string | null; hod_name: string | null
  email: string | null; phone: string | null; location: string | null
}
export interface Program extends Stamped {
  name: string; code: string; level: 'UG' | 'PG' | 'Doctoral' | 'Diploma'; department_id: number
  department_name: string | null; duration_years: number; total_seats: number | null
  eligibility: string | null; description: string | null
}
export interface Course extends Stamped {
  code: string; title: string; program_id: number; program_name: string | null; department_id: number
  department_name: string | null; semester: number; credits: number; course_type: string; description: string | null
}
export interface Subject extends Stamped {
  course_id: number; course_code: string | null; course_title: string | null; semester: number | null
  code: string; name: string; component: string; credits: number; weekly_hours: number | null
  faculty_id: number | null; faculty_name: string | null
}
export interface SyllabusUnit extends Stamped {
  course_id: number; course_code: string | null; course_title: string | null; unit_number: number
  title: string; topics: string; hours: number | null; reference_books: string | null
}
export interface Faculty extends Stamped {
  name: string; designation: string; department_id: number; department_name: string | null
  email: string | null; phone: string | null; qualification: string | null; specialization: string | null
  office: string | null; experience_years: number | null
}
export interface Fee extends Stamped {
  program_id: number; program_name: string | null; academic_year: string; year_of_study: number
  tuition_fee: string; hostel_fee: string; exam_fee: string; other_fee: string; total_fee: string; notes: string | null
}
export interface LibraryResource extends Stamped {
  title: string; category: string; description: string | null; location: string | null; timings: string | null; url: string | null
}
export interface Facility extends Stamped {
  name: string; category: string; description: string | null; location: string | null
  timings: string | null; contact: string | null; capacity: number | null
}
export interface MedicalFacility extends Stamped {
  name: string; facility_type: string; description: string | null; location: string | null
  timings: string | null; contact_phone: string | null; doctor_name: string | null; is_emergency: boolean
}
export interface Contact extends Stamped {
  name: string; designation: string | null; office: string; phone: string | null; email: string | null
  available_hours: string | null; is_emergency: boolean
}
export interface Announcement extends Stamped {
  title: string; content: string; category: string; priority: 'normal' | 'important' | 'urgent'
  is_published: boolean; expires_at: string | null; created_at: string; author_name: string | null
}

export interface Source {
  number: number
  source_type: 'document' | 'database'
  title: string
  section: string | null
  page: number | null
  score: number
  excerpt: string
  document_id: number | null
  link: string | null
}

export interface AskResponse {
  session_id: number
  message_id: number
  answer: string
  sources: Source[]
  answered: boolean
  generator: string
  response_time_ms: number
}

export interface ChatMessage {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[] | null
  created_at: string
  meta?: { generator?: string; response_time_ms?: number; answered?: boolean; error?: boolean }
}

export interface ChatSessionSummary { id: number; title: string; created_at: string; updated_at: string }

export interface UploadedDocument {
  id: number; title: string; category: string; original_filename: string; file_type: string; file_size: number
  status: 'pending' | 'processing' | 'indexed' | 'failed'; error_message: string | null; page_count: number | null
  chunk_count: number; is_verified: boolean; indexed_at: string | null; created_at: string; updated_at: string
}

export interface SearchResult { type: string; id: number; title: string; subtitle: string; link: string }

export interface AdminStudent { id: number; email: string; full_name: string; is_active: boolean; created_at: string; student: StudentProfile | null; updated_at?: string }
export interface QueryLog {
  id: number; query_text: string; answered: boolean; input_mode: string; response_time_ms: number
  generator: string; source_count: number; created_at: string; user_name: string | null
}
export interface ActivityItem { id: number; action: string; entity: string; summary: string; created_at: string; user_name: string | null }
