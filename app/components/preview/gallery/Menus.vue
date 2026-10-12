<script setup lang="ts">
import { menuItems } from '~/utils/preview-data'

const contextMenu = ref<{ show: (event: Event) => void } | null>(null)

const breadcrumbHome = { icon: 'pi pi-home' }
const breadcrumb = [{ label: 'Electronics' }, { label: 'Computers' }, { label: 'Laptops' }]

const flatMenu = [
  { label: 'Documents', items: [{ label: 'New', icon: 'pi pi-plus' }, { label: 'Search', icon: 'pi pi-search' }] },
  { label: 'Profile', items: [{ label: 'Settings', icon: 'pi pi-cog' }, { label: 'Logout', icon: 'pi pi-sign-out' }] },
]

const megaMenu = [
  {
    label: 'Furniture',
    icon: 'pi pi-box',
    items: [
      [{ label: 'Living room', items: [{ label: 'Sofas' }, { label: 'Tables' }, { label: 'Lighting' }] }],
      [{ label: 'Bedroom', items: [{ label: 'Beds' }, { label: 'Wardrobes' }] }],
    ],
  },
  {
    label: 'Electronics',
    icon: 'pi pi-mobile',
    items: [[{ label: 'Computers', items: [{ label: 'Laptops' }, { label: 'Monitors' }] }]],
  },
]

const dock = [
  { label: 'Finder', icon: 'pi pi-folder' },
  { label: 'Mail', icon: 'pi pi-envelope' },
  { label: 'Calendar', icon: 'pi pi-calendar' },
  { label: 'Photos', icon: 'pi pi-image' },
  { label: 'Trash', icon: 'pi pi-trash' },
]
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <PreviewDemo
      title="Menubar"
      wide
    >
      <Menubar :model="menuItems">
        <template #end>
          <Avatar
            label="AL"
            shape="circle"
          />
        </template>
      </Menubar>
    </PreviewDemo>

    <PreviewDemo
      title="MegaMenu"
      wide
    >
      <MegaMenu :model="megaMenu" />
    </PreviewDemo>

    <PreviewDemo title="Breadcrumb">
      <Breadcrumb
        :home="breadcrumbHome"
        :model="breadcrumb"
      />
    </PreviewDemo>

    <PreviewDemo title="ContextMenu">
      <div
        class="grid h-24 place-items-center rounded-lg border border-dashed border-surface text-sm text-muted-color"
        @contextmenu.prevent="contextMenu?.show($event)"
      >
        Right-click here
      </div>
      <ContextMenu
        ref="contextMenu"
        :model="menuItems"
      />
    </PreviewDemo>

    <PreviewDemo title="Menu">
      <Menu
        :model="flatMenu"
        class="w-full"
      />
    </PreviewDemo>

    <PreviewDemo title="TieredMenu">
      <TieredMenu
        :model="menuItems"
        class="w-full"
      />
    </PreviewDemo>

    <PreviewDemo title="PanelMenu">
      <PanelMenu
        :model="menuItems"
        class="w-full"
      />
    </PreviewDemo>

    <PreviewDemo title="Dock">
      <div class="relative h-24 rounded-lg bg-surface-100 dark:bg-surface-800">
        <Dock
          :model="dock"
          position="bottom"
          class="!absolute"
        >
          <template #itemicon="{ item }">
            <span
              v-tooltip.top="item.label"
              class="grid size-10 place-items-center rounded-lg bg-primary text-primary-contrast"
            >
              <i
                :class="item.icon"
                aria-hidden="true"
              />
            </span>
          </template>
        </Dock>
      </div>
    </PreviewDemo>
  </div>
</template>
