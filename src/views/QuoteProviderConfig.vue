<template>
  <div class="quote-provider-page">
    <section class="filter-panel" aria-label="报价方查询条件">
      <div class="filter-grid">
        <label class="filter-item">
          <span>报价方</span>
          <el-input
            v-model="draftFilters.provider"
            clearable
            placeholder="查找报价方"
            :prefix-icon="Search"
            @keyup.enter="applyFilters"
          />
        </label>
        <label class="filter-item">
          <span>自营账号</span>
          <el-input
            v-model="draftFilters.account"
            clearable
            placeholder="输入自营账号"
            :prefix-icon="Search"
            @keyup.enter="applyFilters"
          />
        </label>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="applyFilters">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <section class="provider-content">
      <div class="table-toolbar">
        <div class="toolbar-actions">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增报价方</el-button>
          <div class="rule-config-action">
            <el-button :icon="Setting" @click="openRuleDialog">报价方规则配置</el-button>
            <el-popover
              placement="top-start"
              :width="288"
              trigger="click"
              popper-class="rule-config-note-popper"
            >
              <template #reference>
                <button type="button" class="rule-config-note" aria-label="查看报价方规则配置说明">
                  1
                </button>
              </template>
              <p class="rule-config-note-popper__title">报价方带入说明</p>
              <p>未勾选表格报价方时，进入后不预选；勾选后会自动带入所选报价方。</p>
            </el-popover>
          </div>
        </div>
        <span class="result-count">共 {{ filteredProviders.length }} 条</span>
      </div>

      <el-table
        :data="filteredProviders"
        :border="false"
        stripe
        table-layout="auto"
        empty-text="暂无符合条件的报价方"
        class="provider-table"
        @selection-change="handleProviderSelectionChange"
      >
        <el-table-column type="selection" width="48" fixed="left" />
        <el-table-column prop="provider" label="报价方" min-width="110" fixed="left" />
        <el-table-column prop="proprietaryAccount" label="自营账号" min-width="110" />
        <el-table-column prop="counterpartyAccount" label="上手方账号" min-width="120" />
        <el-table-column prop="emails" label="邮箱地址" min-width="260">
          <template #default="{ row }">
            <span class="email-cell">{{ row.emails || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dealCharacter" label="成交字符" min-width="110">
          <template #default="{ row }">{{ row.dealCharacter || '—' }}</template>
        </el-table-column>
        <el-table-column label="匹配规则" min-width="250">
          <template #default="{ row }">
            <div class="rule-tags">
              <el-tag v-for="rule in row.matchRules" :key="rule" size="small" effect="plain">
                {{ rule }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="168" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="168" />
        <el-table-column label="操作" width="112" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="removeProvider(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog
      v-model="providerDialogVisible"
      :title="editingId ? '编辑报价方' : '新增报价方'"
      width="min(1080px, calc(100vw - 64px))"
      class="provider-editor-dialog"
      destroy-on-close
      @closed="providerFormRef?.clearValidate()"
    >
      <el-form
        ref="providerFormRef"
        :model="providerForm"
        :rules="providerFormRules"
        label-position="top"
      >
        <div class="provider-required-fields">
          <el-form-item label="报价方" prop="provider">
            <el-select
              v-model="providerForm.provider"
              filterable
              allow-create
              placeholder="请选择报价方"
            >
              <el-option
                v-for="option in providerOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="自营账号" prop="proprietaryAccount">
            <el-select
              v-model="providerForm.proprietaryAccount"
              filterable
              allow-create
              placeholder="请选择自营账号"
            >
              <el-option
                v-for="option in proprietaryAccountOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上手方账号" prop="counterpartyAccount">
            <el-select
              v-model="providerForm.counterpartyAccount"
              filterable
              allow-create
              placeholder="请选择上手方账号"
            >
              <el-option
                v-for="option in counterpartyAccountOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
        </div>

        <section class="repeatable-field-section" aria-label="邮箱地址配置">
          <div class="repeatable-field-heading">
            <h3>邮箱地址</h3>
            <el-button type="primary" :icon="Plus" @click="providerForm.emails.push('')"
              >添加</el-button
            >
          </div>
          <div class="repeatable-field-list">
            <div
              v-for="(_, index) in providerForm.emails"
              :key="`email-${index}`"
              class="repeatable-field-row"
            >
              <span>邮箱地址</span>
              <el-input v-model="providerForm.emails[index]" placeholder="请输入邮箱地址" />
              <el-button
                link
                type="danger"
                :disabled="providerForm.emails.length === 1"
                @click="providerForm.emails.splice(index, 1)"
              >
                删除
              </el-button>
            </div>
          </div>
        </section>

        <section class="repeatable-field-section" aria-label="成交字符配置">
          <div class="repeatable-field-heading">
            <h3>成交字符</h3>
            <el-button type="primary" :icon="Plus" @click="providerForm.dealCharacters.push('')"
              >添加</el-button
            >
          </div>
          <div class="repeatable-field-list">
            <div
              v-for="(_, index) in providerForm.dealCharacters"
              :key="`deal-character-${index}`"
              class="repeatable-field-row"
            >
              <span>成交字符</span>
              <el-input v-model="providerForm.dealCharacters[index]" placeholder="请输入成交字符" />
              <el-button
                link
                type="danger"
                :disabled="providerForm.dealCharacters.length === 1"
                @click="providerForm.dealCharacters.splice(index, 1)"
              >
                删除
              </el-button>
            </div>
          </div>
        </section>

        <QuoteRuleBuilder
          v-model="providerForm.ruleConfig"
          variant="fixed"
          class="provider-rule-builder"
          aria-label="当前报价方规则配置"
        />
      </el-form>
      <template #footer>
        <el-button @click="providerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProvider">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="ruleDialogVisible"
      title="报价方规则配置"
      width="650px"
      class="quote-rule-dialog"
      destroy-on-close
    >
      <div class="rule-dialog-content">
        <label class="counterparty-field">
          <span class="counterparty-heading">
            <span class="counterparty-title-block">
              <el-tag class="counterparty-step" effect="light">01</el-tag>
              <span>
                <span class="counterparty-title">生效的上手方 <em>*</em></span>
                <span class="counterparty-description">规则仅对所选上手方生效，支持搜索、多选</span>
              </span>
            </span>
            <el-tag
              v-if="draftRuleConfig.counterparties.length"
              class="selected-count"
              effect="light"
            >
              已选 {{ draftRuleConfig.counterparties.length }} 个
            </el-tag>
          </span>
          <el-select
            v-model="draftRuleConfig.counterparties"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            :reserve-keyword="false"
            placeholder="请选择上手方（可多选）"
          >
            <template #header>
              <div class="counterparty-batch-actions">
                <el-checkbox
                  :model-value="allCounterpartiesSelected"
                  :indeterminate="someCounterpartiesSelected"
                  @change="toggleAllCounterparties"
                >
                  全选
                </el-checkbox>
                <el-button
                  link
                  type="primary"
                  :disabled="draftRuleConfig.counterparties.length === 0"
                  @click="draftRuleConfig.counterparties = []"
                >
                  清空
                </el-button>
              </div>
            </template>
            <el-option
              v-for="provider in counterpartyOptions"
              :key="provider"
              :label="provider"
              :value="provider"
            />
          </el-select>
        </label>

        <QuoteRuleBuilder v-model="draftRuleConfig" variant="dialog" aria-label="报价方规则配置" />
      </div>
      <template #footer>
        <div class="rule-dialog-footer">
          <span>保存后规则即对所选上手方生效</span>
          <div>
            <el-button @click="ruleDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveRules">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshLeft, Search, Setting } from '@element-plus/icons-vue'
import QuoteRuleBuilder from '../components/quote/QuoteRuleBuilder.vue'

interface QuoteProvider {
  id: number
  provider: string
  proprietaryAccount: string
  counterpartyAccount: string
  emails: string
  dealCharacter: string
  matchRules: string[]
  ruleConfig: RuleBuilderModel
  createdAt: string
  updatedAt: string
}

type RuleType = '' | 'exerciseDate' | 'knockout'
type RuleRelation = 'AND' | 'OR'
type RuleOperator = 'equals' | 'notEquals'

interface QuoteRule {
  id: number
  type: RuleType
  operator: RuleOperator
  value: string[]
}

interface QuoteRuleConfig {
  counterparties: string[]
  relation: RuleRelation
  rules: QuoteRule[]
}

interface RuleBuilderModel {
  relation: RuleRelation
  rules: QuoteRule[]
}

interface ProviderForm {
  provider: string
  proprietaryAccount: string
  counterpartyAccount: string
  emails: string[]
  dealCharacters: string[]
  ruleConfig: RuleBuilderModel
}

interface ProviderSeed {
  provider: string
  proprietaryAccount: string
  counterpartyAccount: string
  exerciseDate: string
  knockout: string
  order?: 'exercise-first' | 'knockout-first'
}

const providerSeeds: ProviderSeed[] = [
  {
    provider: '中信证券',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2172101',
    exerciseDate: '无要求',
    knockout: '无要求',
    order: 'exercise-first',
  },
  {
    provider: '华泰证券',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2180001',
    exerciseDate: '无要求',
    knockout: '无要求',
    order: 'exercise-first',
  },
  {
    provider: 'CLSA',
    proprietaryAccount: '1000008',
    counterpartyAccount: '1000004',
    exerciseDate: 'T+1',
    knockout: '无要求',
  },
  {
    provider: 'HTSCNYFIX',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2180001',
    exerciseDate: 'T+1',
    knockout: '无要求',
  },
  {
    provider: 'EQD',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2188002',
    exerciseDate: 'T+1',
    knockout: '无要求',
  },
  {
    provider: 'NOMURA',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2120002',
    exerciseDate: 'T+1',
    knockout: '无要求',
  },
  {
    provider: 'WEWI',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2186007',
    exerciseDate: 'T+1',
    knockout: '无要求',
  },
  {
    provider: 'WF001',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2189001',
    exerciseDate: 'T+1',
    knockout: '无要求',
  },
  {
    provider: 'GFOTC',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2187005',
    exerciseDate: 'T+5',
    knockout: '无要求',
  },
  {
    provider: 'WEWI',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2186007',
    exerciseDate: '无要求',
    knockout: '五连板',
  },
  {
    provider: 'WEWI',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2186007',
    exerciseDate: 'T+1',
    knockout: '五连板',
  },
  {
    provider: 'N/A',
    proprietaryAccount: '',
    counterpartyAccount: '',
    exerciseDate: 'T+5',
    knockout: '五连板',
  },
  {
    provider: '中金',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2169003',
    exerciseDate: '无要求',
    knockout: '协商敲出',
  },
  {
    provider: '中金',
    proprietaryAccount: '2172007',
    counterpartyAccount: '2169003',
    exerciseDate: 'T+1',
    knockout: '协商敲出',
  },
  {
    provider: 'N/A',
    proprietaryAccount: '',
    counterpartyAccount: '',
    exerciseDate: 'T+5',
    knockout: '协商敲出',
  },
]

const providers = ref<QuoteProvider[]>(providerSeeds.map(createProviderFromSeed))
const selectedProviders = ref<QuoteProvider[]>([])

const draftFilters = reactive({ provider: '', account: '' })
const activeFilters = reactive({ provider: '', account: '' })
const providerDialogVisible = ref(false)
const ruleDialogVisible = ref(false)
const editingId = ref<number | null>(null)
const providerFormRef = ref<FormInstance>()
const providerForm = reactive<ProviderForm>(emptyProviderForm())
const savedRuleConfig = reactive<QuoteRuleConfig>({
  counterparties: ['CLSA', 'NOMURA'],
  relation: 'AND',
  rules: [
    {
      id: 1,
      type: 'exerciseDate',
      operator: 'equals',
      value: ['无要求'],
    },
    {
      id: 2,
      type: 'knockout',
      operator: 'equals',
      value: ['无要求'],
    },
  ],
})
const draftRuleConfig = reactive<QuoteRuleConfig>({
  counterparties: [],
  relation: 'AND',
  rules: [],
})

const counterpartyOptions = computed(() => [
  ...new Set(providers.value.map((provider) => provider.provider)),
])
const providerOptions = computed(() => [
  ...new Set(providers.value.map((provider) => provider.provider)),
])
const proprietaryAccountOptions = computed(() => [
  ...new Set(providers.value.map((provider) => provider.proprietaryAccount).filter(Boolean)),
])
const counterpartyAccountOptions = computed(() => [
  ...new Set(providers.value.map((provider) => provider.counterpartyAccount).filter(Boolean)),
])
const allCounterpartiesSelected = computed(
  () =>
    counterpartyOptions.value.length > 0 &&
    draftRuleConfig.counterparties.length === counterpartyOptions.value.length,
)
const someCounterpartiesSelected = computed(
  () =>
    draftRuleConfig.counterparties.length > 0 &&
    draftRuleConfig.counterparties.length < counterpartyOptions.value.length,
)

const providerFormRules: FormRules<ProviderForm> = {
  provider: [{ required: true, message: '请输入报价方名称', trigger: 'blur' }],
  proprietaryAccount: [{ required: true, message: '请输入自营账号', trigger: 'blur' }],
  counterpartyAccount: [{ required: true, message: '请输入上手方账号', trigger: 'blur' }],
}

const filteredProviders = computed(() => {
  const providerKeyword = activeFilters.provider.trim().toLowerCase()
  const accountKeyword = activeFilters.account.trim().toLowerCase()

  return providers.value.filter((provider) => {
    const providerMatched = provider.provider.toLowerCase().includes(providerKeyword)
    const accountMatched = provider.proprietaryAccount.toLowerCase().includes(accountKeyword)
    return providerMatched && accountMatched
  })
})

function emptyProviderForm(): ProviderForm {
  return {
    provider: '',
    proprietaryAccount: '',
    counterpartyAccount: '',
    emails: [''],
    dealCharacters: [''],
    ruleConfig: defaultRuleConfig(),
  }
}

function assignProviderForm(value: ProviderForm) {
  Object.assign(providerForm, value)
  providerForm.ruleConfig = fixedRuleConfig(value.ruleConfig)
}

function applyFilters() {
  Object.assign(activeFilters, draftFilters)
}

function resetFilters() {
  Object.assign(draftFilters, { provider: '', account: '' })
  Object.assign(activeFilters, draftFilters)
}

function openCreateDialog() {
  editingId.value = null
  assignProviderForm(emptyProviderForm())
  providerDialogVisible.value = true
}

function openEditDialog(provider: QuoteProvider) {
  editingId.value = provider.id
  assignProviderForm({
    provider: provider.provider,
    proprietaryAccount: provider.proprietaryAccount,
    counterpartyAccount: provider.counterpartyAccount,
    emails: splitValues(provider.emails),
    dealCharacters: splitValues(provider.dealCharacter),
    ruleConfig: provider.ruleConfig,
  })
  providerDialogVisible.value = true
}

function openRuleDialog() {
  draftRuleConfig.counterparties = [
    ...new Set(selectedProviders.value.map((provider) => provider.provider).filter(Boolean)),
  ]
  draftRuleConfig.relation = 'AND'
  draftRuleConfig.rules = fixedDialogRules(savedRuleConfig.rules)
  ruleDialogVisible.value = true
}

function handleProviderSelectionChange(selection: QuoteProvider[]) {
  selectedProviders.value = selection
}

function toggleAllCounterparties(selected: boolean | string | number) {
  draftRuleConfig.counterparties = selected ? [...counterpartyOptions.value] : []
}

async function saveProvider() {
  const valid = await providerFormRef.value?.validate().catch(() => false)
  if (!valid) return
  if (hasIncompleteRules(providerForm.ruleConfig.rules)) {
    ElMessage.warning('请完整配置每一条规则')
    return
  }

  const timestamp = formatDateTime(new Date())
  providerForm.ruleConfig = fixedRuleConfig(providerForm.ruleConfig)
  const providerPayload = {
    provider: providerForm.provider,
    proprietaryAccount: providerForm.proprietaryAccount,
    counterpartyAccount: providerForm.counterpartyAccount,
    emails: cleanValues(providerForm.emails).join(','),
    dealCharacter: cleanValues(providerForm.dealCharacters).join(','),
    ruleConfig: cloneRuleConfig(providerForm.ruleConfig),
    matchRules: summarizeRules(providerForm.ruleConfig),
  }
  if (editingId.value) {
    const provider = providers.value.find((item) => item.id === editingId.value)
    if (provider) Object.assign(provider, providerPayload, { updatedAt: timestamp })
    ElMessage.success('报价方信息已更新')
  } else {
    providers.value.unshift({
      id: Math.max(0, ...providers.value.map((item) => item.id)) + 1,
      ...providerPayload,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    ElMessage.success('报价方已新增')
  }
  providerDialogVisible.value = false
}

async function removeProvider(provider: QuoteProvider) {
  const confirmed = await ElMessageBox.confirm(
    `确认移除报价方“${provider.provider}”吗？`,
    '移除报价方',
    {
      confirmButtonText: '确认移除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(
    () => true,
    () => false,
  )
  if (!confirmed) return

  const index = providers.value.findIndex((item) => item.id === provider.id)
  if (index === -1) return
  providers.value.splice(index, 1)
  ElMessage.success('报价方已移除')
}

function saveRules() {
  if (draftRuleConfig.counterparties.length === 0) {
    ElMessage.warning('请选择至少一个生效的上手方')
    return
  }
  if (hasIncompleteRules(draftRuleConfig.rules)) {
    ElMessage.warning('请完整配置每一条规则')
    return
  }

  savedRuleConfig.counterparties = [...draftRuleConfig.counterparties]
  savedRuleConfig.relation = 'AND'
  savedRuleConfig.rules = fixedDialogRules(draftRuleConfig.rules)
  ruleDialogVisible.value = false
  ElMessage.success('报价方规则配置已保存')
}

function normalizeRuleValues(values: string[]) {
  return [...new Set(values.map((value) => (value === '不限' ? '无要求' : value)))]
}

function fixedDialogRules(rules: QuoteRule[]): QuoteRule[] {
  const toFixedRule = (type: Exclude<RuleType, ''>, id: number): QuoteRule => {
    const matchedRule = rules.find((rule) => rule.type === type)
    const value = matchedRule ? normalizeRuleValues(matchedRule.value) : []

    return {
      id,
      type,
      operator: 'equals',
      value: value.length ? value : ['无要求'],
    }
  }

  return [toFixedRule('exerciseDate', 1), toFixedRule('knockout', 2)]
}

function defaultRuleConfig(): RuleBuilderModel {
  return fixedRuleConfig({ relation: 'AND', rules: [] })
}

function fixedRuleConfig(config: RuleBuilderModel): RuleBuilderModel {
  return {
    relation: 'AND',
    rules: fixedDialogRules(config.rules),
  }
}

function createProviderFromSeed(seed: ProviderSeed, index: number): QuoteProvider {
  const ruleConfig = createRuleConfig(seed)
  const sequence = String(index + 1).padStart(2, '0')

  return {
    id: index + 1,
    provider: seed.provider,
    proprietaryAccount: seed.proprietaryAccount,
    counterpartyAccount: seed.counterpartyAccount,
    emails: seed.provider === 'N/A' ? '' : `quote-provider-${sequence}@example.com`,
    dealCharacter: seed.provider === 'N/A' ? '' : `ACK_${sequence}`,
    matchRules: summarizeRules(ruleConfig),
    ruleConfig,
    createdAt: `2026-08-${String(1 + (index % 9)).padStart(2, '0')} 09:${String(10 + index).padStart(2, '0')}:00`,
    updatedAt: `2026-08-12 16:${String(10 + index).padStart(2, '0')}:00`,
  }
}

function createRuleConfig(seed: ProviderSeed): RuleBuilderModel {
  const exerciseRule: QuoteRule = {
    id: 1,
    type: 'exerciseDate',
    operator: 'equals',
    value: [seed.exerciseDate],
  }
  const knockoutRule: QuoteRule = {
    id: 2,
    type: 'knockout',
    operator: 'equals',
    value: [seed.knockout],
  }

  return {
    relation: 'AND',
    rules:
      seed.order === 'exercise-first' ? [exerciseRule, knockoutRule] : [knockoutRule, exerciseRule],
  }
}

function cloneRuleConfig(config: RuleBuilderModel): RuleBuilderModel {
  return {
    relation: config.relation,
    rules: config.rules.map((rule) => ({ ...rule, value: [...rule.value] })),
  }
}

function hasIncompleteRules(rules: QuoteRule[]) {
  return rules.some((rule) => !rule.type || rule.value.length === 0)
}

function summarizeRules(config: RuleBuilderModel) {
  return config.rules.map((rule) => {
    const typeLabel = rule.type === 'exerciseDate' ? '最快行权日' : '敲出规则'
    const operatorLabel = rule.operator === 'equals' ? '等于' : '不等于'
    return `${typeLabel}${operatorLabel}${rule.value.join('、')}`
  })
}

function splitValues(value: string) {
  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return values.length ? values : ['']
}

function cleanValues(values: string[]) {
  return values.map((item) => item.trim()).filter(Boolean)
}

function formatDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}
</script>

<style scoped>
.quote-provider-page {
  min-height: calc(100vh - 96px);
  padding: 20px 24px 32px;
  background: var(--color-bg-surface);
  border-radius: 4px;
}

.filter-panel {
  container-type: inline-size;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.filter-grid {
  display: grid;
  grid-template-columns: 320px 320px auto;
  align-items: end;
  gap: 20px 28px;
}

.filter-item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.filter-item > span {
  text-align: right;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.filter-actions :deep(.el-button + .el-button),
.toolbar-actions :deep(.el-button + .el-button),
.provider-table :deep(.el-button + .el-button) {
  margin-left: 0;
}

.provider-content {
  padding-top: 20px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rule-config-action {
  position: relative;
  display: inline-flex;
}

.rule-config-note {
  position: absolute;
  top: -9px;
  right: -9px;
  z-index: 1;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  padding: 0;
  color: var(--color-danger);
  cursor: pointer;
  background: var(--color-danger-light);
  border: 2px solid var(--color-danger);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.rule-config-note:hover,
.rule-config-note:focus-visible {
  color: var(--color-bg-surface);
  background: var(--color-danger);
  outline: 0;
}

:global(.rule-config-note-popper) {
  padding: 12px 14px;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgb(31 35 41 / 12%);
  font-size: 13px;
  line-height: 20px;
}

:global(.rule-config-note-popper p) {
  margin: 0;
}

:global(.rule-config-note-popper p + p) {
  margin-top: 4px;
}

:global(.rule-config-note-popper__title) {
  color: var(--color-text-primary);
  font-weight: 700;
}

.result-count {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.provider-table {
  width: 100%;
  --el-table-header-bg-color: var(--color-border-subtle);
  --el-table-header-text-color: var(--color-text-primary);
  --el-table-row-hover-bg-color: var(--color-bg-elevated);
  --el-table-border-color: var(--color-border-subtle);
}

.provider-table :deep(.el-table__header th) {
  height: 44px;
  font-weight: 600;
}

.provider-table :deep(.el-table__body-header th.el-table-fixed-column--left),
.provider-table :deep(.el-table__body-header th.el-table-fixed-column--right) {
  background-color: var(--color-border-subtle) !important;
}

.provider-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.provider-table :deep(.cell) {
  line-height: 22px;
  white-space: nowrap;
}

.email-cell {
  color: var(--color-text-secondary);
}

.rule-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}

.rule-tags :deep(.el-tag) {
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  border-color: var(--color-border-strong);
}

.provider-required-fields {
  display: grid;
  gap: 0;
}

.provider-required-fields :deep(.el-form-item) {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  margin-bottom: 18px;
}

.provider-required-fields :deep(.el-form-item__label) {
  height: auto;
  margin: 0;
  padding-right: 18px;
  line-height: 32px;
  text-align: right;
}

.provider-required-fields :deep(.el-select) {
  width: 100%;
}

.repeatable-field-section {
  margin-top: 18px;
}

.repeatable-field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.repeatable-field-heading h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 600;
}

.repeatable-field-list {
  display: grid;
  gap: 10px;
  padding-top: 10px;
}

.repeatable-field-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.repeatable-field-row > span {
  color: var(--color-text-secondary);
  text-align: right;
}

.provider-rule-builder {
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.rule-dialog-content {
  display: grid;
  gap: 40px;
  padding: 8px 0 22px;
  margin-right: -16px;
}

.counterparty-field {
  display: grid;
  gap: 40px;
  width: 100%;
  max-width: 100%;
  padding-top: 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.counterparty-field :deep(.el-select) {
  width: 100%;
}

.counterparty-heading,
.counterparty-title-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.counterparty-title-block {
  justify-content: flex-start;
}

.counterparty-step {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 20px;
  font-weight: 650;
  line-height: 44px;
}

.counterparty-title-block > span:last-child {
  display: grid;
  gap: 4px;
}

.counterparty-title {
  color: var(--color-text-primary);
  font-size: 26px;
  font-weight: 650;
  line-height: 30px;
}

.counterparty-title em {
  color: var(--color-danger);
  font-style: normal;
}

.counterparty-description {
  color: var(--color-text-tertiary);
  font-size: 20px;
  font-weight: 400;
  line-height: 24px;
}

.selected-count {
  height: 46px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 20px;
  font-weight: 600;
  line-height: 46px;
}

.counterparty-field :deep(.el-select__wrapper) {
  min-height: 76px;
  max-height: 76px;
  padding: 8px 14px;
  background: var(--color-bg-surface);
  border: 2px solid var(--color-primary-soft) !important;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: none !important;
}

.counterparty-field :deep(.el-select__selection.is-near) {
  margin-left: 0;
}

.counterparty-field :deep(.el-select__wrapper:hover) {
  border-color: var(--color-primary-border) !important;
}

.counterparty-field :deep(.el-select__wrapper.is-focused) {
  border-color: var(--color-primary) !important;
}

.counterparty-field :deep(.el-tag) {
  height: 52px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-weight: 500;
  font-size: 20px;
  line-height: 52px;
}

.counterparty-field :deep(.el-tag .el-tag__close) {
  color: var(--color-primary);
}

.counterparty-field :deep(.el-tag .el-tag__close:hover) {
  color: var(--color-bg-surface);
  background: var(--color-primary);
}

.counterparty-batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 220px;
  padding: 4px 8px;
}

:global(.quote-rule-dialog .el-dialog__header) {
  padding: 26px 48px 28px 32px;
  margin-right: 0;
}

:global(.quote-rule-dialog .el-dialog__body) {
  padding: 38px 32px 32px;
}

:global(.quote-rule-dialog .el-dialog__footer) {
  padding: 28px 32px;
  background: var(--color-bg-elevated);
  border-top: 0;
}

:global(.quote-rule-dialog .el-dialog__title) {
  color: var(--color-text-primary);
  font-size: 34px;
  font-weight: 650;
  line-height: 46px;
}

:global(.quote-rule-dialog .el-dialog__headerbtn) {
  top: 38px;
  right: 48px;
  width: 32px;
  height: 32px;
}

:global(.quote-rule-dialog .el-dialog__close) {
  color: var(--color-text-tertiary);
  font-size: 26px;
}

.rule-dialog-footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: var(--color-text-tertiary);
  font-size: 20px;
}

.rule-dialog-footer > div {
  display: flex;
  gap: 16px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.rule-dialog-footer :deep(.el-button) {
  min-width: 122px;
  height: 56px;
  margin-left: 0;
  border-radius: 8px;
  font-size: 20px;
}

.rule-dialog-footer :deep(.el-button--default) {
  color: var(--color-text-secondary);
  border-color: var(--color-primary-soft);
  background: var(--color-bg-surface);
}

.rule-dialog-footer :deep(.el-button--primary) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

:global(.quote-rule-dialog) {
  display: flex;
  width: 650px !important;
  min-height: 0;
  max-width: calc(100vw - 32px);
  height: 520px;
  max-height: calc(100vh - 32px);
  margin: max(32px, calc(50vh - 300px)) auto 0 !important;
  flex-direction: column;
}

:global(.quote-rule-dialog .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  container-name: quote-rule-dialog;
  container-type: inline-size;
}

:global(.quote-rule-dialog .el-dialog__header) {
  padding: 16px 20px 10px;
}

:global(.quote-rule-dialog .el-dialog__body) {
  padding: 10px 20px;
}

:global(.quote-rule-dialog .el-dialog__footer) {
  padding: 12px 20px;
}

:global(.quote-rule-dialog .el-dialog__title) {
  font-size: 22px;
  line-height: 30px;
}

:global(.quote-rule-dialog .el-dialog__headerbtn) {
  top: 16px;
  right: 20px;
  width: 24px;
  height: 24px;
}

:global(.quote-rule-dialog .el-dialog__close) {
  font-size: 20px;
}

.rule-dialog-content {
  gap: 14px;
  padding: 0;
  margin-right: 0;
}

.counterparty-field {
  gap: 8px;
  padding-top: 0;
}

.counterparty-heading,
.counterparty-title-block {
  gap: 10px;
}

.counterparty-step {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 28px;
}

.counterparty-title-block > span:last-child {
  gap: 0;
}

.counterparty-title {
  font-size: 18px;
  line-height: 24px;
}

.counterparty-description {
  font-size: 13px;
  line-height: 18px;
}

.selected-count {
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 32px;
}

.counterparty-field :deep(.el-select__wrapper) {
  min-height: 42px;
  max-height: 42px;
  padding: 4px 8px;
}

.counterparty-field :deep(.el-tag) {
  height: 28px;
  padding: 0 8px;
  border-radius: 5px;
  font-size: 14px;
  line-height: 28px;
}

.rule-dialog-footer {
  gap: 16px;
  font-size: 13px;
}

.rule-dialog-footer :deep(.el-button) {
  min-width: 76px;
  height: 34px;
  border-radius: 6px;
  font-size: 14px;
}

/* 规则弹窗沿用系统菜单的控件令牌，避免出现第二套圆角、蓝色和按钮尺度。 */
:global(.quote-rule-dialog) {
  --el-dialog-padding-primary: 0px;
  padding: 0;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

:global(.quote-rule-dialog .el-dialog__header) {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--color-border-subtle);
}

:global(.quote-rule-dialog .el-dialog__body) {
  padding: 12px 20px;
}

:global(.quote-rule-dialog .el-dialog__footer) {
  padding: 20px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
}

:global(.quote-rule-dialog .el-dialog__title) {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: 24px;
}

:global(.quote-rule-dialog .el-dialog__headerbtn) {
  top: 16px;
  right: 20px;
}

:global(.quote-rule-dialog .el-dialog__close) {
  color: var(--color-text-tertiary);
  font-size: 18px;
}

.rule-dialog-content {
  gap: 16px;
}

.counterparty-field {
  gap: 8px;
}

.counterparty-heading,
.counterparty-title-block {
  gap: 8px;
}

.counterparty-step {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  background: var(--color-primary-light);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 24px;
}

.counterparty-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: 22px;
}

.counterparty-description {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 18px;
}

.selected-count {
  height: 24px;
  padding: 0 8px;
  border-radius: 2px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 24px;
}

.counterparty-field :deep(.el-select__wrapper) {
  min-height: 36px;
  max-height: 36px;
  padding: 0 8px;
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
  box-shadow: none !important;
}

.counterparty-field :deep(.el-select__wrapper:hover) {
  border-color: var(--color-border-strong) !important;
  background: var(--color-bg-surface);
}

.counterparty-field :deep(.el-select__wrapper.is-focused) {
  border-color: var(--color-primary) !important;
  background: var(--color-bg-surface);
  box-shadow: 0 0 0 1px var(--color-primary) !important;
}

.counterparty-field :deep(.el-tag) {
  height: 24px;
  padding: 0 7px;
  border-radius: 2px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: var(--font-size-xs);
  line-height: 24px;
}

.counterparty-field :deep(.el-tag .el-tag__close) {
  color: var(--color-primary);
}

.rule-dialog-footer {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.rule-dialog-footer > div {
  gap: 10px;
  top: 50%;
  transform: translate(-50%, -50%);
}

.rule-dialog-footer :deep(.el-button) {
  min-width: 64px;
  height: 32px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-md);
}

.rule-dialog-footer :deep(.el-button--default) {
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.rule-dialog-footer :deep(.el-button--primary) {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

:global(.provider-editor-dialog .el-dialog__header) {
  padding: 24px 28px 16px;
}

:global(.provider-editor-dialog .el-dialog__body) {
  max-height: calc(100vh - 220px);
  padding: 16px 28px 24px;
  overflow-y: auto;
}

:global(.provider-editor-dialog .el-dialog__footer) {
  padding: 14px 28px 22px;
  border-top: 1px solid var(--color-border-subtle);
}

@container (max-width: 860px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }

  .filter-actions {
    grid-column: 1 / -1;
    padding-left: 84px;
  }
}

@media (max-width: 760px) {
  .quote-provider-page {
    padding: 16px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .provider-required-fields :deep(.el-form-item) {
    grid-template-columns: 1fr;
  }

  .provider-required-fields :deep(.el-form-item__label) {
    padding-right: 0;
    text-align: left;
  }

  .repeatable-field-row {
    grid-template-columns: 1fr 40px;
  }

  .repeatable-field-row > span {
    grid-column: 1 / -1;
    text-align: left;
  }

  .filter-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .filter-item > span {
    text-align: left;
  }

  .filter-actions {
    grid-column: auto;
    padding-left: 0;
  }

  :global(.quote-rule-dialog .el-dialog__header) {
    padding: 24px 24px 20px;
  }

  :global(.quote-rule-dialog .el-dialog__body) {
    padding: 20px 24px;
  }

  :global(.quote-rule-dialog .el-dialog__footer) {
    padding: 20px 24px;
  }

  :global(.quote-rule-dialog .el-dialog__headerbtn) {
    top: 22px;
    right: 24px;
  }

  .counterparty-heading,
  .rule-dialog-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .rule-dialog-footer,
  .rule-dialog-footer > div {
    width: 100%;
  }

  .rule-dialog-content {
    margin-right: 0;
  }

  .rule-dialog-footer > div {
    position: static;
    transform: none;
  }

  .rule-dialog-footer > div :deep(.el-button) {
    flex: 1;
  }
}

@container (max-width: 560px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    grid-column: auto;
    padding-left: 0;
  }
}
</style>
