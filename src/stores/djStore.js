import { create } from 'zustand'

const useDjStore = create((set, get) => ({
  // 当前播放状态
  isPlaying: false,
  currentTrack: null,
  currentTime: 0,
  duration: 0,
  volume: 0.8,

  // BPM 相关
  bpm: 120,
  targetBpm: 120,

  // EQ
  eqHigh: 0,
  eqMid: 0,
  eqLow: 0,

  // Crossfader
  crossfader: 0.5,

  // 效果器
  reverb: 0,
  delay: 0,
  filter: 0,

  // 歌单
  playlists: [],
  currentPlaylist: null,
  queue: [],

  // AI 歌词
  generatedLyrics: '',

  // Cookie 状态
  hasNeteaseCookie: false,

  // Actions
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  setBpm: (bpm) => set({ bpm }),
  setTargetBpm: (bpm) => set({ targetBpm: bpm }),

  setEqHigh: (value) => set({ eqHigh: value }),
  setEqMid: (value) => set({ eqMid: value }),
  setEqLow: (value) => set({ eqLow: value }),

  setCrossfader: (value) => set({ crossfader: value }),

  setReverb: (value) => set({ reverb: value }),
  setDelay: (value) => set({ delay: value }),
  setFilter: (value) => set({ filter: value }),

  setPlaylists: (playlists) => set({ playlists }),
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
  setQueue: (queue) => set({ queue }),

  setGeneratedLyrics: (lyrics) => set({ generatedLyrics: lyrics }),

  setHasNeteaseCookie: (has) => set({ hasNeteaseCookie: has }),

  // 播放下一首
  nextTrack: () => {
    const { queue, currentTrack } = get()
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id)
    if (currentIndex < queue.length - 1) {
      set({ currentTrack: queue[currentIndex + 1] })
    }
  },

  // 播放上一首
  prevTrack: () => {
    const { queue, currentTrack } = get()
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id)
    if (currentIndex > 0) {
      set({ currentTrack: queue[currentIndex - 1] })
    }
  }
}))

export default useDjStore
