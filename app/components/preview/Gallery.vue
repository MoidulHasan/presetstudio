<script setup lang="ts">
// Every themable PrimeVue component, grouped like the PrimeVue docs.
// Only the active category renders, which keeps theme updates fast.
const categories = [
  { value: 'form', label: 'Form', icon: 'pi pi-pen-to-square', count: 28 },
  { value: 'button', label: 'Button', icon: 'pi pi-stop', count: 4 },
  { value: 'data', label: 'Data', icon: 'pi pi-table', count: 10 },
  { value: 'panel', label: 'Panel', icon: 'pi pi-window-maximize', count: 10 },
  { value: 'overlay', label: 'Overlay', icon: 'pi pi-clone', count: 6 },
  { value: 'menu', label: 'Menu', icon: 'pi pi-bars', count: 8 },
  { value: 'messages', label: 'Messages', icon: 'pi pi-comment', count: 2 },
  { value: 'media', label: 'Media', icon: 'pi pi-image', count: 4 },
  { value: 'file', label: 'File', icon: 'pi pi-upload', count: 1 },
  { value: 'misc', label: 'Misc', icon: 'pi pi-th-large', count: 14 },
] as const

const active = ref<string>('form')
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-4">
    <!-- Tabs used as navigation only; the active category renders below. -->
    <Tabs
      v-model:value="active"
      scrollable
      class="sticky top-0 z-10"
    >
      <TabList>
        <Tab
          v-for="category in categories"
          :key="category.value"
          :value="category.value"
          class="flex items-center gap-2"
        >
          <i
            :class="category.icon"
            aria-hidden="true"
          />
          {{ category.label }}
          <Badge
            :value="category.count"
            severity="secondary"
            size="small"
          />
        </Tab>
      </TabList>
    </Tabs>

    <div role="tabpanel">
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
