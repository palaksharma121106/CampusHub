import { motion } from 'framer-motion'
import {
  ArrowRight, BookOpen, Building2, CheckCircle2, FileSearch, GraduationCap, HeartPulse, Home, IndianRupee, Library,
  Mic, MessageSquareText, Phone, ShieldCheck, Sparkles, UserSquare2, Volume2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
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
          <div className="flex items-center gap-2 text-sm font-medium text-white"><span className="h-2 w-2 rounded-full bg-teal-400" />CampusHub Assistant</div>
          <span className="text-xs text-navy-300">Voice · RAG</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-500 px-4 py-2.5 text-sm text-white">What is the minimum attendance required to sit the end-semester exam?</div>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-navy-100">
            Students must maintain at least <span className="font-semibold text-white">75% attendance</span> in each course to be eligible for the end-semester examination.
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-teal-200">[1] Academic Regulations · p.1</span>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-teal-500 text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-teal-400/40" /><Mic className="relative h-5 w-5" />
            </div>
            <div className="flex h-8 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.span key={i} className="w-1 shrink-0 rounded-full bg-teal-300/80"
                  animate={{ height: [6, 8 + ((i * 7) % 22), 6] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.04 }} />
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
  const { data: overview } = useAsync(() => publicApi.overview(), [])
  const stats = [
    { label: 'Departments', value: overview?.departments },
    { label: 'Programmes', value: overview?.programs },
    { label: 'Faculty members', value: overview?.faculty },
    { label: 'Indexed documents', value: overview?.documents },
  ]
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="grid-bg absolute inset-0 opacity-[0.07]" />
        <div className="container relative grid items-center gap-14 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <motion.div className="min-w-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-teal-200">
              <Sparkles className="h-3.5 w-3.5" /> Voice-enabled · Retrieval-augmented AI
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Every answer about your campus,<br className="hidden sm:block" /> <span className="text-teal-300">one question away.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
              CampusHub brings programmes, syllabus, faculty, fees, library, hostel and medical information into one place —
              with an intelligent voice assistant that answers from your institution's official documents.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent"><Link to="/register">Create student account <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="inverted"><Link to="/login">Student login</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-300">
              {['Cited, source-grounded answers', 'Works with voice or text', 'Secure JWT authentication'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-400" />{t}</span>
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
                <p className="text-2xl font-semibold text-white">{s.value ?? '—'}</p>
                <p className="text-sm text-navy-300">{s.label}</p>
              </div>
            ))}
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
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{overview?.college_name ?? 'Your campus'}</h2>
            <p className="mt-3 text-sm text-muted-foreground">The institution shown in this deployment uses a clearly labelled <span className="font-medium text-foreground">demonstration dataset</span>. Administrators replace it with verified official information before production use.</p>
          </div>
          {[
            { icon: Building2, title: 'Academic schools', text: 'Engineering, sciences and management departments with dedicated faculty and labs.' },
            { icon: Home, title: 'Residential campus', text: 'Separate hostels, central dining, sports complex, health centre and transport.' },
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
            <p className="mx-auto mt-3 max-w-xl text-navy-200">Create your student account in under a minute and start exploring with the voice assistant.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="accent"><Link to="/register">Get started</Link></Button>
              <Button asChild size="lg" variant="inverted"><Link to="/admin/login">Administrator login</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">An intelligent voice-based college information assistant. Final-year B.Tech Computer Science project.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#assistant" className="hover:text-foreground">Assistant</a>
            <Link to="/login" className="hover:text-foreground">Student login</Link>
            <Link to="/admin/login" className="hover:text-foreground">Admin portal</Link>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} CampusHub · Demonstration data is illustrative and not official institutional information.</div>
      </footer>
    </div>
  )
}
