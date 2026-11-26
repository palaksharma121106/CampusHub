import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string
  children?: ReactNode; footer?: ReactNode; className?: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy-950/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn('fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-card shadow-elevated data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)}
        >
          <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
                : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t bg-muted/40 px-6 py-3 rounded-b-2xl">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Delete', onConfirm, loading }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string
  confirmLabel?: string; onConfirm: () => void; loading?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} className="max-w-md"
      footer={<>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>}
    >
      <p className="text-sm text-muted-foreground">{description}</p>
    </Dialog>
  )
}
