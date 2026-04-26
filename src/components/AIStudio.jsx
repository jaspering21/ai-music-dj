import { useState } from 'react'
import useDjStore from '../stores/djStore'

function AIStudio() {
  const [lyricsPrompt, setLyricsPrompt] = useState('')
  const [lyricsStyle, setLyricsStyle] = useState('流行')
  const [generatedLyrics, setGeneratedLyrics] = useState('')
  const [loading, setLoading] = useState(false)

  const [miniMaxApiKey, setMiniMaxApiKey] = useState('')

  const { currentTrack } = useDjStore()

  // 设置 MiniMax API Key
  const handleSetApiKey = async () => {
    if (!miniMaxApiKey.trim()) {
      alert('请输入 API Key')
      return
    }

    try {
      await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: miniMaxApiKey })
      })
      alert('API Key 设置成功！')
    } catch (err) {
      alert('设置失败: ' + err.message)
    }
  }

  // 生成歌词
  const handleGenerateLyrics = async () => {
    if (!lyricsPrompt.trim()) {
      alert('请输入歌词主题')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lyricsPrompt, style: lyricsStyle })
      })
      const data = await res.json()
      if (data.lyrics) {
        setGeneratedLyrics(data.lyrics)
      } else {
        alert('生成失败: ' + (data.error || '未知错误'))
      }
    } catch (err) {
      alert('生成失败: ' + err.message)
    }
    setLoading(false)
  }

  // TTS 语音合成
  const handleTTS = async () => {
    if (!generatedLyrics) {
      alert('请先生成歌词')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: generatedLyrics })
      })
      const data = await res.json()
      if (data.audio) {
        alert('TTS 生成成功！')
      }
    } catch (err) {
      alert('TTS 失败: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">AI 工作室</h2>

      {/* MiniMax API Key 设置 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">MiniMax API Key</h4>
        <div className="flex gap-2">
          <input
            type="password"
            value={miniMaxApiKey}
            onChange={(e) => setMiniMaxApiKey(e.target.value)}
            placeholder="输入 MiniMax API Key"
            className="flex-1 bg-dj-dark border border-gray-600 rounded px-4 py-2"
          />
          <button
            onClick={handleSetApiKey}
            className="px-6 py-2 bg-dj-accent rounded hover:opacity-80"
          >
            设置
          </button>
        </div>
      </div>

      {/* 歌词生成 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-3">歌词生成</h4>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">歌词主题</label>
            <input
              type="text"
              value={lyricsPrompt}
              onChange={(e) => setLyricsPrompt(e.target.value)}
              placeholder="例如：夜晚的城市、分手后的心情..."
              className="w-full bg-dj-dark border border-gray-600 rounded px-4 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">风格</label>
            <select
              value={lyricsStyle}
              onChange={(e) => setLyricsStyle(e.target.value)}
              className="w-full bg-dj-dark border border-gray-600 rounded px-4 py-2 mt-1"
            >
              <option value="流行">流行</option>
              <option value="嘻哈">嘻哈</option>
              <option value="摇滚">摇滚</option>
              <option value="电子">电子</option>
              <option value="民谣">民谣</option>
              <option value="R&B">R&B</option>
            </select>
          </div>

          <button
            onClick={handleGenerateLyrics}
            disabled={loading}
            className="w-full py-3 bg-dj-accent rounded hover:opacity-80 disabled:opacity-50"
          >
            {loading ? '生成中...' : '生成歌词'}
          </button>
        </div>

        {/* 生成的歌词显示 */}
        {generatedLyrics && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-semibold">生成的歌词</h5>
              <button
                onClick={handleTTS}
                className="text-sm px-3 py-1 bg-dj-gold text-black rounded hover:opacity-80"
              >
                语音预览
              </button>
            </div>
            <textarea
              value={generatedLyrics}
              onChange={(e) => setGeneratedLyrics(e.target.value)}
              className="w-full h-48 bg-dj-dark border border-gray-600 rounded p-3 text-sm"
            />
          </div>
        )}
      </div>

      {/* 智能伴奏生成 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-3">智能伴奏生成</h4>

        <div className="p-4 bg-dj-dark rounded text-center">
          <p className="text-gray-400 mb-2">
            基于当前播放歌曲或指定描述生成伴奏
          </p>
          {currentTrack && (
            <p className="text-dj-accent">
              当前曲目: {currentTrack.name}
            </p>
          )}
          <button
            className="mt-4 px-6 py-2 bg-dj-gold text-black rounded hover:opacity-80"
            onClick={() => alert('智能伴奏功能开发中...')}
          >
            生成智能伴奏
          </button>
        </div>
      </div>

      {/* 使用提示 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">使用提示</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• 先设置 MiniMax API Key 才能使用 AI 功能</li>
          <li>• 歌词生成支持多种风格选择</li>
          <li>• 生成的歌词可以直接编辑</li>
          <li>• 语音预览使用 MiniMax TTS 技术</li>
        </ul>
      </div>
    </div>
  )
}

export default AIStudio
