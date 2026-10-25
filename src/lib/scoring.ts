import { COMPANIES, findCompany, targetCoversCompany } from '../data/companies'
import { FACTOR_DEFAULTS } from '../data/defaults'
import type { FactorGroup, FactorId, FactorResult, Person, RoleCategory, ScoreResult, SliderId, UserProfile } from '../types'
import { ANALYTICS_CATEGORIES, canonInterest, focusTags, hasAnalyticsToProduct, isAlumni, listJoin, metroOf, norm } from './derive'

/**
 * Explainable fit scoring.
 *
 * Each factor yields a fraction in [0, 1] plus a human-readable detail.
 * earned = fraction * weight * sliderMultiplier, where weight comes from the profile
 * (defaults in FACTOR_DEFAULTS) and the multiplier maps a 0..100 preference slider to 0..2
 * (50 is neutral). Percent = (raw / sum of weights) ^ 0.85, capped at 99.
 */

export const FACTOR_META: Record<FactorId, { group: FactorGroup; label: string; slider?: SliderId }> = {
  roleMatch: { group: 'Professional alignment', label: 'Target role match' },
  companyMatch: { group: 'Professional alignment', label: 'Target company' },
  internMatch: { group: 'Professional alignment', label: 'Relevant internship history', slider: 'formerInterns' },
  academic: { group: 'Professional alignment', label: 'Similar academic background', slider: 'sameSchool' },
  careerPath: { group: 'Professional alignment', label: 'Similar early-career path', slider: 'earlyCareer' },
  productDataOverlap: { group: 'Professional alignment', label: 'Product and data skill overlap' },
  focusFit: { group: 'Professional alignment', label: 'Focus areas you prioritize' },
  alumni: { group: 'Connection strength', label: 'Alumni overlap', slider: 'alumni' },
  club: { group: 'Connection strength', label: 'Shared club or org' },
  geography: { group: 'Connection strength', label: 'Geography' },
  hobby: { group: 'Connection strength', label: 'Shared interests' },
  projectDomain: { group: 'Connection strength', label: 'Project and domain overlap' },
  mutuals: { group: 'Connection strength', label: 'Shared connections' },
  hiring: { group: 'Timing relevance', label: 'Hiring Summer 2027 interns' },
  roleOpen: { group: 'Timing relevance', label: 'Role currently open' },
  recent: { group: 'Timing relevance', label: 'Recently joined or interned' },
  earlyCareer: { group: 'Accessibility', label: 'Early-career', slider: 'earlyCareer' },
  contact: { group: 'Accessibility', label: 'Public contact pathway' },
}

export const FACTOR_ORDER = Object.keys(FACTOR_META) as FactorId[]

export function sliderMultiplier(value: number): number {
  return Math.max(0, Math.min(200, value)) / 50
}

const RELATED: Partial<Record<RoleCategory, Partial<Record<RoleCategory, number>>>> = {
  'Product Analytics': { 'Product Management': 0.6, 'Data Analytics': 0.7, 'Data Science': 0.65, 'Business Analytics': 0.6, 'Sports Analytics': 0.55 },
  'Product Management': { 'Product Analytics': 0.6, 'Data Analytics': 0.3, 'Data Science': 0.3, 'Business Analytics': 0.35 },
  'Data Analytics': { 'Business Analytics': 0.8, 'Product Analytics': 0.7, 'Data Science': 0.7, 'Sports Analytics': 0.7 },
  'Business Analytics': { 'Data Analytics': 0.8, 'Product Analytics': 0.6, 'Data Science': 0.55, 'Sports Analytics': 0.6 },
  'Data Science': { 'Data Analytics': 0.7, 'Product Analytics': 0.7, 'Business Analytics': 0.55, 'Sports Analytics': 0.7 },
}

function roleSimilarity(cat: RoleCategory, targets: RoleCategory[]): { f: number; via?: RoleCategory } {
  let best = 0
  let via: RoleCategory | undefined
  for (const t of targets) {
    const f = cat === t ? 1 : (RELATED[t]?.[cat] ?? (cat === 'Sports Analytics' ? 0 : 0))
    if (f > best) { best = f; via = t }
  }
  return { f: best, via }
}

