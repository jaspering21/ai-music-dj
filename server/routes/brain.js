import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseTaste, parseRoutines } from '../services/claudeLocalService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const router = express.Router()

// Get user taste profile (parsed from markdown)
router.get('/taste', async (req, res) => {
  try {
    const tastePath = req.query.path ||
      path.join(__dirname, '../../src/brain/taste.md')

    const data = await parseTaste(tastePath)
    res.json(data)
  } catch (error) {
    console.error('Taste parsing error:', error)
    res.status(500).json({ error: 'Failed to parse taste', details: error.message })
  }
})

// Get user routines profile (parsed from markdown)
router.get('/routines', async (req, res) => {
  try {
    const routinesPath = req.query.path ||
      path.join(__dirname, '../../src/brain/routines.md')

    const data = await parseRoutines(routinesPath)
    res.json(data)
  } catch (error) {
    console.error('Routines parsing error:', error)
    res.status(500).json({ error: 'Failed to parse routines', details: error.message })
  }
})

// Get both taste and routines combined
router.get('/profile', async (req, res) => {
  try {
    const tastePath = path.join(__dirname, '../../src/brain/taste.md')
    const routinesPath = path.join(__dirname, '../../src/brain/routines.md')

    const [taste, routines] = await Promise.all([
      parseTaste(tastePath),
      parseRoutines(routinesPath)
    ])

    res.json({ taste, routines })
  } catch (error) {
    console.error('Profile parsing error:', error)
    res.status(500).json({ error: 'Failed to parse profile', details: error.message })
  }
})

export default router
