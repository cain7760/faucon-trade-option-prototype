<template>
  <el-container class="enterprise-shell" direction="vertical">
    <AppGlobalHeader @logout="handleLogout" />

    <el-container class="enterprise-shell__body">
      <SystemSidebar
        v-model:collapsed="collapsed"
        :active-path="activeMenuPath"
        @select="onMenuSelect"
      />

      <el-container direction="vertical" class="enterprise-workspace">
        <div class="enterprise-workspace__breadcrumb">
          <el-breadcrumb separator="/" aria-label="面包屑">
            <el-breadcrumb-item v-if="route.meta?.parentTitle">{{
              route.meta.parentTitle
            }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.detail">问题中心</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <el-main class="layout-content">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import AppGlobalHeader from './components/AppGlobalHeader.vue'
import SystemSidebar from './components/SystemSidebar.vue'

const shellCollapsedStorageKey = 'system-shell:collapsed'
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const collapsed = ref(window.localStorage.getItem(shellCollapsedStorageKey) === 'true')

const activeMenuPath = computed(() => {
  if (route.path.startsWith('/audit-phase1/issues/')) return '/audit-phase1/issues'
  return route.path
})
const currentTitle = computed(() => (route.meta?.title as string) || '工作台')

watch(collapsed, (value) => {
  window.localStorage.setItem(shellCollapsedStorageKey, String(value))
})

function onMenuSelect(path: string) {
  if (!path.startsWith('/')) return
  router.push(path)
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.enterprise-shell {
  width: 100%;
  height: 100dvh;
  min-height: 0;
  background: #f2f5f9;
}

.enterprise-shell__body {
  min-height: 0;
  overflow: hidden;
}

.enterprise-workspace {
  min-width: 0;
  min-height: 0;
  background: #f2f5f9;
}

.enterprise-workspace__breadcrumb {
  display: flex;
  flex: 0 0 44px;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  background: #fff;
  border-bottom: 1px solid #e7edf5;
}

.enterprise-workspace__breadcrumb :deep(.el-breadcrumb) {
  font-size: 13px;
}

.enterprise-workspace__breadcrumb :deep(.el-breadcrumb__inner),
.enterprise-workspace__breadcrumb :deep(.el-breadcrumb__inner a) {
  color: #667085;
  font-weight: 400;
}

.enterprise-workspace__breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #344054;
  font-weight: 600;
}

.layout-content {
  min-height: 0;
  padding: 18px;
  overflow: auto;
  background: #f2f5f9;
}

.page-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.page-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .layout-content {
    padding: 12px;
  }

  .enterprise-workspace__breadcrumb {
    padding: 0 12px;
  }
}
</style>
