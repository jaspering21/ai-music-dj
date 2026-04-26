// useContextAggregator.js - Assembles 6 fragments of context

import { useState, useEffect, useCallback } from 'react'
import useContextStore from '../stores/contextStore'
import useDjStore from '../stores/djStore'
import { calculateMood } from '../context/MoodMapper'
import { buildSystemPrompt, buildShortContext, buildRecommendationContext } from '../context/SystemPromptBuilder'

const useContextAggregator = () => {
  const [isAggregating, setIsAggregating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState(null)

  // Get stores
  const {
    weather,
    datetime,
    currentMood,
    currentEnergy,
    musicRecommendation
  } = useContextStore()

  const { queue, currentTrack } = useDjStore()

  // Fetch all context data
  const fetchAllContexts = useCallback(async () => {
    setIsAggregating(true)
    setError(null)

    try {
      // Fetch context from server
      const response = await fetch('/api/context')
      if (!response.ok) throw new Error('Failed to fetch context')
      const data = await response.json()

      // Update context store
      useContextStore.getState().setWeather(data.weather)
      useContextStore.getState().setDatetime(data.datetime)
      useContextStore.getState().setMood(data.mood)
      useContextStore.getState().setEnergy(data.energy)
      useContextStore.getState().setMusicRecommendation(data.recommendation)

      setLastUpdated(Date.now())
    } catch (err) {
      setError(err.message)
      console.error('Context aggregation error:', err)
    } finally {
      setIsAggregating(false)
    }
  }, [])

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/brain/profile')
      if (!response.ok) throw new Error('Failed to fetch preferences')
      return await response.json()
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
      return { taste: null, routines: null }
    }
  }, [])

  // Get recent plays from queue
  const getRecentPlays = useCallback(() => {
    // Use last 10 unique tracks from queue
    const seen = new Set()
    const recent = []

    // Add current track first if exists
    if (currentTrack) {
      recent.push({
        id: currentTrack.id,
        name: currentTrack.name,
        artist: currentTrack.artist,
        playedAt: Date.now()
      })
      seen.add(currentTrack.id)
    }

    // Add from queue (most recent first)
    for (let i = queue.length - 1; i >= 0 && recent.length < 10; i--) {
      const track = queue[i]
      if (!seen.has(track.id)) {
        recent.push({
          id: track.id,
          name: track.name,
          artist: track.artist,
          playedAt: Date.now() - (recent.length * 30000) // Estimate
        })
        seen.add(track.id)
      }
    }

    return recent
  }, [queue, currentTrack])

  // Get current session state
  const getSessionState = useCallback(() => {
    return {
      mood: currentMood,
      energy: currentEnergy,
      intent: musicRecommendation ? 'listening' : 'idle'
    }
  }, [currentMood, currentEnergy, musicRecommendation])

  // Build full system prompt (6 fragments)
  const buildFullPrompt = useCallback(async () => {
    const preferences = await fetchPreferences()

    const fragments = {
      systemPrompt: null, // Use default
      userPreferences: preferences,
      externalContext: { weather, datetime },
      deviceState: { ampOn: true }, // Assume on
      recentPlays: getRecentPlays(),
      sessionState: getSessionState()
    }

    return buildSystemPrompt(fragments)
  }, [weather, datetime, getRecentPlays, getSessionState])

  // Build short context for simple commands
  const buildContextForCommand = useCallback(() => {
    return buildShortContext({
      weather,
      datetime,
      mood: currentMood,
      energy: currentEnergy
    })
  }, [weather, datetime, currentMood, currentEnergy])

  // Build recommendation context
  const buildRecommendation = useCallback(async () => {
    const preferences = await fetchPreferences()

    return buildRecommendationContext({
      weather,
      datetime,
      mood: currentMood,
      energy: currentEnergy,
      userPreferences: preferences
    })
  }, [weather, datetime, currentMood, currentEnergy])

  // Auto-refresh context periodically (every 5 minutes)
  useEffect(() => {
    // Initial fetch
    fetchAllContexts()

    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchAllContexts()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchAllContexts])

  // Calculate derived mood when weather/time changes
  useEffect(() => {
    if (weather && datetime) {
      const calculated = calculateMood(weather, datetime)
      if (calculated.mood !== currentMood) {
        useContextStore.getState().setMood(calculated.mood)
      }
      if (calculated.energy !== currentEnergy) {
        useContextStore.getState().setEnergy(calculated.energy)
      }
    }
  }, [weather, datetime])

  return {
    // State
    isAggregating,
    lastUpdated,
    error,

    // Context data
    weather,
    datetime,
    currentMood,
    currentEnergy,
    musicRecommendation,

    // Actions
    fetchAllContexts,

    // Builders
    buildFullPrompt,
    buildContextForCommand,
    buildRecommendation,

    // Computed
    getRecentPlays,
    getSessionState
  }
}

export default useContextAggregator
