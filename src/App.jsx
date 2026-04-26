import { useState, useEffect } from 'react'
import useDjStore from './stores/djStore'
import useAudioEngine from './hooks/useAudioEngine'
import Deck from './components/Deck'
import Mixer from './components/Mixer'
import Effects from './components/Effects'
import PlaylistBrowser from './components/PlaylistBrowser'
import AIStudio from './components/AIStudio'
import WeatherWidget from './components/WeatherWidget'
import SmartPlaySelector from './components/SmartPlaySelector'
import AIDJOverlay from './components/AIDJOverlay'

function App() {
  const [activeTab, setActiveTab] = useState('deck')
  const [neteaseCookie, setNeteaseCookie] = useState('')
  const [cookieError, setCookieError] = useState('')
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayMessage, setOverlayMessage] = useState('')

  const {
    currentTrack,
    isPlaying,
    setCurrentTrack,
    setPlaying,
    setHasNeteaseCookie
  } = useDjStore()

  const { loadTrack } = useAudioEngine()

  // 设置网易云 Cookie
  const handleSetCookie = async () => {
    if (!neteaseCookie.trim()) {
      setCookieError('请输入 Cookie')
      return
    }

    try {
      const res = await fetch('/api/netease/cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: neteaseCookie })
      })

      if (res.ok) {
        setHasNeteaseCookie(true)
        setCookieError('')
        alert('Cookie 设置成功！')
      } else {
        setCookieError('设置失败')
      }
    } catch (err) {
      setCookieError('设置失败: ' + err.message)
    }
  }

  // 播放歌曲
  const handlePlayTrack = async (track) => {
    try {
      // 获取播放 URL
      const res = await fetch(`/api/netease/song/url/${track.id}`)
      const data = await res.json()

      if (data.data?.[0]?.url) {
        setCurrentTrack(track)
        await loadTrack(data.data[0].url)
        setPlaying(true)
      } else {
        alert('该歌曲无法播放（可能需要VIP或版权限制）')
      }
    } catch (err) {
      console.error('播放失败:', err)
      alert('播放失败: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-dj-dark text-white">
      {/* 顶部导航 */}
      <header className="bg-dj-primary px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dj-accent">AI Music DJ</h1>
        <div className="flex items-center gap-4">
          <WeatherWidget />
          <span className="text-sm text-gray-400">
            {currentTrack ? `正在播放: ${currentTrack.name}` : '未播放'}
          </span>
          <div className="w-3 h-3 rounded-full bg-dj-accent animate-pulse" />
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <nav className="w-48 bg-dj-primary p-4 min-h-screen">
          <ul className="space-y-2">
            {[
              { id: 'deck', label: 'DJ 控制台' },
              { id: 'mixer', label: '混音器' },
              { id: 'effects', label: '效果器' },
              { id: 'playlist', label: '网易云歌单' },
              { id: 'aidj', label: '🤖 AI DJ' },
              { id: 'ai', label: 'AI 工作室' }
            ].map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2 rounded transition ${
                    activeTab === tab.id
                      ? 'bg-dj-accent text-white'
                      : 'hover:bg-dj-dark text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Cookie 设置 */}
          <div className="mt-8 p-4 border border-gray-600 rounded">
            <h3 className="text-sm font-semibold mb-2">网易云 Cookie</h3>
            <p className="text-xs text-gray-400 mb-2">
              登录 music.163.com 后复制 Cookie
            </p>
            <textarea
              value={neteaseCookie}
              onChange={(e) => setNeteaseCookie(e.target.value)}
              className="w-full h-16 bg-dj-dark border border-gray-600 rounded p-2 text-xs"
              placeholder="Cookie..."
            />
            {cookieError && (
              <p className="text-xs text-red-400 mt-1">{cookieError}</p>
            )}
            <button
              onClick={handleSetCookie}
              className="mt-2 w-full bg-dj-accent py-1 rounded text-sm hover:opacity-80"
            >
              设置 Cookie
            </button>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          {activeTab === 'deck' && <Deck />}
          {activeTab === 'mixer' && <Mixer />}
          {activeTab === 'effects' && <Effects />}
          {activeTab === 'playlist' && (
            <PlaylistBrowser onPlayTrack={handlePlayTrack} />
          )}
          {activeTab === 'aidj' && <SmartPlaySelector />}
          {activeTab === 'ai' && <AIStudio />}
        </main>

        {/* AI DJ Overlay */}
        {showOverlay && (
          <AIDJOverlay
            message={overlayMessage}
            onClose={() => setShowOverlay(false)}
          />
        )}
      </div>
    </div>
  )
}

export default App
