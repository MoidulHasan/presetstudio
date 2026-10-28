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
      <!-- One toast in place (PrimeVue's own markup and classes, as on the stage), so it shows
           without opening one; the buttons open real ones. -->
      <div
        class="p-toast p-component !w-full max-w-[var(--p-toast-width)]"
        data-pc-name="toast"
      >
        <div class="p-toast-message p-toast-message-success">
          <div class="p-toast-message-content">
            <i
              class="pi pi-check p-toast-message-icon"
              aria-hidden="true"
            />
            <div class="p-toast-message-text">
              <span class="p-toast-summary">Saved</span>
              <div class="p-toast-detail">
                Your changes are live.
              </div>
            </div>
            <div>
              <button
                class="p-toast-close-button"
                type="button"
                tabindex="-1"
                aria-label="Close"
              >
                <i
                  class="pi pi-times p-toast-close-icon"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
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
