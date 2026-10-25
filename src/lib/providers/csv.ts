import type { Person, RoleCategory } from '../../types'
import { inferCategory } from '../../data/demoPeople'
import { searchPeopleLocal } from '../search'
import type { PeopleProvider } from './types'

/** Minimal RFC4180-ish parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((x) => x.trim())) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x.trim())) rows.push(row)
  return rows
}

export const CSV_TEMPLATE = 'name,role,company,location,school,field,grad_year,industries,interests,skills,website_url,source_url,notes\n"Alex Example","Product Analyst","Spotify","Los Angeles, CA","UC San Diego","Data Science",2022,"Consumer tech;Media / entertainment","Music;Basketball","SQL;Python","","","Met at a campus panel"\n'

/** Convert a user-provided CSV (people you found through legitimate means) into Person records. */
export function csvToPeople(text: string): { people: Person[]; skipped: number } {
  const rows = parseCsv(text)
  if (rows.length < 2) return { people: [], skipped: 0 }
  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const col = (r: string[], k: string) => (r[head.indexOf(k)] ?? '').trim()
  const list = (s: string) => s.split(/[;|]/).map((x) => x.trim()).filter(Boolean)
  const people: Person[] = []
  let skipped = 0
  rows.slice(1).forEach((r, i) => {
    const name = col(r, 'name')
    const role = col(r, 'role')
    const company = col(r, 'company')
    if (!name || !role || !company) { skipped++; return }
    const gradYear = Number(col(r, 'grad_year')) || 0
    const yearsOut = gradYear ? Math.max(0, new Date().getFullYear() - gradYear) : 3
    const cat: RoleCategory = inferCategory(role)
    people.push({
      id: `csv-${Date.now().toString(36)}-${i}`,
      name, role, company,
      headline: `${role} at ${company}`,
      roleCategory: cat,
      location: col(r, 'location') || 'Unknown',
      yearsOut,
      education: col(r, 'school') ? [{ school: col(r, 'school'), degree: '', field: col(r, 'field'), gradYear }] : [],
      careerHistory: [{ company, role, start: new Date().getFullYear(), end: 'Present', category: cat }],
      priorCompanies: [], internshipHistory: [],
      industries: list(col(r, 'industries')), interests: list(col(r, 'interests')), skills: list(col(r, 'skills')),
      clubs: [], projects: [], mutuals: [], recentlyJoined: false,
      contactPathway: col(r, 'website_url') || col(r, 'source_url') ? 'public-site' : 'none',
      websiteUrl: col(r, 'website_url') || undefined,
      source: 'CSV import (you provided this)',
      sourceUrl: col(r, 'source_url') || undefined,
      tags: [], notes: col(r, 'notes'), isDemo: false,
    })
  })
  return { people, skipped }
}

export const csvProvider: PeopleProvider = {
  id: 'csv',
  label: 'CSV import',
  kind: 'local',
  description: 'People you add yourself from a CSV, for example from an alumni directory page you saved or a club roster you have access to.',
  requiresApproval: false,
  isConfigured: () => true,
  async searchPeople(query, filters, ctx) {
    const hits = searchPeopleLocal(ctx.localPeople.filter((p) => p.id.startsWith('csv-')), ctx.profile, { query, filters, recommended: true, sort: 'best' })
    return { people: hits.map((h) => h.person) }
  },
}
