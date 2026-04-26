import express from 'express'
import axios from 'axios'

const router = express.Router()

// 网易云音乐 API 基础 URL
const NETEASE_API = 'http://music.163.com/api'

// Cookie 配置（用户需要提供自己的网易云Cookie）
// 优先从环境变量读取，没有则从文件读取
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COOKIE_FILE = path.join(__dirname, '../../data/netease_cookie.json')

function loadCookie() {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const data = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))
      return data.cookie || ''
    }
  } catch (e) {}
  return ''
}

function saveCookie(cookie) {
  try {
    fs.writeFileSync(COOKIE_FILE, JSON.stringify({ cookie, updated: new Date().toISOString() }))
  } catch (e) {
    console.error('保存Cookie失败:', e)
  }
}

let NETEASE_COOKIE = loadCookie()
console.log('Cookie已加载，长度:', NETEASE_COOKIE.length)

// 设置 Cookie
router.post('/cookie', (req, res) => {
  try {
    const { cookie } = req.body
    if (cookie) {
      NETEASE_COOKIE = cookie
      saveCookie(cookie)
      console.log('Cookie 设置成功，长度:', cookie.length)
      res.json({ success: true, message: 'Cookie 设置成功' })
    } else {
      res.status(400).json({ success: false, message: 'Cookie 不能为空' })
    }
  } catch (error) {
    console.error('Cookie 设置错误:', error)
    res.status(500).json({ success: false, message: 'Cookie 设置失败', error: error.message })
  }
})

// 获取用户信息
router.get('/user/info', async (req, res) => {
  try {
    // 先尝试获取用户等级信息，其中包含UID
    const response = await axios.get(`${NETEASE_API}/user/level`, {
      params: { csrf_token: '' },
      headers: {
        Cookie: NETEASE_COOKIE,
        Referer: 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    res.json(response.data)
  } catch (error) {
    console.error('获取用户信息失败:', error.message)
    res.status(500).json({ error: '获取用户信息失败', details: error.message })
  }
})

// 获取用户歌单
router.get('/playlist/:id', async (req, res) => {
  try {
    const { id } = req.params
    const response = await axios.get(`${NETEASE_API}/playlist/detail`, {
      params: { id, csrf_token: '' },
      headers: {
        Cookie: NETEASE_COOKIE,
        Referer: 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    res.json(response.data)
  } catch (error) {
    console.error('获取歌单失败:', error.message)
    res.status(500).json({ error: '获取歌单失败', details: error.message })
  }
})

// 获取歌曲播放 URL
router.get('/song/url/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 方法1: 尝试 /api/song/enhance/player/url/v2 (较新接口)
    try {
      const response = await axios.get(`${NETEASE_API}/song/enhance/player/url/v2`, {
        params: { id, level: 'standard' },
        headers: {
          Cookie: NETEASE_COOKIE,
          Referer: 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })
      if (response.data?.data?.[0]?.url) {
        return res.json(response.data)
      }
    } catch (e) {}

    // 方法2: 返回一个代理端点，让前端通过代理获取音频
    res.json({
      code: 200,
      data: [{
        id: parseInt(id),
        url: `/api/netease/stream/${id}`,
        type: 'mp3'
      }]
    })
  } catch (error) {
    console.error('获取歌曲URL失败:', error?.response?.data || error.message)
    res.status(500).json({ error: '获取歌曲URL失败', details: error?.response?.data || error.message })
  }
})

// 流式代理音频（解决CORS）
router.get('/stream/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 获取真实播放地址
    let audioUrl = null

    // 尝试PC端接口
    try {
      const pcRes = await axios.get(`${NETEASE_API}/song/enhance/player/url`, {
        params: { id, level: 'standard', csrf_token: '' },
        headers: {
          Cookie: NETEASE_COOKIE,
          Referer: 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })
      if (pcRes.data?.data?.[0]?.url) {
        audioUrl = pcRes.data.data[0].url
      }
    } catch (e) {
      console.error('PC端接口失败:', e.message)
    }

    // 如果没有获取到，使用外链
    if (!audioUrl) {
      audioUrl = `https://music.163.com/song/media/outer/url?id=${id}.mp3`
    }

    console.log('代理音频:', id, '->', audioUrl ? '找到URL' : '无URL')

    // 流式转发音频数据
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const audioRes = await axios.get(audioUrl, {
      responseType: 'stream',
      headers: {
        Cookie: NETEASE_COOKIE,
        Referer: 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 30000
    })

    audioRes.data.pipe(res)
  } catch (error) {
    console.error('流媒体代理失败:', error.message)
    if (!res.headersSent) {
      res.status(500).send('获取音频失败: ' + error.message)
    }
  }
})

// 搜索歌曲
router.get('/search', async (req, res) => {
  try {
    const { keywords } = req.query
    const response = await axios.get(`${NETEASE_API}/search/get`, {
      params: { s: keywords, type: 1, csrf_token: '' },
      headers: {
        Cookie: NETEASE_COOKIE,
        Referer: 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    res.json(response.data)
  } catch (error) {
    console.error('搜索失败:', error.message)
    res.status(500).json({ error: '搜索失败', details: error.message })
  }
})

// 代理播放音频（解决 CORS 问题）
router.get('/proxy/:id', async (req, res) => {
  try {
    const { id } = req.params
    // 先获取真实播放地址
    const response = await axios.get(`${NETEASE_API}/song/detail`, {
      params: { ids: `[${id}]`, csrf_token: '' },
      headers: {
        Cookie: NETEASE_COOKIE,
        Referer: 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    if (response.data.songs && response.data.songs[0]) {
      const song = response.data.songs[0]
      // 获取真实播放URL
      const urlResponse = await axios.get(`${NETEASE_API}/song/play`, {
        params: { id, csrf_token: '' },
        headers: {
          Cookie: NETEASE_COOKIE,
          Referer: 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })

      // 如果有真实URL，重定向
      if (urlResponse.data && urlResponse.data.data) {
        res.json({ url: urlResponse.data.data[0].url, song: song.name })
      } else {
        // 否则返回外链URL（可能需要VIP）
        res.json({
          url: `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
          song: song.name,
          warning: '可能受VIP限制'
        })
      }
    } else {
      res.status(404).json({ error: '歌曲未找到' })
    }
  } catch (error) {
    console.error('代理失败:', error.message)
    res.status(500).json({ error: '代理失败', details: error.message })
  }
})

// 获取歌词
router.get('/lyric/:id', async (req, res) => {
  try {
    const { id } = req.params
    const response = await axios.get(`${NETEASE_API}/song/lyric`, {
      params: { id, os: 'pc', lv: -1, kv: -1, tv: -1, csrf_token: '' },
      headers: {
        Cookie: NETEASE_COOKIE,
        Referer: 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    res.json(response.data)
  } catch (error) {
    console.error('获取歌词失败:', error.message)
    res.status(500).json({ error: '获取歌词失败', details: error.message })
  }
})

// 获取用户收藏歌单
router.get('/user/playlists/:uid', async (req, res) => {
  try {
    const { uid } = req.params
    const response = await axios.get(`${NETEASE_API}/user/playlist`, {
      params: { uid, csrf_token: '' },
      headers: {
        Cookie: NETEASE_COOKIE,
        Referer: 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    res.json(response.data)
  } catch (error) {
    console.error('获取用户歌单失败:', error.message)
    res.status(500).json({ error: '获取用户歌单失败', details: error.message })
  }
})

export default router
