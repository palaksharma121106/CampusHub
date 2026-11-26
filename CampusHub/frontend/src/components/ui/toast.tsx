import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Toast = { id: number; kind: 'success' | 'error'; text: string }
interface ToastApi { success: (text: string) => void; error: (text: string) => void }
const ToastContext = createContext<ToastApi>({ success: () => undefined, error: () => undefined })

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => dismiss(id), 4000)
  }, [])
  const api = useMemo(() => ({ success: (t: string) => push('success', t), error: (t: string) => push('error', t) }), [push])
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
              role="status" className="pointer-events-auto flex items-start gap-2 rounded-xl border bg-card p-3 text-sm shadow-elevated">
              {t.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              <span className="flex-1">{t.text}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
