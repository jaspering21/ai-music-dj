import { useState, useEffect } from 'react'
import useDjStore from '../stores/djStore'

function PlaylistBrowser({ onPlayTrack }) {
  const [playlists, setPlaylists] = useState([])
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [tracks, setTracks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCookieModal, setShowCookieModal] = useState(false)
  const [cookieInput, setCookieInput] = useState('')
  const [cookieError, setCookieError] = useState('')

  const { hasNeteaseCookie, setHasNeteaseCookie } = useDjStore()

  // Cookie 登录
  const handleCookieLogin = async () => {
    if (!cookieInput.trim()) {
      setCookieError('请粘贴 Cookie')
      return
    }

    try {
      const res = await fetch('/api/netease/cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: cookieInput })
      })

      if (res.ok) {
        setHasNeteaseCookie(true)
        setShowCookieModal(false)
        setCookieInput('')
        setCookieError('')
      } else {
        setCookieError('设置失败')
      }
    } catch (err) {
      setCookieError('设置失败: ' + err.message)
    }
  }

  // 获取用户歌单
  useEffect(() => {
    if (!hasNeteaseCookie) return

    // 默认使用 "我喜欢的音乐" 歌单 ID
    fetchUserPlaylists('1') // 用户 ID 1 表示当前登录用户
  }, [hasNeteaseCookie])

  const fetchUserPlaylists = async (uid) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/netease/user/playlists/${uid}`)
      const data = await res.json()
      if (data.playlist) {
        setPlaylists(data.playlist)
      }
    } catch (err) {
      console.error('获取歌单失败:', err)
    }
    setLoading(false)
  }

  // 选择歌单
  const selectPlaylist = async (playlistId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/netease/playlist/${playlistId}`)
      const data = await res.json()
      if (data.playlist) {
        setCurrentPlaylist(data.playlist)
        setTracks(data.playlist.tracks || [])
      }
    } catch (err) {
      console.error('获取歌单详情失败:', err)
    }
    setLoading(false)
  }

  // 搜索歌曲
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/netease/search?keywords=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.result?.songs) {
        setSearchResults(data.result.songs)
      }
    } catch (err) {
      console.error('搜索失败:', err)
    }
    setLoading(false)
  }

  if (!hasNeteaseCookie) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">网易云歌单</h2>

        {/* 登录卡片 */}
        <div className="bg-dj-primary p-8 rounded-lg text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-lg font-semibold mb-2">登录网易云音乐</h3>
          <p className="text-gray-400 text-sm mb-6">
            登录后即可播放你喜欢的歌曲
          </p>
          <button
            onClick={() => setShowCookieModal(true)}
            className="px-8 py-3 bg-dj-accent rounded-lg hover:opacity-80 transition"
          >
            粘贴 Cookie 登录
          </button>
          <p className="text-xs text-gray-500 mt-4">
            如何获取 Cookie？
          </p>
          <p className="text-xs text-gray-600">
            1. 登录 music.163.com<br/>
            2. 按 F12 打开开发者工具<br/>
            3. 复制 Application → Cookies 中的全部值
          </p>
        </div>

        {/* Cookie 登录弹窗 */}
        {showCookieModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-dj-primary rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">粘贴网易云 Cookie</h3>
              <textarea
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="请在此处粘贴复制的 Cookie..."
                className="w-full h-32 bg-dj-dark border border-gray-600 rounded-lg p-3 text-sm font-mono"
              />
              {cookieError && (
                <p className="text-red-400 text-sm mt-2">{cookieError}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                你的 Cookie 仅存储在本地浏览器中
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCookieLogin}
                  className="flex-1 py-2 bg-dj-accent rounded-lg hover:opacity-80"
                >
                  确认登录
                </button>
                <button
                  onClick={() => {
                    setShowCookieModal(false)
                    setCookieInput('')
                    setCookieError('')
                  }}
                  className="flex-1 py-2 bg-gray-600 rounded-lg hover:opacity-80"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">网易云歌单</h2>

      {/* 搜索栏 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索歌曲..."
            className="flex-1 bg-dj-dark border border-gray-600 rounded px-4 py-2"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-dj-accent rounded hover:opacity-80 disabled:opacity-50"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="bg-dj-primary p-4 rounded-lg">
          <h4 className="font-semibold mb-3">搜索结果</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-2 hover:bg-dj-dark rounded cursor-pointer"
                onClick={() => onPlayTrack({
                  id: song.id,
                  name: song.name,
                  artist: song.artists?.[0]?.name || '未知'
                })}
              >
                <div>
                  <span className="text-white">{song.name}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    - {song.artists?.[0]?.name || '未知'}
                  </span>
                </div>
                <button className="text-dj-accent hover:text-dj-gold">▶</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 歌单列表 */}
      <div className="grid grid-cols-4 gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => selectPlaylist(playlist.id)}
            className={`p-3 rounded-lg cursor-pointer transition ${
              currentPlaylist?.id === playlist.id
                ? 'bg-dj-accent'
                : 'bg-dj-primary hover:bg-dj-dark'
            }`}
          >
            <img
              src={playlist.coverImgUrl}
              alt={playlist.name}
              className="w-full aspect-square object-cover rounded mb-2"
            />
            <p className="text-sm truncate">{playlist.name}</p>
            <p className="text-xs text-gray-400">{playlist.trackCount} 首</p>
          </div>
        ))}
      </div>

      {/* 当前歌单详情 */}
      {currentPlaylist && (
        <div className="bg-dj-primary p-4 rounded-lg">
          <h4 className="font-semibold mb-3">{currentPlaylist.name}</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 hover:bg-dj-dark rounded cursor-pointer"
                onClick={() => onPlayTrack({
                  id: track.id,
                  name: track.name,
                  artist: track.ar?.[0]?.name || '未知'
                })}
              >
                <div>
                  <span className="text-white">{track.name}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    - {track.ar?.[0]?.name || '未知'}
                  </span>
                </div>
                <button className="text-dj-accent hover:text-dj-gold text-xl">▶</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <span className="text-dj-accent animate-pulse">加载中...</span>
        </div>
      )}
    </div>
  )
}

export default PlaylistBrowser
