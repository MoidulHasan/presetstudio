<template>
  <div class="flex min-h-screen flex-col">
    <!-- Keyboard users can jump past the header; visible only while focused. -->
    <a
      href="#main"
      class="sr-only z-50 rounded-md bg-surface-900 px-3 py-2 text-sm font-medium text-surface-0 focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
    >Skip to content</a>
    <AppHeader />
    <main
      id="main"
      class="flex-1 focus:outline-none"
      tabindex="-1"
    >
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