function fieldSimilarity(field: string, profile: UserProfile): number {
  const f = norm(field)
  const mine = norm(`${profile.degree} ${profile.minor}`)
  const tokens = f.split(/[^a-z]+/).filter((t) => t.length > 3 && !['and', 'applied'].includes(t))
  if (/data science/.test(f) && /data science/.test(mine)) return 1
  if (/business analytics/.test(f) && /business analytics/.test(mine)) return 0.9
  if (tokens.length && tokens.every((t) => mine.includes(t))) return 1
  if (/statistic/.test(f)) return 0.8
  if (/math/.test(f)) return 0.7
  if (/computer science|informatics/.test(f)) return 0.6
  if (/management science|operations|econom/.test(f)) return 0.5
  if (/cognitive|business/.test(f)) return 0.4
  return 0
}

interface Partial_ {
  f: number
  detail: string | null
}
type FactorFn = (p: Person, u: UserProfile) => Partial_
const NONE: Partial_ = { f: 0, detail: null }

const FACTORS: Record<FactorId, FactorFn> = {
  roleMatch(p, u) {
    const { f, via } = roleSimilarity(p.roleCategory, u.targetRoles)
    if (f === 0) return NONE
    return { f, detail: f === 1 ? `${p.roleCategory} role, one of your target roles` : `${p.roleCategory} is adjacent to your ${via} goal` }
  },
  companyMatch(p, u) {
    if (u.targetCompanies.some((t) => targetCoversCompany(t, p.company))) return { f: 1, detail: `Works at ${p.company}, one of your target companies` }
    const prior = p.priorCompanies.find((c) => u.targetCompanies.some((t) => targetCoversCompany(t, c)))
    if (prior) return { f: 0.5, detail: `Previously at ${prior}, a company on your list` }
    const co = findCompany(p.company)
    const inds = new Set([...(co?.industries ?? []), ...p.industries].map(norm))
    const hit = u.industries.filter((i) => inds.has(norm(i)))
    if (hit.length) return { f: 0.25, detail: `Works in ${hit[0].toLowerCase()}, an industry you target` }
    return NONE
  },
  internMatch(p, u) {
    let best: Partial_ = NONE
    for (const i of p.internshipHistory) {
      const companyHit = u.targetCompanies.some((t) => targetCoversCompany(t, i.company))
      const roleF = roleSimilarity(i.category ?? 'Other', u.targetRoles).f
      const roleHit = roleF >= 0.7
      const co = findCompany(i.company)
      const indHit = (co?.industries ?? []).some((x) => u.industries.map(norm).includes(norm(x)))
      let f = 0
      if (companyHit && roleHit) f = 1
      else if (companyHit) f = 0.7
      else if (roleHit) f = 0.6
      else if (indHit) f = 0.35
      if (f > best.f) best = { f, detail: `Former ${i.role} at ${i.company} (${i.year})` }
    }
    return best
  },
  academic(p, u) {
    let best = 0
    let field = ''
    for (const e of p.education) {
      const f = fieldSimilarity(e.field, u)
      if (f > best) { best = f; field = e.field }
    }
    if (best === 0) return NONE
    return { f: best, detail: best >= 0.9 ? `Studied ${field}, like you` : `Studied ${field}, close to your data science and business analytics focus` }
  },
  careerPath(p, u) {
    if (hasAnalyticsToProduct(p)) {
      return { f: 1, detail: p.roleCategory === 'Product Management' ? 'Moved from analytics into product management' : 'Analytics to product analytics career path' }
    }
    if (p.internshipHistory.some((i) => norm(i.company) === norm(p.company)) && p.yearsOut <= 7) {
      return { f: 0.8, detail: `Intern-to-full-time at ${p.company}` }
    }
    if (u.targetRoles.includes(p.roleCategory) && p.yearsOut <= 7) return { f: 0.4, detail: 'Early in a role you are targeting' }
    return NONE
  },
  productDataOverlap(p, u) {
    const mine = new Set(u.skills.map(norm))
    const shared = p.skills.filter((s) => mine.has(norm(s)))
    if (!shared.length) return NONE
    return { f: Math.min(1, shared.length / 4), detail: `Skill overlap: ${listJoin(shared.slice(0, 4))}` }
  },
  focusFit(p, u) {
    const tags = focusTags(p)
    const ind = new Set(u.industries.map(norm))
    const mult: Record<string, number | undefined> = {
      gaming: ind.has('gaming') ? sliderMultiplier(u.sliders.gaming) : undefined,
      sports: ind.has('sports') ? sliderMultiplier(u.sliders.sports) : undefined,
      pm: u.targetRoles.includes('Product Management') ? sliderMultiplier(u.sliders.pm) : undefined,
      productAnalytics: u.targetRoles.includes('Product Analytics') ? sliderMultiplier(u.sliders.productAnalytics) : undefined,
      creator: ind.has('creator economy') ? 1 : undefined,
      consumer: ind.has('consumer tech') || ind.has('consumer apps') || ind.has('e-commerce') ? 1 : undefined,
    }
    const hits = tags.filter((t) => mult[t] !== undefined)
    if (!hits.length) return NONE
    const best = Math.max(...hits.map((t) => mult[t] as number))
    const f = Math.min(1, 0.5 * best + 0.2 * (hits.length - 1))
    const names: Record<string, string> = { gaming: 'Gaming', sports: 'Sports', pm: 'PM', productAnalytics: 'Product analytics', creator: 'Creator economy', consumer: 'Consumer' }
    return { f, detail: `${listJoin(hits.map((h) => names[h]))} focus` }
  },
  alumni(p, u) {
    if (isAlumni(p, u.school)) return { f: 1, detail: `${u.school} alum${p.education.find((e) => e.school === u.school) ? ` (${p.education.find((e) => e.school === u.school)!.field}, ${p.education.find((e) => e.school === u.school)!.gradYear})` : ''}` }
    const extra = p.education.find((e) => u.extraSchools.some((s) => norm(s) === norm(e.school)))
    if (extra) return { f: 0.6, detail: `Attended ${extra.school}, a school you follow` }
    return NONE
  },
  club(p, u) {
    const mine = new Set(u.clubs.map(norm))
    const hit = p.clubs.find((c) => mine.has(norm(c)))
    return hit ? { f: 1, detail: `Also part of ${hit}` } : NONE
  },
  geography(p, u) {
    const metro = metroOf(p.location)
    if (u.locations.some((l) => metroOf(l) === metro)) return { f: 1, detail: `Based in ${metro}` }
    if (metro === 'Remote' && u.remoteOk) return { f: 0.6, detail: 'Remote, which you are open to' }
    if (u.openToRelocate) return { f: 0.2, detail: null }
    return NONE
  },
  hobby(p, u) {
    const mine = new Set(u.hobbies.map(canonInterest))
    const shared = [...new Set(p.interests.map(canonInterest))].filter((i) => mine.has(i))
    if (!shared.length) return NONE
    const pretty = shared.map((s) => (s === 'brazilian jiu-jitsu' ? 'BJJ' : s.replace(/^./, (c) => c.toUpperCase())))
    return { f: Math.min(1, shared.length / 2), detail: `Shared interests: ${listJoin(pretty.slice(0, 3))}` }
  },
  projectDomain(p, u) {
    const mine = u.projects.map((pr) => ({ title: pr.title, d: new Set(pr.domains.map(norm)) }))
    const theirs = new Set([...p.projects.flatMap((x) => x.domains), ...p.industries].map(norm))
    let best: { title: string; shared: string[] } | null = null
    const union = new Set<string>()
    for (const m of mine) {
      const shared = [...m.d].filter((x) => theirs.has(x))
      shared.forEach((s) => union.add(s))
      if (shared.length && (!best || shared.length > best.shared.length)) best = { title: m.title, shared }
    }
    if (!best) return NONE
    return { f: Math.min(1, union.size / 2), detail: `Overlaps with your ${best.title} project (${best.shared.slice(0, 3).join(', ')})` }
  },
  mutuals(p) {
    if (!p.mutuals.length) return NONE
    return { f: p.mutuals.length >= 2 ? 1 : 0.6, detail: `${p.mutuals.length} shared connection${p.mutuals.length > 1 ? 's' : ''} (demo)` }
  },
  hiring(p) {
    const co = findCompany(p.company)
    return co?.hiringSummer2027 ? { f: 1, detail: `${co.name} is flagged as hiring Summer 2027 interns (demo signal)` } : NONE
  },
  roleOpen(p, u) {
    const co = findCompany(p.company)
    if (!co) return NONE
    if (co.openRoles.includes(p.roleCategory)) return { f: 1, detail: `${p.roleCategory} roles are open at ${co.name} (demo signal)` }
    if (co.openRoles.some((r) => u.targetRoles.includes(r))) return { f: 0.6, detail: `${co.name} has roles open that match your targets (demo signal)` }
    return NONE
  },
  recent(p) {
    const start = p.careerHistory.find((j) => j.end === 'Present')?.start ?? 0
    if (p.recentlyJoined || start >= new Date().getFullYear() - 1) return { f: 1, detail: 'Recently joined, so the intern process is fresh' }
    return NONE
  },
  earlyCareer(p) {
    const y = p.yearsOut
    const f = y <= 0 ? 0.8 : y <= 7 ? 1 : y <= 8 ? 0.5 : y <= 10 ? 0.3 : 0
    if (!f) return NONE
    return { f, detail: `${y} year${y === 1 ? '' : 's'} out of college, close enough to remember the recruiting grind` }
  },
  contact(p) {
    const f = p.contactPathway === 'public-site' || p.contactPathway === 'alumni-directory' ? 1 : p.contactPathway === 'professional-network' ? 0.5 : 0
    if (!f) return NONE
    const how = { 'public-site': 'a public site or team page', 'alumni-directory': 'the alumni directory', 'professional-network': 'a professional network' }[p.contactPathway as string]
    return { f, detail: `Reachable through ${how}` }
  },
}

