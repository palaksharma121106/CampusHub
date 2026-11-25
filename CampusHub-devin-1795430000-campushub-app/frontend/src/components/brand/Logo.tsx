import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/mody-emblem.png"
      alt="Mody University"
      className={cn(
        'h-9 w-9 shrink-0 rounded-full object-contain ring-1 ring-black/10 shadow-xs',
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
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <LogoMark className={inverted ? 'ring-white/25' : undefined} />
      <span className="flex flex-col justify-center gap-0.5 leading-none">
        <span
          className={cn(
            'text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase whitespace-nowrap',
            inverted ? 'text-teal-300' : 'text-emerald-800'
          )}
        >
          Mody University
        </span>
        <span
          className={cn(
            'text-base sm:text-[17px] font-extrabold tracking-tight whitespace-nowrap',
            inverted ? 'text-white' : 'text-navy-950'
          )}
        >
          Campus<span className="text-teal-500">Hub</span>
        </span>
      </span>
    </span>
  )
}

export function FullLogo({
  inverted = false,
  className,
  imgClassName,
}: {
  inverted?: boolean
  className?: string
  imgClassName?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center shrink-0 select-none',
        inverted && 'rounded-xl bg-white px-3.5 py-2 shadow-sm',
        className
      )}
    >
      <img
        src={inverted ? '/mody-logo-badge.png' : '/mody-logo.png'}
        alt="Mody University of Science and Technology – Accredited Grade A+ by NAAC"
        className={cn('h-10 sm:h-12 w-auto object-contain', imgClassName)}
      />
    </span>
  )
}
