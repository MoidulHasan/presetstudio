<script setup lang="ts">
const toast = useToast()

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as const
const buttonSeverity = (s: (typeof severities)[number]) => (s === 'primary' ? undefined : s)

const name = ref('')
const cities = [
  { name: 'Amsterdam', code: 'AMS' },
  { name: 'Dhaka', code: 'DAC' },
  { name: 'Lisbon', code: 'LIS' },
  { name: 'Tokyo', code: 'TYO' },
]
const city = ref<(typeof cities)[number] | null>(null)
const agree = ref(true)
const notifications = ref(true)
const dialogVisible = ref(false)

const orders = [
  { id: 1001, customer: 'Ada Lovelace', status: 'Shipped', total: 129.0 },
  { id: 1002, customer: 'Alan Turing', status: 'Pending', total: 54.5 },
  { id: 1003, customer: 'Grace Hopper', status: 'Delivered', total: 310.2 },
  { id: 1004, customer: 'Katherine Johnson', status: 'Cancelled', total: 18.9 },
]
const statusSeverity: Record<string, string> = {
  Shipped: 'info',
  Pending: 'warn',
  Delivered: 'success',
  Cancelled: 'danger',
}
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function showToast(severity: 'success' | 'info' | 'warn' | 'error') {
  toast.add({ severity, summary: `${severity[0]!.toUpperCase()}${severity.slice(1)} message`, detail: 'This is how notifications look.', life: 3000 })
}
</script>

<template>
  <div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
    <Card class="lg:col-span-2">
      <template #title>
        Buttons
      </template>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="s in severities"
              :key="s"
              :label="s"
              :severity="buttonSeverity(s)"
              class="capitalize"
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="s in severities"
              :key="s"
              :label="s"
              :severity="buttonSeverity(s)"
              class="capitalize"
              outlined
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="s in severities"
              :key="s"
              :label="s"
              :severity="buttonSeverity(s)"
              class="capitalize"
              text
            />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              label="Icon"
              icon="pi pi-check"
            />
            <Button
              icon="pi pi-heart"
              rounded
              aria-label="Like"
            />
            <Button
              label="Rounded"
              rounded
            />
            <Button
              label="Raised"
              raised
            />
            <Button
              label="Loading"
              loading
            />
            <Button
              label="Disabled"
              disabled
            />
            <Button
              label="Small"
              size="small"
            />
            <Button
              label="Large"
              size="large"
            />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        Form
      </template>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label
              for="preview-name"
              class="text-sm font-medium"
            >Name</label>
            <InputText
              id="preview-name"
              v-model="name"
              placeholder="Your name"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label
              for="preview-city"
              class="text-sm font-medium"
            >City</label>
            <Select
              v-model="city"
              input-id="preview-city"
              :options="cities"
              option-label="name"
              placeholder="Select a city"
              show-clear
            />
          </div>
          <div class="flex flex-col gap-2">
            <InputText
              placeholder="Invalid field"
              invalid
            />
            <InputText
              placeholder="Disabled field"
              disabled
            />
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="agree"
              input-id="preview-agree"
              binary
            />
            <label for="preview-agree">I agree to the terms</label>
          </div>
          <div class="flex items-center gap-2">
            <ToggleSwitch
              v-model="notifications"
              input-id="preview-notify"
            />
            <label for="preview-notify">Email notifications</label>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        Tabs
      </template>
      <template #content>
        <Tabs value="0">
          <TabList>
            <Tab value="0">
              Overview
            </Tab>
            <Tab value="1">
              Activity
            </Tab>
            <Tab value="2">
              Settings
            </Tab>
            <Tab
              value="3"
              disabled
            >
              Disabled
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="0">
              <p class="m-0">
                Tabs use the primary color for the active indicator and focus ring.
              </p>
            </TabPanel>
            <TabPanel value="1">
              <p class="m-0">
                No recent activity.
              </p>
            </TabPanel>
            <TabPanel value="2">
              <p class="m-0">
                Settings would go here.
              </p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <Card class="lg:col-span-2">
      <template #title>
        Data table
      </template>
      <template #content>
        <DataTable
          :value="orders"
          size="small"
          striped-rows
          data-key="id"
        >
          <Column
            field="id"
            header="Order"
            sortable
          />
          <Column
            field="customer"
            header="Customer"
            sortable
          />
          <Column
            field="status"
            header="Status"
          >
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity[data.status]"
              />
            </template>
          </Column>
          <Column
            field="total"
            header="Total"
            sortable
          >
            <template #body="{ data }">
              {{ currency.format(data.total) }}
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Card>
      <template #title>
        Messages
      </template>
      <template #content>
        <div class="flex flex-col gap-2">
          <Message severity="success">
            Your changes were saved.
          </Message>
          <Message severity="info">
            A new version is available.
          </Message>
          <Message severity="warn">
            Your trial ends in 3 days.
          </Message>
          <Message severity="error">
            Something went wrong.
          </Message>
          <Message severity="secondary">
            Secondary message.
          </Message>
          <Message severity="contrast">
            Contrast message.
          </Message>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>
        Overlays
      </template>
      <template #content>
        <div class="flex flex-wrap gap-2">
          <Button
            label="Open dialog"
            icon="pi pi-external-link"
            @click="dialogVisible = true"
          />
          <Button
            label="Success toast"
            severity="success"
            outlined
            @click="showToast('success')"
          />
          <Button
            label="Info toast"
            severity="info"
            outlined
            @click="showToast('info')"
          />
          <Button
            label="Warn toast"
            severity="warn"
            outlined
            @click="showToast('warn')"
          />
          <Button
            label="Error toast"
            severity="danger"
            outlined
            @click="showToast('error')"
          />
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="dialogVisible"
      header="Edit profile"
      modal
      :style="{ width: '26rem' }"
    >
      <p class="mb-4 text-surface-500 dark:text-surface-400">
        Update your information.
      </p>
      <div class="mb-6 flex flex-col gap-2">
        <label
          for="dialog-username"
          class="text-sm font-medium"
        >Username</label>
        <InputText
          id="dialog-username"
          autocomplete="off"
        />
      </div>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          @click="dialogVisible = false"
        />
        <Button
          label="Save"
          @click="dialogVisible = false"
        />
      </div>
    </Dialog>
    <Toast />
  </div>
</template>
