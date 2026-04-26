import { useEffect, useCallback } from 'react'
import AudioEngine from '../audio/AudioEngine'
import useDjStore from '../stores/djStore'

/**
 * 音频引擎 React Hook
 */
const useAudioEngine = () => {
  const {
    isPlaying,
    volume,
    eqHigh,
    eqMid,
    eqLow,
    reverb,
    delay,
    filter,
    currentTrack,
    setCurrentTime,
    setDuration,
    setBpm,
    setPlaying
  } = useDjStore()

  // 初始化音频引擎
  useEffect(() => {
    AudioEngine.init()

    // 监听时间更新
    AudioEngine.onTimeUpdate((time) => {
      setCurrentTime(time)
    })

    // 监听播放结束 - 自动播放下一首
    AudioEngine.onEnded(() => {
      const { queue, currentTrack, nextTrack } = useDjStore.getState()
      const currentIndex = queue.findIndex(t => t?.id === currentTrack?.id)
      if (currentIndex < queue.length - 1) {
        nextTrack()
      } else {
        setPlaying(false)
      }
    })

    // 不要在这里 destroy！切换组件时保持音频引擎运行
  }, [])

  // 同步音量
  useEffect(() => {
    AudioEngine.setVolume(volume)
  }, [volume])

  // 同步 EQ
  useEffect(() => {
    AudioEngine.setEq('high', eqHigh)
    AudioEngine.setEq('mid', eqMid)
    AudioEngine.setEq('low', eqLow)
  }, [eqHigh, eqMid, eqLow])

  // 同步效果器
  useEffect(() => {
    AudioEngine.setReverb(reverb)
    AudioEngine.setDelay(delay)
    AudioEngine.setFilterFrequency(filter)
  }, [reverb, delay, filter])

  // 播放/暂停控制
  useEffect(() => {
    if (isPlaying) {
      AudioEngine.play()
    } else {
      AudioEngine.pause()
    }
  }, [isPlaying])

  // 自动加载当前轨道变化后的新歌曲（仅在自动切歌时触发）
  useEffect(() => {
    if (!currentTrack || !isPlaying) return

    // 检查 AudioEngine 是否已加载了这首歌（避免重复加载）
    const currentSrc = AudioEngine.audioElement?.src || ''
    if (currentSrc.includes(`/stream/${currentTrack.id}`)) {
      // 已加载同样的歌，跳过
      return
    }

    // 获取歌曲URL并加载
    fetch(`/api/netease/song/url/${currentTrack.id}`)
      .then(r => r.json())
      .then(async (data) => {
        if (data.data?.[0]?.url) {
          await AudioEngine.loadAudio(data.data[0].url)
          AudioEngine.play()
        }
      })
      .catch(err => console.error('自动加载下一首失败:', err))
  }, [currentTrack, isPlaying])

  // 加载音频
  const loadTrack = useCallback(async (url) => {
    const duration = await AudioEngine.loadAudio(url)
    setDuration(duration)
    // 检测 BPM
    const bpm = await AudioEngine.detectBPM()
    setBpm(bpm)
  }, [setDuration, setBpm])

  // 跳转
  const seek = useCallback((time) => {
    AudioEngine.seek(time)
  }, [])

  // 音高调整
  const setPitch = useCallback((semitones) => {
    // 将半音转换为播放速率
    const rate = Math.pow(2, semitones / 12)
    AudioEngine.setPlaybackRate(rate)
  }, [])

  return {
    loadTrack,
    seek,
    setPitch,
    getFrequencyData: () => AudioEngine.getFrequencyData(),
    getWaveformData: () => AudioEngine.getWaveformData()
  }
}

export default useAudioEngine
