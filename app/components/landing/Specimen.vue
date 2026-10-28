<script setup lang="ts">
// A sheet of real PrimeVue components (buttons, a field, toggles, tags…) drawn in the theme given
// as CSS variables (`specimenVars` with `SPECIMEN_COMPONENTS`): what a theme changes, with no
// made-up app around it. `compact` keeps the first rows (`phoneCompact`: only on phones);
// `elevated` lifts the card off a colored background.
defineProps<{ vars: Record<string, string>, compact?: boolean, phoneCompact?: boolean, elevated?: boolean }>()

const search = ref('')
const period = ref('Week')
const checked = ref(true)
const radio = ref('on')
const on = ref(true)
const level = ref(60)
</script>

<template>
  <div
    class="ps-specimen"
    :style="vars"
  >
    <Card :pt="{ root: { class: elevated ? 'shadow-2xl' : '' }, body: { class: compact ? '!p-4' : '' } }">
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-2">
            <Button label="Primary" />
            <Button
              label="Secondary"
              severity="secondary"
            />
            <Button
              label="Outlined"
              outlined
            />
          </div>
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="search"
              placeholder="Search"
              aria-label="Search"
              fluid
            />
          </IconField>
          <SelectButton
            v-model="period"
            :options="['Day', 'Week', 'Month']"
            :allow-empty="false"
            aria-label="Period"
          />
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <label class="flex items-center gap-2">
              <Checkbox
                v-model="checked"
                binary
              />
              Checkbox
            </label>
            <label class="flex items-center gap-2">
              <RadioButton
                v-model="radio"
                value="on"
              />
              Radio
            </label>
            <label class="flex items-center gap-2">
              <ToggleSwitch v-model="on" />
              Switch
            </label>
          </div>
          <div
            v-if="!compact"
            class="flex flex-col gap-5"
            :class="{ 'max-sm:hidden': phoneCompact }"
          >
            <Slider
              v-model="level"
              aria-label="Level"
              class="mx-1"
            />
            <div class="flex flex-wrap items-center gap-2">
              <Tag value="New" />
              <Tag
                value="Success"
                severity="success"
              />
              <Tag
                value="Warning"
                severity="warn"
              />
              <Tag
                value="Danger"
                severity="danger"
              />
              <Badge value="3" />
            </div>
            <Message
              severity="success"
              size="small"
            >
              Changes saved.
            </Message>
          </div>
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
