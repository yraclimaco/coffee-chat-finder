import type { Person } from '../../types'
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
  const [rawName, ...rest] = r.title.split(/\s[|\-:]\s/)
  const headline = rest.join(' | ') || r.snippet.slice(0, 120)
  const role = (headline.match(/(product (?:manager|analyst)|data (?:scientist|analyst)|business analyst)/i)?.[1] ?? 'Unknown role')
  const company = headline.match(/\bat ([A-Z][\w&. ]+)/)?.[1]?.trim() ?? 'Unknown company'
  return {
    id: `web-${btoa(r.url).replace(/[^a-z0-9]/gi, '').slice(0, 16)}`,
    name: rawName.trim(), headline, company, role, roleCategory: inferCategory(role),
    location: 'Unknown', yearsOut: 3, education: [], careerHistory: [], priorCompanies: [], internshipHistory: [],
    industries: [], interests: [], skills: [], clubs: [], projects: [], mutuals: [], recentlyJoined: false,
    contactPathway: 'public-site', websiteUrl: r.url, source: sourceLabel, sourceUrl: r.url,
    tags: ['unverified'], notes: r.snippet, isDemo: false,
  }
}

function liveStub(id: string, label: string, envHint: string): PeopleProvider {
  return {
    id, label, kind: 'live', requiresApproval: true,
    description: `Not connected. To enable: implement the fetch in this adapter, add ${envHint} to a server-side proxy (never ship keys to the browser), and approve it in Profile > Data sources.`,
    isConfigured: () => false,
    async searchPeople() {
      throw new ProviderNotConfiguredError(id, `${label} is not configured. Nothing was sent anywhere.`)
    },
  }
}

export const liveProviders: PeopleProvider[] = [
  liveStub('tavily', 'Tavily web search', 'TAVILY_API_KEY'),
  liveStub('google-cse', 'Google Custom Search', 'GOOGLE_CSE_KEY and GOOGLE_CSE_CX'),
  liveStub('bing', 'Bing Search API', 'BING_SEARCH_KEY'),
  liveStub('serpapi', 'SerpAPI', 'SERPAPI_KEY'),
  liveStub('company-pages', 'Company team page crawler', 'a crawl allow-list'),
]
