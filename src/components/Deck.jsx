import { useEffect, useRef } from 'react'
import useDjStore from '../stores/djStore'
import useAudioEngine from '../hooks/useAudioEngine'

function Deck() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    bpm,
    eqHigh,
    eqMid,
    eqLow,
    setPlaying,
    setVolume,
    setEqHigh,
    setEqMid,
    setEqLow
  } = useDjStore()

  const { getWaveformData } = useAudioEngine()

  // 绘制波形
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    const draw = () => {
      const data = getWaveformData()

      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, width, height)

      ctx.lineWidth = 2
      ctx.strokeStyle = '#e94560'
      ctx.beginPath()

      const sliceWidth = width / data.length
      let x = 0

      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0
        const y = (v * height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        x += sliceWidth
      }

      ctx.stroke()

      // 绘制播放进度
      if (duration > 0) {
        const progress = (currentTime / duration) * width
        ctx.strokeStyle = '#f5c518'
        ctx.beginPath()
        ctx.moveTo(progress, 0)
        ctx.lineTo(progress, height)
        ctx.stroke()
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [currentTime, duration, getWaveformData])

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">DJ 控制台</h2>

      {/* 当前曲目信息 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {currentTrack?.name || '未选择曲目'}
            </h3>
            <p className="text-gray-400">
              {currentTrack?.artist || '---'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-dj-accent">{bpm}</span>
            <span className="text-gray-400 text-sm block">BPM</span>
          </div>
        </div>

        {/* 波形显示 */}
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          className="w-full bg-dj-dark rounded"
        />

        {/* 时间显示 */}
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* 播放控制 */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-dj-accent hover:opacity-80 flex items-center justify-center text-2xl"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* 音量控制 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">音量</h4>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* 三段 EQ */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-4">EQ 均衡器</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400">低音 (Low)</label>
            <input
              type="range"
              min="-12"
              max="12"
              value={eqLow}
              onChange={(e) => setEqLow(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-dj-accent">{eqLow > 0 ? '+' : ''}{eqLow.toFixed(1)} dB</span>
          </div>
          <div>
            <label className="text-sm text-gray-400">中音 (Mid)</label>
            <input
              type="range"
              min="-12"
              max="12"
              value={eqMid}
              onChange={(e) => setEqMid(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-dj-accent">{eqMid > 0 ? '+' : ''}{eqMid.toFixed(1)} dB</span>
          </div>
          <div>
            <label className="text-sm text-gray-400">高音 (High)</label>
            <input
              type="range"
              min="-12"
              max="12"
              value={eqHigh}
              onChange={(e) => setEqHigh(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-dj-accent">{eqHigh > 0 ? '+' : ''}{eqHigh.toFixed(1)} dB</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Deck
