import { describe, expect, it } from 'vitest'

import { toSpeakable } from '@/hooks/useSpeechSynthesis'
import { formatBytes, initials } from '@/lib/utils'
import { validateFile } from '@/pages/admin/AdminDocuments'

describe('toSpeakable', () => {
  it('removes citations and markdown and reads rupees naturally', () => {
    expect(toSpeakable('- The fee is **Rs. 1,65,000** per year [1]')).toBe('The fee is rupees 1,65,000 per year')
  })
})

describe('validateFile', () => {
  const file = (name: string, size = 1024) => new File([new Uint8Array(size)], name)
  it('accepts PDF and DOCX', () => {
    expect(validateFile(file('rules.pdf'))).toBeNull()
    expect(validateFile(file('Hostel.DOCX'))).toBeNull()
  })
  it('rejects other types, empty and oversized files', () => {
    expect(validateFile(file('notes.txt'))).toMatch(/Only PDF and DOCX/)
    expect(validateFile(file('empty.pdf', 0))).toMatch(/empty/)
    expect(validateFile(file('big.pdf', 21 * 1024 * 1024))).toMatch(/larger than/)
  })
})

describe('formatting helpers', () => {
  it('formats sizes and initials', () => {
    expect(formatBytes(2048)).toMatch(/2(\.0)? KB/)
    expect(initials('Aarav Gupta')).toBe('AG')
  })
})
