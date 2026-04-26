import { create } from 'zustand'

const useContextStore = create((set, get) => ({
  // Weather context
  weather: null,
  weatherLoading: false,
  weatherError: null,
  weatherLastUpdated: null,

  // DateTime context
  datetime: null,

  // Combined mood/energy state
  currentMood: 'neutral',
  currentEnergy: 'moderate', // low, moderate, high
  musicRecommendation: '',

  // Session context
  sessionStart: Date.now(),
  interactionCount: 0,
  lastInteraction: null,

  // Actions
  setWeather: (weather) => set({
    weather,
    weatherLastUpdated: Date.now(),
    weatherError: null
  }),

  setWeatherLoading: (loading) => set({ weatherLoading: loading }),

  setWeatherError: (error) => set({ weatherError: error }),

  setDatetime: (datetime) => set({ datetime }),

  setMood: (mood) => set({ currentMood: mood }),

  setEnergy: (energy) => set({ currentEnergy: energy }),

  setMusicRecommendation: (rec) => set({ musicRecommendation: rec }),

  updateContext: async () => {
    try {
      const response = await fetch('/api/context')
      if (!response.ok) throw new Error('Failed to fetch context')
      const data = await response.json()

      set({
        weather: data.weather,
        datetime: data.datetime,
        currentMood: data.mood,
        currentEnergy: data.energy,
        musicRecommendation: data.recommendation,
        weatherLastUpdated: Date.now()
      })
    } catch (error) {
      console.error('Failed to update context:', error)
      set({ weatherError: error.message })
    }
  },

  recordInteraction: () => set(state => ({
    interactionCount: state.interactionCount + 1,
    lastInteraction: Date.now()
  })),

  resetSession: () => set({
    sessionStart: Date.now(),
    interactionCount: 0,
    lastInteraction: null
  }),

  // Computed: get combined context summary
  getContextSummary: () => {
    const { weather, datetime, currentMood, currentEnergy } = get()
    return {
      weather: weather ? `${weather.city} ${weather.temp}°C ${weather.conditionDesc}` : null,
      time: datetime ? `${datetime.dayLabel} ${datetime.timePeriod}` : null,
      season: datetime?.season,
      mood: currentMood,
      energy: currentEnergy,
      isWeekend: datetime?.isWeekend,
      holiday: datetime?.holiday
    }
  }
}))

export default useContextStore
