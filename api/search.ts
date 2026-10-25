import { runSearch } from './_core'

// Vercel serverless function: POST /api/search { query }
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const out = await runSearch(req.body?.query, process.env, req.headers['x-access-code'])
  res.status(out.status).json(out.body)
}
