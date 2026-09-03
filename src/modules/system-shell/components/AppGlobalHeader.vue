<template>
  <header class="app-global-header">
    <button
      class="app-global-header__brand"
      type="button"
      aria-label="猎盈中后台管理系统"
      @click="router.push('/audit-phase1/dashboard')"
    >
      <img class="app-global-header__brand-mark" src="/brand/faucon-trade-trader-app.svg" alt="" />
      <span class="app-global-header__brand-name">猎盈中后台管理系统</span>
    </button>

    <div class="app-global-header__global-zone">
      <el-dropdown trigger="click">
        <button class="app-global-header__workspace-switch" type="button">
          机构管理端 <el-icon><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>机构管理端</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span class="app-global-header__meta app-global-header__environment">功能设计 DEMO</span>
    </div>

    <div class="app-global-header__user-zone">
      <el-tooltip content="帮助中心" placement="bottom">
        <button class="app-global-header__icon-button" type="button" aria-label="帮助中心">
          <el-icon><Service /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip :content="isDark ? '切换浅色' : '切换深色'" placement="bottom">
        <button
          class="app-global-header__icon-button app-global-header__theme-button"
          type="button"
          aria-label="主题设置"
          @click="toggleTheme"
        >
          <el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
        </button>
      </el-tooltip>
      <el-dropdown trigger="click" @visible-change="onNotificationVisibleChange">
        <el-badge :value="unreadCount" is-dot :hidden="unreadCount === 0" :offset="[-4, 4]">
          <button class="app-global-header__icon-button" type="button" aria-label="通知">
            <el-icon><Bell /></el-icon>
          </button>
        </el-badge>
        <template #dropdown>
          <div class="notification-panel" @click.stop>
            <div class="notification-panel__header">
              <span>通知</span>
              <el-button v-if="unreadCount > 0" link size="small" @click="markAllNotificationsRead"
                >全部已读</el-button
              >
            </div>
            <div v-if="notificationList.length === 0" class="notification-panel__empty">
              暂无通知
            </div>
            <button
              v-for="notification in notificationList"
              :key="notification.id"
              class="notification-panel__item"
              :class="{ 'notification-panel__item--unread': !notification.is_read }"
              type="button"
              @click="readNotification(notification)"
            >
              <span
                class="notification-panel__dot"
                :class="notification.type === 'alert' ? 'is-alert' : 'is-info'"
              ></span>
              <span class="notification-panel__body">
                <span class="notification-panel__title">{{ notification.title }}</span>
                <span class="notification-panel__time">{{ notification.created_at }}</span>
              </span>
            </button>
            <button
              v-if="notificationList.length"
              class="notification-panel__footer"
              type="button"
              @click="router.push('/scheduler/history')"
            >
              查看运行实例
            </button>
          </div>
        </template>
      </el-dropdown>
      <el-dropdown trigger="click">
        <button class="app-global-header__user-button" type="button">
          <span class="app-global-header__avatar">{{
            userInfo?.username?.slice(0, 1).toUpperCase() || 'A'
          }}</span>
          <el-icon><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled
              ><el-icon><User /></el-icon>个人中心</el-dropdown-item
            >
            <el-dropdown-item @click="$emit('logout')"
              ><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, Bell, Moon, Service, Sunny, SwitchButton, User } from '@element-plus/icons-vue'
import { getNotifications, markAllRead, markNotifRead } from '../../../api'
import { useUserStore } from '../../../stores/user'

defineEmits<{
  logout: []
}>()

interface NotificationItem {
  id: string | number
  title: string
  created_at: string
  is_read: boolean
  type?: 'alert' | 'info'
}

const router = useRouter()
const userStore = useUserStore()
const unreadCount = ref(0)
const notificationList = ref<NotificationItem[]>([])
const userInfo = computed(() => userStore.userInfo)

const themeStorageKey = 'system-shell:theme'
const isDark = ref(false)

function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  window.localStorage.setItem(themeStorageKey, dark ? 'dark' : 'light')
}

function toggleTheme() {
  applyTheme(!isDark.value)
}

