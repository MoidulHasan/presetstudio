<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <AppHeader />
    <main class="flex min-h-0 flex-1">
      <slot />
    </main>
  </div>
</template>
