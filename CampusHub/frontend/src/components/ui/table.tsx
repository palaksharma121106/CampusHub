import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export const Table = ({ className, ...p }: HTMLAttributes<HTMLTableElement>) => (
  <div className="scrollbar-thin w-full overflow-x-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...p} /></div>
)
export const THead = ({ className, ...p }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('border-b bg-muted/50 [&_tr]:border-b', className)} {...p} />
)
export const TBody = ({ className, ...p }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />
)
export const TR = ({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b transition-colors hover:bg-muted/40', className)} {...p} />
)
export const TH = ({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)} {...p} />
)
export const TD = ({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...p} />
)
