// SystemPromptBuilder.js - Builds complete system prompt from 6 fragments

// Base system prompt for AI DJ
const BASE_SYSTEM_PROMPT = `你是 AI DJ，一个智能音乐DJ系统。

你的职责是根据用户当前的环境、心情和偏好，选择最合适的音乐，并为用户提供音乐相关的对话体验。

核心原则：
1. 音乐选择要符合当前场景（天气、时间、活动）
2. 优先考虑用户的长期音乐偏好
3. 如果用户明确要求，按要求播放
4. 简单指令直接执行，复杂问题才需要解释

指令分流规则：
- "下一首"、"上一首"、"暂停"、"播放"、"停止" → 直接执行
- "来点XX音乐"、"播放XX风格的歌"、"推荐点歌" → 执行 + 简短确认
- 其他闲聊和复杂问题 → 完整对话

你应该：
- 简洁有力，不要啰嗦
- 音乐推荐时说明原因（因为天气/时间/心情）
- 适时提供串场词（DJ talk）来衔接歌曲
- 尊重用户的音乐品味，不强行推荐不喜欢的内容`

// Format preferences for system prompt
function formatPreferences(taste, routines) {
  if (!taste && !routines) {
    return '用户偏好：未设置（使用默认推荐）'
  }

  const parts = []

  if (taste) {
    if (taste.genres && taste.genres.length > 0) {
      parts.push(`喜欢的风格：${taste.genres.join('、')}`)
    }
    if (taste.artists && taste.artists.length > 0) {
      parts.push(`喜欢的艺术家：${taste.artists.slice(0, 5).join('、')}`)
    }
    if (taste.bpmRange) {
      parts.push(`BPM偏好：${taste.bpmRange.min}-${taste.bpmRange.max}`)
    }
    if (taste.avoid && taste.avoid.length > 0) {
      parts.push(`回避的元素：${taste.avoid.join('、')}`)
    }
    if (taste.language) {
      parts.push(`语言偏好：${taste.language}`)
    }
  }

  if (routines) {
    if (routines.schedule) {
      parts.push(`作息：${routines.schedule.wake}-${routines.schedule.sleep}`)
    }
    if (routines.weekendPreference) {
      parts.push(`周末偏好：${routines.weekendPreference}`)
    }
  }

  return parts.length > 0 ? parts.join('\n') : '用户偏好：未设置'
}

// Format external context
function formatExternalContext(weather, datetime) {
  const parts = []

  if (weather) {
    parts.push(`天气：${weather.city} ${weather.temp}°C ${weather.conditionDesc}`)
  }

  if (datetime) {
    const timeInfo = `${datetime.dayLabel} ${datetime.timePeriod}（${datetime.season}）`
    parts.push(`时间：${timeInfo}`)
    if (datetime.holiday) {
      parts.push(`节日：${datetime.holiday}`)
    }
    if (datetime.isWeekend) {
      parts.push('今天周末')
    }
  }

  return parts.length > 0 ? parts.join('\n') : '外部环境：未知'
}

// Format recent plays
function formatRecentPlays(recentPlays) {
  if (!recentPlays || recentPlays.length === 0) {
    return '最近播放：无记录'
  }

  const tracks = recentPlays.slice(-5).map(t =>
    `  - ${t.name} (${t.artist || '未知'})`
  ).join('\n')

  return `最近播放：\n${tracks}`
}

// Format current session state
function formatSessionState(session) {
  if (!session) {
    return '当前状态：默认'
  }

  const parts = []
  if (session.mood) {
    parts.push(`心情：${session.mood}`)
  }
  if (session.energy) {
    parts.push(`能量：${session.energy}`)
  }
  if (session.intent) {
    parts.push(`意图：${session.intent}`)
  }

  return parts.length > 0 ? parts.join('\n') : '当前状态：默认'
}

// Build complete system prompt from 6 fragments
export function buildSystemPrompt(fragments) {
  const {
    systemPrompt = BASE_SYSTEM_PROMPT,
    userPreferences = {},
    externalContext = {},
    deviceState = {},
    recentPlays = [],
    sessionState = {}
  } = fragments

  const { taste, routines } = userPreferences
  const { weather, datetime } = externalContext

  const prompt = `${BASE_SYSTEM_PROMPT}

## 当前环境上下文
${formatExternalContext(weather, datetime)}

## 用户音乐偏好
${formatPreferences(taste, routines)}

## 当前状态
${formatSessionState(sessionState)}

## 最近播放历史
${formatRecentPlays(recentPlays)}

${deviceState.ampOn !== undefined ? `## 设备状态
功放：${deviceState.ampOn ? '开启' : '关闭'}
音量：${deviceState.volume || 0.6}` : ''}

请根据以上上下文，选择合适的音乐或回应用户。`

  return prompt
}

// Build a short context for simple commands (no need for full prompt)
export function buildShortContext(fragments) {
  const { weather, datetime, mood, energy } = fragments

  let context = ''

  if (weather) {
    context += `[天气] ${weather.city} ${weather.temp}°C ${weather.conditionDesc}\n`
  }

  if (datetime) {
    context += `[时间] ${datetime.dayLabel} ${datetime.timePeriod}\n`
  }

  if (mood) {
    context += `[心情] ${mood}\n`
  }

  if (energy) {
    context += `[能量] ${energy}\n`
  }

  return context.trim()
}

// Get recommendation context for music selection
export function buildRecommendationContext(fragments) {
  const { weather, datetime, mood, energy, userPreferences } = fragments

  const { taste, routines } = userPreferences || {}

  return {
    mood: mood || 'neutral',
    energy: energy || 'moderate',
    weatherCondition: weather?.condition,
    timeActivity: datetime?.timeActivity,
    season: datetime?.season,
    isWeekend: datetime?.isWeekend,
    holiday: datetime?.holiday,
    bpmRange: taste?.bpmRange,
    preferredGenres: taste?.genres || [],
    preferredArtists: taste?.artists || [],
    skipReasons: taste?.skipReasons || [],
    musicByTime: routines?.musicByTime,
    weatherMusic: routines?.weatherMusic
  }
}

export default { buildSystemPrompt, buildShortContext, buildRecommendationContext }
