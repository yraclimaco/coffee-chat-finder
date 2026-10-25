import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../src/data/defaults'
import { DEMO_PEOPLE } from '../src/data/demoPeople'
import { generateDraft, suggestQuestions, wordCount } from '../src/lib/outreach'
import { parseQuery, searchPeopleLocal } from '../src/lib/search'
import { scorePerson } from '../src/lib/scoring'
import { csvToPeople } from '../src/lib/providers/csv'
import { EMPTY_FILTERS } from '../src/types'

const profile = () => structuredClone(DEFAULT_PROFILE)
const byName = (n: string) => DEMO_PEOPLE.find((p) => p.name === n)!
const search = (query: string, p = profile()) => searchPeopleLocal(DEMO_PEOPLE, p, { query, filters: EMPTY_FILTERS, recommended: false, sort: 'best' }).map((h) => h.person.name)

describe('demo data', () => {
  it('has 25-40 profiles, all marked demo, no real URLs', () => {
    expect(DEMO_PEOPLE.length).toBeGreaterThanOrEqual(25)
    expect(DEMO_PEOPLE.length).toBeLessThanOrEqual(40)
    for (const p of DEMO_PEOPLE) {
      expect(p.isDemo).toBe(true)
      expect(p.linkedinUrl).toBeUndefined()
      if (p.websiteUrl) expect(p.websiteUrl.endsWith('.example')).toBe(true)
    }
  })
})

describe('scoring', () => {
  it('breakdown sums to raw and every factor is bounded by its max * multiplier', () => {
    for (const p of DEMO_PEOPLE) {
      const r = scorePerson(p, profile())
      expect(r.factors.reduce((s, f) => s + f.earned, 0)).toBeCloseTo(r.raw, 0)
      expect(r.percent).toBeGreaterThanOrEqual(0)
      expect(r.percent).toBeLessThanOrEqual(99)
    }
  })
  it('ranks a UCSD alum + former intern at a target gaming company above a distant senior exec', () => {
    const maya = scorePerson(byName('Maya Okafor'), profile())
    const sam = scorePerson(byName('Samuel Okoro'), profile())
    expect(maya.percent).toBeGreaterThan(85)
    expect(maya.percent).toBeGreaterThan(sam.percent + 20)
    expect(maya.reasons.join(' ')).toMatch(/Riot Games/)
  })
  it('preferences change the ranking', () => {
    const p = profile()
    const devon = byName('Devon Brooks')
    const base = scorePerson(devon, p).percent
    p.sliders.alumni = 0
    p.sliders.formerInterns = 0
    expect(scorePerson(devon, p).percent).toBeLessThan(base)
    const q = profile()
    q.sliders.sports = 100
    const sofia = byName('Sofia Reyes')
    expect(scorePerson(sofia, q).raw).toBeGreaterThan(scorePerson(sofia, profile()).raw)
  })
  it('weights are configurable', () => {
    const p = profile()
    const maya = byName('Maya Okafor')
    const before = scorePerson(maya, p).factors.find((f) => f.id === 'alumni')!.earned
    p.weights.alumni = 30
    expect(scorePerson(maya, p).factors.find((f) => f.id === 'alumni')!.earned).toBe(before * 2)
  })
})

