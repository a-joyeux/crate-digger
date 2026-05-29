<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppFilters from './components/AppFilters.vue'
import ShuffleButton from './components/ShuffleButton.vue'
import PlayerBar from './components/PlayerBar.vue'
import StatusBanner from './components/StatusBanner.vue'
import { useFilters } from './composables/useFilters'
import { useArchiveSearch } from './composables/useArchiveSearch'
import { useTrackMetadata } from './composables/useTrackMetadata'
import { usePlayer } from './composables/usePlayer'

const { filters, setDecade, toggleGenre, clearGenres, buildQuery } = useFilters()
const search = useArchiveSearch()
const { fetchTrack } = useTrackMetadata()
const player = usePlayer(onTrackEnded)

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const filtersExpanded = ref(true)

let requestEpoch = 0

// Auto-collapse filters when a track starts playing
watch(() => player.currentTrack.value, (track) => {
  if (track) filtersExpanded.value = false
})

const filterSummary = computed(() => {
  const parts: string[] = []
  if (filters.decade) parts.push(filters.decade)
  if (filters.genres.length > 0) parts.push(filters.genres.join(', '))
  return parts.length > 0 ? parts.join(' · ') : 'All'
})

function onSetDecade(decade: string | null): void {
  setDecade(decade)
  requestEpoch++
  player.setPrefetch(null)
}

function onToggleGenre(genre: string): void {
  toggleGenre(genre)
  requestEpoch++
  player.setPrefetch(null)
}

function onClearGenres(): void {
  clearGenres()
  requestEpoch++
  player.setPrefetch(null)
}

async function loadAndPlay(epoch: number): Promise<void> {
  const identifier = await search.fetchRandomIdentifier(buildQuery())
  if (epoch !== requestEpoch) return
  if (!identifier) {
    errorMessage.value = 'Could not load a track — try again.'
    isLoading.value = false
    return
  }
  const track = await fetchTrack(identifier)
  if (epoch !== requestEpoch) return
  if (!track) {
    errorMessage.value = 'Could not load a track — try again.'
    isLoading.value = false
    return
  }
  player.play(track)
  isLoading.value = false
  prefetchNext(epoch)
}

async function prefetchNext(epoch: number): Promise<void> {
  const identifier = await search.fetchRandomIdentifier(buildQuery())
  if (epoch !== requestEpoch) return
  if (!identifier) return
  const track = await fetchTrack(identifier)
  if (epoch !== requestEpoch) return
  if (track) player.setPrefetch(track)
}

function onShuffle(): void {
  player.ensureUnlocked()
  errorMessage.value = null
  requestEpoch++
  const epoch = requestEpoch
  if (player.hasPrefetch.value) {
    player.skip()
    prefetchNext(epoch)
    return
  }
  isLoading.value = true
  loadAndPlay(epoch)
}

function onSkip(): void {
  requestEpoch++
  const epoch = requestEpoch
  if (player.hasPrefetch.value) {
    player.skip()
    prefetchNext(epoch)
  } else {
    isLoading.value = true
    loadAndPlay(epoch)
  }
}

function onTrackEnded(): void {
  onSkip()
}

watch(search.error, (msg) => {
  if (msg) errorMessage.value = 'Could not load a track — try again.'
})
</script>

<template>
  <div class="min-h-dvh bg-surface-base flex flex-col">
    <div class="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-6 sm:py-10 gap-6">

      <!-- Header -->
      <header class="flex items-center justify-between min-h-[1.5rem]">
        <h1 class="font-mono text-xs tracking-widest2 uppercase text-text-muted">
          Crate Digger
        </h1>
        <!-- Filter toggle — only shown while playing -->
        <button
          v-if="player.currentTrack.value"
          class="font-mono text-xs text-text-muted hover:text-text-secondary transition-colors duration-100 flex items-center gap-1.5"
          @click="filtersExpanded = !filtersExpanded"
        >
          {{ filterSummary }}
          <span class="text-text-muted opacity-60">{{ filtersExpanded ? '▴' : '▾' }}</span>
        </button>
      </header>

      <!-- Filters — visible when idle or manually expanded while playing -->
      <Transition name="filters">
        <AppFilters
          v-if="!player.currentTrack.value || filtersExpanded"
          :model-value="filters"
          @set-decade="onSetDecade"
          @toggle-genre="onToggleGenre"
          @clear-genres="onClearGenres"
        />
      </Transition>

      <!-- Main area -->
      <div class="flex-1 flex flex-col justify-center gap-6">
        <StatusBanner :message="errorMessage" />

        <ShuffleButton
          v-if="!player.currentTrack.value"
          :loading="isLoading"
          @shuffle="onShuffle"
        />

        <PlayerBar
          v-if="player.currentTrack.value"
          :track="player.currentTrack.value"
          :status="player.status.value"
          :is-buffering="player.isBuffering.value"
          :current-time="player.currentTime.value"
          :duration="player.duration.value"
          :volume="player.volume.value"
          :has-prev="player.hasPrev.value"
          @prev="player.back"
          @skip="onSkip"
          @seek="player.seek"
          @toggle-play-pause="player.togglePlayPause"
          @set-volume="player.setVolume"
        />
      </div>

      <footer class="font-mono text-xs text-text-muted text-center">
        Audio from <a
          href="https://archive.org"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-text-secondary transition-colors duration-100"
        >Internet Archive</a>
      </footer>

    </div>
  </div>
</template>

<style>
.filters-enter-active,
.filters-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.filters-enter-from,
.filters-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>