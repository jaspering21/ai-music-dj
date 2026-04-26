import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Cache for parsed markdown results (5 minute TTL)
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function getCacheKey(filePath) {
  const stats = fs.statSync(filePath)
  return `${filePath}:${stats.mtime.getTime()}`
}

function getFromCache(cacheKey) {
  const entry = cache.get(cacheKey)
  if (!entry) return null

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(cacheKey)
    return null
  }

  return entry.data
}

function setCache(cacheKey, data) {
  // Limit cache size to 50 entries
  if (cache.size > 50) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(cacheKey, { data, timestamp: Date.now() })
}

const TASTE_SYSTEM_PROMPT = `你是一个音乐品味分析助手。请阅读用户的音乐偏好文档，提取结构化信息并以JSON格式输出。

输出格式：
{
  "genres": ["流行", "摇滚"],  // 喜欢的音乐类型数组
  "bpmRange": { "min": 80, "max": 130 },  // 喜欢的BPM范围
  "instruments": ["吉他", "钢琴"],  // 喜欢的乐器
  "avoid": ["重型金属", "悲伤情歌"],  // 回避的元素
  "artists": ["周杰伦", "Coldplay"],  // 喜欢的艺术家
  "mood": {  // 情绪音乐映射
    "happy": ["欢快流行", "庆祝歌曲"],
    "sad": ["温柔抒情", "治愈系"],
    "focus": ["器乐", "氛围音乐"],
    "relax": ["轻音乐", "爵士"]
  },
  "language": "华语",  // 语言偏好
  "era": "2000年代",  // 时代偏好
  "vocal": true,  // 是否喜欢人声
  "skipReasons": []  // 已知的跳曲原因
}

请只输出JSON，不要有其他文字。`

const ROUTINES_SYSTEM_PROMPT = `你是一个日常作息分析助手。请阅读用户的作息文档，提取音乐播放习惯并以JSON格式输出。

输出格式：
{
  "schedule": {
    "wake": "07:00",
    "sleep": "23:00",
    "workStart": "09:00",
    "workEnd": "18:00"
  },
  "musicByTime": {
    "dawn": { "mood": "peaceful", "bpmRange": [60, 80] },
    "morning": { "mood": "upbeat", "bpmRange": [90, 110] },
    "work": { "mood": "focus", "bpmRange": [80, 100] },
    "lunch": { "mood": "casual", "bpmRange": [100, 120] },
    "evening": { "mood": "relax", "bpmRange": [85, 105] },
    "night": { "mood": "calm", "bpmRange": [70, 90] }
  },
  "weatherMusic": {
    "rain": ["治愈系", "室内音乐"],
    "clear": ["户外感", "活力"],
    "snow": ["温暖", "治愈"],
    "hot": ["清爽", "轻快"]
  },
  "volumeByTime": {
    "default": 0.6,
    "morning": 0.5,
    "work": 0.4,
    "evening": 0.5,
    "night": 0.3
  },
  "weekendPreference": "更活跃",  // 或"与工作日相似"
  "specialHabits": []  // 特殊习惯描述
}

请只输出JSON，不要有其他文字。`

async function parseMarkdownWithClaude(filePath, systemPrompt) {
  return new Promise((resolve, reject) => {
    const cacheKey = getCacheKey(filePath)
    const cached = getFromCache(cacheKey)
    if (cached) {
      return resolve(cached)
    }

    // Check if claude CLI is available
    const claudeCheck = spawn('which', ['claude'])
    claudeCheck.on('error', () => {
      // Claude CLI not available, return fallback
      console.warn('Claude CLI not found, using fallback parsing')
      return resolve(getFallbackParse(filePath))
    })

    claudeCheck.on('close', (code) => {
      if (code !== 0) {
        console.warn('Claude CLI not found, using fallback parsing')
        return resolve(getFallbackParse(filePath))
      }

      let output = ''
      let errorOutput = ''

      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8')
      const fullPrompt = `${systemPrompt}\n\n--- 文件内容 ---\n${content}`

      // Use claude -p with prompt from args (read file content separately)
      const claude = spawn('claude', ['-p', systemPrompt], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      claude.stdout.on('data', (data) => {
        output += data.toString()
      })

      claude.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      claude.on('close', (code) => {
        if (code !== 0) {
          console.warn('Claude CLI error, using fallback:', errorOutput.slice(0, 200))
          return resolve(getFallbackParse(filePath))
        }

        try {
          // Extract JSON from output
          const jsonMatch = output.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            console.warn('No JSON found in Claude output, using fallback')
            return resolve(getFallbackParse(filePath))
          }

          const parsed = JSON.parse(jsonMatch[0])
          setCache(cacheKey, parsed)
          resolve(parsed)
        } catch (parseError) {
          console.warn('JSON parse error, using fallback:', parseError.message)
          resolve(getFallbackParse(filePath))
        }
      })

      // Write file content to Claude stdin
      claude.stdin.write(content)
      claude.stdin.end()
    })
  })
}

function getFallbackParse(filePath) {
  // Simple regex-based fallback when Claude CLI is not available
  const content = fs.readFileSync(filePath, 'utf-8')
  const filename = path.basename(filePath, '.md')

  if (filename === 'taste') {
    return {
      genres: extractList(content, /风格标签[：:]\s*([^\n]+)/),
      bpmRange: { min: 80, max: 130 },
      instruments: [],
      avoid: [],
      artists: [],
      mood: { happy: [], sad: [], focus: [], relax: [] },
      language: '不限',
      era: '不限',
      vocal: true,
      skipReasons: []
    }
  } else if (filename === 'routines') {
    return {
      schedule: { wake: '07:00', sleep: '23:00', workStart: '09:00', workEnd: '18:00' },
      musicByTime: {},
      weatherMusic: {},
      volumeByTime: { default: 0.6 },
      weekendPreference: '与工作日相似',
      specialHabits: []
    }
  }

  return {}
}

function extractList(content, regex) {
  const match = content.match(regex)
  if (!match) return []
  return match[1].split(/[,，、]/).map(s => s.trim()).filter(Boolean)
}

export async function parseTaste(filePath) {
  return parseMarkdownWithClaude(filePath, TASTE_SYSTEM_PROMPT)
}

export async function parseRoutines(filePath) {
  return parseMarkdownWithClaude(filePath, ROUTINES_SYSTEM_PROMPT)
}

export function clearCache() {
  cache.clear()
}

export default { parseTaste, parseRoutines, clearCache }
