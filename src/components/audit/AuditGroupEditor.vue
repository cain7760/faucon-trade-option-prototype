<script lang="ts">
export interface AuditResponsibilityGroup {
  id?: string
  name: string
  code: string
  layers: string[]
  scopes: string[]
  team: string
  leader: string
  dutyMembers: string[]
  recipientPolicy: string
  channelIds: string[]
  acknowledgmentSlaMinutes: number
  escalationEnabled: boolean
  escalationTargets: string[]
  recoveryNotification: boolean
}
</script>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{ visible: boolean; group?: Partial<AuditResponsibilityGroup> | null }>()
const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'save', value: AuditResponsibilityGroup): void
}>()
const form = reactive<AuditResponsibilityGroup>({
  name: '',
  code: '',
  layers: ['L0'],
  scopes: [],
  team: '',
  leader: '',
  dutyMembers: [],
  recipientPolicy: 'leader_and_duty',
  channelIds: [],
  acknowledgmentSlaMinutes: 60,
  escalationEnabled: true,
  escalationTargets: [],
  recoveryNotification: true,
})

watch(
  () => [props.visible, props.group] as const,
  () => {
    if (!props.visible) return
    Object.assign(form, {
      name: '',
      code: '',
      layers: ['L0'],
      scopes: [],
      team: '',
      leader: '',
      dutyMembers: [],
      recipientPolicy: 'leader_and_duty',
      channelIds: [],
      acknowledgmentSlaMinutes: 60,
      escalationEnabled: true,
      escalationTargets: [],
      recoveryNotification: true,
      ...(props.group || {}),
    })
  },
  { immediate: true },
)

function close() {
  emit('update:visible', false)
}
function save() {
  emit('save', { ...form })
}
</script>

<template>
  <el-dialog :model-value="visible" title="责任组与通知策略" :width="720" @close="close">
    <el-form :model="form" label-position="top">
      <div class="audit-form-grid">
        <el-form-item label="责任组名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="责任组编码"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="所属团队"><el-input v-model="form.team" /></el-form-item>
        <el-form-item label="负责人"><el-input v-model="form.leader" /></el-form-item>
        <el-form-item label="确认 SLA（分钟）"
          ><el-input-number v-model="form.acknowledgmentSlaMinutes" :min="5" :step="5"
        /></el-form-item>
        <el-form-item label="超时升级"><el-switch v-model="form.escalationEnabled" /></el-form-item>
      </div>
      <el-form-item label="通知后恢复提醒"
        ><el-switch v-model="form.recoveryNotification"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.audit-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
</style>
