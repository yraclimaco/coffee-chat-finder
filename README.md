# Coffee Chat Finder

A local-first tool for finding people worth a 15 to 20 minute conversation while recruiting. It ranks people with an explainable score, supports natural-language and filtered search, and tracks a light outreach pipeline. It never sends anything.

All bundled profiles are **fictional demo data**, marked in the UI.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # scoring, search, drafts, CSV import
npm run build    # typecheck + production build
```

State (preferences, saved people, pipeline, searches) lives in browser localStorage under `ccf:v1`. Profile > Reset clears it.

## Layout

| Path | Purpose |
| --- | --- |
| `src/lib/scoring.ts` | Factor functions, weights, sliders, percent, breakdown |
| `src/lib/search.ts` | Query parser, filters, sorting, autocomplete |
| `src/lib/outreach.ts` | Hooks, coffee-chat questions, 50 to 100 word drafts |
| `src/lib/providers/` | `PeopleProvider` interface, demo, CSV, live-search stubs |
| `src/lib/store.ts` | localStorage-backed store and pipeline rules |
| `src/data/` | Demo people, company signals, default profile |
| `src/pages/` | Discover, Search, Person, Saved, Pipeline, Insights, Profile |

## Scoring

`earned = fraction * weight * sliderMultiplier` per factor, summed. Percent is `(raw / sum of weights) ^ 0.85`, capped at 99. Weights default to the values in `src/data/defaults.ts` and are editable in Profile > Advanced. The eight priority sliders map 0 to 100 onto a 0x to 2x multiplier (50 is neutral). Every person page and card shows the per-factor breakdown.

Hiring and open-role flags in `src/data/companies.ts` are illustrative placeholders, not live data.

## Real people: public web search

Search > "Find real people on the public web" calls `/api/search`, a small server function (`api/search.ts`, shared logic in `api/_core.ts`) that queries Tavily. LinkedIn, social sites and contact-lookup sites are excluded. Only your search words are sent. Results are unverified leads: you open the source, correct name, role and company, then add them. Added people are scored like everyone else.

1. Create a Tavily key and copy `.env.example` to `.env.local` with `TAVILY_API_KEY=...`, then `npm run dev`.
2. Deploy on Vercel and set `TAVILY_API_KEY` (and an `ACCESS_CODE`) under Project Settings > Environment Variables. The browser asks for the code once.
3. Profile > Demo data > hide the fictional profiles.

Other providers (Google Custom Search, Bing, SerpAPI, crawlers) follow the same pattern: implement `searchPeople` and keep keys on the server. Never scrape LinkedIn or anything behind a login, and never guess email addresses.

## Env vars

`TAVILY_API_KEY` (required for web search) and `ACCESS_CODE` (optional) on the server. Demo data and CSV import work without them.
