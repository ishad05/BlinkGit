import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { analyzeRoute } from './routes/analyze.js'
import { getModelsRoute, postModelsRoute } from './routes/models.js'

const app = new Hono()

app.post('/analyze', analyzeRoute)
app.get('/models', getModelsRoute)
app.post('/models', postModelsRoute)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
