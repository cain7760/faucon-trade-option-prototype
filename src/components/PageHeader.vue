<template>
  <header class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div class="page-actions"><slot name="actions" /></div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}
.page-header h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
  line-height: 34px;
  font-weight: 600;
}
.page-header p {
  margin: 5px 0 0;
  color: var(--color-text-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.page-actions {
  flex: 0 0 auto;
}
</style>
