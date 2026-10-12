<script setup lang="ts">
import { CATEGORY_META } from '~/utils/preview-categories'
import { PREVIEW_CATEGORIES, type PreviewCategory } from '~/utils/theme/messages'

// Every themable PrimeVue component, grouped like the PrimeVue docs. Only the
// active category renders, which keeps theme updates fast. Inside the editor the
// category comes from the editor toolbar (so side-by-side panes stay in sync);
// opened standalone, the gallery shows its own tabs.
const props = defineProps<{ category?: PreviewCategory }>()

const local = ref<PreviewCategory>('form')
const active = computed(() => props.category ?? local.value)
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-4">
    <Tabs
      v-if="!props.category"
      v-model:value="local"
      scrollable
      class="sticky top-0 z-10"
    >
      <TabList>
        <Tab
          v-for="id in PREVIEW_CATEGORIES"
          :key="id"
          :value="id"
          class="flex items-center gap-2"
        >
          <i
            :class="CATEGORY_META[id].icon"
            aria-hidden="true"
          />
          {{ CATEGORY_META[id].label }}
          <Badge
            :value="CATEGORY_META[id].count"
            severity="secondary"
            size="small"
          />
        </Tab>
      </TabList>
    </Tabs>

    <div :aria-label="`${CATEGORY_META[active].label} components`">
      <PreviewGalleryForm v-if="active === 'form'" />
      <PreviewGalleryButtons v-else-if="active === 'button'" />
      <PreviewGalleryData v-else-if="active === 'data'" />
      <PreviewGalleryPanels v-else-if="active === 'panel'" />
      <PreviewGalleryOverlays v-else-if="active === 'overlay'" />
      <PreviewGalleryMenus v-else-if="active === 'menu'" />
      <PreviewGalleryMessages v-else-if="active === 'messages'" />
      <PreviewGalleryMedia v-else-if="active === 'media'" />
      <PreviewGalleryFiles v-else-if="active === 'file'" />
      <PreviewGalleryMisc v-else />
    </div>
  </div>
</template>
