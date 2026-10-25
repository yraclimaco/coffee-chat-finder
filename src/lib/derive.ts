import { SCHOOL_ALIASES } from '../data/defaults'
import type { Person, RoleCategory, UserProfile } from '../types'

export const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

const INTEREST_SYNONYMS: Record<string, string> = {
  bjj: 'brazilian jiu-jitsu',
  'jiu-jitsu': 'brazilian jiu-jitsu',
  'jiu jitsu': 'brazilian jiu-jitsu',
  lol: 'league of legends',
  hoops: 'basketball',
  'creative web': 'creative web/product experiences',
  surfing: 'surf',
  'sports analytics': 'sports analytics',
  videogames: 'gaming',
  'video games': 'gaming',
}

export function canonInterest(s: string): string {
  const n = norm(s)
  return INTEREST_SYNONYMS[n] ?? n
}

export function canonSchool(s: string): string {
  const n = norm(s)
  for (const [canon, aliases] of Object.entries(SCHOOL_ALIASES)) {
    if (n === canon || aliases.includes(n)) return canon
  }
  return n
}

export function sameSchool(a: string, b: string): boolean {
  return canonSchool(a) === canonSchool(b)
}

export function isAlumni(person: Person, school: string): boolean {
  return person.education.some((e) => sameSchool(e.school, school))
}

const METROS: [string, RegExp][] = [
  ['San Diego', /san diego|la jolla|carlsbad|encinitas/i],
  ['Los Angeles', /los angeles|burbank|el segundo|playa vista|santa monica|culver|pasadena|long beach|irvine/i],
  ['Bay Area', /san francisco|san mateo|san bruno|oakland|san jose|palo alto|bay area/i],
  ['Seattle', /seattle|redmond|bellevue/i],
  ['New York', /new york|brooklyn/i],
  ['Remote', /remote/i],
]

export function metroOf(location: string): string {
  const hit = METROS.find(([, re]) => re.test(location))
  return hit ? hit[0] : location.split(',')[0].trim()
}

export type FocusTag = 'gaming' | 'sports' | 'pm' | 'productAnalytics' | 'creator' | 'consumer'

export function focusTags(p: Person): FocusTag[] {
  const tags: FocusTag[] = []
  const ind = p.industries.map(norm)
  if (ind.includes('gaming')) tags.push('gaming')
  if (ind.includes('sports') || p.roleCategory === 'Sports Analytics') tags.push('sports')
  if (p.roleCategory === 'Product Management') tags.push('pm')
  if (p.roleCategory === 'Product Analytics') tags.push('productAnalytics')
  if (ind.includes('creator economy')) tags.push('creator')
  if (ind.some((i) => ['consumer tech', 'consumer apps', 'e-commerce'].includes(i))) tags.push('consumer')
  return tags
}

export const ANALYTICS_CATEGORIES: RoleCategory[] = ['Data Analytics', 'Data Science', 'Business Analytics', 'Product Analytics', 'Sports Analytics']

export interface Badge {
  label: string
  tone: 'accent' | 'moss' | 'sky' | 'sand'
}

export function badgesFor(p: Person, profile: UserProfile): Badge[] {
  const out: Badge[] = []
  const ind = p.industries.map(norm)
  const interests = p.interests.map(canonInterest)
  if (isAlumni(p, profile.school)) out.push({ label: 'UCSD Alum', tone: 'accent' })
  if (p.internshipHistory.length) out.push({ label: 'Former Intern', tone: 'moss' })
  if (p.roleCategory === 'Product Analytics') out.push({ label: 'Product Analytics', tone: 'sky' })
  if (p.roleCategory === 'Product Management') out.push({ label: 'PM', tone: 'sky' })
  if (ind.includes('gaming')) out.push({ label: 'Gaming', tone: 'sand' })
  if (ind.includes('sports') || p.roleCategory === 'Sports Analytics') out.push({ label: 'Sports', tone: 'sand' })
  if (interests.includes('basketball')) out.push({ label: 'Basketball', tone: 'sand' })
  if (interests.includes('brazilian jiu-jitsu')) out.push({ label: 'BJJ', tone: 'sand' })
  if (p.roleCategory === 'Data Science' || p.education.some((e) => /data science/i.test(e.field))) out.push({ label: 'Data Science', tone: 'sky' })
  if (ind.includes('creator economy')) out.push({ label: 'Creator Economy', tone: 'sand' })
  if (ind.includes('consumer tech') || ind.includes('consumer apps')) out.push({ label: 'Consumer Tech', tone: 'sand' })
  if (metroOf(p.location) === 'San Diego') out.push({ label: 'San Diego', tone: 'moss' })
  if (hasAnalyticsToProduct(p)) out.push({ label: 'Similar Career Path', tone: 'accent' })
  return out
}

export function hasAnalyticsToProduct(p: Person): boolean {
  if (p.roleCategory !== 'Product Management' && p.roleCategory !== 'Product Analytics') return false
  const earlier = [
    ...p.careerHistory.filter((j) => j.role !== p.role).map((j) => j.category ?? 'Other'),
    ...p.internshipHistory.map((i) => i.category ?? 'Other'),
  ]
  return earlier.some((c) => ANALYTICS_CATEGORIES.includes(c as RoleCategory) && c !== p.roleCategory)
}

export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export const firstName = (name: string) => name.split(' ')[0]

export function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}
