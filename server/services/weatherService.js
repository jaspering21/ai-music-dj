import axios from 'axios'
import { getWeatherMoodMapping } from './datetimeService.js'

const OPENWEATHERMAP_API = 'https://api.openweathermap.org/data/2.5/weather'

// Cache weather data for 30 minutes
let weatherCache = {
  data: null,
  timestamp: 0,
  ttl: 30 * 60 * 1000 // 30 minutes
}

// Default location (Beijing) - can be configured via env
const DEFAULT_LAT = 39.9042
const DEFAULT_LON = 116.4074

function getWeatherFromCondition(condition) {
  const main = condition.toLowerCase()

  if (main.includes('thunder') || main.includes('storm')) return 'thunderstorm'
  if (main.includes('drizzle')) return 'drizzle'
  if (main.includes('rain') || main.includes('shower')) return 'rain'
  if (main.includes('snow')) return 'snow'
  if (main.includes('mist') || main.includes('haze') || main.includes('smoke')) return 'mist'
  if (main.includes('fog')) return 'fog'
  if (main.includes('cloud')) return 'clouds'
  if (main.includes('clear')) return 'clear'

  return 'clouds' // default
}

export async function getWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const now = Date.now()

  // Return cached data if still valid
  if (weatherCache.data && (now - weatherCache.timestamp) < weatherCache.ttl) {
    return weatherCache.data
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY

  // If no API key, return mock data for development
  if (!apiKey) {
    const mockData = getMockWeather()
    weatherCache.data = mockData
    weatherCache.timestamp = now
    return mockData
  }

  try {
    const response = await axios.get(OPENWEATHERMAP_API, {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: 'metric', // Celsius
        lang: 'zh_cn'
      },
      timeout: 5000
    })

    const weather = response.data
    const condition = getWeatherFromCondition(weather.weather[0].main)
    const moodMap = getWeatherMoodMapping()
    const moodInfo = moodMap[condition] || moodMap.clouds

    const data = {
      temp: Math.round(weather.main.temp),
      feelsLike: Math.round(weather.main.feels_like),
      humidity: weather.main.humidity,
      condition,
      conditionDesc: weather.weather[0].description,
      conditionIcon: weather.weather[0].icon,
      windSpeed: weather.wind.speed,
      city: weather.name,
      mood: moodInfo.mood,
      energy: moodInfo.energy,
      moodDesc: moodInfo.description,
      recommendation: getWeatherRecommendation(condition, moodInfo, weather.main.temp),
      timestamp: now
    }

    weatherCache.data = data
    weatherCache.timestamp = now

    return data
  } catch (error) {
    console.error('Weather API error:', error.message)
    // Return mock data on error
    const mockData = getMockWeather()
    weatherCache.data = mockData
    weatherCache.timestamp = now
    return mockData
  }
}

function getMockWeather() {
  const conditions = ['clear', 'clouds', 'rain', 'snow', 'drizzle']
  const condition = conditions[Math.floor(Math.random() * conditions.length)]
  const moodMap = getWeatherMoodMapping()
  const moodInfo = moodMap[condition]

  const temps = {
    clear: 25,
    clouds: 20,
    rain: 15,
    snow: -2,
    drizzle: 18
  }

  return {
    temp: temps[condition],
    feelsLike: temps[condition] - 2,
    humidity: condition === 'rain' ? 80 : 50,
    condition,
    conditionDesc: moodInfo.description,
    conditionIcon: '01d',
    windSpeed: 3,
    city: '北京',
    mood: moodInfo.mood,
    energy: moodInfo.energy,
    moodDesc: moodInfo.description,
    recommendation: getWeatherRecommendation(condition, moodInfo, temps[condition]),
    timestamp: Date.now(),
    isMock: true
  }
}

function getWeatherRecommendation(condition, moodInfo, temp) {
  let rec = ''

  if (condition === 'clear') {
    if (temp > 25) {
      rec = '阳光明媚，适合播放轻快活力的音乐'
    } else if (temp < 10) {
      rec = '晴冷天气，适合温暖治愈的歌曲'
    } else {
      rec = '天气晴好，推荐播放清新宜人的音乐'
    }
  } else if (condition === 'clouds') {
    rec = '多云天气，适合播放悠闲轻松的音乐'
  } else if (condition === 'rain') {
    rec = '雨天最适合宅在家里听点舒缓的音乐'
  } else if (condition === 'thunderstorm') {
    rec = '雷暴天气，推荐沉浸感强的音乐'
  } else if (condition === 'snow') {
    rec = '雪天宅家，推荐温暖治愈系音乐'
  } else if (condition === 'drizzle') {
    rec = '细雨绵绵，适合播放安静的背景音乐'
  } else {
    rec = `当前${moodInfo.description}，推荐播放舒缓的音乐`
  }

  return rec
}

export function clearWeatherCache() {
  weatherCache.data = null
  weatherCache.timestamp = 0
}

export default { getWeather, clearWeatherCache }
