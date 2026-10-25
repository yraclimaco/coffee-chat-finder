import { DEMO_PEOPLE } from '../../data/demoPeople'
import { searchPeopleLocal } from '../search'
import type { PeopleProvider } from './types'

export const demoProvider: PeopleProvider = {
  id: 'demo',
  label: 'Demo data',
  kind: 'local',
  description: `${DEMO_PEOPLE.length} fictional profiles bundled with the app. Clearly marked DEMO DATA.`,
  requiresApproval: false,
  isConfigured: () => true,
  async searchPeople(query, filters, ctx) {
    const demoIds = new Set(DEMO_PEOPLE.map((p) => p.id))
    const hits = searchPeopleLocal(ctx.localPeople.filter((p) => demoIds.has(p.id)), ctx.profile, { query, filters, recommended: true, sort: 'best' })
    return { people: hits.map((h) => h.person) }
  },
}