async function loadNotifications() {
  try {
    const response: any = await getNotifications({ pageSize: 5 })
    notificationList.value = response?.list || []
    unreadCount.value = response?.unread || 0
  } catch {
    notificationList.value = []
    unreadCount.value = 0
  }
}

function onNotificationVisibleChange(visible: boolean) {
  if (visible) loadNotifications()
}

async function readNotification(notification: NotificationItem) {
  if (notification.is_read) return
  await markNotifRead(notification.id)
  notification.is_read = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function markAllNotificationsRead() {
  await markAllRead()
  notificationList.value.forEach((notification) => (notification.is_read = true))
  unreadCount.value = 0
}

onMounted(() => {
  applyTheme(window.localStorage.getItem(themeStorageKey) === 'dark')
  userStore.fetchUser()
  loadNotifications()
})
</script>

<style scoped>
.app-global-header {
  z-index: 20;
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr) auto;
  flex: 0 0 52px;
  height: 52px;
  min-height: 52px;
  color: #344054;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.app-global-header__brand {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 18px;
  color: #182230;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-right: 1px solid #e2e8f0;
}

.app-global-header__brand-mark {
  display: block;
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 6px;
}

.app-global-header__brand-name {
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-global-header__global-zone,
.app-global-header__user-zone {
  display: flex;
  gap: 16px;
  align-items: center;
}

.app-global-header__global-zone {
  min-width: 0;
  padding: 0 18px;
}

.app-global-header__workspace-switch,
.app-global-header__icon-button,
.app-global-header__user-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #475467;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.app-global-header__workspace-switch {
  gap: 3px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.app-global-header__workspace-switch .el-icon,
.app-global-header__user-button > .el-icon {
  color: #98a2b3;
  font-size: 13px;
}

.app-global-header__meta {
  flex: 0 0 auto;
  color: #667085;
  font-size: 13px;
  white-space: nowrap;
}

.app-global-header__user-zone {
  gap: 8px;
  padding: 0 16px 0 10px;
  white-space: nowrap;
}

.app-global-header__icon-button {
  width: 30px;
  height: 30px;
  color: #475467;
  background: #f2f5fa;
  border-radius: 6px;
}

.app-global-header__icon-button:hover,
.app-global-header__user-button:hover {
  color: #0f55d9;
  background: #e8f1ff;
}

.app-global-header__user-button {
  gap: 7px;
  padding: 2px 4px;
  border-radius: 6px;
}

.app-global-header__avatar {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #176bff, #4e9bff);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.notification-panel {
  width: 320px;
  padding: 8px 0;
}

.notification-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  color: #1d2939;
  font-size: 14px;
  font-weight: 700;
}

.notification-panel__empty {
  padding: 24px 16px;
  color: #98a2b3;
  text-align: center;
  font-size: 13px;
}

.notification-panel__item {
  display: flex;
  width: 100%;
  gap: 10px;
  padding: 10px 16px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 0;
}

.notification-panel__item:hover,
.notification-panel__item--unread {
  background: #f7f9fc;
}

.notification-panel__dot {
  width: 6px;
  height: 6px;
  margin-top: 6px;
  border-radius: 50%;
}

.notification-panel__dot.is-alert {
  background: #d92d20;
}

.notification-panel__dot.is-info {
  background: #0f9f6e;
}

.notification-panel__body {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.notification-panel__title {
  overflow: hidden;
  color: #344054;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-panel__time {
  color: #98a2b3;
  font-size: 11px;
}

.notification-panel__footer {
  width: 100%;
  padding: 8px 16px;
  color: #0f55d9;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-top: 1px solid #e8edf4;
  font-size: 12px;
}

@media (max-width: 1180px) {
  .app-global-header__environment,
  .app-global-header__theme-button {
    display: none;
  }

  .app-global-header__global-zone {
    gap: 12px;
  }
}

@media (max-width: 920px) {
  .app-global-header {
    grid-template-columns: 64px minmax(0, 1fr) auto;
  }

  .app-global-header__brand {
    justify-content: center;
    padding: 0;
  }

  .app-global-header__brand-name,
  .app-global-header__workspace-switch,
  .app-global-header__meta,
  .app-global-header__user-zone > :first-child {
    display: none;
  }

  .app-global-header__search {
    width: min(360px, 44vw);
  }
}
</style>
