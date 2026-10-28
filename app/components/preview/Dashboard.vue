<script setup lang="ts">
// A realistic admin dashboard to judge the theme in context.
const period = ref('30d')
const periods = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This year', value: 'year' },
]

const stats = [
  { label: 'Revenue', value: '$48,290', delta: '+12.4%', up: true, icon: 'pi pi-wallet' },
  { label: 'Orders', value: '1,284', delta: '+4.1%', up: true, icon: 'pi pi-shopping-cart' },
  { label: 'Customers', value: '9,410', delta: '+2.7%', up: true, icon: 'pi pi-users' },
  { label: 'Refunds', value: '23', delta: '-8.0%', up: false, icon: 'pi pi-replay' },
]

const bars = [42, 58, 51, 66, 73, 61, 84, 79, 92, 70, 88, 96]
const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const orders = [
  { id: '#3021', customer: 'Ada Lovelace', date: 'Oct 12', status: 'Paid', total: 249 },
  { id: '#3020', customer: 'Alan Turing', date: 'Oct 12', status: 'Pending', total: 89 },
  { id: '#3019', customer: 'Grace Hopper', date: 'Oct 11', status: 'Shipped', total: 1290 },
  { id: '#3018', customer: 'Katherine Johnson', date: 'Oct 10', status: 'Refunded', total: 54 },
  { id: '#3017', customer: 'Margaret Hamilton', date: 'Oct 10', status: 'Paid', total: 410 },
]
const statusSeverity: Record<string, string> = { Paid: 'success', Pending: 'warn', Shipped: 'info', Refunded: 'danger' }
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const team = [
  { name: 'Lena Park', role: 'Sales', goal: 82, initials: 'LP' },
  { name: 'Omar Aziz', role: 'Support', goal: 64, initials: 'OA' },
  { name: 'Mia Chen', role: 'Marketing', goal: 45, initials: 'MC' },
]
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-color">
          Dashboard
        </h1>
        <p class="text-sm text-muted-color">
          Welcome back. Here's what happened in your store.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Select
          v-model="period"
          :options="periods"
          option-label="label"
          option-value="value"
          aria-label="Period"
        />
        <Button
          label="New report"
          icon="pi pi-plus"
        />
      </div>
    </header>

    <Message
      severity="info"
      closable
    >
      Your monthly payout of $12,480 is scheduled for October 15.
    </Message>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        v-for="stat in stats"
        :key="stat.label"
      >
        <template #content>
          <div class="flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <span class="text-sm text-muted-color">{{ stat.label }}</span>
              <span class="text-2xl font-semibold text-color">{{ stat.value }}</span>
            </div>
            <span class="grid size-10 place-items-center rounded-lg bg-highlight">
              <i
                :class="stat.icon"
                aria-hidden="true"
              />
            </span>
          </div>
          <Tag
            class="mt-3"
            :severity="stat.up ? 'success' : 'danger'"
            :value="stat.delta"
            :icon="stat.up ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"
          />
        </template>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <template #title>
          Revenue
        </template>
        <template #subtitle>
          Monthly, in thousands
        </template>
        <template #content>
          <div
            class="flex h-48 items-end gap-2"
            role="img"
            aria-label="Bar chart of monthly revenue"
          >
            <div
              v-for="(bar, i) in bars"
              :key="i"
              class="flex flex-1 flex-col items-center gap-1"
            >
              <div
                class="w-full rounded-t-md"
                :class="i === bars.length - 1 ? 'bg-primary' : 'bg-primary-200 dark:bg-primary-800'"
                :style="{ height: `${bar * 1.6}px` }"
              />
              <span class="text-xs text-muted-color">{{ months[i] }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          Team goals
        </template>
        <template #content>
          <ul class="flex flex-col gap-4">
            <li
              v-for="member in team"
              :key="member.name"
              class="flex flex-col gap-2"
            >
              <div class="flex items-center gap-3">
                <Avatar
                  :label="member.initials"
                  shape="circle"
                />
                <div class="flex flex-1 flex-col">
                  <span class="text-sm font-medium text-color">{{ member.name }}</span>
                  <span class="text-xs text-muted-color">{{ member.role }}</span>
                </div>
                <span class="text-sm text-muted-color">{{ member.goal }}%</span>
              </div>
              <ProgressBar
                :value="member.goal"
                :show-value="false"
                style="height: 6px"
              />
            </li>
          </ul>
        </template>
      </Card>
    </div>

    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          Recent orders
          <Button
            label="View all"
            icon="pi pi-arrow-right"
            icon-pos="right"
            severity="secondary"
            size="small"
            text
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="orders"
          data-key="id"
          size="small"
          row-hover
        >
          <Column
            field="id"
            header="Order"
          />
          <Column
            field="customer"
            header="Customer"
            sortable
          />
          <Column
            field="date"
            header="Date"
          />
          <Column header="Status">
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="statusSeverity[data.status]"
              />
            </template>
          </Column>
          <Column
            header="Total"
            class="text-right"
          >
            <template #body="{ data }">
              {{ currency.format(data.total) }}
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>