export function totalMax(profile: UserProfile): number {
  return FACTOR_ORDER.reduce((s, id) => s + (profile.weights[id] ?? FACTOR_DEFAULTS[id]), 0)
}

export function scorePerson(p: Person, u: UserProfile): ScoreResult {
  const factors: FactorResult[] = FACTOR_ORDER.map((id) => {
    const meta = FACTOR_META[id]
    const weight = u.weights[id] ?? FACTOR_DEFAULTS[id]
    const { f, detail } = FACTORS[id](p, u)
    const mult = meta.slider ? sliderMultiplier(u.sliders[meta.slider]) : 1
    const earned = Math.round(f * weight * mult * 10) / 10
    return { id, group: meta.group, label: meta.label, max: weight, earned, detail: f > 0 ? detail : null }
  })
  const raw = factors.reduce((s, f) => s + f.earned, 0)
  const max = totalMax(u)
  const percent = Math.min(99, Math.round(100 * Math.pow(Math.max(0, raw) / max, 0.85)))
  const reasons = [...factors]
    .filter((f) => f.detail && f.earned >= f.max * 0.3 && !['earlyCareer', 'contact', 'geography'].includes(f.id) || (f.detail && ['geography'].includes(f.id) && f.earned >= f.max))
    .sort((a, b) => b.earned - a.earned)
    .map((f) => f.detail as string)
    .slice(0, 5)
  return { percent, raw: Math.round(raw * 10) / 10, max, factors, reasons }
}

