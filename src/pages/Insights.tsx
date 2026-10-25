import { Link } from 'react-router-dom'
import { PageHeader, Section } from '../components/ui'
import { computeAnalytics } from '../lib/analytics'
import { useScored } from '../lib/hooks'
import { useApp } from '../lib/store'

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

function Bars({ rows }: { rows: [string, number][] }) {
  if (!rows.length) return <p className="text-sm text-ink-soft">Save a few people to see this.</p>
  const max = Math.max(...rows.map((r) => r[1]))
  return (
    <ul className="space-y-2.5">
      {rows.map(([k, v]) => (
        <li key={k}>
          <div className="mb-1 flex justify-between text-sm"><span>{k}</span><span className="tabular-nums text-ink-soft">{v}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-accent/70" style={{ width: `${(v / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}

export default function Insights() {
  const s = useApp()
  const { people } = useScored()
  const a = computeAnalytics(s, people)
  return (
    <div>
      <PageHeader title="Insights" subtitle="A quiet look at your own process. The question is whether you found someone worth talking to, not how many messages you sent." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Discovered this week" value={a.discoveredThisWeek} hint="Profiles shown in Discover" />
        <Tile label="Saved" value={a.saved} hint="People worth a conversation" />
        <Tile label="Outreaches sent" value={a.contacted} hint="Sent by you" />
        <Tile label="Responses" value={a.responded} />
        <Tile label="Coffee chats" value={a.chatsCompleted} hint={a.chatsScheduled ? `${a.chatsScheduled} scheduled` : 'Completed'} />
        <Tile label="Response rate" value={a.responseRate === null ? 'n/a' : `${a.responseRate}%`} hint={a.contacted ? `${a.responded} of ${a.contacted}` : 'Needs a first outreach'} />
        <Tile label="Saved to conversation" value={a.conversationsPerSaved === null ? 'n/a' : `${a.conversationsPerSaved}%`} hint="Chats booked or done" />
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Section title="Top companies (saved)"><Bars rows={a.topCompanies} /></Section>
        <Section title="Top role categories (saved)"><Bars rows={a.topRoles} /></Section>
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        A good week might be two or three conversations that taught you something. If your saved list is long and your chats are few, try narrowing the list in <Link to="/saved" className="text-sky hover:underline">Saved</Link>.
      </p>
    </div>
  )
}
