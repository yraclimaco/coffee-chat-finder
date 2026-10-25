import { useSyncExternalStore } from 'react'
import { DEFAULT_LISTS, DEFAULT_PROFILE, FACTOR_DEFAULTS, SLIDER_DEFAULTS } from '../data/defaults'
import { DEMO_PEOPLE } from '../data/demoPeople'
import { PIPELINE_STATUSES } from '../types'
import type { Outreach, Person, PipelineStatus, SavedEntry, SavedSearch, SearchFilters, UserProfile } from '../types'

const KEY = 'ccf:v1'

export interface AppState {
  profile: UserProfile
  onboarded: boolean
  saved: Record<string, SavedEntry>
  lists: string[]
  dismissed: string[]
  outreach: Record<string, Outreach>
  recentSearches: string[]
  savedSearches: SavedSearch[]
  imported: Person[]
  hideDemo: boolean
  seen: Record<string, string>
}

function initial(): AppState {
  return {
    profile: structuredClone(DEFAULT_PROFILE),
    onboarded: false,
    saved: {},
    lists: [...DEFAULT_LISTS],
    dismissed: [],
    outreach: {},
    recentSearches: [],
    savedSearches: [],
    imported: [],
    hideDemo: false,
    seen: {},
  }
}

function load(): AppState {
  const base = initial()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<AppState>
    const profile = { ...base.profile, ...parsed.profile } as UserProfile
    profile.sliders = { ...SLIDER_DEFAULTS, ...profile.sliders }
    profile.weights = { ...FACTOR_DEFAULTS, ...profile.weights }
    return { ...base, ...parsed, profile }
  } catch {
    return base
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function commit(next: AppState) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable: stay in memory */ }
  listeners.forEach((l) => l())
}

export function useApp(): AppState {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}

export const getState = () => state
export const allPeople = (s: AppState = state): Person[] => (s.hideDemo ? s.imported : [...DEMO_PEOPLE, ...s.imported])

const now = () => new Date().toISOString()
export const today = () => new Date().toISOString().slice(0, 10)

export const actions = {
  completeOnboarding(profile: UserProfile) { commit({ ...state, profile, onboarded: true }) },
  updateProfile(patch: Partial<UserProfile>) { commit({ ...state, profile: { ...state.profile, ...patch } }) },
  resetProfileWeights() { commit({ ...state, profile: { ...state.profile, sliders: { ...SLIDER_DEFAULTS }, weights: { ...FACTOR_DEFAULTS } } }) },
  resetAll() { commit({ ...initial() }) },

  save(personId: string, lists: string[] = []) {
    if (state.saved[personId]) return
    const outreach = state.outreach[personId] ?? blankOutreach(personId)
    commit({ ...state, saved: { ...state.saved, [personId]: { savedAt: now(), lists } }, outreach: { ...state.outreach, [personId]: outreach } })
  },
  unsave(personId: string) {
    const { [personId]: _gone, ...rest } = state.saved
    commit({ ...state, saved: rest })
  },
  toggleList(personId: string, list: string) {
    const e = state.saved[personId]
    if (!e) return
    const lists = e.lists.includes(list) ? e.lists.filter((l) => l !== list) : [...e.lists, list]
    commit({ ...state, saved: { ...state.saved, [personId]: { ...e, lists } } })
  },
  addList(name: string) {
    const n = name.trim()
    if (!n || state.lists.some((l) => l.toLowerCase() === n.toLowerCase())) return
    commit({ ...state, lists: [...state.lists, n] })
  },
  removeList(name: string) {
    if (DEFAULT_LISTS.includes(name)) return
    const saved = Object.fromEntries(Object.entries(state.saved).map(([id, e]) => [id, { ...e, lists: e.lists.filter((l) => l !== name) }]))
    commit({ ...state, lists: state.lists.filter((l) => l !== name), saved })
  },
  dismiss(personId: string) { if (!state.dismissed.includes(personId)) commit({ ...state, dismissed: [...state.dismissed, personId] }) },
  undismiss(personId: string) { commit({ ...state, dismissed: state.dismissed.filter((d) => d !== personId) }) },
  clearDismissed() { commit({ ...state, dismissed: [] }) },

  markSeen(ids: string[]) {
    const fresh = ids.filter((id) => !state.seen[id])
    if (!fresh.length) return
    const seen = { ...state.seen }
    fresh.forEach((id) => (seen[id] = now()))
    commit({ ...state, seen })
  },

  recordSearch(q: string) {
    const t = q.trim()
    if (!t) return
    commit({ ...state, recentSearches: [t, ...state.recentSearches.filter((x) => x !== t)].slice(0, 8) })
  },
  clearRecent() { commit({ ...state, recentSearches: [] }) },
  saveSearch(name: string, query: string, filters: SearchFilters) {
    commit({ ...state, savedSearches: [{ id: `s-${Date.now()}`, name, query, filters }, ...state.savedSearches] })
  },
  deleteSavedSearch(id: string) { commit({ ...state, savedSearches: state.savedSearches.filter((s) => s.id !== id) }) },

  importPeople(people: Person[]) { commit({ ...state, imported: [...state.imported, ...people] }) },
  setHideDemo(v: boolean) { commit({ ...state, hideDemo: v }) },
  removeImported() { commit({ ...state, imported: [] }) },

  updateOutreach(personId: string, patch: Partial<Outreach>) {
    const prev = state.outreach[personId] ?? blankOutreach(personId)
    const next: Outreach = { ...prev, ...patch, updatedAt: now() }
    if (patch.status && patch.status !== prev.status) applyStatusSideEffects(prev, next)
    commit({ ...state, outreach: { ...state.outreach, [personId]: next } })
  },
}

