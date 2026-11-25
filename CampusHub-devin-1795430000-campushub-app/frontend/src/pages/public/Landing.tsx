import { motion } from 'framer-motion'
import {
  ArrowRight, BookOpen, Building2, CheckCircle2, FileSearch, GraduationCap, HeartPulse, Home, IndianRupee, Library,
  Mic, MessageSquareText, Phone, Shield, ShieldCheck, Sparkles, UserCheck, UserSquare2, Volume2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { publicApi } from '@/services/campus'

const features = [
  { icon: GraduationCap, title: 'Programs & Courses', text: 'Every programme, course and credit structure in one searchable catalogue.' },
  { icon: BookOpen, title: 'Syllabus & Subjects', text: 'Unit-wise syllabus, topics, hours and reference books for each course.' },
  { icon: UserSquare2, title: 'Faculty Directory', text: 'Find faculty by department, specialisation, office and contact details.' },
  { icon: IndianRupee, title: 'Fee Structures', text: 'Year-wise tuition, hostel and examination fees with clear breakdowns.' },
  { icon: Library, title: 'Library', text: 'Timings, sections, e-resources and borrowing rules at a glance.' },
  { icon: HeartPulse, title: 'Medical Services', text: 'Health centre hours, emergency numbers and on-campus medical support.' },
  { icon: Home, title: 'Hostels & Facilities', text: 'Hostel blocks, dining, sports, transport and campus services.' },
  { icon: Phone, title: 'Important Contacts', text: 'Reach the right office quickly, including emergency contacts.' },
]

const steps = [
  { icon: Mic, title: 'Ask naturally', text: 'Speak or type a question such as "What is the minimum attendance requirement?"' },
  { icon: FileSearch, title: 'Retrieve official sources', text: 'CampusHub searches uploaded college documents and the institutional database using semantic vector search.' },
  { icon: Sparkles, title: 'Generate a grounded answer', text: 'The language model answers only from retrieved passages and cites every source it used.' },
  { icon: Volume2, title: 'Listen or read', text: 'Hear the answer read aloud, follow the source references, or continue the conversation.' },
]

const fade = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.45 } }

function AssistantPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-teal-400/10 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-900/90 shadow-elevated backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Mody University Voice Assistant
          </div>
          <span className="text-xs text-navy-300">Voice · RAG</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-500 px-4 py-2.5 text-sm text-white">
            What is the minimum attendance required to sit the end-semester exam?
          </div>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-navy-100">
            Students must maintain at least <span className="font-semibold text-white">75% attendance</span> in each course to be eligible for the end-semester examination at Mody University.
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-teal-200">[1] MUST Academic Regulations · p.1</span>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-teal-500 text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-teal-400/40" />
              <Mic className="relative h-5 w-5" />
            </div>
            <div className="flex h-8 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1 shrink-0 rounded-full bg-teal-300/80"
                  animate={{ height: [6, 8 + ((i * 7) % 22), 6] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.04 }}
                />
              ))}
            </div>
            <span className="text-xs text-navy-300">Listening…</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { loginAsDemo } = useAuth()
  const { data: overview } = useAsync(() => publicApi.overview(), [])

  const stats = [
    { label: 'Departments', value: overview?.departments ?? 6 },
    { label: 'Programmes', value: overview?.programs ?? 18 },
    { label: 'Faculty members', value: overview?.faculty ?? 84 },
    { label: 'Indexed documents', value: overview?.documents ?? 42 },
  ]

  const handleQuickDemo = (role: 'student' | 'admin') => {
    if (loginAsDemo) {
      loginAsDemo(role)
      navigate(role === 'admin' ? '/admin' : '/app')
    } else {
      navigate(role === 'admin' ? '/admin/login' : '/login')
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="grid-bg absolute inset-0 opacity-[0.07]" />
        <div className="container relative grid items-center gap-14 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <motion.div className="min-w-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-200">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                MODY UNIVERSITY OF SCIENCE AND TECHNOLOGY
              </span>
              <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-navy-300">
                Lakshmangarh · Rajasthan
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.2rem]">
              Smart Voice Portal for <br className="hidden sm:block" />
              <span className="text-teal-300">Mody University</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-200">
              CampusHub brings programmes, unit-wise syllabus, faculty directories, fee structures, hostels, and medical services into one place — with an intelligent voice assistant that answers straight from official university documents.
            </p>

            {/* Direct Login CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent" className="font-semibold shadow-md">
                <Link to="/login" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Student Login <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="inverted" className="font-semibold">
                <Link to="/admin/login" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Admin Portal
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>

            {/* Quick 1-Click Demo Login Bar */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs text-navy-300">
              <span className="text-teal-300 font-semibold">⚡ One-Click Demo Access:</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="rounded-full border border-teal-400/30 bg-teal-500/15 px-3 py-1 text-teal-200 hover:bg-teal-500/25 transition-colors font-medium cursor-pointer"
              >
                Login as Demo Student (Aarav)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/20 transition-colors font-medium cursor-pointer"
              >
                Login as Demo Admin
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-300">
              {['Cited, source-grounded answers', 'Works with voice or text in browser', 'Role-based student & admin authentication'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div className="min-w-0" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <AssistantPreview />
          </motion.div>
        </div>

        <div className="relative border-t border-white/10 bg-navy-900/60">
          <div className="container grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-navy-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals & User Login Showcase Section */}
      <section id="login-portals" className="border-b bg-muted/40 py-20">
        <div className="container">
          <motion.div {...fade} className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Portal Access</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Login to Your Portal</h2>
            <p className="mt-3 text-muted-foreground">
              Direct access for Mody University students, faculty, and administrative staff. Choose your portal below to sign in or test immediately with demo access.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Student Portal Card */}
            <motion.div
              {...fade}
              className="relative rounded-2xl border bg-card p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg hover:border-teal-500/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800">
                    Student Portal
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-bold">Student Login</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Sign in to explore your courses, syllabus, fee schedules, attendance guidelines, notices, and interact with the AI voice assistant.
                </p>

                <div className="mt-5 rounded-xl border bg-muted/50 p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Demo Student Credentials:</span>
                    <span className="text-[10px] text-teal-600 font-medium">Ready to test</span>
                  </div>
                  <p className="mt-1 font-mono text-muted-foreground">aarav.student@campushub.demo</p>
                  <p className="mt-1 text-[11px] text-teal-700 font-medium">B.Tech Computer Science & Engineering · Year 3</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="flex-1" variant="accent">
                  <Link to="/login" className="flex items-center justify-center gap-1.5 font-semibold">
                    <UserCheck className="h-4 w-4" /> Go to Student Login <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => handleQuickDemo('student')}
                  className="border-teal-500/30 text-teal-800 hover:bg-teal-50 font-semibold"
                >
                  ⚡ Instant Demo
                </Button>
              </div>
            </motion.div>

            {/* Admin Portal Card */}
            <motion.div
              {...fade}
              className="relative rounded-2xl border bg-card p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg hover:border-navy-500/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900/10 text-navy-900">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-navy-900/10 px-3 py-1 text-xs font-semibold text-navy-800">
                    Admin Portal
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-bold">Administrator Login</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Sign in to manage academic records, upload & index official university PDFs/DOCX files into the RAG vector index, and inspect queries.
                </p>

                <div className="mt-5 rounded-xl border bg-muted/50 p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Demo Admin Credentials:</span>
                    <span className="text-[10px] text-navy-700 font-medium">Full privileges</span>
                  </div>
                  <p className="mt-1 font-mono text-muted-foreground">admin@campushub.demo</p>
                  <p className="mt-1 text-[11px] text-navy-700 font-medium">Campus Administrator & Data Management</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="flex-1">
                  <Link to="/admin/login" className="flex items-center justify-center gap-1.5 font-semibold">
                    <Shield className="h-4 w-4" /> Go to Admin Login <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => handleQuickDemo('admin')}
                  className="border-navy-500/30 text-navy-800 hover:bg-navy-50 font-semibold"
                >
                  ⚡ Instant Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem / product */}
      <section className="container py-20">
        <motion.div {...fade} className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Why CampusHub</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">College information is scattered. Finding it shouldn't be hard.</h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>Students routinely search notice boards, PDFs, department offices and messaging groups for basic details — exam rules, fee deadlines, library hours or a faculty member's office.</p>
            <p>CampusHub centralises this information in a structured, searchable portal maintained by administrators, and lets students simply <span className="font-medium text-foreground">ask</span> — by voice or text — to get a precise answer with references to the official source.</p>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="border-y bg-card py-20">
        <div className="container">
          <motion.div {...fade} className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Information hub</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Everything a student needs, organised</h2>
            <p className="mt-3 text-muted-foreground">Each section is backed by the institutional database and kept current by the administration team.</p>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} {...fade} transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group rounded-xl border bg-background p-6 transition-shadow hover:shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-teal-300"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Assistant */}
      <section id="assistant" className="container py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div {...fade}>
            <p className="eyebrow">AI voice assistant</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Talk to your college like you'd talk to a helpful senior</h2>
            <p className="mt-4 text-muted-foreground">Tap the microphone and ask. CampusHub transcribes your speech in the browser, retrieves the most relevant passages from official documents and records, and replies in natural language — out loud.</p>
            <ul className="mt-6 space-y-3">
              {[
                [Mic, 'Speech recognition and text-to-speech built on the Web Speech API'],
                [FileSearch, 'Semantic search over PDFs and DOCX files using Sentence Transformers and FAISS'],
                [ShieldCheck, 'Answers grounded in retrieved sources — never invented'],
                [MessageSquareText, 'Conversation history, suggested questions and source references'],
              ].map(([Icon, text]) => {
                const I = Icon as typeof Mic
                return <li key={text as string} className="flex items-start gap-3 text-sm"><I className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{text as string}</span></li>
              })}
            </ul>
          </motion.div>
          <motion.div {...fade} className="min-w-0 rounded-2xl bg-navy-950 p-4 sm:p-8"><AssistantPreview /></motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y bg-card py-20">
        <div className="container">
          <motion.div {...fade} className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">From question to cited answer in seconds</h2>
          </motion.div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} {...fade} transition={{ duration: 0.4, delay: i * 0.06 }} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-background text-accent"><Icon className="h-4 w-4" /></span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus overview */}
      <section id="campus" className="container py-20">
        <motion.div {...fade} className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <p className="eyebrow">Campus overview</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {overview?.college_name ?? 'Mody University of Science and Technology'}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A premier women's university located in Lakshmangarh, Rajasthan, committed to excellence in science, technology, management, and research with world-class residential and sports amenities.
            </p>
            <div className="mt-6 rounded-xl border bg-card p-4">
              <img src="/mody-logo.png" alt="Mody University" className="h-12 w-auto object-contain" />
              <p className="mt-2 text-xs text-muted-foreground">A Leading Women's University · Lakshmangarh, Rajasthan</p>
            </div>
          </div>
          {[
            { icon: Building2, title: 'Academic schools', text: 'School of Engineering & Technology, School of Business, School of Sciences, and School of Legal Studies with state-of-the-art laboratories.' },
            { icon: Home, title: 'Residential campus', text: 'Sprawling green 265-acre campus with residential hostels, multi-cuisine dining, equestrian facility, sports complex and 24/7 health centre.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="surface p-6">
              <Icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-navy-950 px-8 py-14 text-center text-white sm:px-16">
          <div className="grid-bg absolute inset-0 opacity-[0.06]" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight">Ready to ask your first question?</h2>
            <p className="mx-auto mt-3 max-w-xl text-navy-200">
              Sign in to your student account or test with our one-click demo access to start exploring with the voice assistant.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="accent"><Link to="/login">Student Login</Link></Button>
              <Button asChild size="lg" variant="inverted"><Link to="/admin/login">Administrator Portal</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Mody University of Science and Technology – Intelligent voice-enabled campus assistant and student information portal.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#login-portals" className="hover:text-foreground">Portals & Login</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#assistant" className="hover:text-foreground">Assistant</a>
            <Link to="/login" className="hover:text-foreground">Student login</Link>
            <Link to="/admin/login" className="hover:text-foreground">Admin portal</Link>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Mody University of Science and Technology · CampusHub AI Assistant.
        </div>
      </footer>
    </div>
  )
}
