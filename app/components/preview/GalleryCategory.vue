<script setup lang="ts">
import type { GalleryCategory } from '~/utils/theme/messages'

defineProps<{ category: GalleryCategory }>()
</script>

<template>
  <PreviewGalleryForm v-if="category === 'form'" />
  <PreviewGalleryButtons v-else-if="category === 'button'" />
  <PreviewGalleryData v-else-if="category === 'data'" />
  <PreviewGalleryPanels v-else-if="category === 'panel'" />
  <PreviewGalleryOverlays v-else-if="category === 'overlay'" />
  <PreviewGalleryMenus v-else-if="category === 'menu'" />
  <PreviewGalleryMessages v-else-if="category === 'messages'" />
  <PreviewGalleryMedia v-else-if="category === 'media'" />
  <PreviewGalleryFiles v-else-if="category === 'file'" />
  <PreviewGalleryMisc v-else />
</template>
