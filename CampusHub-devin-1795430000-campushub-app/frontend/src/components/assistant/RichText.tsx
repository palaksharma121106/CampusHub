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

const BULLET = /^\s*([-*•]|\d+\.)\s+/

export function RichText({ text, onCite }: { text: string; onCite?: (n: number) => void }) {
  const blocks = text.trim().split(/\n{2,}/)
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const groups: { list: boolean; lines: string[] }[] = []
        for (const line of block.split('\n').filter((l) => l.trim())) {
          const list = BULLET.test(line)
          const last = groups[groups.length - 1]
          if (last && last.list === list) last.lines.push(line)
          else groups.push({ list, lines: [line] })
        }
        return (
          <div key={i} className="space-y-1.5">
            {groups.map((g, j) => g.list ? (
              <ul key={j} className="ml-4 list-disc space-y-1 marker:text-accent">
                {g.lines.map((l, k) => <li key={k}>{inline(l.replace(BULLET, ''), onCite)}</li>)}
              </ul>
            ) : (
              <p key={j}>{g.lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l, onCite)}</Fragment>)}</p>
            ))}
          </div>
        )
      })}
    </div>
  )
}
