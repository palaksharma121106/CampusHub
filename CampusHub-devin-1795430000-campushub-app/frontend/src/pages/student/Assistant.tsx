import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, Bot, History, Keyboard, MessageSquarePlus, Send, Sparkles, Square, Trash2, Volume2, VolumeX, X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

import { RichText } from '@/components/assistant/RichText'
import { SourceList } from '@/components/assistant/SourceList'
import { VoiceOrb, Waveform, type AssistantState } from '@/components/assistant/VoiceOrb'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { cn, initials, formatRelative } from '@/lib/utils'
import { errorMessage } from '@/services/api'
import { assistantApi } from '@/services/campus'
import type { ChatMessage, ChatSessionSummary } from '@/types'

function Message({ m, userName, onSpeak, speakingId }: { m: ChatMessage; userName: string; onSpeak: (m: ChatMessage) => void; speakingId: ChatMessage['id'] | null }) {
  const [cite, setCite] = useState<number | null>(null)
  if (m.role === 'user') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-900 px-4 py-2.5 text-sm leading-relaxed text-white">{m.content}</div>
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-800 sm:flex">{initials(userName)}</span>
      </motion.div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white"><Bot className="h-4 w-4" /></span>
      <div className={cn('min-w-0 max-w-[92%] flex-1 rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm leading-relaxed text-foreground/90 shadow-sm', m.meta?.error && 'border-red-200 bg-red-50')}>
        <RichText text={m.content} onCite={setCite} />
        <SourceList sources={m.sources ?? []} highlight={cite} />
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {!m.meta?.error && (
            <button type="button" onClick={() => onSpeak(m)} className="inline-flex items-center gap-1 font-medium hover:text-accent">
              {speakingId === m.id ? <><Square className="h-3 w-3" />Stop</> : <><Volume2 className="h-3.5 w-3.5" />Listen</>}
            </button>
          )}
          {m.meta?.answered === false && <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" />Not found in official records</span>}
          {m.meta?.generator && <span>{m.meta.generator === 'gemini' ? 'Gemini · grounded' : 'Extractive · grounded'}</span>}
          {m.meta?.response_time_ms !== undefined && <span>{(m.meta.response_time_ms / 1000).toFixed(1)}s</span>}
        </div>
      </div>
    </motion.div>
  )
}

