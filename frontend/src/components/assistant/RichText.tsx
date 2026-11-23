import { Fragment, type ReactNode } from 'react'

/** Render the small subset of markdown the assistant produces: paragraphs, bullet lists, **bold** and [n] citations. */
function inline(text: string, onCite?: (n: number) => void): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    const cite = part.match(/^\[(\d+)\]$/)
    if (cite) {
      return (
        <button key={i} type="button" onClick={() => onCite?.(Number(cite[1]))}
          className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-0.5 items-center justify-center rounded bg-accent-soft px-1 align-middle text-[10px] font-semibold text-teal-700 hover:bg-teal-100">
          {cite[1]}
        </button>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function RichText({ text, onCite }: { text: string; onCite?: (n: number) => void }) {
  const blocks = text.trim().split(/\n{2,}/)
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim())
        if (lines.length && lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          return (
            <ul key={i} className="ml-4 list-disc space-y-1 marker:text-accent">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''), onCite)}</li>)}
            </ul>
          )
        }
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, onCite)}</Fragment>)}</p>
      })}
    </div>
  )
}
