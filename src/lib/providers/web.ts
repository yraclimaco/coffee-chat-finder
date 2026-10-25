import type { Person, SearchFilters } from '../../types'
import { inferCategory } from '../../data/demoPeople'
import { ProviderNotConfiguredError } from './types'
import type { PeopleProvider } from './types'

/**
 * Shape of a result from a public web search API (Tavily, Google Custom Search, Bing, SerpAPI).
 * Each adapter maps its API response into this before `webResultToPerson`.
 */
export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * Turn a public web page result (team page, conference bio, personal site, GitHub profile) into a
 * Person with low confidence. Never invents emails or social URLs: only the page it came from.
 */
export function webResultToPerson(r: WebSearchResult, sourceLabel: string): Person {
  const title = r.title.replace(/\s+/g, ' ').trim()
  const nameMatch = title.match(/^([A-Z][\p{L}'.-]+(?:\s[A-Z][\p{L}'.-]+){1,2})(?=\s[|\-:,]|\s*$)/u)
  const name = nameMatch?.[1] ?? ''
  const rest = nameMatch ? title.slice(nameMatch[0].length).replace(/^\s*[|\-:,]\s*/, '') : title
  const role = rest.match(/((?:senior |associate |lead )?(?:product (?:manager|analyst)|data (?:scientist|analyst)|business analyst|analytics [a-z]+|[a-z]+ analyst))/i)?.[1] ?? ''
  const company = rest.match(/\b(?:at|@)\s+([A-Z][\w&.]*(?:\s[A-Z][\w&.]*){0,2})/)?.[1] ?? ''
  return {
    id: `web-${btoa(unescape(encodeURIComponent(r.url))).replace(/[^a-z0-9]/gi, '').slice(-16)}`,
    name, headline: rest.slice(0, 140), company, role, roleCategory: inferCategory(role || rest),
    location: '', yearsOut: 3, education: [], careerHistory: [], priorCompanies: [], internshipHistory: [],
    industries: [], interests: [], skills: [], clubs: [], projects: [], mutuals: [], recentlyJoined: false,
    contactPathway: 'public-site', websiteUrl: r.url, source: sourceLabel, sourceUrl: r.url,
    tags: ['unverified'], notes: r.snippet.slice(0, 400), isDemo: false,
  }
}

function liveStub(id: string, label: string, envHint: string): PeopleProvider {
  return {
    id, label, kind: 'live', requiresApproval: true,
    description: `Not connected. To enable: implement the fetch in this adapter and add ${envHint} to the server (api/_core.ts pattern), never the browser.`,
    isConfigured: () => false,
    async searchPeople() {
      throw new ProviderNotConfiguredError(id, `${label} is not configured. Nothing was sent anywhere.`)
    },
  }
}

/** Builds a natural-language web query from the app's search text and filters. Contains no personal profile data. */
export function buildWebQuery(query: string, f: SearchFilters): string {
  const bits = [f.role, f.company || f.internship, f.school, f.industry, f.field, f.location, f.interest, f.keyword, query].filter(Boolean)
  return `${[...new Set(bits)].join(' ')} team member profile OR speaker bio OR alumni spotlight`.slice(0, 280)
}

const CODE_KEY = 'ccf:access-code'

/** Public web search through the server-side /api/search proxy (Tavily). Results are unverified leads. */
export const tavilyProvider: PeopleProvider = {
  id: 'tavily',
  label: 'Public web search (Tavily)',
  kind: 'live',
  requiresApproval: true,
  description: 'Searches public pages such as team pages, speaker bios and personal sites. LinkedIn and lead-gen sites are excluded. Needs TAVILY_API_KEY on the server. Only your search words are sent.',
  isConfigured: () => true,
  async searchPeople(query, filters) {
    const q = buildWebQuery(query, filters)
    const call = () => {
      let code = ''
      try { code = localStorage.getItem(CODE_KEY) ?? '' } catch { /* storage unavailable */ }
      return fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-code': code }, body: JSON.stringify({ query: q }) })
    }
    let res = await call()
    if (res.status === 401) {
      const entered = window.prompt('Access code for web search')
      if (entered) {
        try { localStorage.setItem(CODE_KEY, entered) } catch { /* ignore */ }
        res = await call()
      }
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new ProviderNotConfiguredError('tavily', data.error ?? `Web search failed (${res.status}).`)
    return { people: (data.results as WebSearchResult[]).map((r) => webResultToPerson(r, 'Public web search')), note: q }
  },
}

export const liveProviders: PeopleProvider[] = [
  liveStub('google-cse', 'Google Custom Search', 'GOOGLE_CSE_KEY and GOOGLE_CSE_CX'),
  liveStub('bing', 'Bing Search API', 'BING_SEARCH_KEY'),
  liveStub('serpapi', 'SerpAPI', 'SERPAPI_KEY'),
  liveStub('company-pages', 'Company team page crawler', 'a crawl allow-list'),
]
