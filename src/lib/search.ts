import { COMPANIES, findCompany, targetCoversCompany } from '../data/companies'
import { EMPTY_FILTERS, INDUSTRIES, ROLE_CATEGORIES } from '../types'
import type { Person, RoleCategory, ScoreResult, SearchFilters, UserProfile } from '../types'
import { canonInterest, canonSchool, isAlumni, metroOf, norm } from './derive'
import { careerRelevance, scorePerson } from './scoring'

export type SortKey = 'best' | 'shared' | 'career' | 'internship' | 'alumni'
export const SORT_LABELS: Record<SortKey, string> = {
  best: 'Best Match',
  shared: 'Shared Connection',
  career: 'Career Relevance',
  internship: 'Recent Internship',
  alumni: 'Alumni Match',
}

const ROLE_PHRASES: [RegExp, RoleCategory][] = [
  [/product analy(?:sts?|tics)/, 'Product Analytics'],
  [/product managers?|\bpms?\b|\bapms?\b/, 'Product Management'],
  [/sports (?:analysts?|analytics)/, 'Sports Analytics'],
  [/esports (?:analysts?|analytics)/, 'Sports Analytics'],
  [/data scientists?/, 'Data Science'],
  [/data analysts?/, 'Data Analytics'],
  [/business analysts?/, 'Business Analytics'],
  [/recruiters?/, 'Recruiting'],
  [/engineers?/, 'Engineering'],
]

const INDUSTRY_PHRASES: [RegExp, string][] = [
  [/creator economy|creator platforms?|creators?/, 'Creator economy'],
  [/gaming|games?|esports/, 'Gaming'],
  [/sports?|nba/, 'Sports'],
  [/e-?commerce|retail|beauty/, 'E-commerce'],
  [/media|entertainment|streaming/, 'Media / entertainment'],
  [/consumer tech|consumer apps?/, 'Consumer tech'],
  [/fintech|banking|financial/, 'Financial services'],
]

const INTEREST_PHRASES: [RegExp, string][] = [
  [/basketball|hoops/, 'Basketball'],
  [/\bbjj\b|jiu-?jitsu/, 'Brazilian Jiu-Jitsu'],
  [/league of legends|\blol\b/, 'League of Legends'],
  [/nintendo/, 'Nintendo'],
  [/surf(?:ing)?/, 'Surf'],
  [/music/, 'Music'],
]

const LOCATION_PHRASES: [RegExp, string][] = [
  [/san diego|\bsd\b/, 'San Diego'],
  [/los angeles|\bla\b|\blosangeles\b/, 'Los Angeles'],
  [/bay area|san francisco|\bsf\b/, 'Bay Area'],
  [/new york|\bnyc\b/, 'New York'],
  [/seattle|redmond/, 'Seattle'],
  [/remote/, 'Remote'],
]

const STOP = new Set(['at', 'who', 'the', 'in', 'of', 'a', 'an', 'and', 'people', 'folks', 'grads', 'grad', 'graduates', 'became', 'become', 'studied', 'from', 'with', 'for', 'working', 'work', 'that', 'now', 'are', 'is', 'to', 'on', 'did', 'former', 'ex', 'alumni', 'alum', 'interns', 'intern', 'in', 'based', 'near'])

