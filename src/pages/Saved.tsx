import { Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SaveMenu } from '../components/SaveMenu'
import { Avatar, DemoTag, EmptyState, PageHeader, ScoreRing, Segmented } from '../components/ui'
import { DEFAULT_LISTS } from '../data/defaults'
import { useScored } from '../lib/hooks'
import { actions, blankOutreach, useApp } from '../lib/store'

export default function Saved() {
  const s = useApp()
  const { byId, scores } = useScored()
  const [list, setList] = useState('__all')
  const [name, setName] = useState('')

  const entries = useMemo(
    () => Object.entries(s.saved).map(([id, e]) => ({ id, e, p: byId.get(id) })).filter((x) => x.p)
      .sort((a, b) => scores.get(b.id)!.percent - scores.get(a.id)!.percent),
    [s.saved, byId, scores],
  )
  const shown = list === '__all' ? entries : entries.filter((x) => x.e.lists.includes(list))
  const options = [{ value: '__all', label: 'All saved', count: entries.length }, ...s.lists.map((l) => ({ value: l, label: l, count: entries.filter((x) => x.e.lists.includes(l)).length }))]

  return (
    <div>
      <PageHeader title="Saved" subtitle="People worth a real conversation, grouped your way." />
      <div className="mb-3 overflow-x-auto pb-1"><Segmented value={list} onChange={setList} options={options} /></div>

      <form className="mb-5 flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); actions.addList(name); setName('') }}>
        <input className="field !py-1.5 text-sm" placeholder="New custom list" value={name} onChange={(e) => setName(e.target.value)} aria-label="New list name" />
        <button className="btn-ghost !px-3" aria-label="Add list"><Plus size={15} /></button>
      </form>
      {list !== '__all' && !DEFAULT_LISTS.includes(list) && (
        <button className="btn-quiet mb-4 text-xs" onClick={() => { actions.removeList(list); setList('__all') }}><X size={13} />Delete list “{list}” (people stay saved)</button>
      )}

      {shown.length === 0 ? (
        <EmptyState title={entries.length ? 'Nothing in this list yet' : 'No one saved yet'} body="Save people from Discover or Search, then add them to lists like High Priority or Reach Out This Week." action={<Link to="/" className="btn-accent">Go to Discover</Link>} />
      ) : (
        <ul className="grid gap-3">
          {shown.map(({ id, e, p }) => {
            const o = s.outreach[id] ?? blankOutreach(id)
            return (
              <li key={id} className="card flex flex-wrap items-center gap-4 p-4">
                <Avatar name={p!.name} size={40} />
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/person/${id}`} className="font-display text-base font-semibold hover:text-accent-deep hover:underline">{p!.name}</Link>
                    {p!.isDemo && <DemoTag />}
                  </div>
                  <p className="text-sm text-ink-soft">{p!.role} at {p!.company}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {e.lists.map((l) => <span key={l} className="chip">{l}</span>)}
                    <span className="chip border-accent/30 bg-accent-soft text-accent-deep">{o.status}</span>
                  </div>
                </div>
                <ScoreRing percent={scores.get(id)!.percent} size={46} />
                <SaveMenu personId={id} size="sm" />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
