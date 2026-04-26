import useDjStore from '../stores/djStore'

function Mixer() {
  const {
    crossfader,
    setCrossfader,
    currentTime,
    duration
  } = useDjStore()

  // 简化版混音器 - 单轨道版本
  // 实际项目中应该有双轨道（A/B Deck）

  const getProgressPercent = () => {
    if (!duration) return 0
    return (currentTime / duration) * 100
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">混音器</h2>

      {/* Crossfader */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-4">交叉推子 (Crossfader)</h4>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">A</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={crossfader}
            onChange={(e) => setCrossfader(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-gray-400">B</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Deck A</span>
          <span>Center</span>
          <span>Deck B</span>
        </div>
      </div>

      {/* 播放进度可视化 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-4">混音进度</h4>
        <div className="h-4 bg-dj-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-dj-accent to-dj-gold transition-all"
            style={{ width: `${getProgressPercent()}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>已播放: {Math.round(getProgressPercent())}%</span>
          <span>剩余: {100 - Math.round(getProgressPercent())}%</span>
        </div>
      </div>

      {/* 混音提示 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">混音技巧</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• 使用 Crossfader 在两个音轨间平滑过渡</li>
          <li>• 观察 BPM 显示器，同步节奏</li>
          <li>• 在波形达到低点时进行切换</li>
          <li>• 使用效果器增加过渡效果</li>
        </ul>
      </div>
    </div>
  )
}

export default Mixer
