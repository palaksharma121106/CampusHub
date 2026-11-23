import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { VoiceOrb } from '@/components/assistant/VoiceOrb'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

describe('voice support detection', () => {
  afterEach(() => { delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition })

  it('reports unsupported browsers instead of crashing', () => {
    const { result } = renderHook(() => useSpeechRecognition({ onFinal: vi.fn() }))
    expect(result.current.supported).toBe(false)
    render(<VoiceOrb state="idle" supported={false} onClick={vi.fn()} />)
    expect(screen.getByText(/not supported|unsupported|type your question/i)).toBeInTheDocument()
  })

  it('starts recognition and delivers the final transcript', () => {
    const instances: FakeRecognition[] = []
    class FakeRecognition {
      lang = ''; continuous = false; interimResults = false; maxAlternatives = 1
      onresult: ((e: unknown) => void) | null = null
      onend: (() => void) | null = null
      onerror: ((e: unknown) => void) | null = null
      onstart: (() => void) | null = null
      start = vi.fn(() => this.onstart?.())
      stop = vi.fn(() => this.onend?.())
      abort = vi.fn()
      constructor() { instances.push(this) }
    }
    ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition
    const onFinal = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition({ onFinal }))
    expect(result.current.supported).toBe(true)
    act(() => result.current.start())
    const rec = instances[instances.length - 1]
    expect(rec.start).toHaveBeenCalled()
    expect(rec.lang).toBe('en-IN')
    act(() => {
      rec.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: 'library timings' }], { isFinal: true })] })
      rec.onend?.()
    })
    expect(onFinal).toHaveBeenCalledWith('library timings')
  })
})
