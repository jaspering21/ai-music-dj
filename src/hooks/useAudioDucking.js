import { useRef, useCallback } from 'react'

const DUCKING_LEVEL = 0.2 // BGM volume when ducking
const DUCK_IN_DURATION = 200 // ms to fade down
const DUCK_OUT_DURATION = 500 // ms to fade back up

function useAudioDucking() {
  const originalGainRef = useRef(1.0)
  const isDuckingRef = useRef(false)
  const animationRef = useRef(null)

  // Fade function using requestAnimationFrame
  const fade = (from, to, duration, onUpdate, onComplete) => {
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased

      onUpdate(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        onComplete && onComplete()
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)
  }

  // Start ducking (fade BGM down)
  const duck = useCallback((getGainNode, onDucked) => {
    if (isDuckingRef.current) return

    const gainNode = getGainNode()
    if (!gainNode) return

    isDuckingRef.current = true
    const audioParam = gainNode.gain

    // Store original value
    originalGainRef.current = audioParam.value

    fade(
      audioParam.value,
      DUCKING_LEVEL,
      DUCK_IN_DURATION,
      (value) => {
        audioParam.value = value
      },
      () => {
        onDucked && onDucked()
      }
    )
  }, [])

  // End ducking (fade BGM back up)
  const unduck = useCallback((getGainNode, onUnducked) => {
    if (!isDuckingRef.current) return

    const gainNode = getGainNode()
    if (!gainNode) return

    fade(
      gainNode.gain.value,
      originalGainRef.current,
      DUCK_OUT_DURATION,
      (value) => {
        gainNode.gain.value = value
      },
      () => {
        isDuckingRef.current = false
        onUnducked && onUnducked()
      }
    )
  }, [])

  // Quick duck/unduck for short announcements
  const duckBriefly = useCallback(async (getGainNode, duration = 2000) => {
    duck(getGainNode)
    await new Promise(resolve => setTimeout(resolve, duration))
    unduck(getGainNode)
  }, [duck, unduck])

  // Cleanup on unmount
  const cleanup = useCallback((getGainNode) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (isDuckingRef.current && getGainNode) {
      const gainNode = getGainNode()
      if (gainNode) {
        gainNode.gain.value = originalGainRef.current
      }
    }
    isDuckingRef.current = false
  }, [])

  return {
    duck,
    unduck,
    duckBriefly,
    cleanup,
    isDucking: isDuckingRef.current
  }
}

export default useAudioDucking
