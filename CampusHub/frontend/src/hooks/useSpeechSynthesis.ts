import { useCallback, useEffect, useRef, useState } from 'react'

/** Strip markdown / citation markers so the answer sounds natural when read aloud. */
export const toSpeakable = (text: string) =>
  text.replace(/\[\d+\]/g, '').replace(/[*_#`>]/g, '').replace(/^\s*-\s+/gm, '').replace(/Rs\.\s?/g, 'rupees ').replace(/\s{2,}/g, ' ').trim()

export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!supported) return
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      setVoice(
        voices.find((v) => v.lang === 'en-IN') ?? voices.find((v) => /en-(GB|US)/.test(v.lang) && /female|google|samantha|natural/i.test(v.name))
          ?? voices.find((v) => v.lang.startsWith('en')) ?? null,
      )
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', pick)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  const speak = useCallback((text: string) => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(toSpeakable(text))
    if (voice) u.voice = voice
    u.rate = 1
    u.pitch = 1
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    utterRef.current = u
    window.speechSynthesis.speak(u)
  }, [supported, voice])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, speak, stop }
}
