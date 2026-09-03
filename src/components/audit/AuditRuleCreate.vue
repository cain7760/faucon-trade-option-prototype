<template>
  <el-dialog :model-value="visible" title="新建稽核" :width="680" @close="close">
    <el-form :model="form" label-position="top">
      <div class="audit-form-grid">
        <el-form-item label="规则名称" required
          ><el-input v-model="form.name" placeholder="请输入规则名称"
        /></el-form-item>
        <el-form-item label="稽核层级"
          ><el-select v-model="form.layer"
            ><el-option>L0</el-option><el-option>L1</el-option><el-option>L2</el-option></el-select
          ></el-form-item
        >
      </div>
      <el-form-item label="核查对象"
        ><el-input v-model="form.target" placeholder="例如 hz-trade.instrument_eval_rep"
      /></el-form-item>
      <el-form-item label="规则说明"
        ><el-input
          v-model="form.description"
          type="textarea"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          placeholder="描述核查口径、阈值与异常处理方式"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="publish">发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage as Message } from 'element-plus'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'published'): void
}>()
const form = reactive({ name: '', layer: 'L0', target: '', description: '' })

function close() {
  emit('update:visible', false)
}
function publish() {
  if (!form.name.trim()) {
    Message.warning('请先填写规则名称')
    return
  }
  emit('published')
  close()
}
</script>

<style scoped>
.audit-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
</style>
