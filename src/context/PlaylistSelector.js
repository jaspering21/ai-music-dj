// PlaylistSelector.js - Selects playlist based on mood and user preferences

import { getMoodTags } from './MoodMapper.js'

// Score a playlist against current mood and preferences
function scorePlaylist(playlist, mood, energy, preferences = {}) {
  let score = 0
  const reasons = []

  // Title/tag matching
  if (playlist.name && playlist.tags) {
    const titleLower = playlist.name.toLowerCase()
    const tagsLower = playlist.tags.map(t => t.toLowerCase())

    // Mood tag matching
    const moodTags = getMoodTags(mood, energy)
    const matchingTags = tagsLower.filter(tag =>
      moodTags.some(moodTag => tag.includes(moodTag) || moodTag.includes(tag))
    )
    score += matchingTags.length * 20
    if (matchingTags.length > 0) {
      reasons.push(`匹配标签: ${matchingTags.slice(0, 2).join(', ')}`)
    }

    // Title keyword matching
    const titleKeywords = {
      'happy': ['开心', '快乐', '欢快', 'happy', 'joy', ' upbeat'],
      'relax': ['放松', '舒缓', '轻音乐', 'relax', 'chill', 'easy'],
      'focus': ['专注', '工作', '学习', 'focus', 'study', 'concentration'],
      'energy': ['活力', '运动', '健身', 'energy', 'workout', 'pump'],
      'rain': ['雨天', '下雨', '雨声', 'rain', 'cozy'],
      'night': ['夜晚', '深夜', '夜间', 'night', 'late'],
      'morning': ['早晨', '早上', '晨间', 'morning', 'wake']
    }

    if (titleKeywords[mood]) {
      const titleMatch = titleKeywords[mood].some(kw =>
        titleLower.includes(kw.toLowerCase())
      )
      if (titleMatch) {
        score += 15
        reasons.push('标题匹配')
      }
    }
  }

  // BPM matching (if playlist has BPM data)
  if (playlist.avgBpm && preferences.bpmRange) {
    const { min, max } = preferences.bpmRange
    if (playlist.avgBpm >= min && playlist.avgBpm <= max) {
      score += 25
      reasons.push(`BPM ${playlist.avgBpm} 在偏好范围内`)
    } else {
      // Penalize far from preference
      const diff = Math.min(
        Math.abs(playlist.avgBpm - min),
        Math.abs(playlist.avgBpm - max)
      )
      score -= diff / 10
    }
  }

  // Genre matching
  if (playlist.genres && preferences.genres) {
    const matchingGenres = playlist.genres.filter(g =>
      preferences.genres.some(pg => pg.toLowerCase().includes(g.toLowerCase()))
    )
    score += matchingGenres.length * 15
    if (matchingGenres.length > 0) {
      reasons.push(`匹配风格: ${matchingGenres.slice(0, 2).join(', ')}`)
    }
  }

  // Artist matching
  if (playlist.artists && preferences.artists) {
    const matchingArtists = playlist.artists.filter(a =>
      preferences.artists.some(pa => a.toLowerCase().includes(pa.toLowerCase()))
    )
    score += matchingArtists.length * 20
    if (matchingArtists.length > 0) {
      reasons.push(`匹配艺术家: ${matchingArtists.slice(0, 2).join(', ')}`)
    }
  }

  return { score, reasons }
}

// Select the best playlist from candidates
export function selectPlaylist(candidates, mood, energy, preferences = {}) {
  if (!candidates || candidates.length === 0) {
    return null
  }

  const scored = candidates.map(playlist => ({
    playlist,
    ...scorePlaylist(playlist, mood, energy, preferences)
  }))

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  const best = scored[0]

  // If no good match (score < 20), return a default "chill" playlist
  if (best.score < 20) {
    const defaultPlaylist = candidates.find(p =>
      p.name && (
        p.name.toLowerCase().includes('chill') ||
        p.name.toLowerCase().includes('relax') ||
        p.name.toLowerCase().includes('日常')
      )
    )
    if (defaultPlaylist) {
      return {
        playlist: defaultPlaylist,
        score: 0,
        reasons: ['使用默认播放列表'],
        isDefault: true
      }
    }
  }

  return {
    playlist: best.playlist,
    score: best.score,
    reasons: best.reasons,
    isDefault: false
  }
}

// Generate recommendation reason string
export function generateRecommendationReason(mood, energy, weather, datetime, selection) {
  const parts = []

  // Weather reason
  if (weather) {
    const weatherReasons = {
      clear: '天气晴朗',
      clouds: '多云天气',
      rain: '雨天宅家',
      snow: '雪天保暖',
      thunderstorm: '雷暴天气',
      drizzle: '细雨绵绵'
    }
    if (weatherReasons[weather.condition]) {
      parts.push(weatherReasons[weather.condition])
    }
  }

  // Time reason
  if (datetime) {
    const timeReasons = {
      'morning': '早晨时光',
      'morningWork': '上午工作',
      'noon': '午休时间',
      'afternoonWork': '下午工作',
      'evening': '傍晚放松',
      'night': '夜深了',
      'lateNight': '深夜时分'
    }
    if (timeReasons[datetime.timeActivity]) {
      parts.push(timeReasons[datetime.timeActivity])
    }
  }

  // Mood/energy reason
  const moodReasons = {
    happy: '心情愉悦',
    neutral: '平静舒适',
    melancholy: '思绪万千',
    peaceful: '安宁平和',
    focus: '专注工作',
    relax: '轻松休闲',
    calm: '舒缓放松',
    dreamy: '梦幻氛围',
    intense: '充满能量',
    casual: '随意自在'
  }
  if (moodReasons[mood]) {
    parts.push(moodReasons[mood])
  }

  // Add playlist name if available
  if (selection && selection.playlist) {
    parts.push(`推荐「${selection.playlist.name}」`)
  }

  return parts.join('，')
}

// Filter out skip reasons from playlist
export function filterSkipReasons(tracks, skipReasons = []) {
  if (!skipReasons || skipReasons.length === 0) {
    return tracks
  }

  return tracks.filter(track => {
    const trackStr = `${track.name} ${track.artists || ''}`.toLowerCase()
    return !skipReasons.some(reason => trackStr.includes(reason.toLowerCase()))
  })
}

// Get tracks for a playlist, filtered by preferences
export function getPlaylistTracks(playlist, preferences = {}, limit = 50) {
  if (!playlist || !playlist.tracks) {
    return []
  }

  let tracks = [...playlist.tracks]

  // Filter by skip reasons
  if (preferences.skipReasons) {
    tracks = filterSkipReasons(tracks, preferences.skipReasons)
  }

  // Sort by preference matching
  if (preferences.preferredArtists) {
    tracks.sort((a, b) => {
      const aMatch = preferences.preferredArtists.some(pa =>
        (a.artists || []).some(artist => artist.toLowerCase().includes(pa.toLowerCase()))
      )
      const bMatch = preferences.preferredArtists.some(pa =>
        (b.artists || []).some(artist => artist.toLowerCase().includes(pa.toLowerCase()))
      )
      return bMatch - aMatch
    })
  }

  return tracks.slice(0, limit)
}

export default { selectPlaylist, generateRecommendationReason, filterSkipReasons, getPlaylistTracks }
