import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { analyzeRoute } from './routes/analyze.js'
import { getModelsRoute, postModelsRoute } from './routes/models.js'
import { chatRoute } from './routes/chat.js'

const app = new Hono()

// Allow the frontend (any origin in dev, lock down in prod via FRONTEND_URL env)
app.use('*', cors({
  origin: process.env.FRONTEND_URL ?? '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.post('/analyze', analyzeRoute)
app.get('/models', getModelsRoute)
app.post('/models', postModelsRoute)
app.post('/chat', chatRoute)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
