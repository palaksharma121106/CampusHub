import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0d1a33" />
      <path d="M16 7 6 12l10 5 10-5-10-5Z" fill="#2bbaa6" />
      <path d="M10 15v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5l-6 3-6-3Z" fill="#fff" />
    </svg>
  )
}

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={inverted ? 'ring-1 ring-white/15 rounded-lg' : undefined} />
      <span className={cn('text-lg font-semibold tracking-tight', inverted ? 'text-white' : 'text-navy-900')}>
        Campus<span className="text-teal-500">Hub</span>
      </span>
    </span>
  )
}
