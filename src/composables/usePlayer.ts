import { ref, computed, onUnmounted } from 'vue'
import type { Track } from '../types/archive'

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export function usePlayer(onEnded: () => void) {
  const audio = new Audio()
  audio.preload = 'none'

  const status = ref<PlayerStatus>('idle')
  const currentTrack = ref<Track | null>(null)
  const prefetchedTrack = ref<Track | null>(null)
  const isBuffering = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)

  const hasPrefetch = computed(() => prefetchedTrack.value !== null)
  const history = ref<Track[]>([])
  const hasPrev = computed(() => history.value.length > 0)

  audio.addEventListener('waiting', () => { isBuffering.value = true })
  audio.addEventListener('canplay', () => { isBuffering.value = false })
  audio.addEventListener('playing', () => {
    isBuffering.value = false
    status.value = 'playing'
  })
  audio.addEventListener('timeupdate', () => { currentTime.value = audio.currentTime })
  audio.addEventListener('durationchange', () => { duration.value = isFinite(audio.duration) ? audio.duration : 0 })
  audio.addEventListener('loadedmetadata', () => { duration.value = isFinite(audio.duration) ? audio.duration : 0 })
  audio.addEventListener('ended', () => {
    status.value = 'idle'
    currentTime.value = 0
    duration.value = 0
    onEnded()
  })
  audio.addEventListener('error', () => {
    status.value = 'error'
    isBuffering.value = false
  })

  // Unlock audio context on first user gesture (iOS Safari)
  let unlocked = false
  function ensureUnlocked(): void {
    if (unlocked) return
    unlocked = true
    audio.src = ''
    audio.load()
  }

  function _playTrack(track: Track): void {
    currentTrack.value = track
    status.value = 'loading'
    isBuffering.value = true
    currentTime.value = 0
    duration.value = 0
    audio.src = track.audioUrl
    audio.load()
    audio.play().catch(() => { status.value = 'error' })
  }

  function play(track: Track): void {
    ensureUnlocked()
    if (currentTrack.value) {
      history.value.push(currentTrack.value)
      if (history.value.length > 20) history.value.shift()
    }
    _playTrack(track)
  }

  function back(): void {
    const prev = history.value.pop()
    if (prev) _playTrack(prev)
  }

  function skip(): void {
    if (prefetchedTrack.value) {
      const next = prefetchedTrack.value
      prefetchedTrack.value = null
      play(next)
    }
  }

  function togglePlayPause(): void {
    if (audio.paused) {
      audio.play().catch(() => { status.value = 'error' })
    } else {
      audio.pause()
      status.value = 'paused'
    }
  }

  audio.addEventListener('pause', () => {
    if (status.value === 'playing') status.value = 'paused'
  })

  function setVolume(v: number): void {
    audio.volume = Math.max(0, Math.min(1, v))
    volume.value = audio.volume
  }

  function seek(time: number): void {
    if (isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.max(0, Math.min(time, audio.duration))
    }
  }

  function stop(): void {
    audio.pause()
    audio.src = ''
    status.value = 'idle'
    currentTrack.value = null
    isBuffering.value = false
    currentTime.value = 0
    duration.value = 0
  }

  function setPrefetch(track: Track | null): void {
    prefetchedTrack.value = track
  }

  onUnmounted(() => {
    audio.pause()
    audio.src = ''
  })

  return {
    status,
    currentTrack,
    prefetchedTrack,
    isBuffering,
    currentTime,
    duration,
    volume,
    hasPrefetch,
    hasPrev,
    play,
    back,
    skip,
    stop,
    seek,
    togglePlayPause,
    setVolume,
    setPrefetch,
    ensureUnlocked,
  }
}