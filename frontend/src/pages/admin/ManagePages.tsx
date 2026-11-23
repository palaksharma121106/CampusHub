import { Bell, BookMarked, BookOpen, Building2, GraduationCap, HeartPulse, IndianRupee, Landmark, Library, ListTree, Phone, Users, UserSquare2 } from 'lucide-react'

import { ResourceManager, type FieldDef, type FilterDef } from '@/components/admin/ResourceManager'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
  AdminStudent, Announcement, Contact, Course, Department, Facility, Faculty, Fee, LibraryResource, MedicalFacility, Program, Subject, SyllabusUnit,
} from '@/types'

const opts = (...v: string[]) => v.map((x) => ({ value: x, label: x }))
const fromDept = { resource: 'departments', label: (d: Department) => d.name } as FieldDef['from']
const fromProgram = { resource: 'programs', label: (p: Program) => p.name } as FieldDef['from']
const fromCourse = { resource: 'courses', label: (c: Course) => `${c.code} · ${c.title}` } as FieldDef['from']
const fromFaculty = { resource: 'faculty', label: (f: Faculty) => f.name } as FieldDef['from']
const deptFilter: FilterDef = { param: 'department_id', label: 'Departments', from: fromDept }
const programFilter: FilterDef = { param: 'program_id', label: 'Programmes', from: fromProgram }
const courseFilter: FilterDef = { param: 'course_id', label: 'Courses', from: fromCourse }
const muted = (t: string | null | undefined) => <span className="text-muted-foreground">{t || '—'}</span>
const strong = (t: string | null | undefined, sub?: string | null) => (
  <div className="min-w-0"><p className="font-medium">{t}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
)

