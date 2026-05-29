<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Track } from '../types/archive'
import type { PlayerStatus } from '../composables/usePlayer'

const props = defineProps<{
  track: Track
  status: PlayerStatus
  isBuffering: boolean
  currentTime: number
  duration: number
  volume: number
  hasPrev: boolean
}>()

const emit = defineEmits<{
  skip: []
  prev: []
  seek: [time: number]
  togglePlayPause: []
  setVolume: [v: number]
}>()

// --- Scrubber ---
const scrubbing = ref(false)
const scrubValue = ref(0)

watch(() => props.currentTime, (t) => {
  if (!scrubbing.value) scrubValue.value = t
})

const progress = computed(() => {
  const d = props.duration
  return d > 0 ? (scrubValue.value / d) * 100 : 0
})

function onScrubInput(e: Event): void {
  scrubbing.value = true
  scrubValue.value = Number((e.target as HTMLInputElement).value)
}
function onScrubEnd(e: Event): void {
  const val = Number((e.target as HTMLInputElement).value)
  scrubValue.value = val
  scrubbing.value = false
  emit('seek', val)
}

// --- Volume ---
const localVolume = ref(props.volume)
const prevVolume = ref(props.volume > 0 ? props.volume : 1)
const volScrubbing = ref(false)

watch(() => props.volume, (v) => { localVolume.value = v })

function onVolInput(e: Event): void {
  volScrubbing.value = true
  const v = Number((e.target as HTMLInputElement).value)
  localVolume.value = v
  emit('setVolume', v)
}

function onVolChange(): void {
  volScrubbing.value = false
}

function toggleMute(): void {
  const next = localVolume.value === 0 ? prevVolume.value : 0
  if (localVolume.value > 0) prevVolume.value = localVolume.value
  localVolume.value = next
  emit('setVolume', next)
}

// --- Time format ---
function formatTime(s: number): string {
  if (!isFinite(s) || s === 0) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
</script>

<template>
  <div class="flex flex-col gap-7">

    <!-- Track info -->
    <div class="flex flex-col gap-1 min-w-0">
      <p class="font-sans text-xl font-medium text-text-primary leading-snug">
        {{ track.title }}
      </p>
      <div class="flex items-baseline justify-between gap-4 min-w-0">
        <p class="font-sans text-sm text-text-secondary truncate">{{ track.artist }}</p>
        <span class="font-mono text-xs text-text-muted shrink-0 tabular-nums">{{ track.year }}</span>
      </div>
    </div>

    <!-- Timeline -->
    <div class="flex flex-col gap-1.5">
      <div class="timeline-wrap group" :class="{ 'is-active': scrubbing }">
        <div class="timeline-track">
          <div class="timeline-fill" :style="{ width: `${progress}%` }" />
        </div>
        <div class="timeline-thumb" :style="{ left: `${progress}%` }" />
        <input
          type="range"
          class="timeline-input"
          :min="0"
          :max="duration || 100"
          step="any"
          :value="scrubValue"
          :disabled="duration === 0"
          @input="onScrubInput"
          @change="onScrubEnd"
        />
      </div>
      <div class="flex justify-between">
        <span class="font-mono text-xs text-text-muted tabular-nums">
          {{ formatTime(scrubbing ? scrubValue : currentTime) }}
        </span>
        <span class="font-mono text-xs text-text-muted tabular-nums">{{ formatTime(duration) }}</span>
      </div>
    </div>

    <!-- Transport controls -->
    <div class="flex items-center justify-center gap-10">
      <button class="ctrl-sym" :disabled="!hasPrev" @click="$emit('prev')">←</button>

      <button class="ctrl-sym ctrl-sym--primary" @click="$emit('togglePlayPause')">
        <span v-if="isBuffering" class="text-sm tracking-widest">···</span>
        <span v-else-if="status === 'paused'">▶</span>
        <span v-else>II</span>
      </button>

      <button class="ctrl-sym" @click="$emit('skip')">→</button>
    </div>

    <!-- Volume -->
    <div class="flex items-center gap-3">
      <span class="font-mono text-xs text-text-muted shrink-0 w-10 tracking-widest2 uppercase">Vol</span>
      <div class="vol-wrap group flex-1" :class="{ 'is-active': volScrubbing }">
        <div class="vol-track">
          <div class="vol-fill" :style="{ width: `${localVolume * 100}%` }" />
        </div>
        <div class="vol-thumb" :style="{ left: `${localVolume * 100}%` }" />
        <input
          type="range"
          class="vol-input"
          min="0"
          max="1"
          step="0.01"
          :value="localVolume"
          @input="onVolInput"
          @change="onVolChange"
        />
      </div>
      <button
        class="vol-mute"
        :aria-label="localVolume === 0 ? 'Unmute' : 'Mute'"
        @click="toggleMute"
      >{{ localVolume === 0 ? '○' : '●' }}</button>
    </div>

  </div>
</template>

<style scoped>
/* Timeline */
.timeline-wrap {
  position: relative;
  display: flex;
  align-items: center;
  height: 20px;
  cursor: pointer;
}
.timeline-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background-color: theme('colors.surface.border');
  border-radius: 2px;
  transition: height 0.1s ease;
  overflow: hidden;
}
.timeline-wrap:hover .timeline-track,
.timeline-wrap.is-active .timeline-track { height: 5px; }

