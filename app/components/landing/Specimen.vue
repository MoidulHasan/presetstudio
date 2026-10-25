<script setup lang="ts">
// A small piece of a real app (inviting people to a workspace) built from PrimeVue components,
// drawn in the theme given as CSS variables (`specimenVars` with `SPECIMEN_COMPONENTS`).
// `compact` keeps the form only.
defineProps<{ vars: Record<string, string>, compact?: boolean }>()

const email = ref('maya@northwind.io')
const role = ref('Editor')
const welcome = ref(true)
</script>

<template>
  <div
    class="ps-specimen"
    :style="vars"
  >
    <Card :pt="{ body: { class: compact ? '!p-4 !gap-3' : '' } }">
      <template #title>
        <span :class="compact ? 'text-base' : ''">Invite people to Northwind</span>
      </template>
      <template
        v-if="!compact"
        #subtitle
      >
        They get an email with a link to join.
      </template>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label
              v-if="!compact"
              :for="`specimen-email-${compact ? 'c' : 'f'}`"
              class="text-sm font-medium"
            >Email</label>
            <InputText
              :id="`specimen-email-${compact ? 'c' : 'f'}`"
              v-model="email"
              aria-label="Email"
              fluid
            />
          </div>
          <SelectButton
            v-model="role"
            :options="['Viewer', 'Editor', 'Admin']"
            :allow-empty="false"
            aria-label="Role"
          />
          <label class="flex items-center gap-3 text-sm">
            <ToggleSwitch v-model="welcome" />
            Send a welcome email
          </label>
          <div class="flex flex-wrap gap-2">
            <Button label="Send invite" />
            <Button
              label="Cancel"
              severity="secondary"
              text
            />
          </div>
          <template v-if="!compact">
            <Message
              severity="success"
              size="small"
            >
              Sam Okafor joined 2 minutes ago.
            </Message>
            <ul class="flex flex-col gap-3">
              <li class="flex items-center gap-3">
                <Avatar
                  label="SO"
                  shape="circle"
                />
                <span class="flex-1 text-sm">Sam Okafor</span>
                <Tag value="Admin" />
              </li>
              <li class="flex items-center gap-3">
                <Avatar
                  label="LP"
                  shape="circle"
                />
                <span class="flex-1 text-sm">Lena Petrova</span>
                <Tag
                  value="Pending"
                  severity="warn"
                />
              </li>
            </ul>
          </template>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
/* The page's own text styles stop here: the theme's text color and font size take over. */
.ps-specimen {
  color: var(--p-text-color);
  font-size: 1rem;
  line-height: 1.5;
}
</style>
