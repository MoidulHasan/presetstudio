<script setup lang="ts">
import { photos } from '~/utils/preview-data'

const responsive = [
  { breakpoint: '1024px', numVisible: 2, numScroll: 1 },
  { breakpoint: '640px', numVisible: 1, numScroll: 1 },
]
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <PreviewDemo
      title="Carousel"
      wide
    >
      <Carousel
        :value="photos"
        :num-visible="3"
        :num-scroll="1"
        :responsive-options="responsive"
        circular
      >
        <template #item="{ data }">
          <div class="m-2 overflow-hidden rounded-lg border border-surface">
            <img
              :src="data.src"
              :alt="data.title"
              class="aspect-[3/2] w-full object-cover"
            >
            <div class="flex items-center justify-between p-3">
              <span class="font-medium">{{ data.title }}</span>
              <Button
                icon="pi pi-heart"
                severity="secondary"
                size="small"
                text
                rounded
                :aria-label="`Like ${data.title}`"
              />
            </div>
          </div>
        </template>
      </Carousel>
    </PreviewDemo>

    <PreviewDemo title="Galleria">
      <Galleria
        :value="photos"
        :num-visible="4"
        container-style="max-width: 100%"
      >
        <template #item="{ item }">
          <img
            :src="item.src"
            :alt="item.title"
            class="block w-full"
          >
        </template>
        <template #thumbnail="{ item }">
          <img
            :src="item.thumb"
            :alt="item.title"
            class="block"
          >
        </template>
      </Galleria>
    </PreviewDemo>

    <PreviewDemo title="Image · ImageCompare">
      <Image
        :src="photos[0]!.src"
        alt="Mountains"
        width="100%"
        preview
      />
      <ImageCompare class="w-full">
        <template #left>
          <img
            :src="photos[3]!.src"
            alt="Before"
          >
        </template>
        <template #right>
          <img
            :src="photos[4]!.src"
            alt="After"
          >
        </template>
      </ImageCompare>
    </PreviewDemo>
  </div>
</template>
