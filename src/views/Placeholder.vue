<template>
  <section class="placeholder-card">
    <div class="placeholder-icon"><icon-apps /></div>
    <h1>{{ route.meta.title || '功能页面' }}</h1>
    <p>该模块不在“数据稽核一期”交付包内，当前保留菜单与路由位置。</p>
    <el-button type="primary" @click="router.push('/audit-phase1/dashboard')"
      >返回稽核驾驶舱</el-button
    >
  </section>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Grid as IconApps } from '@element-plus/icons-vue'
const route = useRoute()
const router = useRouter()
</script>

<style scoped>
.placeholder-card {
  min-height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-surface);
  text-align: center;
}
.placeholder-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  margin-bottom: 18px;
  border-radius: 16px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  font-size: 28px;
}
h1 {
  margin: 0 0 10px;
  font-size: 22px;
}
p {
  margin: 0 0 24px;
  color: var(--color-text-tertiary);
}
</style>
