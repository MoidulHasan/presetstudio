<script setup lang="ts">
// A checkout form: dense inputs, validation, radio choices and a summary.
const toast = useToast()

const email = ref('ada@example.com')
const name = ref('')
const address = ref('')
const country = ref<{ name: string, code: string } | null>({ name: 'Netherlands', code: 'NL' })
const countries = [
  { name: 'Bangladesh', code: 'BD' },
  { name: 'Germany', code: 'DE' },
  { name: 'Japan', code: 'JP' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'United States', code: 'US' },
]
const postcode = ref('1012')
const delivery = ref('standard')
const deliveryOptions = [
  { value: 'standard', label: 'Standard', detail: '3–5 business days', price: 'Free' },
  { value: 'express', label: 'Express', detail: '1–2 business days', price: '$12' },
]
const date = ref<Date | null>(null)
const notes = ref('')
const quantity = ref(2)
const newsletter = ref(true)
const coupon = ref('')
const submitted = ref(false)

const nameInvalid = computed(() => submitted.value && !name.value.trim())

function submit() {
  submitted.value = true
  if (nameInvalid.value) {
    toast.add({ severity: 'error', summary: 'Check the form', detail: 'Full name is required.', life: 3000 })
    return
  }
  toast.add({ severity: 'success', summary: 'Order placed', detail: 'A confirmation is on its way.', life: 3000 })
}
</script>

<template>
  <div class="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_20rem]">
    <form
      class="flex flex-col gap-6"
      novalidate
      @submit.prevent="submit"
    >
      <div>
        <h1 class="text-2xl font-semibold text-color">
          Checkout
        </h1>
        <p class="text-sm text-muted-color">
          Step 2 of 3: shipping details
        </p>
      </div>

      <Card>
        <template #title>
          Contact
        </template>
        <template #content>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label
                for="f-email"
                class="text-sm font-medium"
              >Email</label>
              <IconField>
                <InputIcon class="pi pi-envelope" />
                <InputText
                  id="f-email"
                  v-model="email"
                  type="email"
                  class="w-full"
                />
              </IconField>
            </div>
            <div class="flex flex-col gap-2">
              <label
                for="f-name"
                class="text-sm font-medium"
              >Full name</label>
              <InputText
                id="f-name"
                v-model="name"
                :invalid="nameInvalid"
                placeholder="Ada Lovelace"
                aria-describedby="f-name-error"
              />
              <Message
                v-if="nameInvalid"
                id="f-name-error"
                severity="error"
                size="small"
                variant="simple"
              >
                Full name is required.
              </Message>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          Shipping
        </template>
        <template #content>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-2 sm:col-span-2">
              <label
                for="f-address"
                class="text-sm font-medium"
              >Address</label>
              <InputText
                id="f-address"
                v-model="address"
                placeholder="Street and number"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label
                for="f-country"
                class="text-sm font-medium"
              >Country</label>
              <Select
                v-model="country"
                input-id="f-country"
                :options="countries"
                option-label="name"
                filter
              />
            </div>
            <div class="flex flex-col gap-2">
              <label
                for="f-postcode"
                class="text-sm font-medium"
              >Postcode</label>
              <InputText
                id="f-postcode"
                v-model="postcode"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label
                for="f-date"
                class="text-sm font-medium"
              >Preferred delivery date</label>
              <DatePicker
                v-model="date"
                input-id="f-date"
                show-icon
                placeholder="Any day"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label
                for="f-qty"
                class="text-sm font-medium"
              >Quantity</label>
              <InputNumber
                v-model="quantity"
                input-id="f-qty"
                show-buttons
                :min="1"
                :max="10"
              />
            </div>
            <fieldset class="flex flex-col gap-2 sm:col-span-2">
              <legend class="mb-2 text-sm font-medium">
                Delivery
              </legend>
              <label
                v-for="option in deliveryOptions"
                :key="option.value"
                class="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                :class="delivery === option.value ? 'border-primary bg-highlight' : 'border-surface'"
              >
                <RadioButton
                  v-model="delivery"
                  :value="option.value"
                  name="delivery"
                />
                <span class="flex flex-1 flex-col">
                  <span class="text-sm font-medium">{{ option.label }}</span>
                  <span class="text-xs text-muted-color">{{ option.detail }}</span>
                </span>
                <span class="text-sm font-medium">{{ option.price }}</span>
              </label>
            </fieldset>
            <div class="flex flex-col gap-2 sm:col-span-2">
              <label
                for="f-notes"
                class="text-sm font-medium"
              >Notes for the courier</label>
              <Textarea
                id="f-notes"
                v-model="notes"
                rows="3"
                auto-resize
              />
            </div>
          </div>
        </template>
      </Card>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="newsletter"
            input-id="f-news"
            binary
          />
          <label
            for="f-news"
            class="text-sm"
          >Email me about new products</label>
        </div>
        <div class="flex gap-2">
          <Button
            label="Back"
            severity="secondary"
            outlined
          />
          <Button
            type="submit"
            label="Place order"
            icon="pi pi-lock"
          />
        </div>
      </div>
    </form>

    <aside class="flex flex-col gap-4">
      <Card>
        <template #title>
          Summary
        </template>
        <template #content>
          <ul class="flex flex-col gap-3 text-sm">
            <li class="flex justify-between">
              <span>Desk lamp × {{ quantity }}</span><span>${{ 49 * quantity }}</span>
            </li>
            <li class="flex justify-between">
              <span>Shipping</span><span>{{ delivery === 'express' ? '$12' : 'Free' }}</span>
            </li>
          </ul>
          <Divider />
          <InputGroup>
            <InputText
              v-model="coupon"
              placeholder="Coupon code"
              aria-label="Coupon code"
            />
            <Button
              label="Apply"
              severity="secondary"
            />
          </InputGroup>
          <Divider />
          <div class="flex justify-between font-semibold text-color">
            <span>Total</span><span>${{ 49 * quantity + (delivery === 'express' ? 12 : 0) }}</span>
          </div>
        </template>
      </Card>
      <Message
        severity="warn"
        size="small"
      >
        Only 3 left in stock.
      </Message>
    </aside>
  </div>
</template>
