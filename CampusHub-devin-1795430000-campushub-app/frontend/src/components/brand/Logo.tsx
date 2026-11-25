import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/mody-emblem.png"
      alt="Mody University"
      className={cn(
        'h-8 w-8 rounded-full object-contain shrink-0 bg-white ring-1 ring-black/10 shadow-xs',
        className
      )}
    />
  )
}

export function Logo({
  inverted = false,
  className,
}: {
  inverted?: boolean
  className?: string
}) {
  return (
    <span className={cn('flex items-center gap-2.5 select-none', className)}>
      <LogoMark className={inverted ? 'ring-white/20' : undefined} />
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            'text-[10px] sm:text-[11px] font-bold tracking-wider uppercase',
            inverted ? 'text-teal-300' : 'text-emerald-800'
          )}
        >
          Mody University
        </span>
        <span
          className={cn(
            'text-base sm:text-lg font-extrabold tracking-tight',
            inverted ? 'text-white' : 'text-navy-950'
          )}
        >
          Campus<span className="text-teal-500">Hub</span>
        </span>
      </div>
    </span>
  )
}

export function FullLogo({
  inverted = false,
  className,
}: {
  inverted?: boolean
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <img
        src={inverted ? '/mody-logo-badge.png' : '/mody-logo.png'}
        alt="Mody University of Science and Technology"
        className="h-10 sm:h-12 w-auto max-w-[260px] object-contain drop-shadow-xs"
      />
    </div>
  )
}
