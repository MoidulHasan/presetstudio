<script setup lang="ts">
// The Tag stage: every severity plain, as a pill and with an icon.
const emit = defineEmits<{ pick: [target: string] }>()

const SEVERITIES = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'] as const
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
</script>

<template>
  <PreviewStageSchemes intro="Every severity plain, as a pill and with an icon. Click a tag to edit it.">
    <template #default>
      <div class="grid grid-cols-[5.5rem_repeat(3,max-content)] items-center gap-x-6 gap-y-4">
        <span />
        <span class="text-[11px] text-muted-color">Plain</span>
        <span class="text-[11px] text-muted-color">Pill</span>
        <span class="text-[11px] text-muted-color">With icon</span>
        <template
          v-for="severity in SEVERITIES"
          :key="severity"
        >
          <span class="text-xs text-muted-color">{{ label(severity) }}</span>
          <Tag
            :value="label(severity)"
            :severity="severity === 'primary' ? undefined : severity"
            class="cursor-pointer"
            @click="emit('pick', `root:${severity}:default`)"
          />
          <Tag
            :value="label(severity)"
            :severity="severity === 'primary' ? undefined : severity"
            rounded
            class="cursor-pointer"
            @click="emit('pick', 'section:shape')"
          />
          <Tag
            :value="label(severity)"
            :severity="severity === 'primary' ? undefined : severity"
            icon="pi pi-check"
            class="cursor-pointer"
            @click="emit('pick', 'section:size')"
          />
        </template>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