export const ManageDepartments = () => (
  <ResourceManager<Department> resource="departments" title="Departments" singular="Department" icon={Building2} itemLabel={(d) => d.name}
    description="Academic departments and their heads."
    columns={[
      { header: 'Department', cell: (d) => strong(d.name, d.code) },
      { header: 'Head of department', cell: (d) => muted(d.hod_name) },
      { header: 'Email', cell: (d) => muted(d.email), className: 'hidden md:table-cell' },
      { header: 'Location', cell: (d) => muted(d.location), className: 'hidden lg:table-cell' },
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code', required: true },
      { name: 'hod_name', label: 'Head of department' }, { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' }, { name: 'location', label: 'Location' }, { name: 'description', label: 'Description', type: 'textarea' },
    ]} />
)

export const ManagePrograms = () => (
  <ResourceManager<Program> resource="programs" title="Programmes" singular="Programme" icon={GraduationCap} itemLabel={(p) => p.name} filters={[deptFilter]}
    description="Degree programmes offered by each department."
    columns={[
      { header: 'Programme', cell: (p) => strong(p.name, p.code) },
      { header: 'Level', cell: (p) => <Badge variant="accent">{p.level}</Badge> },
      { header: 'Department', cell: (p) => muted(p.department_name), className: 'hidden md:table-cell' },
      { header: 'Duration', cell: (p) => `${p.duration_years} yrs` },
      { header: 'Seats', cell: (p) => p.total_seats ?? '—', className: 'hidden lg:table-cell' },
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code', required: true },
      { name: 'level', label: 'Level', type: 'select', required: true, options: opts('UG', 'PG', 'Doctoral', 'Diploma') },
      { name: 'department_id', label: 'Department', type: 'select', required: true, from: fromDept },
      { name: 'duration_years', label: 'Duration (years)', type: 'number', required: true, defaultValue: '4' },
      { name: 'total_seats', label: 'Total seats', type: 'number' },
      { name: 'eligibility', label: 'Eligibility', type: 'textarea' }, { name: 'description', label: 'Description', type: 'textarea' },
    ]} />
)

export const ManageCourses = () => (
  <ResourceManager<Course> resource="courses" title="Courses" singular="Course" icon={BookOpen} itemLabel={(c) => c.title} filters={[programFilter]}
    description="Courses within each programme, by semester."
    columns={[
      { header: 'Course', cell: (c) => strong(c.title, c.code) },
      { header: 'Programme', cell: (c) => muted(c.program_name), className: 'hidden md:table-cell' },
      { header: 'Sem', cell: (c) => c.semester }, { header: 'Credits', cell: (c) => c.credits },
      { header: 'Type', cell: (c) => <Badge variant="outline">{c.course_type}</Badge>, className: 'hidden sm:table-cell' },
    ]}
    fields={[
      { name: 'title', label: 'Title', required: true }, { name: 'code', label: 'Code', required: true },
      { name: 'program_id', label: 'Programme', type: 'select', required: true, from: fromProgram },
      { name: 'department_id', label: 'Department', type: 'select', required: true, from: fromDept },
      { name: 'semester', label: 'Semester', type: 'number', required: true }, { name: 'credits', label: 'Credits', type: 'number', required: true },
      { name: 'course_type', label: 'Type', type: 'select', required: true, options: opts('Core', 'Elective', 'Lab', 'Project'), defaultValue: 'Core' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ]} />
)

export const ManageSubjects = () => (
  <ResourceManager<Subject> resource="subjects" title="Subjects" singular="Subject" icon={ListTree} itemLabel={(s) => s.name} filters={[courseFilter]}
    description="Subject components and faculty assignment for each course."
    columns={[
      { header: 'Subject', cell: (s) => strong(s.name, s.code) },
      { header: 'Course', cell: (s) => muted(s.course_title), className: 'hidden md:table-cell' },
      { header: 'Component', cell: (s) => <Badge variant="outline">{s.component}</Badge> },
      { header: 'Faculty', cell: (s) => muted(s.faculty_name), className: 'hidden lg:table-cell' },
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code', required: true },
      { name: 'course_id', label: 'Course', type: 'select', required: true, from: fromCourse, full: true },
      { name: 'component', label: 'Component', type: 'select', required: true, options: opts('Theory', 'Lab', 'Tutorial', 'Project'), defaultValue: 'Theory' },
      { name: 'credits', label: 'Credits', type: 'number', required: true }, { name: 'weekly_hours', label: 'Weekly hours', type: 'number' },
      { name: 'faculty_id', label: 'Faculty', type: 'select', from: fromFaculty },
    ]} />
)

export const ManageSyllabus = () => (
  <ResourceManager<SyllabusUnit> resource="syllabus" title="Syllabus" singular="Syllabus unit" icon={BookMarked} itemLabel={(u) => u.title} filters={[courseFilter]}
    description="Unit-wise syllabus content for each course."
    columns={[
      { header: 'Course', cell: (u) => strong(u.course_code, u.course_title) },
      { header: 'Unit', cell: (u) => `Unit ${u.unit_number}` },
      { header: 'Title', cell: (u) => u.title },
      { header: 'Hours', cell: (u) => u.hours ?? '—', className: 'hidden md:table-cell' },
    ]}
    fields={[
      { name: 'course_id', label: 'Course', type: 'select', required: true, from: fromCourse, full: true },
      { name: 'unit_number', label: 'Unit number', type: 'number', required: true }, { name: 'hours', label: 'Hours', type: 'number' },
      { name: 'title', label: 'Title', required: true, full: true }, { name: 'topics', label: 'Topics', type: 'textarea', required: true },
      { name: 'reference_books', label: 'Reference books', type: 'textarea' },
    ]} />
)

export const ManageFaculty = () => (
  <ResourceManager<Faculty> resource="faculty" title="Faculty" singular="Faculty member" icon={UserSquare2} itemLabel={(f) => f.name} filters={[deptFilter]}
    description="Faculty directory records."
    columns={[
      { header: 'Name', cell: (f) => strong(f.name, f.designation) },
      { header: 'Department', cell: (f) => muted(f.department_name), className: 'hidden md:table-cell' },
      { header: 'Specialisation', cell: (f) => muted(f.specialization), className: 'hidden lg:table-cell' },
      { header: 'Email', cell: (f) => muted(f.email), className: 'hidden xl:table-cell' },
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true }, { name: 'designation', label: 'Designation', required: true },
      { name: 'department_id', label: 'Department', type: 'select', required: true, from: fromDept },
      { name: 'email', label: 'Email', type: 'email' }, { name: 'phone', label: 'Phone' }, { name: 'office', label: 'Office' },
      { name: 'qualification', label: 'Qualification' }, { name: 'experience_years', label: 'Experience (years)', type: 'number' },
      { name: 'specialization', label: 'Specialisation', full: true },
    ]} />
)

export const ManageFees = () => (
  <ResourceManager<Fee> resource="fees" title="Fee Structures" singular="Fee structure" icon={IndianRupee} itemLabel={(f) => `${f.program_name} ${f.academic_year} Y${f.year_of_study}`} filters={[programFilter]}
    description="Year-wise fee breakdown per programme."
    columns={[
      { header: 'Programme', cell: (f) => strong(f.program_name, `${f.academic_year} · Year ${f.year_of_study}`) },
      { header: 'Tuition', cell: (f) => formatCurrency(f.tuition_fee), className: 'hidden md:table-cell' },
      { header: 'Hostel', cell: (f) => formatCurrency(f.hostel_fee), className: 'hidden lg:table-cell' },
      { header: 'Total', cell: (f) => <span className="font-semibold">{formatCurrency(f.total_fee)}</span> },
    ]}
    fields={[
      { name: 'program_id', label: 'Programme', type: 'select', required: true, from: fromProgram, full: true },
      { name: 'academic_year', label: 'Academic year', required: true, placeholder: '2025-26' },
      { name: 'year_of_study', label: 'Year of study', type: 'number', required: true },
      { name: 'tuition_fee', label: 'Tuition fee (₹)', type: 'number', step: '0.01', required: true },
      { name: 'hostel_fee', label: 'Hostel fee (₹)', type: 'number', step: '0.01' },
      { name: 'exam_fee', label: 'Exam fee (₹)', type: 'number', step: '0.01' }, { name: 'other_fee', label: 'Other fees (₹)', type: 'number', step: '0.01' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ]} />
)

export const ManageLibrary = () => (
  <ResourceManager<LibraryResource> resource="library" title="Library" singular="Library record" icon={Library} itemLabel={(l) => l.title}
    filters={[{ param: 'category', label: 'Categories', options: opts('Timings', 'Section', 'E-Resource', 'Service', 'Rule') }]}
    description="Library timings, sections, e-resources and rules."
    columns={[
      { header: 'Title', cell: (l) => strong(l.title) }, { header: 'Category', cell: (l) => <Badge variant="accent">{l.category}</Badge> },
      { header: 'Timings', cell: (l) => muted(l.timings), className: 'hidden md:table-cell' },
      { header: 'Location', cell: (l) => muted(l.location), className: 'hidden lg:table-cell' },
    ]}
    fields={[
      { name: 'title', label: 'Title', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: opts('Timings', 'Section', 'E-Resource', 'Service', 'Rule') },
      { name: 'timings', label: 'Timings' }, { name: 'location', label: 'Location' }, { name: 'url', label: 'URL', full: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ]} />
)

const facilityCats = opts('Hostel', 'Sports', 'Dining', 'Transport', 'Laboratory', 'Services', 'Recreation', 'Other')
export const ManageFacilities = () => (
  <ResourceManager<Facility> resource="facilities" title="Hostels & Facilities" singular="Facility" icon={Landmark} itemLabel={(f) => f.name}
    filters={[{ param: 'category', label: 'Categories', options: facilityCats }]}
    description="Hostels, dining, sports, transport and other campus facilities."
    columns={[
      { header: 'Facility', cell: (f) => strong(f.name) }, { header: 'Category', cell: (f) => <Badge variant="accent">{f.category}</Badge> },
      { header: 'Timings', cell: (f) => muted(f.timings), className: 'hidden md:table-cell' },
      { header: 'Capacity', cell: (f) => f.capacity ?? '—', className: 'hidden lg:table-cell' },
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true }, { name: 'category', label: 'Category', type: 'select', required: true, options: facilityCats },
      { name: 'location', label: 'Location' }, { name: 'timings', label: 'Timings' }, { name: 'contact', label: 'Contact' },
      { name: 'capacity', label: 'Capacity', type: 'number' }, { name: 'description', label: 'Description', type: 'textarea' },
    ]} />
)

export const ManageMedical = () => (
  <ResourceManager<MedicalFacility> resource="medical" title="Medical Facilities" singular="Medical facility" icon={HeartPulse} itemLabel={(m) => m.name}
    description="Health centre, emergency and counselling services."
    columns={[
      { header: 'Facility', cell: (m) => strong(m.name, m.facility_type) },
      { header: 'Doctor', cell: (m) => muted(m.doctor_name), className: 'hidden md:table-cell' },
      { header: 'Timings', cell: (m) => muted(m.timings), className: 'hidden lg:table-cell' },
      { header: 'Emergency', cell: (m) => (m.is_emergency ? <Badge variant="destructive">Yes</Badge> : muted('No')) },
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true }, { name: 'facility_type', label: 'Type', required: true, placeholder: 'Clinic, Pharmacy…' },
      { name: 'doctor_name', label: 'Doctor' }, { name: 'contact_phone', label: 'Contact phone' },
      { name: 'timings', label: 'Timings' }, { name: 'location', label: 'Location' },
      { name: 'description', label: 'Description', type: 'textarea' }, { name: 'is_emergency', label: 'Emergency service', type: 'checkbox' },
    ]} />
)

export const ManageContacts = () => (
  <ResourceManager<Contact> resource="contacts" title="Important Contacts" singular="Contact" icon={Phone} itemLabel={(c) => c.office}
    description="Administrative offices and helplines."
    columns={[
      { header: 'Office', cell: (c) => strong(c.office, [c.name, c.designation].filter(Boolean).join(' · ')) },
      { header: 'Phone', cell: (c) => muted(c.phone) }, { header: 'Email', cell: (c) => muted(c.email), className: 'hidden md:table-cell' },
      { header: 'Emergency', cell: (c) => (c.is_emergency ? <Badge variant="destructive">Yes</Badge> : muted('No')), className: 'hidden sm:table-cell' },
    ]}
    fields={[
      { name: 'office', label: 'Office', required: true }, { name: 'name', label: 'Contact person', required: true },
      { name: 'designation', label: 'Designation' }, { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email', type: 'email' },
      { name: 'available_hours', label: 'Available hours' }, { name: 'is_emergency', label: 'Emergency contact', type: 'checkbox' },
    ]} />
)

export const ManageAnnouncements = () => (
  <ResourceManager<Announcement> resource="announcements" title="Announcements" singular="Announcement" icon={Bell} itemLabel={(a) => a.title}
    filters={[{ param: 'priority', label: 'Priorities', options: opts('urgent', 'important', 'normal') }]}
    description="Notices shown on student dashboards and used by the assistant."
    columns={[
      { header: 'Title', cell: (a) => strong(a.title, a.category) },
      { header: 'Priority', cell: (a) => <Badge variant={a.priority === 'urgent' ? 'destructive' : a.priority === 'important' ? 'warning' : 'default'} className="capitalize">{a.priority}</Badge> },
      { header: 'Status', cell: (a) => (a.is_published ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>) },
      { header: 'Posted', cell: (a) => muted(formatDate(a.created_at)), className: 'hidden md:table-cell' },
    ]}
    fields={[
      { name: 'title', label: 'Title', required: true, full: true }, { name: 'category', label: 'Category', defaultValue: 'General' },
      { name: 'priority', label: 'Priority', type: 'select', required: true, options: opts('normal', 'important', 'urgent'), defaultValue: 'normal' },
      { name: 'content', label: 'Content', type: 'textarea', required: true }, { name: 'expires_at', label: 'Expires at', type: 'datetime' },
      { name: 'is_published', label: 'Published', type: 'checkbox', defaultValue: true },
    ]} />
)

export const ManageStudents = () => (
  <ResourceManager<AdminStudent> resource="students" title="Students" singular="Student" icon={Users} itemLabel={(s) => s.full_name} filters={[deptFilter]}
    description="Registered student accounts."
    toForm={(s) => ({ ...s, ...s.student, id: s.id })}
    columns={[
      { header: 'Student', cell: (s) => strong(s.full_name, s.email) },
      { header: 'Enrollment', cell: (s) => muted(s.student?.enrollment_no) },
      { header: 'Programme', cell: (s) => muted(s.student?.program_name), className: 'hidden lg:table-cell' },
      { header: 'Year', cell: (s) => s.student?.year_of_study ?? '—', className: 'hidden sm:table-cell' },
      { header: 'Status', cell: (s) => (s.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Disabled</Badge>) },
    ]}
    fields={[
      { name: 'full_name', label: 'Full name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true, createOnly: true },
      { name: 'enrollment_no', label: 'Enrollment number', required: true, createOnly: true },
      { name: 'password', label: 'Initial password', type: 'password', required: true, createOnly: true, hint: 'Min. 8 characters with a letter and a number' },
      { name: 'department_id', label: 'Department', type: 'select', from: fromDept },
      { name: 'program_id', label: 'Programme', type: 'select', from: fromProgram },
      { name: 'year_of_study', label: 'Year of study', type: 'number', defaultValue: '1' }, { name: 'phone', label: 'Phone' },
      { name: 'is_active', label: 'Account active', type: 'checkbox', defaultValue: true },
    ]} />
)
