import express from 'express'
import { getWeather } from '../services/weatherService.js'
import { getDateTimeContext, getWeatherMoodMapping } from '../services/datetimeService.js'

const router = express.Router()

// Combined context endpoint
router.get('/', async (req, res) => {
  try {
    const [weather, datetime] = await Promise.all([
      getWeather(),
      Promise.resolve(getDateTimeContext())
    ])

    // Calculate combined mood based on weather and time
    const moodMap = getWeatherMoodMapping()
    const weatherMood = moodMap[weather.condition] || moodMap.clouds

    // Time-based energy adjustment
    let energyModifier = 1.0
    if (datetime.hour >= 9 && datetime.hour < 18 && !datetime.isWeekend) {
      energyModifier = datetime.timeActivity === 'focus-work' ? 0.8 : 1.0
    } else if (datetime.hour >= 21 || datetime.hour < 6) {
      energyModifier = 0.6 // Lower energy at night
    }

    // Holiday boost
    if (datetime.holiday) {
      energyModifier = 1.2
    }

    // Determine final energy level
    let finalEnergy = 'moderate'
    if (weatherMood.energy === 'high' || energyModifier > 1) {
      finalEnergy = 'high'
    } else if (weatherMood.energy === 'low' && energyModifier < 0.8) {
      finalEnergy = 'low'
    }

    // Combined mood
    let combinedMood = weatherMood.mood
    if (datetime.seasonMood === 'reflective' && weatherMood.mood === 'melancholy') {
      combinedMood = 'nostalgic'
    }

    // Generate recommendation
    let recommendation = weather.recommendation
    if (datetime.holiday) {
      recommendation = `🎉 ${datetime.holiday}特别推荐：${weather.recommendation}`
    } else if (datetime.isWeekend) {
      recommendation = `周末愉快！${weather.recommendation}`
    }

    res.json({
      weather,
      datetime,
      mood: combinedMood,
      energy: finalEnergy,
      recommendation,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Context API error:', error)
    res.status(500).json({ error: 'Failed to fetch context', details: error.message })
  }
})

// Weather only endpoint
router.get('/weather', async (req, res) => {
  try {
    const weather = await getWeather()
    res.json(weather)
  } catch (error) {
    console.error('Weather API error:', error)
    res.status(500).json({ error: 'Failed to fetch weather', details: error.message })
  }
})

// Datetime only endpoint
router.get('/datetime', (req, res) => {
  try {
    const datetime = getDateTimeContext()
    res.json(datetime)
  } catch (error) {
    console.error('Datetime error:', error)
    res.status(500).json({ error: 'Failed to compute datetime', details: error.message })
  }
})

export default router
