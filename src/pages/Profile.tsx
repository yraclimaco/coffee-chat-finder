import { Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { ProfileForm } from '../components/ProfileForm'
import { useToast } from '../components/Toast'
import { PageHeader, Section } from '../components/ui'
import { FACTOR_DEFAULTS } from '../data/defaults'
import { PROVIDERS } from '../lib/providers'
import { CSV_TEMPLATE, csvToPeople } from '../lib/providers/csv'
import { FACTOR_META, FACTOR_ORDER } from '../lib/scoring'
import { actions, useApp } from '../lib/store'
import type { SliderId } from '../types'

const SLIDERS: { id: SliderId; label: string; hint: string }[] = [
  { id: 'alumni', label: 'Prioritize alumni', hint: 'Boost people from your school' },
  { id: 'formerInterns', label: 'Prioritize former interns', hint: 'People who interned at targets' },
  { id: 'gaming', label: 'Prioritize gaming', hint: 'Gaming industry focus' },
  { id: 'sports', label: 'Prioritize sports', hint: 'Sports industry and analytics' },
  { id: 'pm', label: 'Prioritize PM', hint: 'Product management roles' },
  { id: 'productAnalytics', label: 'Prioritize product analytics', hint: 'Product analyst roles' },
  { id: 'sameSchool', label: 'Prioritize same school or major', hint: 'Similar academic background' },
  { id: 'earlyCareer', label: 'Prioritize early-career people', hint: '1 to 7 years out beats executives' },
]

export default function Profile() {
  const s = useApp()
  const toast = useToast()
  const file = useRef<HTMLInputElement>(null)
  const [csv, setCsv] = useState('')
  const p = s.profile

  const importCsv = (text: string) => {
    const { people, skipped } = csvToPeople(text)
    if (!people.length) { toast('No valid rows found. Needs name, role and company columns.'); return }
    actions.importPeople(people)
    setCsv('')
    toast(`Imported ${people.length} ${people.length === 1 ? 'person' : 'people'}${skipped ? `, skipped ${skipped}` : ''}`)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'people-template.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile and preferences" subtitle="Everything here feeds your scores. Changes apply instantly in Discover and Search." />

      <Section title="About you"><ProfileForm profile={p} onChange={actions.updateProfile} /></Section>

      <Section title="What should rank higher?" aside={<button className="btn-quiet text-xs" onClick={actions.resetProfileWeights}><RotateCcw size={13} />Reset</button>}>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {SLIDERS.map(({ id, label, hint }) => (
            <div key={id}>
              <div className="flex items-baseline justify-between text-sm"><label htmlFor={`sl-${id}`} className="font-medium">{label}</label><span className="text-xs tabular-nums text-ink-faint">{p.sliders[id] === 50 ? 'Neutral' : p.sliders[id] < 50 ? `Down ${50 - p.sliders[id]}` : `Up ${p.sliders[id] - 50}`}</span></div>
              <input id={`sl-${id}`} type="range" min={0} max={100} step={5} value={p.sliders[id]} onChange={(e) => actions.updateProfile({ sliders: { ...p.sliders, [id]: Number(e.target.value) } })} className="mt-2 w-full accent-[#c2562f]" />
              <p className="text-xs text-ink-faint">{hint}</p>
            </div>
          ))}
        </div>
        <details className="mt-6 rounded-xl border border-line p-4">
          <summary className="cursor-pointer text-sm font-medium">Advanced: point value for each scoring factor</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FACTOR_ORDER.map((id) => (
              <label key={id} className="flex items-center justify-between gap-3 text-sm">
                <span><span className="text-ink-faint">{FACTOR_META[id].group.split(' ')[0]} · </span>{FACTOR_META[id].label}</span>
                <input type="number" min={0} max={40} value={p.weights[id]} onChange={(e) => actions.updateProfile({ weights: { ...p.weights, [id]: Math.max(0, Number(e.target.value) || 0) } })} className="field !w-20 !py-1 text-right" aria-label={`${FACTOR_META[id].label} points (default ${FACTOR_DEFAULTS[id]})`} />
              </label>
            ))}
          </div>
        </details>
      </Section>

      <Section title="Data sources">
        <ul className="divide-y divide-line">
          {PROVIDERS.map((pr) => (
            <li key={pr.id} className="flex items-start justify-between gap-4 py-3">
              <div><p className="text-sm font-medium">{pr.label}</p><p className="mt-0.5 text-xs text-ink-soft">{pr.description}</p></div>
              <span className={`chip shrink-0 ${pr.isConfigured() ? 'border-moss/30 bg-moss-soft text-moss' : ''}`}>{pr.isConfigured() ? 'Active' : 'Not connected'}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl bg-paper p-4">
          <h3 className="text-sm font-semibold">Import people from CSV</h3>
          <p className="mt-1 text-xs text-ink-soft">Only add people from sources you are allowed to use, such as a public team page or a club roster. Required columns: name, role, company. No LinkedIn scraping, no guessed emails.</p>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="Paste CSV text here" className="field mt-3 min-h-[6rem] font-mono text-xs" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary text-xs" disabled={!csv.trim()} onClick={() => importCsv(csv)}>Import pasted CSV</button>
            <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) importCsv(await f.text()); e.target.value = '' }} />
            <button className="btn-ghost text-xs" onClick={() => file.current?.click()}><Upload size={13} />Choose file</button>
            <button className="btn-quiet text-xs" onClick={download}><Download size={13} />Template</button>
            {s.imported.length > 0 && <button className="btn-quiet text-xs" onClick={() => { actions.removeImported(); toast('Removed imported people') }}>Remove {s.imported.length} imported</button>}
          </div>
        </div>
      </Section>

      <Section title="Reset">
        <p className="mb-3 text-sm text-ink-soft">Clears saved people, pipeline, searches and preferences stored in this browser.</p>
        <button className="btn-ghost text-sm" onClick={() => { if (window.confirm('Reset everything stored in this browser?')) actions.resetAll() }}>Reset all local data</button>
      </Section>
    </div>
  )
}
