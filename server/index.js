import express from 'express'
import cors from 'cors'
import neteaseRoutes from './routes/netease.js'
import aiRoutes from './routes/ai.js'
import contextRoutes from './routes/context.js'
import brainRoutes from './routes/brain.js'
import smartplayRoutes from './routes/smartplay.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// 网易云音乐 API 代理
app.use('/api/netease', neteaseRoutes)

// MiniMax AI API
app.use('/api/ai', aiRoutes)

// AI DJ Context (weather, datetime, mood)
app.use('/api/context', contextRoutes)

// Local Brain (taste.md, routines.md parsing via claude -p)
app.use('/api/brain', brainRoutes)

// Smart Play (AI DJ recommendation engine)
app.use('/api/smartplay', smartplayRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`AI Music DJ Server running on port ${PORT}`)
})
