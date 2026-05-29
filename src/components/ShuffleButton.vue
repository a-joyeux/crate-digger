<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{ loading: boolean }>()
defineEmits<{ shuffle: [] }>()

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const frameIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

watch(
  () => props.loading,
  (v) => {
    if (v) {
      timer = setInterval(() => {
        frameIndex.value = (frameIndex.value + 1) % FRAMES.length
      }, 80)
    } else {
      if (timer) { clearInterval(timer); timer = null }
      frameIndex.value = 0
    }
  },
  { immediate: true },
)

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <button
    class="w-full py-8 font-mono text-xs tracking-widest2 uppercase border border-surface-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
    :disabled="loading"
    @click="$emit('shuffle')"
  >
    <span v-if="loading" aria-label="Loading">{{ FRAMES[frameIndex] }}</span>
    <span v-else>Shuffle</span>
  </button>
</template>