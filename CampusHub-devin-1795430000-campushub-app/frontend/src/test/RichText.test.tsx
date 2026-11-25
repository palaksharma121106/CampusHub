import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RichText } from '@/components/assistant/RichText'

describe('RichText', () => {
  it('renders an intro line, a bullet list and clickable citations', () => {
    const onCite = vi.fn()
    render(<RichText text={'Here is what I found:\n- Minimum attendance is **75%** [1]\n- Library opens at 8 AM [2]'} onCite={onCite} />)
    expect(screen.getByText('Here is what I found:')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('75%').tagName).toBe('STRONG')
    fireEvent.click(screen.getByRole('button', { name: /2/ }))
    expect(onCite).toHaveBeenCalledWith(2)
  })
})
