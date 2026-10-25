import type { Outreach, Person } from '../types'
import type { AppState } from './store'

const WEEK = 7 * 24 * 3600 * 1000

export interface Analytics {
  discoveredThisWeek: number
  saved: number
  contacted: number
  responded: number
  chatsScheduled: number
  chatsCompleted: number
  responseRate: number | null
  topCompanies: [string, number][]
  topRoles: [string, number][]
  conversationsPerSaved: number | null
}

export function computeAnalytics(s: AppState, people: Person[]): Analytics {
  const byId = new Map(people.map((p) => [p.id, p]))
  const now = Date.now()
  const discoveredThisWeek = Object.values(s.seen).filter((t) => now - new Date(t).getTime() <= WEEK).length
  const savedIds = Object.keys(s.saved)
  const out = Object.values(s.outreach).filter((o) => s.saved[o.personId])
  const contacted = out.filter((o) => o.contactedAt || o.dateContacted).length
  const responded = out.filter((o: Outreach) => o.respondedAt || o.response.trim()).length
  const chatsCompleted = out.filter((o) => o.status === 'Coffee Chat Completed').length
  const chatsScheduled = out.filter((o) => o.status === 'Coffee Chat Scheduled').length
  const tally = (f: (p: Person) => string) => {
    const m = new Map<string, number>()
    savedIds.forEach((id) => { const p = byId.get(id); if (p) m.set(f(p), (m.get(f(p)) ?? 0) + 1) })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }
  return {
    discoveredThisWeek,
    saved: savedIds.length,
    contacted,
    responded,
    chatsScheduled,
    chatsCompleted,
    responseRate: contacted ? Math.round((100 * responded) / contacted) : null,
    topCompanies: tally((p) => p.company),
    topRoles: tally((p) => p.roleCategory),
    conversationsPerSaved: savedIds.length ? Math.round((100 * (chatsCompleted + chatsScheduled)) / savedIds.length) : null,
  }
}
