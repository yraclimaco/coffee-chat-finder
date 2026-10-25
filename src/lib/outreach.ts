import { findCompany } from '../data/companies'
import type { Person, ScoreResult, UserProfile } from '../types'
import { canonInterest, firstName, hasAnalyticsToProduct, isAlumni, listJoin, norm } from './derive'

export interface Hook {
  reason: string
  /** Shown on the person page. */
  hook: string
  /** First-person sentence for a draft. Only states things that are true of the user's profile. */
  line: string
}

/** Best reason to reach out and best personalization hook, derived from real overlap only. */
export function bestHooks(p: Person, u: UserProfile, r: ScoreResult): Hook {
  const f = (id: string) => r.factors.find((x) => x.id === id)!
  const mine = new Set(u.hobbies.map(canonInterest))
  const shared = p.interests.map(canonInterest).filter((i) => mine.has(i))
  const sharedPretty = shared.map((s) => (s === 'brazilian jiu-jitsu' ? 'BJJ' : s))
  const proj = p.projects[0]
  const internship = p.internshipHistory[0]

  let reason: string
  if (hasAnalyticsToProduct(p)) reason = `${firstName(p.name)} made a move you are considering: from analytics into ${p.roleCategory === 'Product Management' ? 'product management' : 'product analytics'}.`
  else if (f('internMatch').earned > 0 && internship) reason = `${firstName(p.name)} interned at ${internship.company} and can explain how that experience translated into a role.`
  else if (f('companyMatch').earned >= f('companyMatch').max * 0.9) reason = `${firstName(p.name)} works at ${p.company}, a company on your list, in a role close to what you want.`
  else if (isAlumni(p, u.school)) reason = `${firstName(p.name)} is a ${u.school} alum, so the starting point is the same.`
  else reason = `${firstName(p.name)}'s ${p.roleCategory.toLowerCase()} work overlaps with what you want to learn.`

  let hook: string
  let line: string
  const sharedProject = f('projectDomain').earned > 0 && proj
  if (shared.includes('league of legends') && p.industries.includes('Gaming')) {
    hook = `Both into League of Legends. Your 9,236-match snowball analysis connects directly to ${p.company}.`
    line = 'I analyzed 9,236 pro League of Legends matches for a project, so your work is close to what I enjoy.'
  } else if (sharedProject && proj.domains.some((d) => ['nba', 'basketball', 'sports'].includes(norm(d)))) {
    hook = `Your NBA shot make probability model lines up with ${proj.title.toLowerCase()}.`
    line = 'I built an NBA shot make probability model, so this area really interests me.'
  } else if (sharedProject && proj.domains.some((d) => ['youtube', 'creator'].includes(norm(d)))) {
    hook = `TubeScope, your YouTube virality project, is close to their work on ${proj.title.toLowerCase()}.`
    line = 'I built a project on YouTube virality, so creator analytics is something I care about.'
  } else if (f('club').earned > 0) {
    const club = p.clubs.find((c) => u.clubs.map(norm).includes(norm(c))) ?? 'the same club'
    hook = `Both part of ${club}.`
    line = `We both spent time in ${club}.`
  } else if (isAlumni(p, u.school)) {
    const e = p.education.find((x) => x.school === u.school)
    hook = `Fellow UCSD alum${e ? ` (${e.field}, ${e.gradYear})` : ''}.`
    line = "I'm a Triton too, so seeing your path from UCSD is really encouraging."
  } else if (shared.length) {
    hook = `Shared interest: ${listJoin(sharedPretty.slice(0, 2))}.`
    line = `I noticed we both like ${sharedPretty[0].toLowerCase() === 'bjj' ? 'BJJ' : sharedPretty[0]}, though mostly I'd love to hear about your work.`
  } else {
    hook = `Their path through ${p.priorCompanies[0] ?? p.company} to ${p.company}.`
    line = `Your path ${p.priorCompanies[0] ? `from ${p.priorCompanies[0]} ` : ''}to ${p.company} is the kind I'm trying to understand.`
  }
  return { reason, hook, line }
}

