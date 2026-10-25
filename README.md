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

## Connecting live search later

Implement `searchPeople(query, filters, ctx)` in a provider (see `src/lib/providers/web.ts` for stubs for Tavily, Google Custom Search, Bing, SerpAPI and a company-page crawler), and map results with `webResultToPerson`. Call third-party APIs from a small server-side proxy so keys never reach the browser, and keep each provider behind explicit user approval. Use only public pages and approved APIs. Do not scrape LinkedIn or anything behind a login, and do not guess email addresses.

## Env vars

None are required. `.env.example` lists the optional keys a future live provider would use.
