import { useEffect, useRef, useCallback } from 'react'
import useDjStore from '../stores/djStore'

const PREFETCH_THRESHOLD = 0.75 // Start prefetch when 75% through
const PREFETCH_LOOKAHEAD = 10 // seconds

function usePrefetch(audioEngine) {
  const { queue, currentTrack } = useDjStore()
  const prefetchedRef = useRef(new Set())
  const audioElementRef = useRef(null)

  // Get audio element from engine
  const getAudioElement = useCallback(() => {
    if (audioEngine?.audioElement) {
      return audioEngine.audioElement
    }
    return null
  }, [audioEngine])

  // Prefetch next track
  const prefetchNextTrack = useCallback(() => {
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id)
    if (currentIndex < 0 || currentIndex >= queue.length - 1) {
      return // No next track
    }

    const nextTrack = queue[currentIndex + 1]
    if (prefetchedRef.current.has(nextTrack.id)) {
      return // Already prefetched
    }

    // Prefetch logic - create invisible audio element to cache
    const prefetchAudio = new Audio()
    prefetchAudio.preload = 'auto'

    // Build URL (this would come from the actual track data in a real app)
    // For now, we just mark it as prefetched
    prefetchedRef.current.add(nextTrack.id)
    console.log(`Prefetching: ${nextTrack.name}`)
  }, [queue, currentTrack])

  // Check if prefetch should start
  const checkPrefetch = useCallback(() => {
    const audio = getAudioElement()
    if (!audio || !audio.duration) return

    const progress = audio.currentTime / audio.duration
    const remainingTime = audio.duration - audio.currentTime

    // Start prefetch when we're 75% through or 10 seconds remaining
    if (progress >= PREFETCH_THRESHOLD || remainingTime <= PREFETCH_LOOKAHEAD) {
      prefetchNextTrack()
    }
  }, [getAudioElement, prefetchNextTrack])

  // Set up prefetch listener
  useEffect(() => {
    const audio = getAudioElement()
    if (!audio) return

    audio.addEventListener('timeupdate', checkPrefetch)

    return () => {
      audio.removeEventListener('timeupdate', checkPrefetch)
    }
  }, [getAudioElement, checkPrefetch])

  // Clear prefetch cache when queue changes significantly
  useEffect(() => {
    prefetchedRef.current.clear()
  }, [queue.length])

  return {
    prefetchNextTrack,
    isPrefetched: (trackId) => prefetchedRef.current.has(trackId)
  }
}

export default usePrefetch