export function groupFactors(result: ScoreResult): { group: FactorGroup; earned: number; max: number; factors: FactorResult[] }[] {
  const groups: FactorGroup[] = ['Professional alignment', 'Connection strength', 'Timing relevance', 'Accessibility']
  return groups.map((group) => {
    const factors = result.factors.filter((f) => f.group === group)
    return { group, earned: factors.reduce((s, f) => s + f.earned, 0), max: factors.reduce((s, f) => s + f.max, 0), factors }
  })
}

export function careerRelevance(result: ScoreResult): number {
  return result.factors.filter((f) => ['roleMatch', 'companyMatch', 'internMatch', 'careerPath', 'productDataOverlap', 'focusFit'].includes(f.id)).reduce((s, f) => s + f.earned, 0)
}

export { COMPANIES, ANALYTICS_CATEGORIES }

export type Coffee = { level: 'High' | 'Good' | 'Worth a look'; text: string }

/** One-line "why a 15 minute chat with this person is worth it". */
export function coffeeChatValue(p: Person, r: ScoreResult): Coffee {
  const level = r.percent >= 75 ? 'High' : r.percent >= 55 ? 'Good' : 'Worth a look'
  const byId = (id: FactorId) => r.factors.find((f) => f.id === id)!
  let text: string
  if (hasAnalyticsToProduct(p)) text = `Can speak to moving from analytics into ${p.roleCategory === 'Product Management' ? 'product management' : 'product analytics'} at ${p.company}.`
  else if (byId('internMatch').earned > 0 && p.yearsOut <= 4) text = `Recent enough to explain how the ${p.internshipHistory[0].company} intern process actually worked.`
  else if (p.roleCategory === 'Sports Analytics') text = 'Can show what sports analytics work looks like day to day and how people break in.'
  else if (p.roleCategory === 'Recruiting') text = 'Useful only for specific process questions. Lead with a real question, not a pitch.'
  else if (p.yearsOut >= 10) text = 'Broad perspective, but likely time-constrained. Save for a specific question.'
  else text = `Can describe day-to-day ${p.roleCategory.toLowerCase()} work at ${p.company}.`
  return { level, text }
}
