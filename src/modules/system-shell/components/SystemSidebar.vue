<template>
  <el-aside :width="collapsed ? '64px' : '252px'" class="system-sidebar">
    <div class="system-sidebar__tools">
      <el-tooltip :content="collapsed ? '展开侧栏' : '收起侧栏'" placement="right">
        <button
          class="system-sidebar__collapse-button"
          type="button"
          :aria-label="collapsed ? '展开菜单' : '收起菜单'"
          @click="$emit('update:collapsed', !collapsed)"
        >
          <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
        </button>
      </el-tooltip>
      <el-input
        v-if="!collapsed"
        v-model="filterText"
        class="system-sidebar__search"
        placeholder="搜索菜单"
        clearable
        aria-label="搜索菜单"
      >
        <template #prefix
          ><el-icon><Search /></el-icon
        ></template>
      </el-input>
    </div>

    <nav class="system-sidebar__scroll" aria-label="系统菜单">
      <section
        v-for="group in filteredNavigationGroups"
        :key="group.label"
        class="system-sidebar__group"
      >
        <p v-if="!collapsed" class="system-sidebar__group-title">{{ group.label }}</p>
        <el-menu
          :default-active="activePath"
          :default-openeds="systemNavigationOpenKeys"
          :collapse="collapsed"
          :collapse-transition="false"
          class="system-sidebar__menu"
          @select="$emit('select', $event)"
        >
          <template v-for="item in group.items" :key="item.index">
            <el-sub-menu v-if="item.children?.length" :index="item.index">
              <template #title>
                <el-icon><LegacyIcon :name="item.icon" /></el-icon>
                <span>{{ item.label }}</span>
              </template>
              <el-menu-item v-for="child in item.children" :key="child.index" :index="child.index">
                <el-icon><LegacyIcon :name="child.icon" /></el-icon>
                <span>{{ child.label }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="item.index">
              <el-icon><LegacyIcon :name="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </section>
    </nav>

    <footer v-if="!collapsed" class="system-sidebar__footer">
      <span>版本 V2026.08</span>
      <button type="button" @click="$emit('update:collapsed', true)">收起侧栏</button>
    </footer>
  </el-aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Expand, Fold, Search } from '@element-plus/icons-vue'
import LegacyIcon from '../../../components/icons/LegacyIcon.vue'
import { systemNavigationGroups, systemNavigationOpenKeys } from '../navigation'

defineProps<{
  activePath: string
  collapsed: boolean
}>()

defineEmits<{
  select: [key: string]
  'update:collapsed': [value: boolean]
}>()

const filterText = ref('')
const normalizedFilterText = computed(() => filterText.value.trim().toLowerCase())

const filteredNavigationGroups = computed(() => {
  if (!normalizedFilterText.value) return systemNavigationGroups

  return systemNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => {
          const matchesParent = item.label.toLowerCase().includes(normalizedFilterText.value)
          const matchingChildren = item.children?.filter((child) =>
            child.label.toLowerCase().includes(normalizedFilterText.value),
          )

          if (matchesParent) return item
          if (matchingChildren?.length) return { ...item, children: matchingChildren }
          return null
        })
        .filter((item) => item !== null),
    }))
    .filter((group) => group.items.length)
})
</script>

<style scoped>
.system-sidebar {
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  transition: width 0.2s ease;
}

.system-sidebar__tools {
  display: flex;
  flex: 0 0 48px;
  gap: 8px;
  align-items: center;
  min-height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid #e8edf4;
}

.system-sidebar__collapse-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  color: #667085;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dde5ef;
  border-radius: 6px;
}

.system-sidebar__collapse-button:hover {
  color: #0f55d9;
  background: #e8f1ff;
}

.system-sidebar__search {
  min-width: 0;
}

.system-sidebar__search :deep(.el-input__wrapper) {
  min-height: 32px;
  padding: 0 9px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #dde5ef !important;
}

.system-sidebar__search :deep(.el-input__wrapper:hover),
.system-sidebar__search :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow: inset 0 0 0 1px #b9cff5 !important;
}

.system-sidebar__scroll {
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px 10px 16px;
  overflow-y: auto;
}

.system-sidebar__group + .system-sidebar__group {
  margin-top: 10px;
}

.system-sidebar__group-title {
  margin: 0;
  padding: 9px 10px 6px;
  color: #8a94a6;
  font-size: 12px;
  font-weight: 700;
}

.system-sidebar__menu {
  background: transparent;
  border-right: 0;
}

.system-sidebar__menu :deep(.el-sub-menu__title),
.system-sidebar__menu :deep(.el-menu-item) {
  width: 100%;
  height: 36px;
  min-width: 0;
  margin: 0 0 2px;
  padding: 0 9px !important;
  color: #475467;
  line-height: 36px;
  border-radius: 6px;
  font-size: 13px;
}

.system-sidebar__menu :deep(.el-sub-menu__title .el-icon),
.system-sidebar__menu :deep(.el-menu-item .el-icon) {
  flex: 0 0 18px;
  width: 18px;
  margin-right: 8px;
  color: #667085;
  font-size: 16px;
}

.system-sidebar__menu :deep(.el-sub-menu__title:hover),
.system-sidebar__menu :deep(.el-menu-item:hover) {
  color: #0f55d9;
  background: #eef5ff;
}

.system-sidebar__menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: #0f55d9;
  background: #e8f1ff;
  font-weight: 700;
}

.system-sidebar__menu :deep(.el-sub-menu .el-menu) {
  position: relative;
  margin: 4px 0 8px 28px;
  padding-left: 9px;
  background: transparent;
  border-left: 1px solid #d8e0eb;
}

.system-sidebar__menu :deep(.el-sub-menu .el-menu-item) {
  height: 32px;
  min-width: 0;
  padding-left: 10px !important;
  color: #667085;
  line-height: 32px;
}

.system-sidebar__menu :deep(.el-menu-item.is-active) {
  color: #0f55d9;
  background: #fff;
  box-shadow: inset 0 0 0 1px #d8e7ff;
  font-weight: 700;
}

.system-sidebar__menu :deep(.el-menu-item.is-active .el-icon),
.system-sidebar__menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title .el-icon) {
  color: #0f55d9;
}

.system-sidebar__menu :deep(.el-sub-menu__icon-arrow) {
  right: 10px;
  margin-top: -3px;
  color: currentcolor;
}

.system-sidebar__menu :deep(.el-menu--collapse) {
  width: 100%;
}

.system-sidebar__menu :deep(.el-menu--collapse .el-sub-menu__title),
.system-sidebar__menu :deep(.el-menu--collapse .el-menu-item) {
  justify-content: center;
  padding: 0 !important;
}

.system-sidebar__menu :deep(.el-menu--collapse .el-sub-menu__title .el-icon),
.system-sidebar__menu :deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin: 0;
}

.system-sidebar__footer {
  display: flex;
  flex: 0 0 42px;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 12px;
  color: #667085;
  border-top: 1px solid #e8edf4;
  font-size: 12px;
}

.system-sidebar__footer button {
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.system-sidebar__footer button:hover {
  color: #0f55d9;
}
</style>
