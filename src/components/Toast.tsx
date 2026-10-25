import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type ToastFn = (message: string, undo?: () => void) => void
const Ctx = createContext<ToastFn>(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ id: number; message: string; undo?: () => void } | null>(null)
  const show = useCallback<ToastFn>((message, undo) => {
    const id = Date.now()
    setT({ id, message, undo })
    setTimeout(() => setT((cur) => (cur?.id === id ? null : cur)), 5000)
  }, [])
  return (
    <Ctx.Provider value={show}>
      {children}
      {t && (
        <div role="status" className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 animate-rise items-center gap-3 rounded-xl bg-ink px-4 py-2.5 text-sm text-paper shadow-lift lg:bottom-6">
          {t.message}
          {t.undo && <button onClick={() => { t.undo?.(); setT(null) }} className="font-semibold text-accent-soft underline-offset-2 hover:underline">Undo</button>}
        </div>
      )}
    </Ctx.Provider>
  )
}
