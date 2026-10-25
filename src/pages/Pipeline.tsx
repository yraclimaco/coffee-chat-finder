import { ChevronDown, CornerDownRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, EmptyState, Field, PageHeader, Segmented } from '../components/ui'
import { useScored } from '../lib/hooks'
import { actions, blankOutreach, isFollowUpDue, nextStatus, today, useApp } from '../lib/store'
import { CHANNELS, PIPELINE_STATUSES } from '../types'
import type { Channel, Outreach, PipelineStatus } from '../types'

export default function Pipeline() {
  const s = useApp()
  const { byId } = useScored()
  const [filter, setFilter] = useState<'all' | 'due' | PipelineStatus>('all')
  const [open, setOpen] = useState<string | null>(null)

  const rows = Object.keys(s.saved).map((id) => ({ id, p: byId.get(id), o: s.outreach[id] ?? blankOutreach(id) })).filter((r) => r.p)
  const due = rows.filter((r) => isFollowUpDue(r.o))
  const shown = (filter === 'all' ? rows : filter === 'due' ? due : rows.filter((r) => r.o.status === filter))
    .sort((a, b) => PIPELINE_STATUSES.indexOf(b.o.status) - PIPELINE_STATUSES.indexOf(a.o.status) || b.o.updatedAt.localeCompare(a.o.updatedAt))

  const counts = (st: PipelineStatus) => rows.filter((r) => r.o.status === st).length
  const options = [
    { value: 'all' as const, label: 'Everyone', count: rows.length },
    ...(due.length ? [{ value: 'due' as const, label: 'Needs follow-up', count: due.length }] : []),
    ...PIPELINE_STATUSES.filter((st) => counts(st) > 0).map((st) => ({ value: st, label: st, count: counts(st) })),
  ]

  const set = (id: string, patch: Partial<Outreach>) => actions.updateOutreach(id, patch)

  return (
    <div>
      <PageHeader title="Outreach pipeline" subtitle="A light tracker for people you decided to reach out to. Messages are sent by you, never from here." />
      {rows.length === 0 ? (
        <EmptyState title="Nothing in your pipeline" body="Save someone from Discover or Search and they will appear here as Not Contacted." action={<Link to="/" className="btn-accent">Find people</Link>} />
      ) : (
        <>
          {due.length > 0 && filter !== 'due' && (
            <button onClick={() => setFilter('due')} className="mb-4 w-full rounded-xl border border-accent/30 bg-accent-soft px-4 py-2.5 text-left text-sm text-accent-deep">
              <b>{due.length}</b> {due.length === 1 ? 'follow-up is' : 'follow-ups are'} due: {due.map((d) => d.p!.name).join(', ')}
            </button>
          )}
          <div className="mb-5 overflow-x-auto pb-1"><Segmented value={filter} onChange={setFilter} options={options} /></div>
          <ul className="grid gap-3">
            {shown.map(({ id, p, o }) => {
              const isOpen = open === id
              const next = nextStatus(o.status)
              return (
                <li key={id} className="card animate-rise">
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <Avatar name={p!.name} size={38} />
                    <div className="min-w-0 flex-1 basis-48">
                      <Link to={`/person/${id}`} className="font-display text-base font-semibold hover:text-accent-deep hover:underline">{p!.name}</Link>
                      <p className="text-xs text-ink-soft">{p!.role} at {p!.company}</p>
                      {o.nextAction && <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft"><CornerDownRight size={12} />{o.nextAction}</p>}
                      {isFollowUpDue(o) && <p className="mt-1 text-xs font-medium text-accent-deep">Follow-up {o.followUpDate ? `due ${o.followUpDate}` : 'due'}</p>}
                    </div>
                    <select aria-label={`Status for ${p!.name}`} value={o.status} onChange={(e) => set(id, { status: e.target.value as PipelineStatus })} className="field !w-auto !py-1.5 text-sm">
                      {PIPELINE_STATUSES.map((st) => <option key={st}>{st}</option>)}
                    </select>
                    {next && <button className="btn-ghost !py-1.5 text-xs" onClick={() => set(id, { status: next })}>Mark {next}</button>}
                    <button aria-expanded={isOpen} aria-label="Toggle details" onClick={() => setOpen(isOpen ? null : id)} className="btn-quiet !px-2"><ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
                  </div>
                  {isOpen && (
                    <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
                      <Field label="Channel"><select className="field" value={o.channel} onChange={(e) => set(id, { channel: e.target.value as Channel })}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
                      <Field label="Date contacted"><input type="date" className="field" value={o.dateContacted} max={today()} onChange={(e) => set(id, { dateContacted: e.target.value })} /></Field>
                      <Field label="Follow-up date"><input type="date" className="field" value={o.followUpDate} onChange={(e) => set(id, { followUpDate: e.target.value })} /></Field>
                      <Field label="Coffee chat date"><input type="date" className="field" value={o.chatDate} onChange={(e) => set(id, { chatDate: e.target.value })} /></Field>
                      <div className="sm:col-span-2"><Field label="Next action"><input className="field" value={o.nextAction} onChange={(e) => set(id, { nextAction: e.target.value })} placeholder="e.g. Send thank-you note" /></Field></div>
                      <Field label="Message I sent"><textarea className="field min-h-[6rem]" value={o.message} onChange={(e) => set(id, { message: e.target.value })} placeholder="Paste what you actually sent" /></Field>
                      <Field label="Response"><textarea className="field min-h-[6rem]" value={o.response} onChange={(e) => set(id, { response: e.target.value })} /></Field>
                      <div className="sm:col-span-2"><Field label="Notes"><textarea className="field min-h-[4.5rem]" value={o.notes} onChange={(e) => set(id, { notes: e.target.value })} /></Field></div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {shown.length === 0 && <p className="mt-6 text-center text-sm text-ink-soft">No one at this stage.</p>}
        </>
      )}
    </div>
  )
}
