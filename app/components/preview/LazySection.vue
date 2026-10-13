<script setup lang="ts">
// Renders its content once it scrolls near the viewport, then keeps it. Every rendered
// component restyles on each theme change, so the "All" gallery only pays for what you've seen.
const props = withDefaults(defineProps<{ eager?: boolean, placeholderHeight?: string }>(), { eager: false, placeholderHeight: '24rem' })

const root = ref<HTMLElement | null>(null)
const visible = ref(props.eager)
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (visible.value || !root.value) return
  observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      visible.value = true
      observer?.disconnect()
    }
  }, { rootMargin: '800px 0px' })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="root"
    :style="visible ? undefined : { minHeight: props.placeholderHeight }"
  >
    <slot v-if="visible" />
  </div>
</template>
