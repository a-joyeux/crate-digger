<script setup lang="ts">
import { watch, ref } from 'vue'

const props = defineProps<{ message: string | null }>()

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.message,
  (msg) => {
    if (timer) clearTimeout(timer)
    if (msg) {
      visible.value = true
      timer = setTimeout(() => { visible.value = false }, 4000)
    } else {
      visible.value = false
    }
  },
)
</script>

<template>
  <Transition name="banner">
    <div
      v-if="visible && message"
      class="border border-surface-border bg-surface-raised px-4 py-3 font-mono text-xs text-text-secondary"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>