export default function Assistant() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [speakingId, setSpeakingId] = useState<ChatMessage['id'] | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const tts = useSpeechSynthesis()

  const loadSessions = useCallback(() => assistantApi.sessions().then(setSessions).catch(() => undefined), [])
  useEffect(() => {
    loadSessions()
    assistantApi.suggestions().then(setSuggestions).catch(() => undefined)
  }, [loadSessions])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, processing])

  useEffect(() => { if (!tts.speaking) setSpeakingId(null) }, [tts.speaking])

  const speakMessage = useCallback((m: ChatMessage) => {
    if (speakingId === m.id) { tts.stop(); return }
    setSpeakingId(m.id)
    tts.speak(m.content)
  }, [speakingId, tts])

  const ask = useCallback(async (raw: string, mode: 'text' | 'voice') => {
    const question = raw.trim()
    if (question.length < 2 || processing) return
    tts.stop()
    setInput('')
    const now = new Date().toISOString()
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: question, created_at: now }])
    setProcessing(true)
    try {
      const res = await assistantApi.ask(question, sessionId, mode)
      const reply: ChatMessage = {
        id: res.message_id, role: 'assistant', content: res.answer, sources: res.sources, created_at: new Date().toISOString(),
        meta: { generator: res.generator, response_time_ms: res.response_time_ms, answered: res.answered },
      }
      setMessages((prev) => [...prev, reply])
      if (!sessionId) { setSessionId(res.session_id); loadSessions() }
      if (autoSpeak && tts.supported) { setSpeakingId(reply.id); tts.speak(reply.content) }
    } catch (e) {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: `Sorry — ${errorMessage(e)}`, created_at: new Date().toISOString(), meta: { error: true } }])
    } finally {
      setProcessing(false)
    }
  }, [processing, sessionId, autoSpeak, tts, loadSessions])

  const stt = useSpeechRecognition({ onFinal: (text) => ask(text, 'voice') })

  // Allow deep links such as /app/assistant?q=library+timings from the dashboard.
  const initialQ = params.get('q')
  useEffect(() => {
    if (initialQ) { ask(initialQ, 'text'); setParams({}, { replace: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ])

  const state: AssistantState = stt.listening ? 'listening' : processing ? 'processing' : tts.speaking ? 'speaking' : 'idle'

  const onOrb = () => {
    if (state === 'speaking') return tts.stop()
    if (state === 'listening') return stt.stop()
    if (!stt.supported) return stt.start()
    stt.start()
  }

  const newChat = () => { tts.stop(); setMessages([]); setSessionId(null); setHistoryOpen(false) }
  const openSession = async (id: number) => {
    tts.stop()
    try {
      const s = await assistantApi.session(id)
      setSessionId(s.id)
      setMessages(s.messages)
      setHistoryOpen(false)
    } catch { /* handled by interceptor */ }
  }
  const deleteSession = async (id: number) => {
    await assistantApi.deleteSession(id)
    if (id === sessionId) newChat()
    loadSessions()
  }
  const submit = (e: FormEvent) => { e.preventDefault(); ask(input, 'text') }

  const historyPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold">Conversations</p>
        <Button size="sm" variant="outline" onClick={newChat}><MessageSquarePlus />New</Button>
      </div>
      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
        {sessions.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">Your conversations will appear here.</p>}
        {sessions.map((s) => (
          <div key={s.id} className={cn('group flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted', s.id === sessionId && 'bg-muted')}>
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openSession(s.id)}>
              <p className="truncate font-medium">{s.title}</p>
              <p className="text-[11px] text-muted-foreground">{formatRelative(s.updated_at)}</p>
            </button>
            <button type="button" onClick={() => deleteSession(s.id)} aria-label="Delete conversation" className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100 focus:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-8 lg:-my-8">
      <aside className="hidden w-72 shrink-0 border-r bg-card xl:block">{historyPanel}</aside>
      <AnimatePresence>
        {historyOpen && (
          <motion.div className="fixed inset-0 z-40 flex xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-navy-950/40" onClick={() => setHistoryOpen(false)} />
            <div className="relative ml-auto h-full w-80 bg-card shadow-elevated">
              <button className="absolute right-2 top-2 z-10 rounded p-1 text-muted-foreground" onClick={() => setHistoryOpen(false)} aria-label="Close history"><X className="h-4 w-4" /></button>
              {historyPanel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex min-w-0 flex-1 flex-col">
        {/* Voice stage */}
        <div className="relative shrink-0 overflow-hidden bg-navy-950 px-4 pb-5 pt-4 text-white">
          <div className="grid-bg absolute inset-0 opacity-[0.06]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">AI Voice Assistant</p>
              <p className="text-sm text-navy-200">Answers come only from official CampusHub documents and records.</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="text-navy-100 hover:bg-white/10 hover:text-white" onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) tts.stop() }}
                title={autoSpeak ? 'Auto-read answers is on' : 'Auto-read answers is off'} aria-pressed={autoSpeak}>
                {autoSpeak ? <Volume2 /> : <VolumeX />}<span className="hidden sm:inline">{autoSpeak ? 'Voice on' : 'Voice off'}</span>
              </Button>
              {messages.length > 0 && (
                <Button size="sm" variant="ghost" className="text-navy-100 hover:bg-white/10 hover:text-white" onClick={newChat}><Trash2 /><span className="hidden sm:inline">Clear</span></Button>
              )}
              <Button size="sm" variant="ghost" className="text-navy-100 hover:bg-white/10 hover:text-white xl:hidden" onClick={() => setHistoryOpen(true)} aria-label="Conversation history"><History /></Button>
            </div>
          </div>
          <div className={cn('relative flex flex-col items-center transition-all', messages.length ? 'mt-1' : 'mt-6')}>
            <VoiceOrb state={state} supported={stt.supported} onClick={onOrb} />
            <div className="mt-2 w-full max-w-md"><Waveform state={state} /></div>
            <AnimatePresence mode="wait">
              {stt.listening && stt.interim && (
                <motion.p key="interim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1 max-w-xl text-center text-sm italic text-navy-100">“{stt.interim}”</motion.p>
              )}
            </AnimatePresence>
            {(stt.error || (!stt.supported)) && (
              <div role="alert" className="mt-3 flex max-w-xl items-start gap-2 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{stt.error ?? 'Your browser does not support speech recognition. Use Chrome or Edge for voice input, or type your question below.'}</span>
                {stt.error && <button onClick={stt.clearError} aria-label="Dismiss" className="ml-1"><X className="h-3.5 w-3.5" /></button>}
              </div>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto bg-background px-4 py-6 sm:px-8">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Sparkles className="h-5 w-5" /></div>
              <h2 className="mt-3 text-lg font-semibold">Hi {user?.full_name.split(' ')[0]}, what would you like to know?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tap the microphone or type a question. Try one of these:</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s, 'text')} className="rounded-xl border bg-card px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-accent/60 hover:bg-accent-soft/40">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((m) => <Message key={m.id} m={m} userName={user?.full_name ?? ''} onSpeak={speakMessage} speakingId={speakingId} />)}
              {processing && (
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white"><Bot className="h-4 w-4" /></span>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border bg-card px-4 py-3">
                    {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-accent" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />)}
                    <span className="ml-2 text-xs text-muted-foreground">Retrieving sources and composing answer…</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={submit} className="shrink-0 border-t bg-card px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <div className="relative flex-1">
              <Keyboard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" aria-label="Type your question" maxLength={1000}
                className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <Button type="submit" variant="accent" size="lg" className="h-11 px-4" disabled={input.trim().length < 2 || processing} aria-label="Send question"><Send /></Button>
          </div>
          {messages.length > 0 && suggestions.length > 0 && (
            <div className="scrollbar-thin mx-auto mt-2 flex max-w-3xl gap-2 overflow-x-auto pb-1">
              {suggestions.slice(0, 4).map((s) => (
                <button key={s} type="button" onClick={() => ask(s, 'text')} disabled={processing} className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-accent/60 hover:text-foreground">{s}</button>
              ))}
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