const ROLE_QUESTIONS: Record<string, string[]> = {
  'Product Analytics': [
    'What does a typical week look like, and how much of it is analysis versus influencing roadmap decisions?',
    'Which metrics does your team argue about most, and how do you decide which one wins?',
    'What separates a product analyst who gets pulled into decisions from one who just answers requests?',
  ],
  'Product Management': [
    'How do you decide what not to build, and who pushes back on you?',
    'How much do you rely on data versus qualitative research when a roadmap call is unclear?',
    'What would you tell a student who has done stakeholder interviews but not shipped a product?',
  ],
  'Data Analytics': [
    'What does a project look like from the first ask to the final recommendation?',
    'Which tools and habits matter more than people expect on the job?',
    'How do you decide when an analysis is good enough to share?',
  ],
  'Business Analytics': [
    'How do you turn a vague business question into something you can measure?',
    'How do you work with stakeholders who want a particular answer?',
    'What skills would you build earlier if you were a student again?',
  ],
  'Data Science': [
    'How much of your time is modeling versus defining the problem and measuring impact?',
    'How does experimentation work on your team, and where does it get messy?',
    'What do hiring managers actually look for in an intern project?',
  ],
  'Sports Analytics': [
    'How do analysts and coaches or decision makers actually work together day to day?',
    'What makes an analysis get used instead of ignored?',
    'What would you want to see in a student sports analytics project?',
  ],
  Recruiting: [
    'What makes an intern application stand out beyond the resume?',
    'How early should students start reaching out?',
    'What do students most often get wrong in the process?',
  ],
}
const GENERIC_ROLE_QUESTIONS = ROLE_QUESTIONS['Data Analytics']

export function suggestQuestions(p: Person): { role: string[]; path: string[]; company: string[] } {
  const role = (ROLE_QUESTIONS[p.roleCategory] ?? GENERIC_ROLE_QUESTIONS).slice(0, 3)
  const path: string[] = []
  const prev = p.careerHistory.find((j) => j.company !== p.company)
  if (hasAnalyticsToProduct(p)) {
    path.push('What pushed you to move toward product, and what did you wish you had built earlier?')
    path.push('Which skills from your analytics work carried over, and which did you have to learn from scratch?')
  } else if (p.internshipHistory.length) {
    const i = p.internshipHistory[0]
    path.push(`How did your ${i.company} internship shape what you went after next?`)
    path.push('Looking back, what did you do as a student that mattered most for landing your first role?')
  } else {
    path.push(`What led you from ${prev ? prev.company : 'school'} to ${p.company}?`)
    path.push('What would you do differently in your first two years?')
  }
  const co = findCompany(p.company)
  const hook = co?.hooks[0]
  const company = [hook ? `I'd love to understand ${hook}. What is that like from your seat?` : `What is the culture like at ${p.company}, and what kinds of people tend to do well there?`]
  return { role, path, company }
}

export type Tone = 'Warm' | 'Curious' | 'Casual' | 'Straightforward'
export type DraftChannel = 'LinkedIn' | 'Email'

export interface DraftInput {
  tone: Tone
  channel: DraftChannel
  context: string
  targetRole: string
  applied: boolean
}

const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const clean = (s: string) => s.replace(/[\u2014\u2013]/g, ',').replace(/\s+,/g, ',').replace(/[ \t]{2,}/g, ' ').trim()

/** "Associate Product Analyst II, Streaming" -> "associate product analyst". */
export function roleShort(role: string): string {
  return role.split(',')[0].replace(/\s+(?:I{1,3}|IV|V)$/, '').toLowerCase()
}

