import type { Person, SearchFilters, UserProfile } from '../../types'

export interface ProviderContext {
  profile: UserProfile
  /** People already known locally (demo + imports). Local providers search these. */
  localPeople: Person[]
}

export interface ProviderResult {
  people: Person[]
  /** Shown to the user, e.g. "3 results from public web search". */
  note?: string
}

/**
 * A source of candidate people. Local providers answer synchronously from data on this machine.
 * Live providers (web search APIs, crawlers) must be explicitly enabled and approved by the user,
 * must only touch public pages or approved APIs, and must never read behind a login or from LinkedIn.
 */
export interface PeopleProvider {
  id: string
  label: string
  kind: 'local' | 'live'
  description: string
  /** Live providers need credentials and explicit user approval before any request is made. */
  requiresApproval: boolean
  isConfigured(): boolean
  searchPeople(query: string, filters: SearchFilters, ctx: ProviderContext): Promise<ProviderResult>
}

export class ProviderNotConfiguredError extends Error {
  constructor(public providerId: string, message: string) {
    super(message)
    this.name = 'ProviderNotConfiguredError'
  }
}
