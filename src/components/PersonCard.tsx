import { ChevronDown, GraduationCap, MapPin, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { badgesFor } from '../lib/derive'
import { actions, useApp } from '../lib/store'
import { coffeeChatValue } from '../lib/scoring'
import type { Person, ScoreResult } from '../types'
import { SaveMenu } from './SaveMenu'
import { ScoreBreakdown } from './ScoreBreakdown'
import { Avatar, Badge, DemoTag, ScoreRing } from './ui'

const VALUE_TONE = { High: 'text-moss bg-moss-soft', Good: 'text-sky bg-sky-soft', 'Worth a look': 'text-ink-soft bg-sand' }

export function PersonCard({ person, result, onDismiss, defaultOpen = false }: { person: Person; result: ScoreResult; onDismiss?: () => void; defaultOpen?: boolean }) {
  const { profile } = useApp()
  const [open, setOpen] = useState(defaultOpen)
  const badges = badgesFor(person, profile).slice(0, 7)
  const value = coffeeChatValue(person, result)
  const school = person.education[0]
  const shared = result.factors.filter((f) => ['alumni', 'club', 'hobby', 'projectDomain', 'mutuals', 'geography'].includes(f.id) && f.earned > 0 && f.detail)

  return (
    <article className="card animate-rise p-4 transition-shadow hover:shadow-lift sm:p-5">
      <div className="flex items-start gap-3.5">
        <Avatar name={person.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/person/${person.id}`} className="font-display text-lg font-semibold leading-tight hover:text-accent-deep hover:underline">{person.name}</Link>
            {person.isDemo && <DemoTag />}
            {person.tags.includes('unverified') && <span className="rounded-md bg-accent-soft px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-accent-deep">Unverified</span>}
          </div>
          <p className="text-sm text-ink-soft">{person.role} <span className="text-ink-faint">at</span> <span className="font-medium text-ink">{person.company}</span></p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-faint">
            <span className="inline-flex items-center gap-1"><MapPin size={12} />{person.location}</span>
            {school && <span className="inline-flex items-center gap-1"><GraduationCap size={12} />{school.school}{school.gradYear ? ` '${String(school.gradYear).slice(2)}` : ''}</span>}
            <span title={person.source}>via {person.source.replace('Demo seed: ', '')}</span>
          </p>
        </div>
        <ScoreRing percent={result.percent} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">{badges.map((b) => <Badge key={b.label} {...b} />)}</div>

      <p className="mt-3 text-sm leading-relaxed">
        <Sparkles size={13} className="mr-1 inline text-accent" />
        {result.reasons[0] ?? 'Lower overall fit, but may still be worth a short conversation.'}
        {result.reasons[1] && <span className="text-ink-soft">{`. ${result.reasons[1]}`}</span>}
      </p>

      {shared.length > 0 && (
        <p className="mt-2 text-xs text-ink-soft"><span className="font-medium text-ink">Shared signals:</span> {shared.slice(0, 3).map((f) => f.detail).join(' · ')}</p>
      )}

      <p className="mt-2 flex items-start gap-2 text-xs text-ink-soft">
        <span className={`mt-px shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VALUE_TONE[value.level]}`}>{value.level} chat value</span>
        <span>{value.text}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SaveMenu personId={person.id} size="sm" />
        {onDismiss && (
          <button onClick={onDismiss} className="btn-quiet !px-2.5 !py-1.5 text-xs" title="Hide this person from recommendations"><X size={14} />Dismiss</button>
        )}
        <Link to={`/person/${person.id}`} className="btn-quiet !px-2.5 !py-1.5 text-xs">View profile</Link>
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="btn-quiet ml-auto !px-2.5 !py-1.5 text-xs">
          Why this person?
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="mt-4 animate-rise rounded-xl bg-paper p-4">
          <div className="mb-3 text-sm font-medium">{result.percent}% match</div>
          <ScoreBreakdown result={result} compact />
        </div>
      )}
    </article>
  )
}

export function dismissWithUndo(person: Person, toast: (msg: string, undo?: () => void) => void) {
  actions.dismiss(person.id)
  toast(`Dismissed ${person.name}`, () => actions.undismiss(person.id))
}
