import { ExternalLink, Globe } from 'lucide-react'
import { useState } from 'react'
import { inferCategory } from '../data/demoPeople'
import { tavilyProvider } from '../lib/providers/web'
import { actions } from '../lib/store'
import type { Person, SearchFilters } from '../types'
import { useToast } from './Toast'

/** Live public-web search. Results are unverified leads: you check the source, fix the fields, then add. */
export function WebLeads({ query, filters }: { query: string; filters: SearchFilters }) {
  const toast = useToast()
  const [leads, setLeads] = useState<Person[] | null>(null)
  const [sent, setSent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true); setError('')
    try {
      const res = await tavilyProvider.searchPeople(query, filters, { profile: undefined as never, localPeople: [] })
      setLeads(res.people)
      setSent(res.note ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.')
    } finally {
      setBusy(false)
    }
  }

  const patch = (id: string, p: Partial<Person>) => setLeads((ls) => ls?.map((l) => (l.id === id ? { ...l, ...p } : l)) ?? null)
  const add = (l: Person) => {
    const cat = inferCategory(l.role || l.headline)
    actions.importPeople([{
      ...l, roleCategory: cat, headline: `${l.role || 'Role unknown'} at ${l.company || 'company unknown'}`,
      careerHistory: l.role && l.company ? [{ company: l.company, role: l.role, start: new Date().getFullYear(), end: 'Present', category: cat }] : [],
    }])
    setLeads((ls) => ls?.filter((x) => x.id !== l.id) ?? null)
    toast(`Added ${l.name}. Find them in Discover or Search.`)
  }

  return (
    <div className="card mt-8 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-1.5 text-base font-semibold"><Globe size={16} />Find real people on the public web</h2>
          <p className="mt-1 text-xs text-ink-soft">Searches public pages like team pages, speaker bios, and personal sites. LinkedIn and contact-lookup sites are excluded. Only your search words are sent, not your profile.</p>
        </div>
        <button className="btn-accent" disabled={busy || (!query.trim() && !Object.values(filters).some(Boolean))} onClick={run}>{busy ? 'Searching…' : 'Search the web'}</button>
      </div>
      {error && <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-deep">{error}</p>}
      {leads && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-ink-faint">Sent to search: “{sent}”. These are unverified leads. Open the source, confirm who they are, correct the fields, then add.</p>
          {leads.length === 0 && <p className="text-sm text-ink-soft">No results. Try fewer words.</p>}
          {leads.map((l) => (
            <div key={l.id} className="rounded-xl border border-line bg-paper p-3.5">
              <div className="grid gap-2 sm:grid-cols-4">
                <input className="field !py-1.5 text-sm" placeholder="Name (required)" value={l.name} onChange={(e) => patch(l.id, { name: e.target.value })} aria-label="Name" />
                <input className="field !py-1.5 text-sm" placeholder="Role" value={l.role} onChange={(e) => patch(l.id, { role: e.target.value })} aria-label="Role" />
                <input className="field !py-1.5 text-sm" placeholder="Company" value={l.company} onChange={(e) => patch(l.id, { company: e.target.value })} aria-label="Company" />
                <input className="field !py-1.5 text-sm" placeholder="Location" value={l.location} onChange={(e) => patch(l.id, { location: e.target.value })} aria-label="Location" />
              </div>
              <p className="mt-2 line-clamp-3 text-xs text-ink-soft">{l.notes}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[60%] items-center gap-1 truncate text-xs text-sky hover:underline">{new URL(l.sourceUrl!).hostname}<ExternalLink size={11} /></a>
                <div className="flex gap-2">
                  <button className="btn-quiet !py-1 text-xs" onClick={() => setLeads((ls) => ls?.filter((x) => x.id !== l.id) ?? null)}>Skip</button>
                  <button className="btn-primary !py-1 text-xs" disabled={!l.name.trim()} onClick={() => add(l)}>Add to my people</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
