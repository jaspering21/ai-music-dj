import express from 'express'
import { getWeather } from '../services/weatherService.js'
import { getDateTimeContext } from '../services/datetimeService.js'
import { parseTaste, parseRoutines } from '../services/claudeLocalService.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Inline MoodMapper functions for server use
const WEATHER_MOOD_MAP = {
  clear: { mood: 'happy', energy: 'high', description: '晴朗' },
  clouds: { mood: 'neutral', energy: 'moderate', description: '多云' },
  rain: { mood: 'melancholy', energy: 'low', description: '雨天' },
  thunderstorm: { mood: 'intense', energy: 'high', description: '雷暴' },
  snow: { mood: 'peaceful', energy: 'low', description: '雪天' },
  mist: { mood: 'dreamy', energy: 'low', description: '雾霾' },
  fog: { mood: 'dreamy', energy: 'low', description: '大雾' },
  drizzle: { mood: 'contemplative', energy: 'low', description: '细雨' }
}

const ACTIVITY_MOOD_MAP = {
  'dawn': { mood: 'peaceful', energy: 'low', description: '黎明' },
  'morning': { mood: 'upbeat', energy: 'moderate', description: '早晨' },
  'morningWork': { mood: 'focus', energy: 'moderate', description: '上午工作' },
  'noon': { mood: 'casual', energy: 'moderate', description: '午休' },
  'afternoonWork': { mood: 'focus', energy: 'moderate-high', description: '下午工作' },
  'evening': { mood: 'relax', energy: 'moderate', description: '傍晚' },
  'night': { mood: 'calm', energy: 'low', description: '夜晚' },
  'lateNight': { mood: 'dreamy', energy: 'low', description: '深夜' },
  'morning-routine': { mood: 'upbeat', energy: 'moderate', description: '晨间活动' },
  'focus-work': { mood: 'focus', energy: 'moderate', description: '专注工作' },
  'lunch-break': { mood: 'casual', energy: 'moderate', description: '午休时光' },
  'afternoon-work': { mood: 'focus', energy: 'moderate-high', description: '下午工作' },
  'evening-relax': { mood: 'relax', energy: 'moderate', description: '傍晚放松' },
  'night-wind-down': { mood: 'calm', energy: 'low', description: '夜间舒缓' },
  'sleep': { mood: 'dreamy', energy: 'low', description: '睡眠时间' }
}

function calculateMood(weather, datetime) {
  const moods = []
  const weights = []

  if (weather && weather.condition) {
    const weatherMood = WEATHER_MOOD_MAP[weather.condition] || WEATHER_MOOD_MAP.clouds
    moods.push({ ...weatherMood, source: 'weather' })
    weights.push(0.4)
  }

  if (datetime && datetime.timeActivity) {
    const timeMood = ACTIVITY_MOOD_MAP[datetime.timeActivity]
    if (timeMood) {
      moods.push({ ...timeMood, source: 'time' })
      weights.push(0.35)
    }
  }

  if (datetime && datetime.seasonMood) {
    moods.push({
      mood: datetime.seasonMood,
      energy: datetime.seasonEnergy || 'moderate',
      description: datetime.season,
      source: 'season'
    })
    weights.push(0.15)
  }

  if (datetime && (datetime.isWeekend || datetime.holiday)) {
    moods.push({
      mood: 'relaxed',
      energy: datetime.holiday ? 'high' : 'moderate',
      description: datetime.holiday || '周末',
      source: 'occasion'
    })
    weights.push(0.10)
  }

  if (moods.length === 0) {
    return { mood: 'neutral', energy: 'moderate', confidence: 0, influences: [] }
  }

  // Normalize weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const normalizedWeights = weights.map(w => w / totalWeight)

  // Determine dominant mood
  const moodScores = {}
  moods.forEach((m, i) => {
    if (!moodScores[m.mood]) {
      moodScores[m.mood] = { score: 0, energy: [] }
    }
    moodScores[m.mood].score += normalizedWeights[i]
    if (m.energy) moodScores[m.mood].energy.push(m.energy)
  })

  let dominantMood = 'neutral'
  let highestScore = 0
  Object.entries(moodScores).forEach(([mood, data]) => {
    if (data.score > highestScore) {
      highestScore = data.score
      dominantMood = mood
    }
  })

  let finalEnergy = 'moderate'
  const energyVotes = moods.map(m => m.energy).filter(Boolean)
  if (energyVotes.length > 0) {
    const highCount = energyVotes.filter(e => e === 'high' || e === 'moderate-high').length
    const lowCount = energyVotes.filter(e => e === 'low').length
    if (highCount > lowCount) finalEnergy = 'moderate-high'
    else if (lowCount > highCount) finalEnergy = 'low'
  }

  return {
    mood: dominantMood,
    energy: finalEnergy,
    confidence: highestScore,
    influences: moods.map(m => m.description || m.mood)
  }
}

function getMoodTags(mood, energy) {
  const tagMap = {
    'happy': ['upbeat', 'positive', 'energetic', 'cheerful'],
    'neutral': ['balanced', 'easy-going', 'versatile'],
    'melancholy': ['emotional', 'thoughtful', 'nostalgic'],
    'peaceful': ['calm', 'serene', 'ambient', 'soft'],
    'focus': ['minimal', 'instrumental', 'steady', 'concentration'],
    'relax': ['chill', 'laid-back', 'mellow', 'unwinding'],
    'calm': ['peaceful', 'tranquil', 'gentle', 'soothing'],
    'dreamy': ['atmospheric', 'ethereal', 'ambient'],
    'intense': ['powerful', 'dramatic', 'bold', 'dynamic'],
    'casual': ['fun', 'casual', 'friendly'],
    'upbeat': ['energizing', 'motivating', 'positive', 'fresh']
  }
  const energyTagMap = {
    'low': ['slow', 'soft', 'quiet', 'gentle'],
    'moderate': ['balanced', 'steady'],
    'moderate-high': ['lively', 'active', 'engaging'],
    'high': ['fast', 'loud', 'powerful', 'intense']
  }
  const moodTags = tagMap[mood] || tagMap.neutral
  const energyTags = energyTagMap[energy] || energyTagMap.moderate
  return [...moodTags, ...energyTags].slice(0, 6)
}

