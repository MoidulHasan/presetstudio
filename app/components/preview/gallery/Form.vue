<script setup lang="ts">
import { cities, countries, fileNodes } from '~/utils/preview-data'

const autocomplete = ref('')
const suggestions = ref<string[]>([])
function search(event: { query: string }) {
  suggestions.value = cities.map(c => c.name).filter(n => n.toLowerCase().includes(event.query.toLowerCase()))
}
const cascade = ref(null)
const checks = ref(['email'])
const color = ref('6366f1')
const date = ref<Date | null>(null)
const inlineDate = ref(new Date())
const floatValue = ref('')
const iftaValue = ref('')
const search2 = ref('')
const price = ref(1250)
const mask = ref('')
const otp = ref('')
const chips = ref(['vue', 'design'])
const knob = ref(62)
const listbox = ref(cities[1])
const multi = ref([cities[0], cities[2]])
const password = ref('')
const radio = ref('card')
const rating = ref(4)
const select = ref(cities[2])
const selectButton = ref('Month')
const slider = ref(40)
const range = ref([20, 70])
const textarea = ref('')
const toggle = ref(true)
const toggleSwitch = ref(true)
const treeSelect = ref(null)
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <PreviewDemo title="InputText">
      <InputText placeholder="Default" />
      <InputText
        placeholder="Filled"
        variant="filled"
      />
      <div class="flex gap-2">
        <InputText
          placeholder="Small"
          size="small"
          class="w-full"
        />
        <InputText
          placeholder="Invalid"
          invalid
          class="w-full"
        />
      </div>
      <InputText
        placeholder="Disabled"
        disabled
      />
    </PreviewDemo>

    <PreviewDemo title="FloatLabel · IftaLabel">
      <FloatLabel variant="on">
        <InputText
          id="g-float"
          v-model="floatValue"
          class="w-full"
        />
        <label for="g-float">Float label</label>
      </FloatLabel>
      <IftaLabel>
        <InputText
          id="g-ifta"
          v-model="iftaValue"
          class="w-full"
        />
        <label for="g-ifta">Infield label</label>
      </IftaLabel>
    </PreviewDemo>

    <PreviewDemo title="IconField · InputGroup">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="search2"
          placeholder="Search"
          class="w-full"
        />
      </IconField>
      <InputGroup>
        <InputGroupAddon>$</InputGroupAddon>
        <InputNumber
          v-model="price"
          placeholder="Price"
        />
        <InputGroupAddon>.00</InputGroupAddon>
      </InputGroup>
    </PreviewDemo>

    <PreviewDemo title="Select">
      <Select
        v-model="select"
        :options="cities"
        option-label="name"
        placeholder="Select a city"
        show-clear
        filter
      />
    </PreviewDemo>

    <PreviewDemo title="MultiSelect">
      <MultiSelect
        v-model="multi"
        :options="cities"
        option-label="name"
        display="chip"
        placeholder="Select cities"
        :max-selected-labels="3"
      />
    </PreviewDemo>

    <PreviewDemo title="AutoComplete">
      <AutoComplete
        v-model="autocomplete"
        :suggestions="suggestions"
        dropdown
        placeholder="Type a city"
        @complete="search"
      />
    </PreviewDemo>

    <PreviewDemo title="CascadeSelect">
      <CascadeSelect
        v-model="cascade"
        :options="countries"
        option-label="cname"
        option-group-label="name"
        :option-group-children="['states', 'cities']"
        placeholder="Select a city"
      />
    </PreviewDemo>

    <PreviewDemo title="TreeSelect">
      <TreeSelect
        v-model="treeSelect"
        :options="fileNodes"
        placeholder="Select a file"
      />
    </PreviewDemo>

    <PreviewDemo title="DatePicker">
      <DatePicker
        v-model="date"
        show-icon
        placeholder="Pick a date"
      />
    </PreviewDemo>

    <PreviewDemo
      title="DatePicker (inline)"
      wide
    >
      <DatePicker
        v-model="inlineDate"
        inline
        class="w-full"
      />
    </PreviewDemo>

    <PreviewDemo title="Listbox">
      <Listbox
        v-model="listbox"
        :options="cities"
        option-label="name"
        class="w-full"
        list-style="max-height: 180px"
      />
    </PreviewDemo>

    <PreviewDemo title="InputNumber · InputMask">
      <InputNumber
        v-model="price"
        mode="currency"
        currency="USD"
        show-buttons
      />
      <InputMask
        v-model="mask"
        mask="(999) 999-9999"
        placeholder="(999) 999-9999"
      />
    </PreviewDemo>

    <PreviewDemo title="InputOtp · InputChips">
      <InputOtp
        v-model="otp"
        :length="6"
      />
      <InputChips v-model="chips" />
    </PreviewDemo>

    <PreviewDemo title="Password">
      <Password
        v-model="password"
        toggle-mask
        placeholder="Password"
        input-class="w-full"
        class="w-full"
      />
    </PreviewDemo>

    <PreviewDemo title="Textarea">
      <Textarea
        v-model="textarea"
        rows="3"
        placeholder="Write a message"
        auto-resize
      />
    </PreviewDemo>

    <PreviewDemo title="Checkbox · RadioButton">
      <div class="flex flex-wrap gap-4">
        <div
          v-for="item in ['email', 'sms', 'push']"
          :key="item"
          class="flex items-center gap-2"
        >
          <Checkbox
            v-model="checks"
            :input-id="`g-check-${item}`"
            :value="item"
          />
          <label
            :for="`g-check-${item}`"
            class="capitalize"
          >{{ item }}</label>
        </div>
      </div>
      <div class="flex flex-wrap gap-4">
        <div
          v-for="item in ['card', 'paypal', 'invoice']"
          :key="item"
          class="flex items-center gap-2"
        >
          <RadioButton
            v-model="radio"
            :input-id="`g-radio-${item}`"
            name="g-payment"
            :value="item"
          />
          <label
            :for="`g-radio-${item}`"
            class="capitalize"
          >{{ item }}</label>
        </div>
      </div>
    </PreviewDemo>

    <PreviewDemo title="ToggleSwitch · ToggleButton">
      <div class="flex items-center gap-3">
        <ToggleSwitch
          v-model="toggleSwitch"
          input-id="g-switch"
        />
        <label for="g-switch">Notifications</label>
      </div>
      <ToggleButton
        v-model="toggle"
        on-label="Following"
        off-label="Follow"
        on-icon="pi pi-check"
        off-icon="pi pi-plus"
        class="w-fit"
      />
    </PreviewDemo>

    <PreviewDemo title="SelectButton">
      <SelectButton
        v-model="selectButton"
        :options="['Day', 'Week', 'Month']"
      />
    </PreviewDemo>

    <PreviewDemo title="Slider">
      <Slider
        v-model="slider"
        aria-label="Volume"
      />
      <Slider
        v-model="range"
        range
        aria-label="Price range"
      />
    </PreviewDemo>

    <PreviewDemo title="Rating · Knob">
      <Rating v-model="rating" />
      <Knob
        v-model="knob"
        :size="100"
        aria-label="Progress"
      />
    </PreviewDemo>

    <PreviewDemo title="ColorPicker">
      <div class="flex items-start gap-4">
        <ColorPicker
          v-model="color"
          inline
        />
        <ColorPicker v-model="color" />
      </div>
    </PreviewDemo>
  </div>
</template>
