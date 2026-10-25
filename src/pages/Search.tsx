import { Bookmark, Clock, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { PersonCard } from '../components/PersonCard'
import { WebLeads } from '../components/WebLeads'
import { useToast } from '../components/Toast'
import { EmptyState, Field, PageHeader, Toggle } from '../components/ui'
import { useScored } from '../lib/hooks'
import { EXAMPLE_QUERIES, SORT_LABELS, activeFilterChips, facetValues, mergeFilters, parseQuery, searchPeopleLocal, suggest } from '../lib/search'
import type { SortKey } from '../lib/search'
import { actions, useApp } from '../lib/store'
import { EMPTY_FILTERS, INDUSTRIES, ROLE_CATEGORIES } from '../types'
import type { SearchFilters } from '../types'

export default function SearchPage() {
  const s = useApp()
  const { people, scores } = useScored()
  const toast = useToast()
  const loc = useLocation()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const [filters, setFilters] = useState<SearchFilters>(() => (loc.state as { filters?: SearchFilters } | null)?.filters ?? EMPTY_FILTERS)
  const [recommended, setRecommended] = useState(true)
  const [sort, setSort] = useState<SortKey>('best')
  const [showAdv, setShowAdv] = useState(false)
  const [focus, setFocus] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const facets = useMemo(() => facetValues(people), [people])

  useEffect(() => { setDraft(q) }, [q])
  useEffect(() => {
    const st = loc.state as { filters?: SearchFilters } | null
    if (st?.filters) setFilters(st.filters)
  }, [loc.state])

  const parsed = useMemo(() => parseQuery(draft), [draft])
  const effective = useMemo(() => mergeFilters(filters, parsed.filters), [filters, parsed])
  const hits = useMemo(
    () => searchPeopleLocal(people, s.profile, { query: draft, filters, recommended, sort, dismissed: new Set(s.dismissed) }),
    [people, s.profile, draft, filters, recommended, sort, s.dismissed],
  )
  const suggestions = useMemo(() => suggest(draft, people), [draft, people])
  const chips = activeFilterChips(effective)
  const hasQuery = draft.trim() !== '' || chips.length > 0

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setFocus(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const submit = (text: string) => {
    setDraft(text)
    setParams(text ? { q: text } : {})
    actions.recordSearch(text)
    setFocus(false)
  }

  const removeChip = (key: keyof SearchFilters) => {
    const merged = { ...effective, [key]: typeof effective[key] === 'boolean' ? false : '' }
    setFilters(merged)
    const rest = parseQuery(draft).keywords.join(' ')
    setDraft(rest)
    setParams(rest ? { q: rest } : {})
  }

  const setF = (patch: Partial<SearchFilters>) => setFilters({ ...effective, ...patch })
  const clearAll = () => { setFilters(EMPTY_FILTERS); setDraft(''); setParams({}) }

  const showDropdown = focus && (suggestions.length > 0 || (!draft && (s.recentSearches.length > 0 || s.savedSearches.length > 0)))

  return (
    <div>
      <PageHeader title="Search" subtitle="Search by person, company, role, school, industry, hobby, or just describe who you want to meet." />

      <div ref={boxRef} className="relative">
        <form onSubmit={(e) => { e.preventDefault(); submit(draft) }} role="search">
          <input
            aria-label="Search people" autoComplete="off" value={draft} placeholder="Try “UCSD product managers at Riot”"
            onChange={(e) => { setDraft(e.target.value); setFocus(true) }} onFocus={() => setFocus(true)}
            className="field !rounded-2xl !py-3.5 !pl-4 text-base shadow-soft"
          />
        </form>
        {showDropdown && (
          <div className="absolute inset-x-0 z-30 mt-2 max-h-96 animate-rise overflow-auto rounded-2xl border border-line bg-card p-2 shadow-lift">
            {suggestions.map((sg) => (
              <button key={sg.kind + sg.text} onClick={() => submit(sg.text)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-sand">
                {sg.text}<span className="text-xs text-ink-faint">{sg.kind}</span>
              </button>
            ))}
            {!draft && s.savedSearches.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-medium text-ink-faint">Saved searches</p>
                {s.savedSearches.map((sv) => (
                  <button key={sv.id} onClick={() => { setFilters(sv.filters); submit(sv.query) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-sand"><Bookmark size={13} className="text-accent" />{sv.name}</button>
                ))}
              </>
            )}
            {!draft && s.recentSearches.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 pb-1 pt-2 text-xs font-medium text-ink-faint">Recent<button onClick={actions.clearRecent} className="hover:text-ink">Clear</button></div>
                {s.recentSearches.map((r) => (
                  <button key={r} onClick={() => submit(r)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-sand"><Clock size={13} className="text-ink-faint" />{r}</button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {!hasQuery && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
          Try:
          {EXAMPLE_QUERIES.map((e) => <button key={e} onClick={() => submit(e)} className="chip hover:bg-sand">{e}</button>)}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Toggle checked={recommended} onChange={setRecommended} label="Recommended for Me" />
        <button onClick={() => setShowAdv(!showAdv)} aria-expanded={showAdv} className="btn-ghost !py-1.5 text-xs"><SlidersHorizontal size={14} />Filters{chips.length > 0 && ` (${chips.length})`}</button>
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field !w-auto !py-1.5 text-xs">
            {Object.entries(SORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        {hasQuery && (
          <>
            <button className="btn-quiet !py-1.5 text-xs" onClick={() => {
              const name = window.prompt('Name this search', draft || chips[0]?.label || 'My search')
              if (name) { actions.saveSearch(name, draft, effective); toast(`Saved search “${name}”`) }
            }}><Bookmark size={14} />Save search</button>
            <button className="btn-quiet !py-1.5 text-xs" onClick={clearAll}><X size={14} />Clear</button>
          </>
        )}
      </div>

      {showAdv && (
        <div className="card mt-4 animate-rise p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Keyword"><input className="field" value={effective.keyword} onChange={(e) => setF({ keyword: e.target.value })} placeholder="e.g. experimentation" /></Field>
            <Field label="Company"><input className="field" list="f-company" value={effective.company} onChange={(e) => setF({ company: e.target.value })} placeholder="e.g. Riot Games" /></Field>
            <Field label="Role">
              <select className="field" value={effective.role} onChange={(e) => setF({ role: e.target.value })}><option value="">Any</option>{ROLE_CATEGORIES.filter((r) => r !== 'Other').map((r) => <option key={r}>{r}</option>)}</select>
            </Field>
            <Field label="School"><input className="field" list="f-school" value={effective.school} onChange={(e) => setF({ school: e.target.value })} placeholder="e.g. UC San Diego" /></Field>
            <Field label="Studied (major)"><input className="field" value={effective.field} onChange={(e) => setF({ field: e.target.value })} placeholder="e.g. Data Science" /></Field>
            <Field label="Industry">
              <select className="field" value={effective.industry} onChange={(e) => setF({ industry: e.target.value })}><option value="">Any</option>{INDUSTRIES.map((r) => <option key={r}>{r}</option>)}</select>
            </Field>
            <Field label="Location"><input className="field" list="f-loc" value={effective.location} onChange={(e) => setF({ location: e.target.value })} placeholder="e.g. Los Angeles" /></Field>
            <Field label="Hobby / interest"><input className="field" list="f-int" value={effective.interest} onChange={(e) => setF({ interest: e.target.value })} placeholder="e.g. Basketball" /></Field>
            <Field label="Interned at"><input className="field" list="f-company" value={effective.internship} onChange={(e) => setF({ internship: e.target.value })} placeholder="e.g. Patreon" /></Field>
            <Field label="Seniority">
              <select className="field" value={effective.seniority} onChange={(e) => setF({ seniority: e.target.value })}><option value="">Any</option>{['Intern', 'Early career', 'Mid-level', 'Senior', 'Executive'].map((r) => <option key={r}>{r}</option>)}</select>
            </Field>
            <div className="flex flex-col justify-end gap-2.5 pb-1.5">
              <Toggle checked={effective.alumniOnly} onChange={(v) => setF({ alumniOnly: v })} label="UCSD alumni only" />
              <Toggle checked={effective.formerInternOnly} onChange={(v) => setF({ formerInternOnly: v })} label="Former interns only" />
            </div>
          </div>
          <datalist id="f-company">{facets.companies.map((c) => <option key={c} value={c} />)}</datalist>
          <datalist id="f-school">{facets.schools.map((c) => <option key={c} value={c} />)}</datalist>
          <datalist id="f-loc">{facets.locations.map((c) => <option key={c} value={c} />)}</datalist>
          <datalist id="f-int">{facets.interests.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
      )}

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1.5 text-xs font-medium text-accent-deep">
              {c.label}
              <button aria-label={`Remove ${c.label}`} onClick={() => removeChip(c.key)} className="grid h-4 w-4 place-items-center rounded-full hover:bg-accent/20"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="mb-3 mt-6 flex items-baseline justify-between">
        <p className="text-sm text-ink-soft" aria-live="polite"><b className="text-ink">{hits.length}</b> {hits.length === 1 ? 'person' : 'people'}{recommended ? ', ranked by your fit' : ''}{s.dismissed.length > 0 && <span className="text-ink-faint"> · {s.dismissed.length} dismissed hidden <button className="underline hover:text-ink" onClick={actions.clearDismissed}>restore</button></span>}</p>
      </div>

      {hits.length === 0 ? (
        <EmptyState title="No one matched" body="Loosen a filter or try different words. Searching “gaming” or “alumni” alone casts a wider net." action={<button className="btn-ghost" onClick={clearAll}>Clear search</button>} />
      ) : (
        <div className="grid gap-4">
          {hits.map((h) => (
            <PersonCard key={h.person.id} person={h.person} result={scores.get(h.person.id)!} />
          ))}
        </div>
      )}

      <WebLeads query={draft} filters={effective} />
      {s.savedSearches.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.savedSearches.map((sv) => (
            <span key={sv.id} className="chip">
              <button onClick={() => { setFilters(sv.filters); submit(sv.query) }}>{sv.name}</button>
              <button aria-label={`Delete saved search ${sv.name}`} onClick={() => actions.deleteSavedSearch(sv.id)} className="text-ink-faint hover:text-ink"><Trash2 size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
