import { Bookmark, BookmarkCheck, Check, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { actions, useApp } from '../lib/store'

export function SaveMenu({ personId, size = 'md' }: { personId: string; size?: 'sm' | 'md' }) {
  const s = useApp()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const entry = s.saved[personId]

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        aria-haspopup="menu" aria-expanded={open}
        onClick={() => { if (!entry) actions.save(personId); setOpen(!open) }}
        className={`${entry ? 'btn border border-accent/30 bg-accent-soft text-accent-deep hover:bg-accent-soft/70' : 'btn-ghost'} ${size === 'sm' ? '!px-2.5 !py-1.5 text-xs' : ''}`}
      >
        {entry ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        {entry ? 'Saved' : 'Save'}
      </button>
      {open && entry && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 animate-rise rounded-2xl border border-line bg-card p-2 shadow-lift">
          <p className="px-2 pb-1 pt-1 text-xs font-medium text-ink-faint">Add to lists</p>
          <div className="max-h-56 overflow-auto">
            {s.lists.map((l) => {
              const on = entry.lists.includes(l)
              return (
                <button key={l} role="menuitemcheckbox" aria-checked={on} onClick={() => actions.toggleList(personId, l)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sand">
                  {l}
                  {on && <Check size={14} className="text-accent" />}
                </button>
              )
            })}
          </div>
          <form className="mt-1 flex gap-1 border-t border-line pt-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { actions.addList(draft); actions.toggleList(personId, draft.trim()); setDraft('') } }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="New list" className="field !py-1.5 text-sm" />
            <button className="btn-ghost !px-2" aria-label="Create list"><Plus size={14} /></button>
          </form>
          <button onClick={() => { actions.unsave(personId); setOpen(false) }} className="mt-2 w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink-soft hover:bg-sand">Remove from saved</button>
        </div>
      )}
    </div>
  )
}