/** Turn "UCSD product managers at Riot" into structured filters + leftover keywords. */
export function parseQuery(q: string): { filters: SearchFilters; keywords: string[] } {
  const filters: SearchFilters = { ...EMPTY_FILTERS }
  let s = ' ' + q.toLowerCase().replace(/[“”"]/g, '') + ' '
  const take = (re: RegExp): boolean => {
    const m = s.match(re)
    if (!m) return false
    s = s.replace(re, ' ')
    return true
  }

  if (take(/\bucsd\b|\buc san diego\b|\btritons?\b/)) filters.school = 'UC San Diego'
  if (take(/\balumni\b|\balum\b/)) filters.alumniOnly = true
  const formerIntern = /\bformer\b|\bex-?\b|\binterns?\b|\binterned\b/.test(s)

  // companies (longest alias first so "xbox microsoft" beats "microsoft")
  const aliases = COMPANIES.flatMap((c) => c.aliases.filter((a) => a !== 'nba' || c.name === 'NBA').map((a) => ({ a, name: c.name }))).sort((x, y) => y.a.length - x.a.length)
  for (const { a, name } of aliases) {
    const re = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`)
    if (re.test(s)) {
      if (formerIntern && /\b(former|ex-?|interns?|interned)\b/.test(s)) filters.internship = name
      else filters.company = name
      s = s.replace(re, ' ')
      break
    }
  }
  if (formerIntern && !filters.internship) filters.formerInternOnly = true
  take(/\bformer\b|\bex-?\b|\binterns?\b|\binterned\b/g)

  if (take(/\bstudied data science\b|\bdata science (?:grads?|graduates?|majors?)\b|\bdata science degree\b/)) filters.field = 'Data Science'
  if (take(/\bstudied statistics\b|\bstatistics (?:grads?|majors?)\b/)) filters.field = 'Statistics'
  for (const [re, cat] of ROLE_PHRASES) if (!filters.role && take(re)) filters.role = cat
  if (!filters.role && /\banalysts?\b/.test(s)) {
    // "sports analysts" handled above; bare "analysts" is a keyword
  }
  for (const [re, v] of INDUSTRY_PHRASES) if (!filters.industry && take(re)) filters.industry = v
  for (const [re, v] of INTEREST_PHRASES) if (!filters.interest && take(re)) filters.interest = v
  for (const [re, v] of LOCATION_PHRASES) if (!filters.location && take(re)) filters.location = v
  if (take(/\bearly[- ]career\b|\bjunior\b/)) filters.seniority = 'Early career'
  if (take(/\bsenior\b/)) filters.seniority = 'Senior'

  const keywords = s.split(/[^a-z0-9+&/-]+/).filter((t) => t && !STOP.has(t))
  return { filters, keywords }
}

function blob(p: Person): string {
  return norm(
    [p.name, p.headline, p.role, p.roleCategory, p.company, p.location, p.industries.join(' '), p.interests.join(' '), p.skills.join(' '), p.clubs.join(' '), p.education.map((e) => `${e.school} ${e.field} ${e.degree}`).join(' '), p.internshipHistory.map((i) => `${i.company} ${i.role}`).join(' '), p.careerHistory.map((j) => `${j.company} ${j.role}`).join(' '), p.projects.map((x) => `${x.title} ${x.note} ${x.domains.join(' ')}`).join(' '), p.tags.join(' '), p.notes].join(' '),
  )
}

export function seniorityOf(p: Person): string {
  if (p.yearsOut <= 0) return 'Intern'
  if (p.yearsOut <= 4) return 'Early career'
  if (p.yearsOut <= 8) return 'Mid-level'
  if (p.yearsOut <= 12) return 'Senior'
  return 'Executive'
}

const has = (hay: string, needle: string) => !needle || norm(hay).includes(norm(needle))

export function matchesFilters(p: Person, f: SearchFilters, extraKeywords: string[] = []): boolean {
  if (f.company && !(targetCoversCompany(f.company, p.company) || has(p.company, f.company))) return false
  if (f.role && !(p.roleCategory === f.role || has(p.role, f.role))) return false
  if (f.school && !p.education.some((e) => canonSchool(e.school) === canonSchool(f.school) || has(e.school, f.school))) return false
  if (f.industry && !p.industries.some((i) => has(i, f.industry))) return false
  if (f.location && !(metroOf(p.location) === metroOf(f.location) || has(p.location, f.location))) return false
  if (f.interest && !p.interests.some((i) => canonInterest(i) === canonInterest(f.interest) || has(i, f.interest))) return false
  if (f.field && !p.education.some((e) => has(e.field, f.field))) return false
  if (f.internship) {
    const ok = p.internshipHistory.some((i) => targetCoversCompany(f.internship, i.company) || has(i.company, f.internship))
    if (!ok) return false
  }
  if (f.formerInternOnly && !p.internshipHistory.length) return false
  if (f.seniority && seniorityOf(p) !== f.seniority) return false
  const b = blob(p)
  const kws = [...(f.keyword ? f.keyword.toLowerCase().split(/\s+/) : []), ...extraKeywords]
  return kws.every((k) => b.includes(k))
}

export interface SearchHit {
  person: Person
  score: ScoreResult
  relevance: number
  alumni: boolean
}

export interface SearchOptions {
  query: string
  filters: SearchFilters
  recommended: boolean
  sort: SortKey
  dismissed?: Set<string>
}

export function mergeFilters(a: SearchFilters, b: SearchFilters): SearchFilters {
  const out = { ...a }
  for (const k of Object.keys(b) as (keyof SearchFilters)[]) {
    const v = b[k]
    if (typeof v === 'boolean') (out[k] as boolean) = (a[k] as boolean) || v
    else if (v) (out[k] as string) = (a[k] as string) || v
  }
  return out
}

export function searchPeopleLocal(people: Person[], profile: UserProfile, opts: SearchOptions): SearchHit[] {
  const parsed = opts.query.trim() ? parseQuery(opts.query) : { filters: EMPTY_FILTERS, keywords: [] as string[] }
  const filters = mergeFilters(opts.filters, parsed.filters)
  const hits: SearchHit[] = []
  for (const person of people) {
    if (opts.dismissed?.has(person.id)) continue
    if (filters.alumniOnly && !isAlumni(person, profile.school)) continue
    if (!matchesFilters(person, filters, parsed.keywords)) continue
    const score = scorePerson(person, profile)
    const b = blob(person)
    const kwHits = parsed.keywords.filter((k) => b.includes(k)).length
    const nameHit = parsed.keywords.some((k) => norm(person.name).includes(k)) ? 25 : 0
    const relevance = kwHits * 10 + nameHit + (filters.company ? 6 : 0) + (filters.role ? 6 : 0) + (filters.school ? 3 : 0) + score.percent / 10
    hits.push({ person, score, relevance, alumni: isAlumni(person, profile.school) })
  }
  const lastIntern = (p: Person) => Math.max(0, ...p.internshipHistory.map((i) => i.year))
  const sharedCount = (h: SearchHit) => h.person.mutuals.length * 3 + (h.score.factors.find((f) => f.id === 'club')!.earned > 0 ? 2 : 0) + (h.alumni ? 2 : 0) + (h.score.factors.find((f) => f.id === 'hobby')!.earned > 0 ? 1 : 0)
  const cmp: Record<SortKey, (a: SearchHit, b: SearchHit) => number> = {
    best: (a, b) => (opts.recommended || !opts.query.trim() ? b.score.percent - a.score.percent : b.relevance - a.relevance),
    shared: (a, b) => sharedCount(b) - sharedCount(a),
    career: (a, b) => careerRelevance(b.score) - careerRelevance(a.score),
    internship: (a, b) => lastIntern(b.person) - lastIntern(a.person),
    alumni: (a, b) => Number(b.alumni) - Number(a.alumni),
  }
  return hits.sort((a, b) => cmp[opts.sort](a, b) || b.score.percent - a.score.percent)
}

export function activeFilterChips(f: SearchFilters): { key: keyof SearchFilters; label: string }[] {
  const labels: Record<string, string> = { keyword: 'Keyword', company: 'Company', role: 'Role', school: 'School', industry: 'Industry', location: 'Location', interest: 'Interest', internship: 'Interned at', seniority: 'Seniority', field: 'Studied' }
  const chips: { key: keyof SearchFilters; label: string }[] = []
  for (const k of Object.keys(labels) as (keyof SearchFilters)[]) if (f[k]) chips.push({ key: k, label: `${labels[k]}: ${f[k]}` })
  if (f.alumniOnly) chips.push({ key: 'alumniOnly', label: 'UCSD alumni only' })
  if (f.formerInternOnly) chips.push({ key: 'formerInternOnly', label: 'Former interns' })
  return chips
}

export const EXAMPLE_QUERIES = [
  'UCSD product managers at Riot',
  'former Patreon PM interns',
  'sports analysts who studied data science',
  'product analysts in gaming',
  'UCSD alumni at Spotify',
  'basketball analytics people',
  'Data Science grads who became PMs',
]

export interface Suggestion {
  text: string
  kind: 'Person' | 'Company' | 'Role' | 'School' | 'Industry' | 'Interest' | 'Example'
}

export function suggest(q: string, people: Person[]): Suggestion[] {
  const n = norm(q)
  if (n.length < 2) return []
  const out: Suggestion[] = []
  const seen = new Set<string>()
  const add = (text: string, kind: Suggestion['kind']) => {
    if (!seen.has(text.toLowerCase()) && norm(text).includes(n)) { seen.add(text.toLowerCase()); out.push({ text, kind }) }
  }
  people.forEach((p) => add(p.name, 'Person'))
  COMPANIES.forEach((c) => add(c.name, 'Company'))
  ROLE_CATEGORIES.filter((r) => r !== 'Other').forEach((r) => add(r, 'Role'))
  ;['UC San Diego', ...new Set(people.flatMap((p) => p.education.map((e) => e.school)))].forEach((s) => add(s, 'School'))
  INDUSTRIES.forEach((i) => add(i, 'Industry'))
  ;[...new Set(people.flatMap((p) => p.interests))].forEach((i) => add(i, 'Interest'))
  EXAMPLE_QUERIES.forEach((e) => add(e, 'Example'))
  return out.slice(0, 8)
}

export function facetValues(people: Person[]) {
  const uniq = (xs: string[]) => [...new Set(xs)].sort()
  return {
    companies: uniq(people.map((p) => p.company)),
    schools: uniq(people.flatMap((p) => p.education.map((e) => e.school))),
    interests: uniq(people.flatMap((p) => p.interests)),
    locations: uniq(people.map((p) => metroOf(p.location))),
    internships: uniq(people.flatMap((p) => p.internshipHistory.map((i) => i.company))),
    findCompany,
  }
}
