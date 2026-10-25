import { Check, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import type { Badge as BadgeT } from '../lib/derive'
import { initials } from '../lib/derive'

const TONES: Record<BadgeT['tone'], string> = {
  accent: 'bg-accent-soft text-accent-deep',
  moss: 'bg-moss-soft text-moss',
  sky: 'bg-sky-soft text-sky',
  sand: 'bg-sand text-ink-soft',
}

export function Badge({ label, tone }: BadgeT) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>{label}</span>
}

export function DemoTag({ className = '' }: { className?: string }) {
  return (
    <span title="Fictional profile created for development" className={`inline-flex items-center rounded-md border border-dashed border-ink-faint/60 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-ink-faint ${className}`}>
      Demo data
    </span>
  )
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const hue = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 5
  const bg = ['#f7e6dc', '#e3eee5', '#e3edf5', '#f1e7d0', '#ece4f1'][hue]
  const fg = ['#9a3f1e', '#3f6a4a', '#34607f', '#7a5f1d', '#5d4577'][hue]
  return (
    <div className="grid shrink-0 place-items-center rounded-full font-display text-sm font-semibold" style={{ width: size, height: size, background: bg, color: fg }} aria-hidden>
      {initials(name)}
    </div>
  )
}

export function ScoreRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const color = percent >= 80 ? '#c2562f' : percent >= 60 ? '#4f7a5a' : '#8d877c'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${percent} percent match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#efe9dc" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold tabular-nums">{percent}%</div>
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-2 text-sm text-ink-soft">
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${value === o.value ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink-soft hover:bg-sand'}`}>
          {o.label}
          {o.count !== undefined && <span className={`ml-1.5 tabular-nums ${value === o.value ? 'text-paper/70' : 'text-ink-faint'}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Multi-select pill group for fixed vocabularies. */
export function PillSelect({ options, value, onChange }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${on ? 'border-accent/40 bg-accent-soft text-accent-deep' : 'border-line bg-card text-ink-soft hover:bg-sand'}`}>
            {on && <Check size={12} />}
            {o}
          </button>
        )
      })}
    </div>
  )
}

/** Free-form tag editor. Enter or comma adds; backspace on empty removes the last. */
export function TokenInput({ value, onChange, placeholder, suggestions }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, '')
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t])
    setDraft('')
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white p-1.5 focus-within:border-accent/60">
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-sand py-0.5 pl-2.5 pr-1 text-xs font-medium text-ink-soft">
          {v}
          <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="grid h-4 w-4 place-items-center rounded-full hover:bg-line"><X size={10} /></button>
        </span>
      ))}
      <input
        list={suggestions ? listId : undefined}
        value={draft}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(draft) }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={() => draft && add(draft)}
        className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-ink-faint focus-visible:ring-0"
      />
      {suggestions && <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 text-3xl" aria-hidden>☕</div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
