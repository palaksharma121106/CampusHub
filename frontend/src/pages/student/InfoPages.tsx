import {
  AlertTriangle, Bell, BookMarked, BookOpen, Building2, CalendarClock, Clock, ExternalLink, GraduationCap, HeartPulse, Home,
  IndianRupee, Landmark, Library, ListTree, Mail, MapPin, Phone, Stethoscope, UserRound, Users, UserSquare2,
} from 'lucide-react'

import { InfoCard, InfoDirectory, stripDemo, type FilterDef } from '@/components/info/InfoDirectory'
import { Badge } from '@/components/ui/badge'
import { InfoRow } from '@/components/ui/misc'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
  Announcement, Contact, Course, Department, Facility, Faculty, Fee, LibraryResource, MedicalFacility, Program, Subject, SyllabusUnit,
} from '@/types'

const deptFilter: FilterDef = { param: 'department_id', label: 'Departments', from: { resource: 'departments', label: (d: Department) => d.name } as FilterDef['from'] }
const programFilter: FilterDef = { param: 'program_id', label: 'Programmes', from: { resource: 'programs', label: (p: Program) => p.name } as FilterDef['from'] }
const courseFilter: FilterDef = { param: 'course_id', label: 'Courses', from: { resource: 'courses', label: (c: Course) => `${c.code} · ${c.title}` } as FilterDef['from'] }
const semesterFilter: FilterDef = { param: 'semester', label: 'Semesters', options: Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` })) }

function DemoNotice() {
  return (
    <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      This deployment uses a demonstration dataset for illustration. It is not official institutional information.
    </div>
  )
}

export const ProgramsPage = () => (
  <InfoDirectory<Program> resource="programs" eyebrow="Academics" title="Academic Programmes" icon={GraduationCap} aside={<DemoNotice />}
    description="Undergraduate, postgraduate and doctoral programmes offered across departments."
    filters={[deptFilter, { param: 'level', label: 'Levels', options: ['UG', 'PG', 'Doctoral', 'Diploma'].map((v) => ({ value: v, label: v })) }]}
    render={(p) => (
      <InfoCard title={p.name} subtitle={p.department_name} badges={<><Badge variant="accent">{p.level}</Badge><Badge variant="outline">{p.code}</Badge></>}
        footer={<div className="flex gap-4 text-xs text-muted-foreground"><span><b className="text-foreground">{p.duration_years}</b> years</span>{p.total_seats && <span><b className="text-foreground">{p.total_seats}</b> seats</span>}</div>}>
        <p className="text-sm text-muted-foreground">{stripDemo(p.description)}</p>
        {p.eligibility && <p className="text-xs"><span className="font-medium">Eligibility: </span><span className="text-muted-foreground">{p.eligibility}</span></p>}
      </InfoCard>
    )} />
)

export const DepartmentsPage = () => (
  <InfoDirectory<Department> resource="departments" eyebrow="Academics" title="Departments" icon={Building2} aside={<DemoNotice />}
    description="Academic departments, their heads and contact information."
    render={(d) => (
      <InfoCard title={d.name} badges={<Badge variant="outline">{d.code}</Badge>}>
        <p className="text-sm text-muted-foreground">{stripDemo(d.description)}</p>
        <InfoRow icon={UserRound}>{d.hod_name && <>Head of Department: <span className="text-foreground">{d.hod_name}</span></>}</InfoRow>
        <InfoRow icon={MapPin}>{d.location}</InfoRow>
        <InfoRow icon={Mail}>{d.email && <a href={`mailto:${d.email}`} className="hover:text-accent">{d.email}</a>}</InfoRow>
        <InfoRow icon={Phone}>{d.phone}</InfoRow>
      </InfoCard>
    )} />
)

export const CoursesPage = () => (
  <InfoDirectory<Course> resource="courses" eyebrow="Academics" title="Courses" icon={BookOpen} filters={[programFilter, semesterFilter]}
    description="Course catalogue with semester, credits and course type."
    render={(c) => (
      <InfoCard title={c.title} subtitle={<>{c.code} · {c.program_name}</>} badges={<Badge variant={c.course_type === 'Core' ? 'default' : 'accent'}>{c.course_type}</Badge>}
        footer={<div className="flex gap-4 text-xs text-muted-foreground"><span>Semester <b className="text-foreground">{c.semester}</b></span><span><b className="text-foreground">{c.credits}</b> credits</span></div>}>
        <p className="text-sm text-muted-foreground">{stripDemo(c.description)}</p>
      </InfoCard>
    )} />
)

export const SubjectsPage = () => (
  <InfoDirectory<Subject> resource="subjects" eyebrow="Academics" title="Subjects" icon={ListTree} filters={[courseFilter]}
    description="Theory, lab and tutorial components that make up each course, with assigned faculty."
    render={(s) => (
      <InfoCard title={s.name} subtitle={<>{s.code} · {s.course_title}</>} badges={<Badge variant="outline">{s.component}</Badge>}
        footer={<div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span><b className="text-foreground">{s.credits}</b> credits</span>{s.weekly_hours && <span><b className="text-foreground">{s.weekly_hours}</b> hrs/week</span>}{s.semester && <span>Semester {s.semester}</span>}</div>}>
        <InfoRow icon={UserSquare2}>{s.faculty_name}</InfoRow>
      </InfoCard>
    )} />
)

export const SyllabusPage = () => (
  <InfoDirectory<SyllabusUnit> resource="syllabus" eyebrow="Academics" title="Syllabus" icon={BookMarked} filters={[courseFilter]} layout="list" pageSize={20}
    description="Unit-wise syllabus, topics and reference books for each course."
    render={(u) => (
      <InfoCard title={<>Unit {u.unit_number}: {u.title}</>} subtitle={<>{u.course_code} · {u.course_title}</>} badges={u.hours ? <Badge variant="accent">{u.hours} hours</Badge> : undefined}>
        <p className="text-sm leading-relaxed text-muted-foreground">{u.topics}</p>
        {u.reference_books && <p className="text-xs"><span className="font-medium">References: </span><span className="text-muted-foreground">{u.reference_books}</span></p>}
      </InfoCard>
    )} />
)

export const FacultyPage = () => (
  <InfoDirectory<Faculty> resource="faculty" eyebrow="People" title="Faculty Directory" icon={UserSquare2} filters={[deptFilter]} aside={<DemoNotice />}
    description="Faculty members, their specialisations, offices and contact details." searchPlaceholder="Search by name or specialisation…"
    render={(f) => (
      <InfoCard title={f.name} subtitle={f.designation} badges={<Badge variant="outline">{f.department_name?.split(' ')[0]}</Badge>}>
        <InfoRow icon={GraduationCap}>{f.qualification}</InfoRow>
        <InfoRow icon={BookOpen}>{f.specialization}</InfoRow>
        <InfoRow icon={MapPin}>{f.office}</InfoRow>
        <InfoRow icon={Mail}>{f.email && <a href={`mailto:${f.email}`} className="hover:text-accent">{f.email}</a>}</InfoRow>
        <InfoRow icon={CalendarClock}>{f.experience_years != null && `${f.experience_years} years experience`}</InfoRow>
      </InfoCard>
    )} />
)

export const FeesPage = () => (
  <InfoDirectory<Fee> resource="fees" eyebrow="Finance" title="Fee Structure" icon={IndianRupee} filters={[programFilter]} aside={<DemoNotice />}
    description="Year-wise fee breakdown for each programme. Amounts are per academic year in Indian Rupees."
    render={(f) => (
      <InfoCard title={f.program_name} subtitle={`Academic year ${f.academic_year} · Year ${f.year_of_study}`}
        footer={<div className="flex items-baseline justify-between"><span className="text-sm font-medium">Total</span><span className="text-lg font-semibold text-navy-900">{formatCurrency(f.total_fee)}</span></div>}>
        <dl className="space-y-1.5 text-sm">
          {([['Tuition', f.tuition_fee], ['Hostel', f.hostel_fee], ['Examination', f.exam_fee], ['Other', f.other_fee]] as const).map(([k, v]) => (
            <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium tabular-nums">{formatCurrency(v)}</dd></div>
          ))}
        </dl>
        {f.notes && <p className="text-xs text-muted-foreground">{stripDemo(f.notes)}</p>}
      </InfoCard>
    )} />
)

export const LibraryPage = () => (
  <InfoDirectory<LibraryResource> resource="library" eyebrow="Campus life" title="Library" icon={Library}
    filters={[{ param: 'category', label: 'Categories', options: ['Timings', 'Section', 'E-Resource', 'Service', 'Rule'].map((v) => ({ value: v, label: v })) }]}
    description="Central library timings, sections, digital resources, services and borrowing rules."
    render={(l) => (
      <InfoCard title={l.title} badges={<Badge variant="accent">{l.category}</Badge>}>
        <p className="text-sm text-muted-foreground">{stripDemo(l.description)}</p>
        <InfoRow icon={Clock}>{l.timings}</InfoRow>
        <InfoRow icon={MapPin}>{l.location}</InfoRow>
        {l.url && <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">Open resource <ExternalLink className="h-3.5 w-3.5" /></a>}
      </InfoCard>
    )} />
)

export const MedicalPage = () => (
  <InfoDirectory<MedicalFacility> resource="medical" eyebrow="Campus life" title="Medical Services" icon={HeartPulse}
    description="On-campus health centre, emergency support, pharmacy and counselling services."
    aside={<div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><Phone className="h-4 w-4" />In a medical emergency, contact the services marked <b>Emergency</b> below or call 108.</div>}
    render={(m) => (
      <InfoCard title={m.name} subtitle={m.facility_type} badges={m.is_emergency ? <Badge variant="destructive">Emergency</Badge> : undefined}>
        <p className="text-sm text-muted-foreground">{stripDemo(m.description)}</p>
        <InfoRow icon={Stethoscope}>{m.doctor_name}</InfoRow>
        <InfoRow icon={Clock}>{m.timings}</InfoRow>
        <InfoRow icon={MapPin}>{m.location}</InfoRow>
        <InfoRow icon={Phone}>{m.contact_phone && <a href={`tel:${m.contact_phone}`} className="font-medium text-foreground hover:text-accent">{m.contact_phone}</a>}</InfoRow>
      </InfoCard>
    )} />
)

const facilityCard = (f: Facility) => (
  <InfoCard title={f.name} badges={<Badge variant="accent">{f.category}</Badge>}>
    <p className="text-sm text-muted-foreground">{stripDemo(f.description)}</p>
    <InfoRow icon={Clock}>{f.timings}</InfoRow>
    <InfoRow icon={MapPin}>{f.location}</InfoRow>
    <InfoRow icon={Phone}>{f.contact}</InfoRow>
    <InfoRow icon={Users}>{f.capacity != null && `Capacity: ${f.capacity}`}</InfoRow>
  </InfoCard>
)

export const HostelsPage = () => (
  <InfoDirectory<Facility> resource="facilities" eyebrow="Campus life" title="Hostels" icon={Home} baseParams={{ category: 'Hostel' }}
    description="Residential blocks, room types, capacity, wardens and timings." render={facilityCard} />
)

export const CampusPage = () => (
  <InfoDirectory<Facility> resource="facilities" eyebrow="Campus life" title="Campus Services & Facilities" icon={Landmark}
    filters={[{ param: 'category', label: 'Categories', options: ['Hostel', 'Sports', 'Dining', 'Transport', 'Laboratory', 'Services', 'Recreation', 'Other'].map((v) => ({ value: v, label: v })) }]}
    description="Sports, dining, transport, laboratories and other services available on campus." render={facilityCard} />
)

export const ContactsPage = () => (
  <InfoDirectory<Contact> resource="contacts" eyebrow="Help" title="Important Contacts" icon={Phone} pageSize={24}
    description="Administrative offices, helplines and emergency contacts."
    render={(c) => (
      <InfoCard title={c.office} subtitle={[c.name, c.designation].filter(Boolean).join(' · ')} badges={c.is_emergency ? <Badge variant="destructive">Emergency</Badge> : undefined}>
        <InfoRow icon={Phone}>{c.phone && <a href={`tel:${c.phone}`} className="font-medium text-foreground hover:text-accent">{c.phone}</a>}</InfoRow>
        <InfoRow icon={Mail}>{c.email && <a href={`mailto:${c.email}`} className="hover:text-accent">{c.email}</a>}</InfoRow>
        <InfoRow icon={Clock}>{c.available_hours}</InfoRow>
      </InfoCard>
    )} />
)

const priority = { urgent: 'destructive', important: 'warning', normal: 'default' } as const
export const AnnouncementsPage = () => (
  <InfoDirectory<Announcement> resource="announcements" eyebrow="Updates" title="Announcements & Notices" icon={Bell} layout="list"
    filters={[{ param: 'priority', label: 'Priorities', options: ['urgent', 'important', 'normal'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) }]}
    description="Official notices from the administration, examination cell and departments."
    render={(a) => (
      <InfoCard title={a.title} subtitle={`${formatDate(a.created_at)} · ${a.category}`} badges={a.priority !== 'normal' ? <Badge variant={priority[a.priority]} className="capitalize">{a.priority}</Badge> : undefined}>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{a.content}</p>
      </InfoCard>
    )} />
)
