<script setup lang="ts">
// Status stage: each severity across the components status colors reach.
const emit = defineEmits<{ pick: [target: string] }>()

const ROWS = [
  { kind: 'info', label: 'Info', button: 'info', tag: 'info', message: 'info' },
  { kind: 'success', label: 'Success', button: 'success', tag: 'success', message: 'success' },
  { kind: 'warn', label: 'Warning', button: 'warn', tag: 'warn', message: 'warn' },
  { kind: 'danger', label: 'Danger', button: 'danger', tag: 'danger', message: 'error' },
  { kind: 'help', label: 'Help', button: 'help', tag: null, message: null },
] as const
</script>

<template>
  <PreviewStageSchemes intro="Each severity across buttons, tags, badges and messages. Click a row to edit that severity.">
    <template #default>
      <!-- Scrolls sideways inside the card on a phone-wide preview. -->
      <div class="-m-1 overflow-x-auto p-1">
        <div class="grid grid-cols-[5rem_auto_auto_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3">
          <template
            v-for="row in ROWS"
            :key="row.kind"
          >
            <span
              class="cursor-pointer text-xs text-muted-color"
              @click="emit('pick', `status:${row.kind}`)"
            >{{ row.label }}</span>
            <span
              class="cursor-pointer"
              @click="emit('pick', `status:${row.kind}`)"
            >
              <Button
                :label="row.label"
                :severity="row.button"
                size="small"
                tabindex="-1"
              />
            </span>
            <span
              class="cursor-pointer"
              @click="emit('pick', `status:${row.kind}`)"
            >
              <Tag
                v-if="row.tag"
                :value="row.label"
                :severity="row.tag"
              />
            </span>
            <span
              class="cursor-pointer"
              @click="emit('pick', `status:${row.kind}`)"
            >
              <Badge
                v-if="row.tag"
                value="4"
                :severity="row.tag"
              />
            </span>
            <div
              class="min-w-0 cursor-pointer"
              @click="emit('pick', `status:${row.kind}`)"
            >
              <Message
                v-if="row.message"
                :severity="row.message"
                size="small"
              >
                {{ row.label }} message
              </Message>
            </div>
          </template>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
