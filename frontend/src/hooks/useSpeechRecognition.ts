import { useCallback, useEffect, useRef, useState } from 'react'

/* Minimal typings for the (still prefixed in Chromium/Safari) Web Speech API. */
interface SpeechRecognitionAlternative { transcript: string }
interface SpeechRecognitionResult { isFinal: boolean; 0: SpeechRecognitionAlternative; length: number }
interface SpeechRecognitionEvent { resultIndex: number; results: ArrayLike<SpeechRecognitionResult> }
interface SpeechRecognitionErrorEvent { error: string }
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  start(): void; stop(): void; abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
type Ctor = new () => SpeechRecognitionLike

const getCtor = (): Ctor | undefined => {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access was blocked. Allow microphone permission in your browser settings and try again.',
  'service-not-allowed': 'Speech recognition is not allowed in this browser context.',
  'no-speech': "I didn't hear anything. Tap the microphone and speak clearly.",
  'audio-capture': 'No microphone was found. Check that a microphone is connected.',
  network: 'Speech recognition needs an internet connection. You can type your question instead.',
}

export function useSpeechRecognition({ onFinal, lang = 'en-IN' }: { onFinal: (text: string) => void; lang?: string }) {
  const supported = typeof window !== 'undefined' && Boolean(getCtor())
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const finalRef = useRef('')
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  const stop = useCallback(() => recRef.current?.stop(), [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) {
      setError('Voice input is not supported in this browser. Please use Chrome or Edge, or type your question.')
      return
    }
    recRef.current?.abort()
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1
    finalRef.current = ''
    setInterim('')
    setError(null)
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      let text = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalRef.current += r[0].transcript
        else text += r[0].transcript
      }
      setInterim((finalRef.current + ' ' + text).trim())
    }
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError(ERRORS[e.error] ?? `Voice input error: ${e.error}`)
    }
    rec.onend = () => {
      setListening(false)
      const text = finalRef.current.trim()
      if (text) onFinalRef.current(text)
    }
    recRef.current = rec
    try {
      rec.start()
    } catch {
      setError('Could not start the microphone. Please try again.')
    }
  }, [lang])

  useEffect(() => () => recRef.current?.abort(), [])

  return { supported, listening, interim, error, start, stop, clearError: () => setError(null) }
}
