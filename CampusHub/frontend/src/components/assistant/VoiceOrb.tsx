import { motion } from 'framer-motion'
import { Loader2, Mic, MicOff, Square, Volume2 } from 'lucide-react'

import { useAudioLevels } from '@/hooks/useAudioLevels'
import { cn } from '@/lib/utils'

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking'

const LABELS: Record<AssistantState, string> = {
  idle: 'Tap to speak',
  listening: 'Listening… tap to finish',
  processing: 'Searching official sources…',
  speaking: 'Speaking — tap to stop',
}

export function Waveform({ state }: { state: AssistantState }) {
  const levels = useAudioLevels(state === 'listening', 40)
  return (
    <div className="flex h-14 items-center justify-center gap-[3px]" aria-hidden>
      {levels.map((lvl, i) => {
        const center = 1 - Math.abs(i - 19.5) / 20
        let h = 4
        if (state === 'listening') h = 4 + lvl * 52
        return state === 'speaking' || state === 'processing' ? (
          <motion.span key={i} className={cn('w-[3px] rounded-full', state === 'speaking' ? 'bg-teal-300' : 'bg-navy-300/60')}
            animate={{ height: state === 'speaking' ? [4, 8 + center * 34 * (0.5 + ((i * 13) % 7) / 7), 4] : [4, 4 + center * 10, 4] }}
            transition={{ duration: state === 'speaking' ? 0.9 : 1.4, repeat: Infinity, delay: i * 0.03, ease: 'easeInOut' }} />
        ) : (
          <span key={i} className={cn('w-[3px] rounded-full transition-[height] duration-75', state === 'listening' ? 'bg-teal-300' : 'bg-white/15')} style={{ height: h }} />
        )
      })}
    </div>
  )
}

export function VoiceOrb({ state, supported, onClick }: { state: AssistantState; supported: boolean; onClick: () => void }) {
  const Icon = !supported ? MicOff : state === 'processing' ? Loader2 : state === 'speaking' ? Square : state === 'listening' ? Mic : Mic
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-40 w-40 items-center justify-center">
        {state === 'listening' && [0, 1, 2].map((i) => (
          <motion.span key={i} className="absolute inset-0 rounded-full border border-teal-400/40"
            initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.25, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.66 }} />
        ))}
        {state === 'speaking' && <motion.span className="absolute inset-4 rounded-full bg-teal-400/15" animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />}
        <motion.button
          type="button"
          onClick={onClick}
          disabled={state === 'processing'}
          whileTap={{ scale: 0.95 }}
          aria-label={!supported ? 'Voice input unavailable' : LABELS[state]}
          aria-pressed={state === 'listening'}
          className={cn(
            'relative z-10 flex h-24 w-24 items-center justify-center rounded-full text-white shadow-[0_10px_40px_-10px_rgba(20,184,166,0.6)] outline-none ring-offset-4 ring-offset-navy-950 transition-colors focus-visible:ring-2 focus-visible:ring-teal-300 disabled:cursor-wait',
            !supported ? 'bg-navy-700' : state === 'listening' ? 'bg-teal-500' : state === 'speaking' ? 'bg-navy-700 hover:bg-navy-600' : 'bg-gradient-to-b from-teal-400 to-teal-600 hover:from-teal-300 hover:to-teal-500',
          )}
        >
          <Icon className={cn('h-9 w-9', state === 'processing' && 'animate-spin')} />
        </motion.button>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-navy-100" aria-live="polite">
        {state === 'speaking' && <Volume2 className="h-4 w-4 text-teal-300" />}
        {supported ? LABELS[state] : 'Voice input not supported — type below'}
      </p>
    </div>
  )
}
