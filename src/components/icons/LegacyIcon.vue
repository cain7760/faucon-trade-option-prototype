<template>
  <svg
    class="legacy-icon"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    stroke-width="4"
    stroke-linecap="butt"
    stroke-linejoin="miter"
    aria-hidden="true"
  >
    <template v-if="name === 'storage'">
      <path
        d="M7 18h34v12H7V18ZM40 6H8a1 1 0 0 0-1 1v11h34V7a1 1 0 0 0-1-1ZM7 30h34v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V30Z"
      />
      <path d="M13.02 36H13v.02h.02V36Z" />
      <path
        d="M13 12v-2h-2v2h2Zm.02 0h2v-2h-2v2Zm0 .02v2h2v-2h-2Zm-.02 0h-2v2h2v-2ZM13 14h.02v-4H13v4Zm-1.98-2v.02h4V12h-4Zm2-1.98H13v4h.02v-4Zm1.98 2V12h-4v.02h4Z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M13.02 24H13v.02h.02V24Z" />
    </template>
    <path
      v-else-if="name === 'exclamation-circle'"
      d="M24 28V14m0 16v4M6 24c0-9.941 8.059-18 18-18s18 8.059 18 18-8.059 18-18 18S6 33.941 6 24Z"
    />
    <path
      v-else-if="name === 'calendar'"
      d="M7 22h34M14 5v8m20-8v8M8 41h32a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1Z"
    />
    <path
      v-else-if="name === 'clock-circle'"
      d="M24 14v10h9.5m8.5 0c0 9.941-8.059 18-18 18S6 33.941 6 24 14.059 6 24 6s18 8.059 18 18Z"
    />
    <path
      v-else-if="name === 'check-circle'"
      d="m15 22 7 7 11.5-11.5M42 24c0 9.941-8.059 18-18 18S6 33.941 6 24 14.059 6 24 6s18 8.059 18 18Z"
    />
    <template v-else-if="name === 'dashboard'">
      <path
        d="M41.808 24c.118 4.63-1.486 9.333-5.21 13m5.21-13h-8.309m8.309 0c-.112-4.38-1.767-8.694-4.627-12M24 6c5.531 0 10.07 2.404 13.18 6M24 6c-5.724 0-10.384 2.574-13.5 6.38M24 6v7.5M37.18 12 31 17.5m-20.5-5.12L17 17.5m-6.5-5.12C6.99 16.662 5.44 22.508 6.53 28m4.872 9c-2.65-2.609-4.226-5.742-4.873-9m0 0 8.97-3.5"
      />
      <path d="M24 32a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 0V19" />
    </template>
    <path
      v-else-if="name === 'grid'"
      d="M7 7h14v14H7V7Zm20 0h14v14H27V7ZM7 27h14v14H7V27Zm20 0h14v14H27V27Z"
    />
    <path
      v-else-if="name === 'star'"
      d="m24 6 5.56 11.27L42 19.08l-9 8.77 2.12 12.39L24 34.39l-11.12 5.85L15 27.85l-9-8.77 12.44-1.81L24 6Z"
    />
    <path
      v-else-if="name === 'bug'"
      d="M24 42c-6.075 0-11-4.925-11-11V18h22v13c0 6.075-4.925 11-11 11Zm0 0V23m11 4h8M5 27h8M7 14a4 4 0 0 0 4 4h26a4 4 0 0 0 4-4m0 28v-.5a6.5 6.5 0 0 0-6.5-6.5M7 42v-.5a6.5 6.5 0 0 1 6.5-6.5M17 14a7 7 0 1 1 14 0"
    />
    <path
      v-else-if="name === 'tool'"
      d="M19.994 11.035c3.66-3.659 9.094-4.46 13.531-2.405a.1.1 0 0 1 .028.16l-6.488 6.488a1 1 0 0 0 0 1.414l4.243 4.243a1 1 0 0 0 1.414 0l6.488-6.488a.1.1 0 0 1 .16.028c2.056 4.437 1.254 9.872-2.405 13.53-3.695 3.696-9.2 4.477-13.66 2.347L12.923 40.733a1 1 0 0 1-1.414 0L7.266 36.49a1 1 0 0 1 0-1.414l10.382-10.382c-2.13-4.46-1.349-9.965 2.346-13.66Z"
    />
    <path
      v-else-if="name === 'notification'"
      d="M24 9c7.18 0 13 5.82 13 13v13H11V22c0-7.18 5.82-13 13-13Zm0 0V4M6 35h36m-25 7h14"
    />
    <path v-else d="M39.6 17.443 24.043 33 8.487 17.443" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name:
      | 'storage'
      | 'exclamation-circle'
      | 'calendar'
      | 'clock-circle'
      | 'check-circle'
      | 'dashboard'
      | 'grid'
      | 'star'
      | 'bug'
      | 'tool'
      | 'notification'
      | 'down'
  }>(),
  {},
)
</script>

<style scoped>
.legacy-icon {
  display: block;
  width: 1em;
  height: 1em;
  overflow: visible;
}
</style>
