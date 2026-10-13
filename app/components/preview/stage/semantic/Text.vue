<script setup lang="ts">
// Text stage: default and muted text, at rest and hovered (the hover colors as links use them).
const emit = defineEmits<{ pick: [target: string] }>()
</script>

<template>
  <PreviewStageSchemes intro="Default and muted text, at rest and hovered. Click a line to edit it.">
    <template #default>
      <div class="grid grid-cols-[6rem_1fr_1fr] items-baseline gap-x-4 gap-y-3">
        <span />
        <span class="text-[11px] text-muted-color">Default</span>
        <span class="text-[11px] text-muted-color">Hover</span>
        <span class="text-xs text-muted-color">Text</span>
        <p
          class="m-0 cursor-pointer text-lg font-semibold"
          style="color: var(--p-text-color)"
          @click="emit('pick', 'cell:text:default')"
        >
          Project settings
        </p>
        <p
          class="m-0 cursor-pointer text-lg font-semibold"
          style="color: var(--p-text-hover-color)"
          @click="emit('pick', 'cell:text:hover')"
        >
          Project settings
        </p>
        <span class="text-xs text-muted-color">Muted</span>
        <p
          class="m-0 cursor-pointer text-sm"
          style="color: var(--p-text-muted-color)"
          @click="emit('pick', 'cell:muted:default')"
        >
          Last edited 3 minutes ago
        </p>
        <p
          class="m-0 cursor-pointer text-sm"
          style="color: var(--p-text-hover-muted-color)"
          @click="emit('pick', 'cell:muted:hover')"
        >
          Last edited 3 minutes ago
        </p>
      </div>
      <div
        class="flex cursor-pointer flex-col gap-2"
        @click="emit('pick', 'cell:text:default')"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          In a paragraph
        </h3>
        <p
          class="m-0 max-w-prose leading-relaxed"
          style="color: var(--p-text-color)"
        >
          Body text uses the default text color.
          <span style="color: var(--p-text-muted-color)">Secondary details are muted.</span>
        </p>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
