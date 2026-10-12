<script setup lang="ts">
// Uploads stay in the browser: customUpload just reports the selection.
const toast = useToast()

function onUpload(event: { files: File | File[] }) {
  const files = Array.isArray(event.files) ? event.files : [event.files]
  toast.add({ severity: 'info', summary: 'Selected', detail: `${files.length} file(s), nothing was uploaded.`, life: 2500 })
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <PreviewDemo title="FileUpload · basic">
      <FileUpload
        mode="basic"
        name="demo"
        accept="image/*"
        :max-file-size="1000000"
        choose-label="Choose image"
        custom-upload
        auto
        @uploader="onUpload"
      />
    </PreviewDemo>

    <PreviewDemo
      title="FileUpload · advanced"
      wide
    >
      <FileUpload
        name="demo[]"
        multiple
        accept="image/*"
        :max-file-size="1000000"
        custom-upload
        @uploader="onUpload"
      >
        <template #empty>
          <div class="flex flex-col items-center gap-2 py-6 text-muted-color">
            <i
              class="pi pi-cloud-upload text-3xl"
              aria-hidden="true"
            />
            <span>Drag and drop files here.</span>
          </div>
        </template>
      </FileUpload>
    </PreviewDemo>
  </div>
</template>