const router = express.Router()

// Get smart recommendation
router.get('/recommend', async (req, res) => {
  try {
    // 1. Gather all context
    const [weather, datetime] = await Promise.all([
      getWeather(),
      Promise.resolve(getDateTimeContext())
    ])

    // 2. Calculate mood
    const moodResult = calculateMood(weather, datetime)

    // 3. Get user preferences
    const tastePath = path.join(__dirname, '../../src/brain/taste.md')
    const routinesPath = path.join(__dirname, '../../src/brain/routines.md')

    const [taste, routines] = await Promise.all([
      parseTaste(tastePath),
      parseRoutines(routinesPath)
    ])

    // 4. Build recommendation context
    const recommendation = {
      mood: moodResult.mood,
      energy: moodResult.energy,
      confidence: moodResult.confidence,
      influences: moodResult.influences,
      weather: {
        condition: weather.condition,
        temp: weather.temp,
        city: weather.city,
        description: weather.moodDesc
      },
      datetime: {
        timePeriod: datetime.timePeriod,
        dayLabel: datetime.dayLabel,
        isWeekend: datetime.isWeekend,
        holiday: datetime.holiday,
        season: datetime.season
      },
      tags: getMoodTags(moodResult.mood, moodResult.energy),
      userPreferences: {
        genres: taste.genres || [],
        bpmRange: taste.bpmRange,
        artists: taste.artists || []
      },
      recommendationText: buildRecommendationText(weather, datetime, moodResult)
    }

    res.json(recommendation)
  } catch (error) {
    console.error('Smart recommend error:', error)
    res.status(500).json({ error: 'Failed to generate recommendation', details: error.message })
  }
})

// Search playlists with smart filtering
router.get('/search', async (req, res) => {
  try {
    const { q, mood, energy } = req.query

    // Get all context
    const [weather, datetime] = await Promise.all([
      getWeather(),
      Promise.resolve(getDateTimeContext())
    ])

    const moodResult = calculateMood(weather, datetime)

    // Forward to netease search with additional context
    const neteaseRes = await fetch(`http://localhost:3001/api/netease/search?keywords=${encodeURIComponent(q || '')}`)
    const data = await neteaseRes.json()

    // Score and filter tracks based on mood
    const scored = (data.result?.songs || []).map(song => ({
      ...song,
      score: calculateTrackScore(song, moodResult)
    }))

    // Sort by score
    scored.sort((a, b) => b.score - a.score)

    res.json({
      ...data,
      result: {
        ...data.result,
        songs: scored.slice(0, 30)
      },
      context: {
        mood: moodResult.mood,
        energy: moodResult.energy,
        weather: weather.condition,
        time: datetime.timeActivity
      }
    })
  } catch (error) {
    console.error('Smart search error:', error)
    res.status(500).json({ error: 'Failed to search', details: error.message })
  }
})

function buildRecommendationText(weather, datetime, moodResult) {
  const parts = []

  // Weather
  if (weather) {
    const weatherMap = {
      clear: '晴朗的天气',
      clouds: '多云的天空',
      rain: '雨天',
      snow: '雪天',
      thunderstorm: '雷暴',
      drizzle: '细雨中'
    }
    parts.push(weatherMap[weather.condition] || `${weather.conditionDesc}`)
  }

  // Time
  if (datetime) {
    if (datetime.holiday) {
      parts.push(`正值${datetime.holiday}`)
    } else if (datetime.isWeekend) {
      parts.push('周末')
    } else {
      parts.push(datetime.timePeriod)
    }
  }

  // Mood
  const moodMap = {
    happy: '心情愉悦',
    neutral: '平静舒适',
    melancholy: '思绪绵绵',
    peaceful: '安宁平和',
    focus: '专注',
    relax: '轻松',
    calm: '舒缓',
    dreamy: '梦幻',
    intense: '充满能量'
  }
  if (moodMap[moodResult.mood]) {
    parts.push(moodMap[moodResult.mood])
  }

  return parts.join('，') + '，来点适合的音乐'
}

function calculateTrackScore(track, moodResult) {
  let score = 50 // Base score

  // Artist match bonus
  // BPM bonus (would need track BPM data)

  // Name/tag matching
  const nameLower = (track.name || '').toLowerCase()
  const tags = getMoodTags(moodResult.mood, moodResult.energy)

  // Simple keyword matching
  const positive = ['happy', 'joy', 'love', 'sun', 'smile', '开心', '快乐', '爱']
  const calm = ['night', 'moon', 'dream', 'sleep', '夜晚', '月光', '梦']
  const focus = ['study', 'work', 'quiet', '专注', '平静']

  if (moodResult.mood === 'happy' && positive.some(k => nameLower.includes(k))) {
    score += 20
  } else if (moodResult.mood === 'calm' && calm.some(k => nameLower.includes(k))) {
    score += 20
  } else if (moodResult.mood === 'focus' && focus.some(k => nameLower.includes(k))) {
    score += 20
  }

  return Math.min(100, score)
}

export default router