.timeline-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background-color: theme('colors.text.secondary');
  border-radius: 2px;
  transition: width 0s, background-color 0.15s ease;
}
.timeline-wrap:hover .timeline-fill,
.timeline-wrap.is-active .timeline-fill { background-color: theme('colors.text.accent'); }

.timeline-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: theme('colors.text.primary');
  pointer-events: none;
  transition: transform 0.1s ease;
}
.timeline-wrap:hover .timeline-thumb,
.timeline-wrap.is-active .timeline-thumb { transform: translate(-50%, -50%) scale(1); }

.timeline-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  padding: 0;
}
.timeline-input:disabled { cursor: default; }

/* Transport symbols */
.ctrl-sym {
  font-family: theme('fontFamily.mono');
  font-size: 1.125rem;
  line-height: 1;
  color: theme('colors.text.secondary');
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s;
}
.ctrl-sym:hover { color: theme('colors.text.primary'); }
.ctrl-sym:disabled { color: theme('colors.text.muted'); cursor: not-allowed; }

.ctrl-sym--primary {
  font-size: 1.5rem;
  color: theme('colors.text.primary');
  min-width: 56px;
  min-height: 56px;
}
.ctrl-sym--primary:hover { color: theme('colors.text.accent'); }

/* Volume — mirrors timeline */
.vol-wrap {
  position: relative;
  display: flex;
  align-items: center;
  height: 20px;
  cursor: pointer;
}
.vol-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background-color: theme('colors.surface.border');
  border-radius: 2px;
  transition: height 0.1s ease;
  overflow: hidden;
}
.vol-wrap:hover .vol-track,
.vol-wrap.is-active .vol-track { height: 5px; }

.vol-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background-color: theme('colors.text.secondary');
  border-radius: 2px;
  transition: background-color 0.15s ease;
}
.vol-wrap:hover .vol-fill,
.vol-wrap.is-active .vol-fill { background-color: theme('colors.text.accent'); }

.vol-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: theme('colors.text.primary');
  pointer-events: none;
  transition: transform 0.1s ease;
}
.vol-wrap:hover .vol-thumb,
.vol-wrap.is-active .vol-thumb { transform: translate(-50%, -50%) scale(1); }

.vol-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  padding: 0;
}

.vol-mute {
  font-size: 0.6rem;
  color: theme('colors.text.muted');
  line-height: 1;
  flex-shrink: 0;
  min-width: 28px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s;
}
.vol-mute:hover { color: theme('colors.text.secondary'); }
</style>