// Shared by the Vercel function (api/search.ts) and the Vite dev middleware.
// Calls Tavily's search API from the server so the key never reaches the browser.

const EXCLUDE = [
  'linkedin.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
  'zoominfo.com', 'rocketreach.co', 'signalhire.com', 'apollo.io', 'contactout.com', 'glassdoor.com', 'indeed.com',
]

export interface CoreResult {
  status: number
  body: unknown
}

export async function runSearch(query: unknown, env: { TAVILY_API_KEY?: string; ACCESS_CODE?: string }, accessCode?: string): Promise<CoreResult> {
  if (env.ACCESS_CODE && accessCode !== env.ACCESS_CODE) return { status: 401, body: { error: 'Access code required.' } }
  if (!env.TAVILY_API_KEY) return { status: 501, body: { error: 'Web search is not configured. Set TAVILY_API_KEY on the server.' } }
  if (typeof query !== 'string' || query.trim().length < 3 || query.length > 300) return { status: 400, body: { error: 'Query must be 3 to 300 characters.' } }
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.TAVILY_API_KEY}` },
    body: JSON.stringify({ query: query.trim(), search_depth: 'basic', max_results: 10, include_answer: false, exclude_domains: EXCLUDE }),
  })
  if (!res.ok) return { status: 502, body: { error: `Search provider returned ${res.status}.` } }
  const data = (await res.json()) as { results?: { title: string; url: string; content: string }[] }
  return { status: 200, body: { results: (data.results ?? []).map(({ title, url, content }) => ({ title, url, snippet: content })) } }
}
