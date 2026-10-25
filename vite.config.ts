import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      {
        // Serve /api/search in dev with the same core code the Vercel function uses.
        name: 'dev-api',
        configureServer(server) {
          server.middlewares.use('/api/search', async (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end('{"error":"POST only"}'); return }
            let raw = ''
            for await (const chunk of req) raw += chunk
            const { runSearch } = await server.ssrLoadModule('/api/_core.ts')
            let query: unknown
            try { query = JSON.parse(raw || '{}').query } catch { /* invalid body */ }
            const out = await runSearch(query, env, req.headers['x-access-code'] as string | undefined)
            res.statusCode = out.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(out.body))
          })
        },
      },
    ],
    test: { environment: 'node' },
  }
})
