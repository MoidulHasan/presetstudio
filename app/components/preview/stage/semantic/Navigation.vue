<script setup lang="ts">
// Navigation stage: menu items at rest, focused and active, with icons and submenu labels.
// Focus and active are classes, so PrimeVue's own Menu/TieredMenu markup shows them.

const MENU = [
  { label: 'New', icon: 'pi pi-plus', cls: '', pick: 'cell:text:default', hint: 'Default' },
  { label: 'Search', icon: 'pi pi-search', cls: 'p-focus', pick: 'cell:background:focus', hint: 'Focus' },
  { label: 'Share', icon: 'pi pi-share-alt', cls: '', pick: 'cell:icon:default', hint: 'Default' },
]
const TIERED = [
  { label: 'File', icon: 'pi pi-file', cls: 'p-tieredmenu-item-active', pick: 'cell:background:active', hint: 'Active', submenu: true },
  { label: 'Edit', icon: 'pi pi-pencil', cls: 'p-focus', pick: 'cell:background:focus', hint: 'Focus', submenu: true },
  { label: 'View', icon: 'pi pi-eye', cls: '', pick: 'cell:submenuicon:default', hint: 'Default', submenu: true },
]
</script>

<template>
  <PreviewStageSchemes intro="Menu items at rest, focused and active. Click any item to edit that exact color.">
    <template #default>
      <div class="hidden">
        <Menu :model="[]" />
        <TieredMenu :model="[]" />
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Menu
          </h3>
          <div class="p-menu p-component">
            <ul
              class="p-menu-list"
              role="menu"
              aria-label="Menu item states"
            >
              <li
                v-pick="'cell:submenu:default'"
                class="p-menu-submenu-label cursor-pointer"
                role="none"
              >
                Documents
              </li>
              <li
                v-for="item in MENU"
                :key="item.label"
                v-pick="item.pick"
                :class="item.cls"
                class="p-menu-item cursor-pointer"
                role="menuitem"
              >
                <div class="p-menu-item-content">
                  <a class="p-menu-item-link">
                    <span
                      :class="item.icon"
                      class="p-menu-item-icon"
                    />
                    <span class="p-menu-item-label flex-1">{{ item.label }}</span>
                    <span class="text-[10px] opacity-60">{{ item.hint }}</span>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Tiered menu
          </h3>
          <div class="p-tieredmenu p-component">
            <ul
              class="p-tieredmenu-root-list"
              role="menubar"
              aria-label="Tiered menu item states"
            >
              <li
                v-for="item in TIERED"
                :key="item.label"
                v-pick="item.pick"
                :class="item.cls"
                class="p-tieredmenu-item cursor-pointer"
                role="menuitem"
              >
                <div class="p-tieredmenu-item-content">
                  <a class="p-tieredmenu-item-link">
                    <span
                      :class="item.icon"
                      class="p-tieredmenu-item-icon"
                    />
                    <span class="p-tieredmenu-item-label flex-1">{{ item.label }}</span>
                    <span class="text-[10px] opacity-60">{{ item.hint }}</span>
                    <i
                      v-if="item.submenu"
                      class="pi pi-angle-right p-tieredmenu-submenu-icon"
                    />
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
