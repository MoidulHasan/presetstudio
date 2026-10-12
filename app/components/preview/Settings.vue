<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'

// An account settings page: navigation, toggles, sliders and a destructive action.
const toast = useToast()

const active = ref('profile')
const nav: MenuItem[] = [
  { label: 'Account', items: [
    { label: 'Profile', icon: 'pi pi-user', key: 'profile' },
    { label: 'Notifications', icon: 'pi pi-bell', key: 'notifications' },
    { label: 'Security', icon: 'pi pi-shield', key: 'security' },
  ] },
  { label: 'Workspace', items: [
    { label: 'Members', icon: 'pi pi-users', badge: '12' },
    { label: 'Billing', icon: 'pi pi-credit-card' },
  ] },
]

const displayName = ref('Ada Lovelace')
const bio = ref('Writing the first program, one note at a time.')
const language = ref('en')
const languages = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
  { label: 'বাংলা', value: 'bn' },
  { label: '日本語', value: 'ja' },
]

const notifications = ref([
  { id: 'mentions', label: 'Mentions', detail: 'When someone @mentions you', on: true },
  { id: 'digest', label: 'Weekly digest', detail: 'A summary every Monday', on: true },
  { id: 'product', label: 'Product updates', detail: 'New features and improvements', on: false },
])

const density = ref('comfortable')
const fontSize = ref(16)
const deleteVisible = ref(false)

function save() {
  toast.add({ severity: 'success', summary: 'Settings saved', life: 2500 })
}
</script>

<template>
  <div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-[14rem_1fr]">
    <Menu
      :model="nav"
      class="h-fit w-full"
    >
      <template #item="{ item, props }">
        <a
          v-bind="props.action"
          class="flex items-center gap-2"
          :class="{ 'font-semibold text-primary': item.key === active }"
          :aria-current="item.key === active ? 'page' : undefined"
          @click="item.key && (active = item.key)"
        >
          <i
            :class="item.icon"
            aria-hidden="true"
          />
          <span class="flex-1">{{ item.label }}</span>
          <Badge
            v-if="item.badge"
            :value="item.badge"
            severity="secondary"
          />
        </a>
      </template>
    </Menu>

    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-color">
            Settings
          </h1>
          <p class="text-sm text-muted-color">
            Manage your profile and preferences.
          </p>
        </div>
        <Button
          label="Save changes"
          icon="pi pi-check"
          @click="save"
        />
      </div>

      <Card>
        <template #title>
          Profile
        </template>
        <template #content>
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <Avatar
                label="AL"
                size="xlarge"
                shape="circle"
              />
              <div class="flex gap-2">
                <Button
                  label="Upload photo"
                  icon="pi pi-upload"
                  severity="secondary"
                  size="small"
                />
                <Button
                  label="Remove"
                  severity="secondary"
                  size="small"
                  text
                />
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label
                  for="s-name"
                  class="text-sm font-medium"
                >Display name</label>
                <InputText
                  id="s-name"
                  v-model="displayName"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  for="s-lang"
                  class="text-sm font-medium"
                >Language</label>
                <Select
                  v-model="language"
                  input-id="s-lang"
                  :options="languages"
                  option-label="label"
                  option-value="value"
                />
              </div>
              <div class="flex flex-col gap-2 sm:col-span-2">
                <label
                  for="s-bio"
                  class="text-sm font-medium"
                >Bio</label>
                <Textarea
                  id="s-bio"
                  v-model="bio"
                  rows="2"
                />
                <small class="text-muted-color">Shown on your public profile.</small>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          Notifications
        </template>
        <template #content>
          <ul class="flex flex-col divide-y divide-surface-200 dark:divide-surface-700">
            <li
              v-for="item in notifications"
              :key="item.id"
              class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <label
                :for="`n-${item.id}`"
                class="flex flex-col"
              >
                <span class="text-sm font-medium">{{ item.label }}</span>
                <span class="text-xs text-muted-color">{{ item.detail }}</span>
              </label>
              <ToggleSwitch
                v-model="item.on"
                :input-id="`n-${item.id}`"
              />
            </li>
          </ul>
        </template>
      </Card>

      <Card>
        <template #title>
          Appearance
        </template>
        <template #content>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <span
                id="s-density"
                class="text-sm font-medium"
              >Density</span>
              <SelectButton
                v-model="density"
                :options="[{ label: 'Compact', value: 'compact' }, { label: 'Comfortable', value: 'comfortable' }]"
                option-label="label"
                option-value="value"
                aria-labelledby="s-density"
              />
            </div>
            <div class="flex flex-col gap-3">
              <span
                id="s-font"
                class="flex justify-between text-sm font-medium"
              >Font size <span class="text-muted-color">{{ fontSize }}px</span></span>
              <Slider
                v-model="fontSize"
                :min="12"
                :max="20"
                aria-labelledby="s-font"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          Danger zone
        </template>
        <template #content>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-muted-color">
              Permanently delete your account and all of its data.
            </p>
            <Button
              label="Delete account"
              severity="danger"
              outlined
              @click="deleteVisible = true"
            />
          </div>
        </template>
      </Card>

      <Dialog
        v-model:visible="deleteVisible"
        header="Delete account?"
        modal
        :style="{ width: '26rem' }"
      >
        <p class="mb-5 text-sm">
          This can't be undone. All projects and files will be removed.
        </p>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            text
            @click="deleteVisible = false"
          />
          <Button
            label="Delete"
            severity="danger"
            @click="deleteVisible = false"
          />
        </div>
      </Dialog>
    </div>
  </div>
</template>
