import {
  Bell, BookMarked, BookOpen, Building2, CalendarRange, FileText, GraduationCap, HeartPulse, Home, IndianRupee,
  Landmark, LayoutDashboard, Library, ListTree, MessageSquareText, Mic, Phone, Settings2, Users, UserSquare2, type LucideIcon,
} from 'lucide-react'

export interface NavItem { to: string; label: string; icon: LucideIcon }
export interface NavGroup { title: string; items: NavItem[] }

export const studentNav: NavGroup[] = [
  { title: 'Overview', items: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/assistant', label: 'AI Voice Assistant', icon: Mic },
  ] },
  { title: 'Academics', items: [
    { to: '/app/programs', label: 'Programs', icon: GraduationCap },
    { to: '/app/departments', label: 'Departments', icon: Building2 },
    { to: '/app/courses', label: 'Courses', icon: BookOpen },
    { to: '/app/subjects', label: 'Subjects', icon: ListTree },
    { to: '/app/syllabus', label: 'Syllabus', icon: BookMarked },
    { to: '/app/faculty', label: 'Faculty Directory', icon: UserSquare2 },
    { to: '/app/fees', label: 'Fee Structure', icon: IndianRupee },
  ] },
  { title: 'Campus Life', items: [
    { to: '/app/library', label: 'Library', icon: Library },
    { to: '/app/medical', label: 'Medical', icon: HeartPulse },
    { to: '/app/hostels', label: 'Hostels', icon: Home },
    { to: '/app/campus', label: 'Campus Services', icon: Landmark },
    { to: '/app/contacts', label: 'Important Contacts', icon: Phone },
  ] },
]

export const adminNav: NavGroup[] = [
  { title: 'Overview', items: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/queries', label: 'Query Analytics', icon: MessageSquareText },
  ] },
  { title: 'People', items: [
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/faculty', label: 'Faculty', icon: UserSquare2 },
  ] },
  { title: 'Academics', items: [
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/programs', label: 'Programs', icon: GraduationCap },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/subjects', label: 'Subjects', icon: ListTree },
    { to: '/admin/syllabus', label: 'Syllabus', icon: BookMarked },
    { to: '/admin/fees', label: 'Fee Structures', icon: IndianRupee },
  ] },
  { title: 'Campus', items: [
    { to: '/admin/library', label: 'Library', icon: Library },
    { to: '/admin/medical', label: 'Medical', icon: HeartPulse },
    { to: '/admin/facilities', label: 'Hostels & Facilities', icon: Landmark },
    { to: '/admin/contacts', label: 'Contacts', icon: Phone },
    { to: '/admin/announcements', label: 'Announcements', icon: Bell },
  ] },
  { title: 'Knowledge Base', items: [
    { to: '/admin/documents', label: 'Documents', icon: FileText },
  ] },
]

export const quickIcons = { CalendarRange, Settings2 }
