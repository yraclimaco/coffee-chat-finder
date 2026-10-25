import { ArrowLeft, Copy, ExternalLink, GraduationCap, Lightbulb, MapPin, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SaveMenu } from '../components/SaveMenu'
import { ScoreBreakdown } from '../components/ScoreBreakdown'
import { useToast } from '../components/Toast'
import { Avatar, Badge, DemoTag, EmptyState, Field, Section, ScoreRing } from '../components/ui'
import { badgesFor, canonInterest } from '../lib/derive'
import { useScored } from '../lib/hooks'
import { bestHooks, generateDraft, suggestQuestions, wordCount } from '../lib/outreach'
import type { Draft, Tone } from '../lib/outreach'
import { coffeeChatValue } from '../lib/scoring'
import { actions, blankOutreach, nextStatus, useApp } from '../lib/store'
import { PIPELINE_STATUSES } from '../types'
import type { PipelineStatus } from '../types'

export default function PersonPage() {
  const { id } = useParams()
  const s = useApp()
  const { byId, scores } = useScored()
  const toast = useToast()
  const person = id ? byId.get(id) : undefined
  const result = id ? scores.get(id) : undefined

  const [tone, setTone] = useState<Tone>('Warm')
  const [channel, setChannel] = useState<'LinkedIn' | 'Email'>('LinkedIn')
  const [context, setContext] = useState('')
  const [targetRole, setTargetRole] = useState<string>(s.profile.targetRoles[0] ?? '')
  const [applied, setApplied] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [edited, setEdited] = useState<{ linkedin: string; email: string } | null>(null)

  const hooks = useMemo(() => (person && result ? bestHooks(person, s.profile, result) : null), [person, result, s.profile])
  const questions = useMemo(() => (person ? suggestQuestions(person) : null), [person])
  if (!person || !result || !hooks || !questions) return <EmptyState title="Person not found" body="They may have been removed with an import." action={<Link to="/" className="btn-ghost">Back to Discover</Link>} />

  const saved = !!s.saved[person.id]
  const outreach = s.outreach[person.id] ?? blankOutreach(person.id)
  const value = coffeeChatValue(person, result)
  const mine = new Set(s.profile.hobbies.map(canonInterest))
  const sharedInterests = person.interests.filter((i) => mine.has(canonInterest(i)))
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast('Copied. Paste it where you want to send it.') } catch { toast('Copy failed. Select the text and copy it manually.') } }

  const generate = () => {
    const d = generateDraft(person, s.profile, result, { tone, channel, context, targetRole, applied })
    setDraft(d)
    setEdited({ linkedin: d.linkedin, email: d.email })
  }

  return (
    <div className="space-y-5">
      <Link to="/" onClick={(e) => { if (window.history.length > 1) { e.preventDefault(); window.history.back() } }} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={15} />Back</Link>

      {person.tags.includes('unverified') && <p className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-2.5 text-sm text-accent-deep">Found through public web search and not verified. Check the source page before reaching out.</p>}
      <header className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={person.name} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-semibold leading-tight">{person.name}</h1>
              {person.isDemo && <DemoTag />}
            </div>
            <p className="mt-0.5 text-[15px] text-ink-soft">{person.role} at <b className="text-ink">{person.company}</b></p>
            <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-ink-faint">
              <span className="inline-flex items-center gap-1"><MapPin size={12} />{person.location}</span>
              {person.education[0] && <span className="inline-flex items-center gap-1"><GraduationCap size={12} />{person.education[0].school}</span>}
              <span>Source: {person.source}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">{badgesFor(person, s.profile).map((b) => <Badge key={b.label} {...b} />)}</div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <ScoreRing percent={result.percent} size={72} />
            <SaveMenu personId={person.id} />
          </div>
        </div>
        {(person.websiteUrl || person.sourceUrl || person.githubUrl) && (
          <p className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-xs">
            {[['Website', person.websiteUrl], ['Source page', person.sourceUrl], ['GitHub', person.githubUrl]].filter(([, u]) => u).map(([l, u]) => (
              <a key={l} href={u as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky hover:underline">{l}<ExternalLink size={11} /></a>
            ))}
            {person.isDemo && <span className="text-ink-faint">(demo links are placeholders)</span>}
          </p>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card border-accent/25 bg-accent-soft/40 p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-accent-deep">Best reason to reach out</h2>
          <p className="text-[15px] leading-relaxed">{hooks.reason}</p>
        </div>
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-moss">Best personalization hook</h2>
          <p className="text-[15px] leading-relaxed">{hooks.hook}</p>
        </div>
      </div>

      <Section title="Relevance summary">
        <p className="text-[15px] leading-relaxed text-ink-soft">
          {result.reasons.length ? `${result.reasons.join('. ')}.` : 'Limited overlap with your targets.'} <b className="text-ink">Coffee chat value: {value.level}.</b> {value.text}
        </p>
        {person.notes && <p className="mt-3 rounded-xl bg-paper px-3.5 py-2.5 text-sm text-ink-soft"><Lightbulb size={14} className="mr-1.5 inline text-accent" />{person.notes}</p>}
      </Section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Section title="Career history">
          <ol className="relative space-y-4 border-l border-line pl-5">
            {[...person.careerHistory].reverse().map((j, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                <p className="text-sm font-medium">{j.role}</p>
                <p className="text-xs text-ink-soft">{j.company} · {j.start} to {j.end}</p>
              </li>
            ))}
          </ol>
          {person.internshipHistory.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Internship history</h3>
              <ul className="space-y-1.5 text-sm">{person.internshipHistory.map((i, k) => <li key={k}>{i.role} <span className="text-ink-soft">at {i.company}, {i.year}</span></li>)}</ul>
            </>
          )}
          <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Education</h3>
          <ul className="space-y-1.5 text-sm">{person.education.map((e, k) => <li key={k}>{e.degree} {e.field} <span className="text-ink-soft">at {e.school}, {e.gradYear}</span></li>)}</ul>
        </Section>

        <div className="space-y-5">
          <Section title="Shared interests and projects">
            {sharedInterests.length ? <div className="flex flex-wrap gap-1.5">{sharedInterests.map((i) => <span key={i} className="chip">{i}</span>)}</div> : <p className="text-sm text-ink-soft">No hobby overlap found. That is fine, professional fit matters more.</p>}
            {person.projects.length > 0 && (
              <ul className="mt-4 space-y-2.5">
                {person.projects.map((p) => <li key={p.title} className="text-sm"><b>{p.title}</b><br /><span className="text-ink-soft">{p.note}</span></li>)}
              </ul>
            )}
            {person.mutuals.length > 0 && <p className="mt-4 text-xs text-ink-soft"><b className="text-ink">Shared connections (demo):</b> {person.mutuals.join(', ')}</p>}
            {person.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{person.skills.map((k) => <span key={k} className="chip">{k}</span>)}</div>}
          </Section>
          <Section title={`${result.percent}% match: score breakdown`}><ScoreBreakdown result={result} /></Section>
        </div>
      </div>

      <Section title="Questions you could ask">
        <div className="grid gap-5 sm:grid-cols-3">
          {([['About the role', questions.role], ['About the path', questions.path], [`About ${person.company}`, questions.company]] as const).map(([h, qs]) => (
            <div key={h}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{h}</h3>
              <ul className="space-y-2.5 text-sm leading-relaxed">{qs.map((q) => <li key={q}>{q}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Outreach helper" aside={<span className="inline-flex items-center gap-1 text-xs text-moss"><ShieldCheck size={13} />Never sends anything</span>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tone"><select className="field" value={tone} onChange={(e) => setTone(e.target.value as Tone)}>{['Warm', 'Curious', 'Casual', 'Straightforward'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Channel"><select className="field" value={channel} onChange={(e) => setChannel(e.target.value as 'LinkedIn' | 'Email')}><option>LinkedIn</option><option>Email</option></select></Field>
          <Field label="Role I am targeting"><select className="field" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>{s.profile.targetRoles.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" checked={applied} onChange={(e) => setApplied(e.target.checked)} className="h-4 w-4 accent-[#c2562f]" />I already applied here</label></div>
        </div>
        <div className="mt-4"><Field label="Context (optional)" hint="For example: we met at a campus panel, or I saw your talk."><input className="field" value={context} onChange={(e) => setContext(e.target.value)} placeholder="How you found them" /></Field></div>
        <button className="btn-accent mt-4" onClick={generate}>Generate outreach draft</button>

        {draft && edited && (
          <div className="mt-6 animate-rise space-y-5">
            {(channel === 'LinkedIn' ? (['linkedin', 'email'] as const) : (['email', 'linkedin'] as const)).map((k) => (
              <div key={k}>
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{k === 'linkedin' ? 'Short LinkedIn version' : `Short email version`}{k === 'email' && <span className="ml-2 font-normal text-ink-soft">Subject: {draft.subject}</span>}</h3>
                  <span className="flex items-center gap-3 text-xs text-ink-faint">{wordCount(edited[k])} words<button className="btn-quiet !px-2 !py-1 text-xs" onClick={() => copy(edited[k])}><Copy size={13} />Copy</button></span>
                </div>
                <textarea className="field min-h-[9rem] leading-relaxed" value={edited[k]} onChange={(e) => setEdited({ ...edited, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <h3 className="mb-1.5 text-sm font-semibold">Two opener options</h3>
              <ul className="space-y-2">
                {draft.openers.map((o) => (
                  <li key={o} className="flex items-start justify-between gap-3 rounded-xl bg-paper p-3 text-sm"><span>{o}</span><button className="btn-quiet !px-2 !py-1 text-xs" onClick={() => copy(o)}><Copy size={13} /></button></li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-ink-faint">Edit anything that does not sound like you, then send it yourself. LinkedIn connection notes have a short character limit, so use the opener there or send the longer text as a message.</p>
            {saved && (
              <button className="btn-ghost text-sm" onClick={() => {
                actions.updateOutreach(person.id, { message: edited[channel === 'LinkedIn' ? 'linkedin' : 'email'], channel, status: outreach.status === 'Not Contacted' ? 'Ready to Contact' : outreach.status })
                toast('Draft stored in your pipeline notes. Not sent.')
              }}>Store draft in pipeline (does not send)</button>
            )}
          </div>
        )}
      </Section>

      {saved ? (
        <Section title="Pipeline" aside={<Link className="text-xs text-sky hover:underline" to="/pipeline">Open pipeline</Link>}>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Status"><select className="field" value={outreach.status} onChange={(e) => actions.updateOutreach(person.id, { status: e.target.value as PipelineStatus })}>{PIPELINE_STATUSES.map((st) => <option key={st}>{st}</option>)}</select></Field>
            {nextStatus(outreach.status) && <button className="btn-ghost" onClick={() => actions.updateOutreach(person.id, { status: nextStatus(outreach.status)! })}>Move to {nextStatus(outreach.status)}</button>}
          </div>
          <div className="mt-4"><Field label="Notes"><textarea className="field min-h-[5rem]" value={outreach.notes} onChange={(e) => actions.updateOutreach(person.id, { notes: e.target.value })} placeholder="What you want to remember" /></Field></div>
        </Section>
      ) : (
        <p className="text-center text-sm text-ink-soft">Save {person.name.split(' ')[0]} to track outreach and notes.</p>
      )}
    </div>
  )
}
