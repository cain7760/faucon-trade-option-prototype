<template>
  <div class="provider-rule-alternatives-page">
    <section class="provider-rule-alternatives-card" aria-label="报价方规则配置">
      <header class="provider-rule-alternatives-heading">
        <div>
          <h1>报价方规则配置</h1>
          <p>维护报价方规则配置；一条规则可关联多个报价方。</p>
        </div>
        <span>共 {{ ruleAlternatives.length }} 条</span>
      </header>

      <div class="provider-rule-alternatives-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增规则</el-button>
      </div>

      <el-table
        :data="ruleAlternatives"
        :border="false"
        row-key="id"
        table-layout="auto"
        empty-text="暂无报价方规则配置"
        class="provider-rule-alternatives-table"
      >
        <el-table-column label="报价方" min-width="240">
          <template #default="{ row }">
            <div class="provider-tags">
              <el-tag v-for="provider in row.providers" :key="provider" size="small" effect="plain">
                {{ provider }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规则" min-width="520">
          <template #default="{ row }">
            {{ formatRuleValues(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="200" />
        <el-table-column prop="createdAt" label="创建时间" min-width="200" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="removeRuleAlternative(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog
      v-model="ruleDialogVisible"
      :title="editingId === null ? '新增规则' : '编辑规则'"
      width="650px"
      class="provider-rule-alternative-dialog"
      destroy-on-close
      @closed="resetRuleForm"
    >
      <el-form label-position="top" class="provider-rule-alternative-form">
        <el-form-item label="报价方" required>
          <el-select v-model="ruleForm.providers" multiple filterable placeholder="请选择报价方">
            <el-option
              v-for="option in providerOptions"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
        </el-form-item>

        <section class="rule-fields" aria-label="规则配置">
          <div class="rule-fields__heading">
            <div>
              <h3>规则配置</h3>
              <p>每条备选方案分别维护最快行权日和敲出规则。</p>
            </div>
          </div>

          <div class="rule-fields__grid">
            <el-form-item label="最快行权日" required>
              <el-select v-model="ruleForm.earliestExercise">
                <el-option
                  v-for="option in earliestExerciseOptions"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="敲出规则" required>
              <el-select v-model="ruleForm.knockoutRule">
                <el-option
                  v-for="option in knockoutRuleOptions"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
            </el-form-item>
          </div>

          <div class="rule-preview" aria-label="规则预览">
            <span>规则预览</span>
            <strong>{{ formatRule(ruleForm) }}</strong>
          </div>
        </section>
      </el-form>

      <template #footer>
        <div class="provider-rule-alternative-dialog__footer">
          <el-button @click="ruleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRuleAlternative">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { reactive, ref } from 'vue'

interface ProviderRuleAlternative {
  id: number
  providers: string[]
  earliestExercise: string
  knockoutRule: string
  updatedAt: string
  createdAt: string
}

interface RuleForm {
  providers: string[]
  earliestExercise: string
  knockoutRule: string
}

const providerOptions = ['致富', 'CLSA', 'NOMURA', '中信证券', '华泰证券']
const earliestExerciseOptions = ['无要求', 'T+1', 'T+2', 'T+5']
const knockoutRuleOptions = ['无要求', '主3创2', '五连板', '协商敲出']

const ruleAlternatives = ref<ProviderRuleAlternative[]>([
  {
    id: 1,
    providers: ['致富', 'CLSA'],
    earliestExercise: 'T+1',
    knockoutRule: '主3创2',
    updatedAt: '2026-08-20 09:30:00',
    createdAt: '2026-08-20 09:30:00',
  },
  {
    id: 2,
    providers: ['致富'],
    earliestExercise: 'T+2',
    knockoutRule: '五连板',
    updatedAt: '2026-08-20 09:35:00',
    createdAt: '2026-08-20 09:35:00',
  },
  {
    id: 3,
    providers: ['NOMURA', '中信证券'],
    earliestExercise: 'T+1',
    knockoutRule: '五连板',
    updatedAt: '2026-08-19 15:20:00',
    createdAt: '2026-08-19 15:20:00',
  },
  {
    id: 4,
    providers: ['NOMURA'],
    earliestExercise: 'T+1',
    knockoutRule: '协商敲出',
    updatedAt: '2026-08-18 11:10:00',
    createdAt: '2026-08-18 11:10:00',
  },
  {
    id: 5,
    providers: ['中信证券', '华泰证券'],
    earliestExercise: '无要求',
    knockoutRule: '五连板',
    updatedAt: '2026-08-18 10:25:00',
    createdAt: '2026-08-18 10:25:00',
  },
  {
    id: 6,
    providers: ['华泰证券'],
    earliestExercise: 'T+5',
    knockoutRule: '主3创2',
    updatedAt: '2026-08-17 16:40:00',
    createdAt: '2026-08-17 16:40:00',
  },
])

const ruleDialogVisible = ref(false)
const editingId = ref<number | null>(null)
const ruleForm = reactive<RuleForm>(createDefaultRuleForm())

function createDefaultRuleForm(): RuleForm {
  return {
    providers: [],
    earliestExercise: '无要求',
    knockoutRule: '无要求',
  }
}

function resetRuleForm() {
  Object.assign(ruleForm, createDefaultRuleForm())
  editingId.value = null
}

function openCreateDialog() {
  resetRuleForm()
  ruleDialogVisible.value = true
}

function openEditDialog(row: ProviderRuleAlternative) {
  editingId.value = row.id
  Object.assign(ruleForm, {
    providers: [...row.providers],
    earliestExercise: row.earliestExercise,
    knockoutRule: row.knockoutRule,
  })
  ruleDialogVisible.value = true
}

function formatRule(rule: Pick<ProviderRuleAlternative, 'earliestExercise' | 'knockoutRule'>) {
  return `最快行权日 等于 ${rule.earliestExercise}；敲出规则 等于 ${rule.knockoutRule}`
}

function formatRuleValues(
  rule: Pick<ProviderRuleAlternative, 'earliestExercise' | 'knockoutRule'>,
) {
  return `${rule.earliestExercise}；${rule.knockoutRule}`
}

function saveRuleAlternative() {
  if (ruleForm.providers.length === 0 || !ruleForm.earliestExercise || !ruleForm.knockoutRule) {
    ElMessage.warning('请完整填写必填项')
    return
  }

  const editingIndex = ruleAlternatives.value.findIndex((item) => item.id === editingId.value)

  if (editingIndex >= 0) {
    const current = ruleAlternatives.value[editingIndex]
    ruleAlternatives.value[editingIndex] = {
      ...current,
      providers: [...ruleForm.providers],
      earliestExercise: ruleForm.earliestExercise,
      knockoutRule: ruleForm.knockoutRule,
      updatedAt: formatDateTime(new Date()),
    }
    ElMessage.success('规则已更新')
  } else {
    ruleAlternatives.value.unshift({
      id: Math.max(0, ...ruleAlternatives.value.map((item) => item.id)) + 1,
      providers: [...ruleForm.providers],
      earliestExercise: ruleForm.earliestExercise,
      knockoutRule: ruleForm.knockoutRule,
      updatedAt: formatDateTime(new Date()),
      createdAt: formatDateTime(new Date()),
    })
    ElMessage.success('规则已新增')
  }

  ruleDialogVisible.value = false
}

async function removeRuleAlternative(row: ProviderRuleAlternative) {
  try {
    await ElMessageBox.confirm(`确定删除“${row.providers.join('、')}”的这条规则吗？`, '删除规则', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  ruleAlternatives.value = ruleAlternatives.value.filter((item) => item.id !== row.id)
  ElMessage.success('规则已删除')
}

function formatDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}
</script>

<style scoped>
.provider-rule-alternatives-page {
  min-height: calc(100vh - 96px);
  padding: 20px 24px 32px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
}

.provider-rule-alternatives-card {
  min-height: 320px;
}

.provider-rule-alternatives-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.provider-rule-alternatives-heading h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
}

.provider-rule-alternatives-heading p {
  margin: 4px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  line-height: 20px;
}

.provider-rule-alternatives-heading > span {
  padding-top: 5px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  line-height: 20px;
  white-space: nowrap;
}

.provider-rule-alternatives-toolbar {
  display: flex;
  align-items: center;
  padding-top: 20px;
}

.provider-rule-alternatives-table {
  width: 100%;
  margin-top: 12px;
  --el-table-header-bg-color: var(--color-border-subtle);
  --el-table-header-text-color: var(--color-text-primary);
  --el-table-row-hover-bg-color: var(--color-border);
  --el-table-border-color: var(--color-border-subtle);
}

.provider-rule-alternatives-table :deep(.el-table__header th) {
  height: 44px;
  font-weight: var(--font-weight-semibold);
}

.provider-rule-alternatives-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.provider-rule-alternatives-table :deep(.cell) {
  line-height: 22px;
  white-space: nowrap;
}

.provider-rule-alternatives-table :deep(.el-button + .el-button) {
  margin-left: 8px;
}

.provider-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}

.provider-tags :deep(.el-tag) {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-primary-border);
}

.provider-rule-alternative-form :deep(.el-select__selection .el-tag) {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-primary-border);
}

.provider-rule-alternative-form :deep(.el-select) {
  width: 100%;
}

.rule-fields {
  padding-top: 4px;
  margin-top: 20px;
  border-top: 1px solid var(--color-border-subtle);
}

.rule-fields__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-top: 20px;
  margin-bottom: 16px;
}

.rule-fields__heading h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  line-height: 22px;
}

.rule-fields__heading p {
  margin: 2px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  line-height: 20px;
}

.rule-fields__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.rule-fields__grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.rule-preview {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  margin-top: 20px;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  line-height: 20px;
}

.rule-preview strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

:global(.provider-rule-alternative-dialog .el-dialog__header) {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 40px;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

:global(.provider-rule-alternative-dialog .el-dialog__title) {
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
}

:global(.provider-rule-alternative-dialog .el-dialog__headerbtn) {
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

:global(.provider-rule-alternative-dialog .el-dialog__body) {
  padding: 24px;
}

:global(.provider-rule-alternative-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
}

.provider-rule-alternative-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.provider-rule-alternative-dialog__footer :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 760px) {
  .provider-rule-alternatives-page {
    padding: 16px;
  }

  .provider-rule-alternatives-heading {
    flex-direction: column;
    gap: 8px;
  }

  .provider-rule-alternatives-heading > span {
    padding-top: 0;
  }

  .rule-fields__grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .rule-preview {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
