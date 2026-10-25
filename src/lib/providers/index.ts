import type { Person, SearchFilters } from '../../types'
import { csvProvider } from './csv'
import { demoProvider } from './demo'
import type { PeopleProvider, ProviderContext } from './types'
import { liveProviders, tavilyProvider } from './web'

export const PROVIDERS: PeopleProvider[] = [demoProvider, csvProvider, tavilyProvider, ...liveProviders]

export async function searchProviders(ids: string[], query: string, filters: SearchFilters, ctx: ProviderContext): Promise<{ people: Person[]; errors: string[] }> {
  const people = new Map<string, Person>()
  const errors: string[] = []
  await Promise.all(
    ids.map(async (id) => {
      const p = PROVIDERS.find((x) => x.id === id)
      if (!p) return
      try {
        const res = await p.searchPeople(query, filters, ctx)
        res.people.forEach((x) => people.set(x.id, x))
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }),
  )
  return { people: [...people.values()], errors }
}

export type { PeopleProvider } from './types'