const LEAD: Record<Tone, (role: string, co: string) => string> = {
  Warm: (r, c) => `Your role as a ${r} at ${c} stood out to me.`,
  Curious: (r, c) => `I'm curious how you ended up as a ${r} at ${c}.`,
  Casual: (r, c) => `Saw you're a ${r} at ${c} and wanted to say hi.`,
  Straightforward: (r, c) => `Your work as a ${r} at ${c} is close to what I want to learn more about.`,
}
const ASK: Record<Tone, string> = {
  Warm: 'Would you be open to a quick 15 to 20 minute chat sometime in the next few weeks? No pressure at all if your schedule is packed.',
  Curious: 'If you have 15 or 20 minutes in the next few weeks, I would really value hearing how you think about it. Totally fine if now is not a good time.',
  Casual: 'Any chance you would be up for a 15 to 20 minute coffee chat, virtual or in person? Totally okay if not.',
  Straightforward: 'Would you be open to a 15 to 20 minute call in the next few weeks? I will keep it short and come with specific questions.',
}
const THANKS: Record<Tone, string> = { Warm: 'Thanks so much,', Curious: 'Thank you for your time,', Casual: 'Thanks either way,', Straightforward: 'Thank you,' }

function intro(u: UserProfile, input: DraftInput): string {
  const role = (input.targetRole || 'product analytics').toLowerCase()
  const field = u.degree.replace(/^B\.?[SA]\.?\s*/i, '').toLowerCase()
  return `I'm ${firstName(u.name)}, a ${field} student at ${u.school}${u.gradYear ? ` (class of ${u.gradYear})` : ''}, exploring ${role} roles for next summer.`
}

function appliedLine(p: Person, role: string): string {
  return `I did apply to ${p.company}${role ? ` for ${role.toLowerCase()}` : ''}, but I'm reaching out to learn from your experience, not to ask about my application.`
}

/** Pack optional sentences into a 50-100 word message. Greeting and sign-off count toward the total. */
function compose(first: string, sign: string, sentences: { text: string; optional?: boolean }[], max: number): string {
  const render = (xs: typeof sentences) => clean(`Hi ${first},\n\n${xs.map((x) => x.text).join(' ')}\n\n${sign}`)
  let kept = sentences.filter((x) => x.text)
  for (const x of [...kept]) {
    if (wc(render(kept)) <= max) break
    if (x.optional) kept = kept.filter((k) => k !== x)
  }
  if (wc(render(kept)) < 50) {
    const pad = { text: "I'm still figuring out what kind of work fits me best, so hearing it from someone doing it would help a lot." }
    kept = [...kept.slice(0, -1), pad, kept[kept.length - 1]]
  }
  return render(kept)
}

export interface Draft {
  linkedin: string
  email: string
  subject: string
  openers: string[]
}

export function generateDraft(p: Person, u: UserProfile, r: ScoreResult, input: DraftInput): Draft {
  const hook = bestHooks(p, u, r)
  const first = firstName(p.name)
  const role = roleShort(p.role)
  const ctx = input.context.trim().replace(/[.!]+$/, '')
  const sentences = [
    { text: intro(u, input) },
    { text: ctx ? `${ctx.replace(/^./, (c) => c.toUpperCase())}. ${LEAD[input.tone](role, p.company)}` : LEAD[input.tone](role, p.company) },
    { text: hook.line, optional: true },
    { text: input.applied ? appliedLine(p, input.targetRole) : '' },
    { text: ASK[input.tone] },
  ]
  const sign = `${THANKS[input.tone]}\n${firstName(u.name)}`
  const linkedin = compose(first, firstName(u.name), sentences, 85)
  const email = compose(first, sign, sentences, 100)
  const subject = input.tone === 'Casual' ? 'Quick question from a UCSD student' : `UCSD student, curious about your path at ${p.company}`
  const openers = [
    clean(`Hi ${first}, I'm a UCSD data science student. ${hook.line} I'd love to hear how you ended up as a ${role} at ${p.company}.`),
    clean(`Hi ${first}, I'm ${firstName(u.name)} from UCSD. ${p.roleCategory === 'Recruiting' ? 'I have a specific question about the intern process' : `I'd love to hear what ${p.roleCategory.toLowerCase()} work at ${p.company} is really like`}, if you ever have a spare 15 minutes.`),
  ]
  return { linkedin, email, subject, openers }
}

export function wordCount(t: string): number {
  return wc(t)
}
export { wc }
