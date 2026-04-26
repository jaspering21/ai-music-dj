import useDjStore from '../stores/djStore'

function Effects() {
  const {
    reverb,
    delay,
    filter,
    setReverb,
    setDelay,
    setFilter
  } = useDjStore()

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">效果器</h2>

      {/* 混响 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">混响 (Reverb)</h4>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={reverb}
          onChange={(e) => setReverb(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>干</span>
          <span>{Math.round(reverb * 100)}%</span>
          <span>湿</span>
        </div>
      </div>

      {/* 延迟 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">延迟 (Delay)</h4>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={delay}
          onChange={(e) => setDelay(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>关闭</span>
          <span>{Math.round(delay * 100)}%</span>
          <span>最大</span>
        </div>
      </div>

      {/* 滤波器 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">滤波器 (Filter)</h4>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={filter}
          onChange={(e) => setFilter(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>低频</span>
          <span>中频</span>
          <span>高频</span>
        </div>
      </div>

      {/* 预设效果 */}
      <div className="bg-dj-primary p-4 rounded-lg">
        <h4 className="font-semibold mb-2">预设效果</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => { setReverb(0.5); setDelay(0.3); }}
            className="py-2 px-4 bg-dj-dark rounded hover:bg-dj-accent transition"
          >
            大厅
          </button>
          <button
            onClick={() => { setReverb(0.2); setDelay(0.5); }}
            className="py-2 px-4 bg-dj-dark rounded hover:bg-dj-accent transition"
          >
            地下室
          </button>
          <button
            onClick={() => { setFilter(0.8); setDelay(0.4); }}
            className="py-2 px-4 bg-dj-dark rounded hover:bg-dj-accent transition"
          >
            爆炸
          </button>
        </div>
      </div>
    </div>
  )
}

export default Effects
