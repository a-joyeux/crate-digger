<script setup lang="ts">
import { DECADES, GENRES } from '../composables/useFilters'
import type { FilterState } from '../types/archive'

defineProps<{ modelValue: FilterState }>()
defineEmits<{
  setDecade: [decade: string | null]
  toggleGenre: [genre: string]
  clearGenres: []
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- ERA row -->
    <div class="flex items-center gap-3 min-w-0">
      <span class="font-mono text-xs text-text-secondary shrink-0 w-10 tracking-widest2 uppercase">ERA</span>
      <div class="-mr-5 pr-5 flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          class="filter-btn shrink-0"
          :class="{ active: modelValue.decade === null }"
          @click="$emit('setDecade', null)"
        >All</button>
        <button
          v-for="d in DECADES"
          :key="d"
          class="filter-btn shrink-0"
          :class="{ active: modelValue.decade === d }"
          @click="$emit('setDecade', d)"
        >{{ d }}</button>
      </div>
    </div>

    <!-- GENRE row -->
    <div class="flex items-center gap-3 min-w-0">
      <span class="font-mono text-xs text-text-secondary shrink-0 w-10 tracking-widest2 uppercase">GNR</span>
      <div class="-mr-5 pr-5 flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          class="filter-btn shrink-0"
          :class="{ active: modelValue.genres.length === 0 }"
          @click="$emit('clearGenres')"
        >All</button>
        <button
          v-for="g in GENRES"
          :key="g"
          class="filter-btn shrink-0"
          :class="{ active: modelValue.genres.includes(g) }"
          @click="$emit('toggleGenre', g)"
        >{{ g }}</button>
      </div>
    </div>
  </div>
</template>