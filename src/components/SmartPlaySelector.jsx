import { useState, useEffect } from 'react'
import useContextStore from '../stores/contextStore'
import useDjStore from '../stores/djStore'
import AudioEngine from '../audio/AudioEngine'

const MOOD_COLORS = {
  happy: '#4CAF50',
  neutral: '#9E9E9E',
  melancholy: '#5C6BC0',
  peaceful: '#26A69A',
  focus: '#FF9800',
  relax: '#42A5F5',
  calm: '#66BB6A',
  dreamy: '#AB47BC',
  intense: '#EF5350',
  casual: '#78909C'
}

function SmartPlaySelector() {
  const [recommendation, setRecommendation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showReason, setShowReason] = useState(false)

  const { weather, datetime, currentMood, currentEnergy, musicRecommendation } = useContextStore()
  const { setCurrentPlaylist, setQueue, setCurrentTrack, setPlaying } = useDjStore()

  // Fetch recommendation on mount
  useEffect(() => {
    fetchRecommendation()
  }, [weather, datetime])

  const fetchRecommendation = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/smartplay/recommend')
      const data = await res.json()
      setRecommendation(data)
      setShowReason(true)
      setTimeout(() => setShowReason(false), 5000)

      // 根据推荐标签搜索歌曲
      if (data.tags && data.tags.length > 0) {
        searchSongsByTags(data.tags)
      }
    } catch (err) {
      console.error('Failed to fetch recommendation:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 根据标签搜索歌曲
  const searchSongsByTags = async (tags) => {
    try {
      // 用第一个标签搜索
      const keyword = tags[0]
      const res = await fetch(`/api/netease/search?keywords=${encodeURIComponent(keyword)}`)
      const data = await res.json()

      if (data.result?.songs) {
        setSearchResults(data.result.songs.slice(0, 10))
      }
    } catch (err) {
      console.error('Failed to search songs:', err)
    }
  }

  // 播放推荐歌曲
  const handlePlayRecommendation = async () => {
    if (!recommendation || searchResults.length === 0) return

    // 播放第一首
    const song = searchResults[0]
    const track = {
      id: song.id,
      name: song.name,
      artist: song.artists?.[0]?.name || '未知'
    }

    try {
      const res = await fetch(`/api/netease/song/url/${track.id}`)
      const data = await res.json()

      if (data.data?.[0]?.url) {
        console.log('播放:', track.name, 'URL:', data.data[0].url)
        setCurrentTrack(track)
        setCurrentPlaylist({ name: 'AI推荐播放列表' })
        setQueue(searchResults.map(s => ({
          id: s.id,
          name: s.name,
          artist: s.artists?.[0]?.name || '未知'
        })))

        await AudioEngine.loadAudio(data.data[0].url)
        AudioEngine.play()
        setPlaying(true)
      } else {
        console.log('无法获取播放URL')
        alert('该歌曲无法播放')
      }
    } catch (err) {
      console.error('播放失败:', err)
    }
  }

  const handleAIDJMode = () => {
    fetchRecommendation()
  }

  const moodColor = MOOD_COLORS[currentMood] || MOOD_COLORS.neutral

  return (
    <div className="smart-play-selector">
      <div className="selector-header">
        <h3>AI DJ 智能播放</h3>
        <button className="ai-mode-btn" onClick={handleAIDJMode}>
          🤖 AI 模式
        </button>
      </div>

      {/* Context Banner */}
      <div className="context-banner" style={{ borderColor: moodColor }}>
        <div className="context-item">
          <span className="label">心情</span>
          <span className="value mood-value" style={{ color: moodColor }}>
            {currentMood || '加载中'}
          </span>
        </div>
        <div className="context-item">
          <span className="label">能量</span>
          <span className="value">{currentEnergy || '-'}</span>
        </div>
        <div className="context-item">
          <span className="label">天气</span>
          <span className="value">{weather?.conditionDesc || '-'}</span>
        </div>
        <div className="context-item">
          <span className="label">时间</span>
          <span className="value">{datetime?.timePeriod || '-'}</span>
        </div>
      </div>

      {/* Recommendation Reason */}
      {recommendation && showReason && (
        <div className="recommendation-reason" style={{ backgroundColor: `${moodColor}20` }}>
          <p>{recommendation.recommendationText}</p>
          <div className="influences">
            {recommendation.influences?.map((inf, i) => (
              <span key={i} className="influence-tag">{inf}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Tags */}
      {recommendation && (
        <div className="recommendation-tags">
          {recommendation.tags?.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="action-btn play-btn"
          onClick={handlePlayRecommendation}
          disabled={isLoading || !recommendation || searchResults.length === 0}
        >
          {isLoading ? '加载中...' : '▶ 播放推荐'}
        </button>
      </div>

      {/* 推荐歌曲列表 */}
      {searchResults.length > 0 && (
        <div className="section">
          <h4>根据心情推荐</h4>
          <div className="space-y-2">
            {searchResults.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-2 hover:bg-dj-dark rounded cursor-pointer"
                onClick={() => {
                  const track = {
                    id: song.id,
                    name: song.name,
                    artist: song.artists?.[0]?.name || '未知'
                  }
                  setCurrentTrack(track)
                  // 通过 AudioEngine 播放
                  fetch(`/api/netease/song/url/${song.id}`)
                    .then(r => r.json())
                    .then(async (data) => {
                      if (data.data?.[0]?.url) {
                        await AudioEngine.loadAudio(data.data[0].url)
                        AudioEngine.play()
                        setPlaying(true)
                      }
                    })
                }}
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

      <style>{`
        .smart-play-selector {
          padding: 16px;
          background: #1a1a2e;
          border-radius: 12px;
          color: #fff;
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .selector-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .ai-mode-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #e94560, #ff6b6b);
          border: none;
          border-radius: 20px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .ai-mode-btn:hover {
          transform: scale(1.05);
        }

        .context-banner {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid;
          margin-bottom: 12px;
        }

        .context-item {
          text-align: center;
        }

        .context-item .label {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
        }

        .context-item .value {
          display: block;
          font-size: 14px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .mood-value {
          font-weight: 600;
        }

        .recommendation-reason {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }

        .recommendation-reason p {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.4;
        }

        .influences {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .influence-tag {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 11px;
        }

        .recommendation-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .tag {
          padding: 4px 10px;
          background: rgba(233, 69, 96, 0.2);
          color: #e94560;
          border-radius: 12px;
          font-size: 12px;
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .action-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-btn {
          background: linear-gradient(135deg, #e94560, #ff6b6b);
          color: white;
        }

        .play-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .play-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .section h4 {
          margin: 0 0 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .playlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }

        .playlist-card {
          cursor: pointer;
          transition: transform 0.2s;
        }

        .playlist-card:hover {
          transform: scale(1.05);
        }

        .playlist-card img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 6px;
        }

        .playlist-name {
          font-size: 12px;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}

export default SmartPlaySelector