const CONTACTED_AFTER: PipelineStatus[] = ['Contacted', 'Follow-Up Due', 'Responded', 'Coffee Chat Scheduled', 'Coffee Chat Completed', 'Stay in Touch', 'Referral Discussion']
const RESPONDED_AFTER: PipelineStatus[] = ['Responded', 'Coffee Chat Scheduled', 'Coffee Chat Completed', 'Referral Discussion']

const AUTO_NEXT: Partial<Record<PipelineStatus, string>> = {
  'Ready to Contact': 'Review your draft and send it yourself',
  Contacted: 'Follow up if no reply',
  Responded: 'Suggest a couple of times to chat',
  'Coffee Chat Scheduled': 'Prepare your questions',
  'Coffee Chat Completed': 'Send a thank-you note',
  'Stay in Touch': 'Check in again in a few months',
}

function applyStatusSideEffects(prev: Outreach, next: Outreach) {
  const auto = Object.values(AUTO_NEXT)
  if (!prev.nextAction || auto.includes(prev.nextAction)) next.nextAction = AUTO_NEXT[next.status] ?? ''
  if (CONTACTED_AFTER.includes(next.status) && !next.contactedAt) {
    next.contactedAt = now()
    if (!next.dateContacted) next.dateContacted = today()
  }
  if (RESPONDED_AFTER.includes(next.status) && !next.respondedAt) next.respondedAt = now()
  if (next.status === 'Contacted' && !next.followUpDate) {
    const d = new Date(); d.setDate(d.getDate() + 7)
    next.followUpDate = d.toISOString().slice(0, 10)
  }
}

export function blankOutreach(personId: string): Outreach {
  return { personId, status: 'Not Contacted', channel: 'LinkedIn', dateContacted: '', message: '', response: '', followUpDate: '', chatDate: '', notes: '', nextAction: '', updatedAt: now() }
}

export function nextStatus(s: PipelineStatus): PipelineStatus | null {
  const flow: PipelineStatus[] = ['Not Contacted', 'Ready to Contact', 'Contacted', 'Responded', 'Coffee Chat Scheduled', 'Coffee Chat Completed', 'Stay in Touch']
  const i = flow.indexOf(s)
  if (s === 'Follow-Up Due') return 'Responded'
  if (s === 'Referral Discussion' || s === 'Closed') return null
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null
}

export function isFollowUpDue(o: Outreach): boolean {
  return o.status === 'Follow-Up Due' || (o.status === 'Contacted' && !!o.followUpDate && o.followUpDate <= today())
}

export { PIPELINE_STATUSES }
