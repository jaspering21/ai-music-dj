import express from 'express'
import axios from 'axios'

const router = express.Router()

// MiniMax API 配置
const MINIMAX_API_URL = 'https://api.minimax.chat/v1'
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || ''

// 设置 MiniMax API Key
router.post('/config', (req, res) => {
  const { apiKey } = req.body
  if (apiKey) {
    process.env.MINIMAX_API_KEY = apiKey
    res.json({ success: true, message: 'API Key 设置成功' })
  } else {
    res.status(400).json({ success: false, message: 'API Key 不能为空' })
  }
})

// 生成歌词
router.post('/lyrics', async (req, res) => {
  try {
    const { prompt, style } = req.body
    if (!MINIMAX_API_KEY) {
      return res.status(400).json({ error: '请先配置 MiniMax API Key' })
    }

    const response = await axios.post(
      `${MINIMAX_API_URL}/text/chatcompletion_v2`,
      {
        model: 'abab6.5s-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的歌词创作者。根据用户的需求创作歌词。风格可以是：流行、嘻哈、摇滚、电子、民谣等。`
          },
          {
            role: 'user',
            content: `请为以下主题创作歌词：${prompt}，风格：${style || '流行'}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const lyrics = response.data.choices?.[0]?.message?.content || ''
    res.json({ success: true, lyrics })
  } catch (error) {
    console.error('生成歌词失败:', error.message)
    res.status(500).json({ error: '生成歌词失败', details: error.message })
  }
})

// TTS 语音合成
router.post('/tts', async (req, res) => {
  try {
    const { text, voice } = req.body
    if (!MINIMAX_API_KEY) {
      return res.status(400).json({ error: '请先配置 MiniMax API Key' })
    }

    const response = await axios.post(
      `${MINIMAX_API_URL}/t2a_v2`,
      {
        model: 'speech-02-hd',
        text,
        stream: false,
        voice_setting: {
          voice_id: voice || 'male-qn-qingse'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    res.json({ success: true, audio: response.data })
  } catch (error) {
    console.error('TTS 失败:', error.message)
    res.status(500).json({ error: 'TTS 失败', details: error.message })
  }
})

// 生成智能伴奏
router.post('/accompaniment', async (req, res) => {
  try {
    const { prompt, duration } = req.body
    if (!MINIMAX_API_KEY) {
      return res.status(400).json({ error: '请先配置 MiniMax API Key' })
    }

    const response = await axios.post(
      `${MINIMAX_API_URL}/music generation`,
      {
        model: 'music-01',
        prompt,
        duration: duration || 30
      },
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    res.json({ success: true, music: response.data })
  } catch (error) {
    console.error('生成伴奏失败:', error.message)
    res.status(500).json({ error: '生成伴奏失败', details: error.message })
  }
})

export default router