describe('search', () => {
  it('parses the example queries into filters', () => {
    expect(parseQuery('UCSD product managers at Riot').filters).toMatchObject({ school: 'UC San Diego', role: 'Product Management', company: 'Riot Games' })
    expect(parseQuery('former Patreon PM interns').filters).toMatchObject({ internship: 'Patreon', role: 'Product Management' })
    expect(parseQuery('sports analysts who studied data science').filters).toMatchObject({ role: 'Sports Analytics', field: 'Data Science' })
    expect(parseQuery('product analysts in gaming').filters).toMatchObject({ role: 'Product Analytics', industry: 'Gaming' })
    expect(parseQuery('Data Science grads who became PMs').filters).toMatchObject({ field: 'Data Science', role: 'Product Management' })
  })
  it('returns sensible results for example queries', () => {
    expect(search('UCSD alumni at Spotify')).toEqual(['Theo Nakamura'])
    expect(search('UCSD product managers at Riot')).toEqual(['Kenji Sato'])
    expect(search('product analysts in gaming')).toEqual(expect.arrayContaining(['Maya Okafor', 'Ethan Park']))
    expect(search('former Patreon PM interns')).toEqual(['Jordan Ellis'])
    expect(search('basketball analytics people')).toEqual(expect.arrayContaining(['Devon Brooks', 'Sofia Reyes']))
    expect(search('sports analysts who studied data science')).toEqual(expect.arrayContaining(['Grace Liu']))
    expect(search('Data Science grads who became PMs')).toEqual(expect.arrayContaining(['Victor Hsu']))
  })
  it('finds people by name and by location', () => {
    expect(search('Maya')[0]).toBe('Maya Okafor')
    expect(search('analysts in San Diego').every((n) => ['Devon Brooks', 'Grace Liu', 'Carlos Medina', 'Mei-Ling Zhou'].includes(n))).toBe(true)
  })
  it('structured filters work and dismissed people are hidden', () => {
    const f = { ...EMPTY_FILTERS, company: 'Riot Games' }
    const hits = searchPeopleLocal(DEMO_PEOPLE, profile(), { query: '', filters: f, recommended: true, sort: 'best', dismissed: new Set(['p19']) })
    expect(hits.map((h) => h.person.name).sort()).toEqual(['Kenji Sato', 'Maya Okafor', 'Wei Zhang'])
  })
})

describe('outreach drafts', () => {
  it('stay within 50-100 words, avoid em dashes, never ask for a referral', () => {
    const tones = ['Warm', 'Curious', 'Casual', 'Straightforward'] as const
    for (const p of DEMO_PEOPLE) {
      const r = scorePerson(p, profile())
      for (const tone of tones) for (const applied of [false, true]) {
        const d = generateDraft(p, profile(), r, { tone, channel: 'LinkedIn', context: '', targetRole: 'Product analytics', applied })
        for (const t of [d.linkedin, d.email, ...d.openers]) {
          expect(t).not.toMatch(/[—–]/)
          expect(t.toLowerCase()).not.toMatch(/referral|refer me/)
        }
        for (const t of [d.linkedin, d.email]) {
          expect(wordCount(t)).toBeGreaterThanOrEqual(50)
          expect(wordCount(t)).toBeLessThanOrEqual(100)
        }
        expect(d.openers).toHaveLength(2)
      }
    }
  })
  it('gives 3 role, 2 path and 1 company question', () => {
    for (const p of DEMO_PEOPLE) {
      const q = suggestQuestions(p)
      expect([q.role.length, q.path.length, q.company.length]).toEqual([3, 2, 1])
    }
  })
})

describe('csv import', () => {
  it('parses quoted fields and skips incomplete rows', () => {
    const { people, skipped } = csvToPeople('name,role,company,location\n"Doe, Jane",Product Analyst,Spotify,"Los Angeles, CA"\n,,,\nBob,,X,Y\n')
    expect(people).toHaveLength(1)
    expect(people[0].name).toBe('Doe, Jane')
    expect(people[0].roleCategory).toBe('Product Analytics')
    expect(skipped).toBe(1)
  })
})

describe('web leads', () => {
  it('extracts name, role and company from typical titles and builds a clean query', async () => {
    const { webResultToPerson, buildWebQuery } = await import('../src/lib/providers/web')
    const p = webResultToPerson({ title: 'Jane Doe - Product Analyst at Riot Games | Team', url: 'https://example.com/team/jane', snippet: 'x' }, 'Public web search')
    expect(p).toMatchObject({ name: 'Jane Doe', role: 'Product Analyst', company: 'Riot Games', isDemo: false, sourceUrl: 'https://example.com/team/jane' })
    expect(p.tags).toContain('unverified')
    const q = buildWebQuery('', { ...EMPTY_FILTERS, role: 'Product Management', company: 'Riot Games', school: 'UC San Diego' })
    expect(q).toContain('Riot Games')
    expect(q).not.toMatch(/Yra|3\.82/)
  })
})
