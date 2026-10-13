<script setup lang="ts">
import { CATEGORY_META } from '~/utils/preview-categories'
import { GALLERY_CATEGORIES, PREVIEW_CATEGORIES, type PreviewCategory } from '~/utils/theme/messages'

// Every themable PrimeVue component, grouped like the PrimeVue docs. Only the
// active category renders, which keeps theme updates fast; "All" stacks every
// category and loads each one as it scrolls into view. Inside the editor the
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

    <div
      v-if="active === 'all'"
      class="flex flex-col gap-10"
    >
      <section
        v-for="(id, index) in GALLERY_CATEGORIES"
        :key="id"
        :aria-label="`${CATEGORY_META[id].label} components`"
      >
        <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-surface-0">
          <i
            :class="CATEGORY_META[id].icon"
            class="text-surface-500"
            aria-hidden="true"
          />
          {{ CATEGORY_META[id].label }}
        </h2>
        <PreviewLazySection :eager="index === 0">
          <PreviewGalleryCategory :category="id" />
        </PreviewLazySection>
      </section>
    </div>
    <div
      v-else
      :aria-label="`${CATEGORY_META[active].label} components`"
    >
      <PreviewGalleryCategory :category="active" />
    </div>
  </div>
</template>
