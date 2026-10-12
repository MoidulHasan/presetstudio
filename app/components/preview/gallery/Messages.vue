<script setup lang="ts">
const toast = useToast()

const severities = ['success', 'info', 'warn', 'error', 'secondary', 'contrast'] as const

function show(severity: (typeof severities)[number]) {
  toast.add({ severity, summary: `${severity.charAt(0).toUpperCase()}${severity.slice(1)}`, detail: 'This is how notifications look.', life: 3000 })
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <PreviewDemo title="Message">
      <Message
        v-for="s in severities"
        :key="s"
        :severity="s"
        :closable="s === 'info'"
      >
        <span class="capitalize">{{ s }}</span> message
      </Message>
    </PreviewDemo>

    <PreviewDemo title="Message · outlined and simple">
      <Message
        severity="success"
        variant="outlined"
        icon="pi pi-check-circle"
      >
        Outlined with icon
      </Message>
      <Message
        severity="error"
        variant="simple"
        size="small"
      >
        Simple, for form validation
      </Message>
      <Message
        severity="warn"
        size="large"
        icon="pi pi-exclamation-triangle"
      >
        Large message
      </Message>
    </PreviewDemo>

    <PreviewDemo
      title="Toast"
      wide
    >
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="s in severities"
          :key="s"
          :label="s"
          severity="secondary"
          outlined
          class="capitalize"
          @click="show(s)"
        />
      </div>
    </PreviewDemo>
  </div>
</template>
