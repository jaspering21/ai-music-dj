/**
 * AI Music DJ - 简化的音频引擎
 * 使用原生 HTML5 Audio，确保能播放
 */
class AudioEngine {
  constructor() {
    this.audioElement = null
    this.isInitialized = false
    this.bpm = 120
    this._callbacks = {}
  }

  /**
   * 初始化
   */
  async init() {
    if (this.isInitialized && this.audioElement) {
      console.log('AudioEngine already initialized')
      return
    }

    console.log('AudioEngine.init()')

    this.audioElement = new Audio()
    this.audioElement.preload = 'auto'
    this.audioElement.volume = 0.8

    // 监听事件
    this.audioElement.addEventListener('play', () => {
      console.log('audio play')
      this._callbacks.play?.()
    })
    this.audioElement.addEventListener('pause', () => {
      console.log('audio pause')
      this._callbacks.pause?.()
    })
    this.audioElement.addEventListener('ended', () => {
      console.log('audio ended')
      this._callbacks.ended?.()
    })
    this.audioElement.addEventListener('error', (e) => {
      console.error('audio error:', e)
      console.error('audioElement.error:', this.audioElement?.error)
    })
    this.audioElement.addEventListener('timeupdate', () => {
      this._callbacks.timeupdate?.(this.audioElement.currentTime)
    })

    this.isInitialized = true
  }

  /**
   * 加载音频
   */
  async loadAudio(url) {
    console.log('AudioEngine.loadAudio():', url)

    await this.init()

    // 处理相对URL（相对于后端服务器）
    if (url && url.startsWith('/api/')) {
      url = `http://localhost:3001${url}`
      console.log('AudioEngine.loadAudio() resolved URL:', url)
    }

    // 重置音频元素
    this.audioElement.pause()
    this.audioElement.removeAttribute('src')

    return new Promise((resolve, reject) => {
      // 检查是否已经可以播放
      if (this.audioElement.readyState >= 3) {
        console.log('already ready')
        resolve(this.audioElement.duration)
        return
      }

      const onCanPlay = () => {
        console.log('canplay event')
        this.audioElement.removeEventListener('canplay', onCanPlay)
        this.audioElement.removeEventListener('error', onError)
        resolve(this.audioElement.duration)
      }

      const onError = (e) => {
        console.error('load error:', e)
        this.audioElement.removeEventListener('canplay', onCanPlay)
        this.audioElement.removeEventListener('error', onError)
        reject(new Error('加载失败'))
      }

      this.audioElement.addEventListener('canplay', onCanPlay)
      this.audioElement.addEventListener('error', onError)

      this.audioElement.src = url
      this.audioElement.load()
    })
  }

  /**
   * 播放
   */
  play() {
    console.log('AudioEngine.play(), src:', this.audioElement?.src)
    if (!this.audioElement?.src) {
      console.warn('没有音频源')
      return
    }
    this.audioElement.play().catch(e => console.error('播放失败:', e))
  }

  /**
   * 暂停
   */
  pause() {
    this.audioElement?.pause()
  }

  /**
   * 跳转
   */
  seek(time) {
    if (this.audioElement) {
      this.audioElement.currentTime = time
    }
  }

  /**
   * 获取时长
   */
  getDuration() {
    return this.audioElement?.duration || 0
  }

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    return this.audioElement?.currentTime || 0
  }

  /**
   * 设置音量
   */
  setVolume(value) {
    console.log('AudioEngine.setVolume():', value)
    if (this.audioElement) {
      this.audioElement.volume = value
    }
  }

  /**
   * 设置 EQ (简化)
   */
  setEq(type, value) {
    // 简化版不处理 EQ
  }

  /**
   * 设置混响 (简化)
   */
  setReverb(value) {
  }

  /**
   * 设置延迟 (简化)
   */
  setDelay(value) {
  }

  /**
   * 设置滤波器 (简化)
   */
  setFilterFrequency(value) {
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate
    }
  }

  /**
   * 获取频谱数据 (返回空)
   */
  getFrequencyData() {
    return new Uint8Array(0)
  }

  /**
   * 获取波形数据 (返回空)
   */
  getWaveformData() {
    return new Uint8Array(0)
  }

  /**
   * BPM 检测 (简化)
   */
  async detectBPM() {
    return 120
  }

  /**
   * 监听时间更新
   */
  onTimeUpdate(callback) {
    this._callbacks.timeupdate = callback
  }

  /**
   * 监听播放结束
   */
  onEnded(callback) {
    this._callbacks.ended = callback
  }

  /**
   * 销毁
   */
  destroy() {
    console.log('AudioEngine.destroy()')
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
    }
    this.isInitialized = false
  }
}

// 导出单例
export default new AudioEngine()
