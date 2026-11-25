import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', {
  variants: {
    variant: {
      default: 'border-transparent bg-navy-50 text-navy-700',
      accent: 'border-transparent bg-accent-soft text-teal-700',
      outline: 'border-border text-muted-foreground',
      success: 'border-transparent bg-emerald-50 text-emerald-700',
      warning: 'border-transparent bg-amber-50 text-amber-700',
      destructive: 'border-transparent bg-red-50 text-red-700',
      solid: 'border-transparent bg-primary text-primary-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
