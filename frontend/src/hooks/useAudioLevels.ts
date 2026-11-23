import { useEffect, useRef, useState } from 'react'

/** Live microphone frequency levels (0..1) for the waveform, using the Web Audio API. */
export function useAudioLevels(active: boolean, bars = 32) {
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0))
  const frame = useRef<number>(0)

  useEffect(() => {
    if (!active || !navigator.mediaDevices?.getUserMedia) {
      setLevels(Array(bars).fill(0))
      return
    }
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      if (cancelled) return s.getTracks().forEach((t) => t.stop())
      stream = s
      ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.75
      ctx.createMediaStreamSource(s).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const step = Math.max(1, Math.floor(data.length / bars))
        setLevels(Array.from({ length: bars }, (_, i) => Math.min(1, (data[i * step] ?? 0) / 200)))
        frame.current = requestAnimationFrame(tick)
      }
      tick()
    }).catch(() => setLevels(Array(bars).fill(0)))
    return () => {
      cancelled = true
      cancelAnimationFrame(frame.current)
      stream?.getTracks().forEach((t) => t.stop())
      ctx?.close()
    }
  }, [active, bars])

  return levels
}
