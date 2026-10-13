<script setup lang="ts">
// The Badge stage: every severity in all four sizes, as a dot and on an icon (OverlayBadge).
const emit = defineEmits<{ pick: [target: string] }>()

const SEVERITIES = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'] as const
const SIZES = [
  { key: 'sm', size: 'small', label: 'Small' },
  { key: 'normal', size: undefined, label: 'Normal' },
  { key: 'lg', size: 'large', label: 'Large' },
  { key: 'xl', size: 'xlarge', label: 'Extra large' },
] as const
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const severityOf = (s: (typeof SEVERITIES)[number]) => (s === 'primary' ? undefined : s)
</script>

<template>
  <PreviewStageSchemes intro="Every severity in all four sizes, as a dot and on an icon. Click a badge to edit it.">
    <template #default>
      <div class="grid grid-cols-[5.5rem_repeat(6,max-content)] items-center gap-x-5 gap-y-4">
        <span />
        <span
          v-for="size in SIZES"
          :key="size.key"
          class="text-[11px] text-muted-color"
        >{{ size.label }}</span>
        <span class="text-[11px] text-muted-color">Dot</span>
        <span class="text-[11px] text-muted-color">On an icon</span>
        <template
          v-for="severity in SEVERITIES"
          :key="severity"
        >
          <span class="text-xs text-muted-color">{{ label(severity) }}</span>
          <Badge
            v-for="size in SIZES"
            :key="size.key"
            value="8"
            :size="size.size"
            :severity="severityOf(severity)"
            class="cursor-pointer"
            @click="emit('pick', size.key === 'normal' ? `root:${severity}:default` : `section:size:${size.key}`)"
          />
          <Badge
            :severity="severityOf(severity)"
            class="cursor-pointer"
            @click="emit('pick', 'section:size')"
          />
          <OverlayBadge
            value="4"
            :severity="severityOf(severity)"
            class="w-fit cursor-pointer"
            @click="emit('pick', `root:${severity}:default`)"
          >
            <i
              class="pi pi-bell text-xl"
              aria-hidden="true"
            />
          </OverlayBadge>
        </template>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
