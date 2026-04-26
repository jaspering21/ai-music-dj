import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const holidays = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/holidays.json'), 'utf-8'))

// Time period definitions
const TIME_PERIODS = {
  dawn: { start: 5, end: 7, label: '黎明', activity: 'morning-wake' },
  morning: { start: 7, end: 9, label: '早晨', activity: 'morning-routine' },
  morningWork: { start: 9, end: 12, label: '上午工作', activity: 'focus-work' },
  noon: { start: 12, end: 14, label: '午休', activity: 'lunch-break' },
  afternoonWork: { start: 14, end: 18, label: '下午工作', activity: 'afternoon-work' },
  evening: { start: 18, end: 21, label: '傍晚', activity: 'evening-relax' },
  night: { start: 21, end: 24, label: '夜晚', activity: 'night-wind-down' },
  lateNight: { start: 0, end: 5, label: '深夜', activity: 'sleep' }
}

// Season definitions
const SEASONS = {
  spring: { months: [3, 4, 5], label: '春天', mood: 'renewal', energy: 'moderate' },
  summer: { months: [6, 7, 8], label: '夏天', mood: 'energetic', energy: 'high' },
  autumn: { months: [9, 10, 11], label: '秋天', mood: 'reflective', energy: 'moderate' },
  winter: { months: [12, 1, 2], label: '冬天', mood: 'contemplative', energy: 'low' }
}

// Holiday mood adjustments
const HOLIDAY_MOODS = {
  '元旦': { mood: 'celebration', energy: 'high', description: '新年的开始' },
  '春节': { mood: 'joyful', energy: 'high', description: '阖家团圆' },
  '清明节': { mood: 'peaceful', energy: 'low', description: '追思先人' },
  '劳动节': { mood: 'gratitude', energy: 'moderate', description: '致敬劳动者' },
  '端午节': { mood: 'traditional', energy: 'moderate', description: '粽子与龙舟' },
  '中秋节': { mood: 'nostalgic', energy: 'low', description: '月圆人团圆' },
  '国庆节': { mood: 'patriotic', energy: 'high', description: '举国欢庆' }
}

function getTimePeriod(hour) {
  for (const [key, period] of Object.entries(TIME_PERIODS)) {
    if (hour >= period.start && hour < period.end) {
      return { key, ...period }
    }
  }
  return { key: 'lateNight', ...TIME_PERIODS.lateNight }
}

function getSeason(month) {
  for (const [key, season] of Object.entries(SEASONS)) {
    if (season.months.includes(month)) {
      return { key, ...season }
    }
  }
  return { key: 'winter', ...SEASONS.winter }
}

function getHoliday(dateStr) {
  const monthDay = dateStr.slice(5) // "YYYY-MM-DD" -> "MM-DD"
  return holidays.holidays[monthDay] || null
}

function isWorkday(dateStr) {
  const monthDay = dateStr.slice(5)
  return holidays.workdays[monthDay] || false
}

export function getDateTimeContext() {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  const month = now.getMonth() + 1
  const dayOfMonth = now.getDate()

  const timePeriod = getTimePeriod(hour)
  const season = getSeason(month)
  const holiday = getHoliday(dateStr)
  const workday = isWorkday(dateStr)

  // Day of week labels
  const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // Time-based music preference hints
  let musicHint = ''
  if (holiday) {
    const holidayMood = HOLIDAY_MOODS[holiday] || { mood: 'celebration', energy: 'high' }
    musicHint = `今天是${holiday}，适合听${holidayMood.description}相关的音乐`
  } else if (isWeekend) {
    musicHint = '周末到了，可以放松一下'
  } else if (timePeriod.key === 'morningWork' || timePeriod.key === 'afternoonWork') {
    musicHint = '工作时间，适合专注型音乐'
  } else if (timePeriod.key === 'evening') {
    musicHint = '傍晚时分，适合放松身心'
  } else if (timePeriod.key === 'night' || timePeriod.key === 'lateNight') {
    musicHint = '夜深了，适合轻柔的音乐'
  }

  return {
    date: dateStr,
    hour,
    dayOfWeek,
    dayOfMonth,
    month,
    year: now.getFullYear(),
    dayLabel: dayLabels[dayOfWeek],
    isWeekend,
    isWorkday: workday && !isWeekend,
    holiday,
    timePeriod: timePeriod.label,
    timeActivity: timePeriod.activity,
    season: season.label,
    seasonMood: season.mood,
    seasonEnergy: season.energy,
    musicHint
  }
}

export function getWeatherMoodMapping() {
  return {
    clear: { mood: 'happy', energy: 'high', description: '晴朗' },
    clouds: { mood: 'neutral', energy: 'moderate', description: '多云' },
    rain: { mood: 'melancholy', energy: 'low', description: '雨天' },
    thunderstorm: { mood: 'intense', energy: 'high', description: '雷暴' },
    snow: { mood: 'peaceful', energy: 'low', description: '雪天' },
    mist: { mood: 'dreamy', energy: 'low', description: '雾霾' },
    fog: { mood: 'dreamy', energy: 'low', description: '大雾' },
    drizzle: { mood: 'contemplative', energy: 'low', description: '细雨' }
  }
}

export default { getDateTimeContext, getWeatherMoodMapping }
