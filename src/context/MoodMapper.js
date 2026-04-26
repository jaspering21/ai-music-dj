// MoodMapper.js - Maps external factors to mood/energy state

// Weather condition to mood mapping
export const WEATHER_MOOD_MAP = {
  clear: { mood: 'happy', energy: 'high', description: '晴朗', tags: ['upbeat', 'bright'] },
  clouds: { mood: 'neutral', energy: 'moderate', description: '多云', tags: ['chill', 'relaxed'] },
  rain: { mood: 'melancholy', energy: 'low', description: '雨天', tags: ['chill', 'contemplative'] },
  thunderstorm: { mood: 'intense', energy: 'high', description: '雷暴', tags: ['dramatic', 'powerful'] },
  snow: { mood: 'peaceful', energy: 'low', description: '雪天', tags: ['cozy', 'serene'] },
  mist: { mood: 'dreamy', energy: 'low', description: '雾霾', tags: ['moody', 'atmospheric'] },
  fog: { mood: 'dreamy', energy: 'low', description: '大雾', tags: ['moody', 'atmospheric'] },
  drizzle: { mood: 'contemplative', energy: 'low', description: '细雨', tags: ['thoughtful', 'gentle'] }
}

// Time period to mood mapping
export const TIME_MOOD_MAP = {
  dawn: { mood: 'peaceful', energy: 'low', description: '黎明', tags: ['ambient', 'soft'] },
  morning: { mood: 'upbeat', energy: 'moderate', description: '早晨', tags: ['fresh', ' energizing'] },
  morningWork: { mood: 'focus', energy: 'moderate', description: '上午工作', tags: ['concentration', 'minimal'] },
  noon: { mood: 'casual', energy: 'moderate', description: '午休', tags: ['relaxed', 'casual'] },
  afternoonWork: { mood: 'focus', energy: 'moderate-high', description: '下午工作', tags: ['productivity', 'steady'] },
  evening: { mood: 'relax', energy: 'moderate', description: '傍晚', tags: ['unwinding', 'social'] },
  night: { mood: 'calm', energy: 'low', description: '夜晚', tags: ['peaceful', 'introspective'] },
  lateNight: { mood: 'dreamy', energy: 'low', description: '深夜', tags: ['ambient', 'sleepy'] }
}

// Activity to mood mapping
export const ACTIVITY_MOOD_MAP = {
  'morning-routine': { mood: 'upbeat', energy: 'moderate', description: '晨间活动' },
  'focus-work': { mood: 'focus', energy: 'moderate', description: '专注工作' },
  'lunch-break': { mood: 'casual', energy: 'moderate', description: '午休时光' },
  'afternoon-work': { mood: 'focus', energy: 'moderate-high', description: '下午工作' },
  'evening-relax': { mood: 'relax', energy: 'moderate', description: '傍晚放松' },
  'night-wind-down': { mood: 'calm', energy: 'low', description: '夜间舒缓' },
  'sleep': { mood: 'dreamy', energy: 'low', description: '睡眠时间' }
}

// Combine multiple mood inputs with weights
export function combineMoods(moods, weights = null) {
  if (!moods || moods.length === 0) {
    return { mood: 'neutral', energy: 'moderate', confidence: 0 }
  }

  if (!weights) {
    weights = moods.map(() => 1 / moods.length)
  }

  // Normalize weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  weights = weights.map(w => w / totalWeight)

  // Determine dominant mood
  const moodScores = {}
  moods.forEach((m, i) => {
    const w = weights[i]
    if (!moodScores[m.mood]) {
      moodScores[m.mood] = { score: 0, energy: [] }
    }
    moodScores[m.mood].score += w
    if (m.energy) moodScores[m.mood].energy.push(m.energy)
  })

  // Find highest scoring mood
  let dominantMood = 'neutral'
  let highestScore = 0
  Object.entries(moodScores).forEach(([mood, data]) => {
    if (data.score > highestScore) {
      highestScore = data.score
      dominantMood = mood
    }
  })

  // Determine energy level
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

// Main mood calculation function
export function calculateMood(weather, datetime, preferences = {}) {
  const moods = []
  const weights = []

  // Weather contribution (40%)
  if (weather && weather.condition) {
    const weatherMood = WEATHER_MOOD_MAP[weather.condition] || WEATHER_MOOD_MAP.clouds
    moods.push({ ...weatherMood, source: 'weather' })
    weights.push(0.4)
  }

  // Time contribution (35%)
  if (datetime && datetime.timeActivity) {
    const timeMood = ACTIVITY_MOOD_MAP[datetime.timeActivity] || TIME_MOOD_MAP[datetime.timePeriod]
    if (timeMood) {
      moods.push({ ...timeMood, source: 'time' })
      weights.push(0.35)
    }
  }

  // Season contribution (15%)
  if (datetime && datetime.seasonMood) {
    moods.push({
      mood: datetime.seasonMood,
      energy: datetime.seasonEnergy || 'moderate',
      description: datetime.season,
      source: 'season'
    })
    weights.push(0.15)
  }

  // Weekend/holiday boost (10%)
  if (datetime) {
    if (datetime.isWeekend || datetime.holiday) {
      moods.push({
        mood: 'relaxed',
        energy: datetime.holiday ? 'high' : 'moderate',
        description: datetime.holiday || '周末',
        source: 'occasion'
      })
      weights.push(0.10)
    }
  }

  // User preference override
  if (preferences.energy) {
    // User prefers specific energy level
  }

  return combineMoods(moods, weights)
}

// Get music recommendation tags based on mood
export function getMoodTags(mood, energy) {
  const tagMap = {
    'happy': ['upbeat', 'positive', 'energetic', 'cheerful'],
    'neutral': ['balanced', 'easy-going', 'versatile'],
    'melancholy': ['emotional', 'thoughtful', 'nostalgic', 'somber'],
    'peaceful': ['calm', 'serene', 'ambient', 'soft'],
    'focus': ['minimal', 'instrumental', 'steady', 'concentration'],
    'relax': ['chill', 'laid-back', 'mellow', 'unwinding'],
    'calm': ['peaceful', 'tranquil', 'gentle', 'soothing'],
    'dreamy': ['atmospheric', ' ethereal', 'ambient', 'experimental'],
    'intense': ['powerful', 'dramatic', 'bold', 'dynamic'],
    'casual': ['fun', 'casual', 'friendly', 'accessible'],
    'upbeat': [' energizing', 'motivating', 'positive', 'fresh']
  }

  const energyTagMap = {
    'low': ['slow', 'soft', 'quiet', 'gentle'],
    'moderate': ['balanced', 'steady', 'normal'],
    'moderate-high': [' lively', 'active', 'engaging'],
    'high': ['fast', 'loud', 'powerful', 'intense']
  }

  const moodTags = tagMap[mood] || tagMap.neutral
  const energyTags = energyTagMap[energy] || energyTagMap.moderate

  return [...moodTags, ...energyTags].slice(0, 6)
}

export default { calculateMood, combineMoods, getMoodTags, WEATHER_MOOD_MAP, TIME_MOOD_MAP }
