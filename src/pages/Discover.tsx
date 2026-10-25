import { RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PersonCard } from '../components/PersonCard'
import { useToast } from '../components/Toast'
import { EmptyState, PageHeader, Segmented } from '../components/ui'
import { isAlumni, metroOf } from '../lib/derive'
import { useScored } from '../lib/hooks'
import { actions, useApp } from '../lib/store'
import type { Person } from '../types'

type Chip = 'all' | 'alumni' | 'interns' | 'gaming' | 'sports' | 'pm' | 'pa' | 'local' | 'early'

export default function Discover() {
  const s = useApp()
  const { people, scores } = useScored()
  const toast = useToast()
  const [chip, setChip] = useState<Chip>('all')
  const [limit, setLimit] = useState(12)
  const dismissed = useMemo(() => new Set(s.dismissed), [s.dismissed])

  const preds: Record<Chip, (p: Person) => boolean> = {
    all: () => true,
    alumni: (p) => isAlumni(p, s.profile.school),
    interns: (p) => p.internshipHistory.length > 0,
    gaming: (p) => p.industries.includes('Gaming'),
    sports: (p) => p.industries.includes('Sports') || p.roleCategory === 'Sports Analytics',
    pm: (p) => p.roleCategory === 'Product Management',
    pa: (p) => p.roleCategory === 'Product Analytics',
    local: (p) => s.profile.locations.some((l) => metroOf(l) === metroOf(p.location)),
    early: (p) => p.yearsOut <= 4,
  }

  const ranked = useMemo(
    () => people.filter((p) => !dismissed.has(p.id)).sort((a, b) => scores.get(b.id)!.percent - scores.get(a.id)!.percent),
    [people, scores, dismissed],
  )
  const shown = ranked.filter(preds[chip])
  const visible = shown.slice(0, limit)

  useEffect(() => { actions.markSeen(visible.map((p) => p.id)) }, [visible.map((p) => p.id).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = (c: Chip) => ranked.filter(preds[c]).length
  const chips: { value: Chip; label: string }[] = [
    { value: 'all', label: 'All matches' }, { value: 'alumni', label: 'UCSD alumni' }, { value: 'interns', label: 'Former interns' },
    { value: 'gaming', label: 'Gaming' }, { value: 'sports', label: 'Sports' }, { value: 'pm', label: 'PM' },
    { value: 'pa', label: 'Product Analytics' }, { value: 'local', label: 'Near me' }, { value: 'early', label: 'Early career' },
  ]

  return (
    <div>
      <PageHeader
        title="Your Matches"
        subtitle="These recommendations combine professional fit, shared background, career path similarity, and personal connection signals."
      />
      <div className="mb-5 rounded-xl border border-dashed border-line bg-card/60 px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <b className="text-ink">Demo data:</b> every person here is fictional. The goal is not to message as many people as possible. Save the few who feel worth a real conversation, then write to them yourself.
      </div>

      <div className="mb-5 overflow-x-auto pb-1">
        <Segmented value={chip} onChange={(c) => { setChip(c); setLimit(12) }} options={chips.map((c) => ({ ...c, count: count(c.value) }))} />
      </div>

      {visible.length === 0 ? (
        <EmptyState title={people.length === 0 ? 'No people yet' : 'No one matches this view'} body={people.length === 0 ? 'Demo data is hidden and you have not added anyone. Search the public web or import a CSV to get started.' : 'Try a broader chip, or restore people you dismissed.'} action={s.dismissed.length ? <button className="btn-ghost" onClick={actions.clearDismissed}>Restore dismissed</button> : undefined} />
      ) : (
        <div className="grid gap-4">
          {visible.map((p) => (
            <PersonCard key={p.id} person={p} result={scores.get(p.id)!} defaultOpen={false}
              onDismiss={() => { actions.dismiss(p.id); toast(`Dismissed ${p.name}`, () => actions.undismiss(p.id)) }} />
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {shown.length > limit ? <button className="btn-ghost" onClick={() => setLimit(limit + 12)}>Show more ({shown.length - limit} left)</button> : <span />}
        {s.dismissed.length > 0 && (
          <button className="btn-quiet text-xs" onClick={actions.clearDismissed}><RotateCcw size={13} />Restore {s.dismissed.length} dismissed</button>
        )}
      </div>
    </div>
  )
}
