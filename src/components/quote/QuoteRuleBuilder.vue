<template>
  <section
    class="rule-builder"
    :class="{
      'rule-builder--dialog': props.variant === 'dialog',
      'rule-builder--fixed': props.variant === 'fixed',
    }"
    :aria-label="ariaLabel"
  >
    <div class="rule-builder-heading">
      <div class="rule-builder-title">
        <div class="rule-builder-title-main">
          <el-tag v-if="isDialog" class="rule-builder-step" effect="light">02</el-tag>
          <h3>规则配置</h3>
        </div>
        <p v-if="isFixed">固定两条规则，规则值默认“无要求”</p>
      </div>
      <el-button v-if="props.variant === 'default'" type="primary" :icon="Plus" @click="addRule">
        新增一条规则
      </el-button>
    </div>

    <div class="rule-list">
      <button
        v-if="!isFixed && model.rules.length > 1"
        class="rule-relation-connector"
        type="button"
        :aria-label="`全部规则关系：${model.relation}，点击切换`"
        :title="`点击切换为 ${model.relation === 'AND' ? 'OR' : 'AND'}`"
        @click="toggleRelation"
      >
        <span class="rule-relation-control" aria-hidden="true">
          <strong>{{ model.relation === 'AND' ? '且' : '或' }}</strong>
          <span>{{ model.relation === 'AND' ? '或' : '且' }}</span>
        </span>
      </button>

      <div v-for="(rule, index) in model.rules" :key="rule.id" class="rule-row">
        <div v-if="!isFixed" class="rule-relation-cell" aria-hidden="true" />

        <span v-if="isFixed" class="rule-type-fixed">
          {{ rule.type === 'exerciseDate' ? '最快行权日' : '敲出规则' }}
        </span>

        <el-select
          v-else
          v-model="rule.type"
          placeholder="请选择规则类型"
          @change="rule.value = []"
        >
          <el-option label="最快行权日" value="exerciseDate" />
          <el-option label="敲出规则" value="knockout" />
        </el-select>

        <span v-if="isFixed" class="rule-operator-fixed">等于</span>

        <el-select v-else v-model="rule.operator" placeholder="请选择">
          <el-option label="等于" value="equals" />
          <el-option label="不等于" value="notEquals" />
        </el-select>

        <el-select
          v-model="rule.value"
          class="rule-value-select"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="3"
          :disabled="!rule.type"
          :placeholder="rule.type ? '请选择规则值' : '请先选择规则类型'"
        >
          <el-option
            v-for="option in ruleValueOptions(rule.type)"
            :key="option"
            :label="option"
            :value="option"
          />
        </el-select>

        <el-button
          v-if="!isFixed"
          link
          type="danger"
          :disabled="model.rules.length === 1"
          @click="removeRule(index)"
        >
          移除
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'

type RuleType = '' | 'exerciseDate' | 'knockout'
type RuleRelation = 'AND' | 'OR'
type RuleOperator = 'equals' | 'notEquals'

interface QuoteRule {
  id: number
  type: RuleType
  operator: RuleOperator
  value: string[]
}

interface RuleBuilderModel {
  relation: RuleRelation
  rules: QuoteRule[]
}

const props = withDefaults(
  defineProps<{ ariaLabel?: string; variant?: 'default' | 'dialog' | 'fixed' }>(),
  {
    ariaLabel: '规则配置',
    variant: 'default',
  },
)

const model = defineModel<RuleBuilderModel>({ required: true })
const isDialog = computed(() => props.variant === 'dialog')
const isFixed = computed(() => props.variant !== 'default')

function addRule() {
  model.value.rules.push({
    id: Math.max(0, ...model.value.rules.map((rule) => rule.id)) + 1,
    type: '',
    operator: 'equals',
    value: [],
  })
}

function removeRule(index: number) {
  if (model.value.rules.length === 1) return
  model.value.rules.splice(index, 1)
}

function toggleRelation() {
  model.value.relation = model.value.relation === 'AND' ? 'OR' : 'AND'
}

function ruleValueOptions(type: RuleType) {
  if (type === 'exerciseDate') return ['T+1', 'T+2', 'T+5', '无要求']
  if (type === 'knockout') return ['主3创2', '五连板', '协商敲出', '无要求']
  return []
}
</script>

<style scoped>
.rule-builder {
  min-width: 0;
}

.rule-builder-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.rule-builder-heading h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 600;
}

.rule-builder-title {
  min-width: 0;
}

.rule-builder-title-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rule-builder-title p {
  margin: 6px 0 0;
  color: var(--color-text-tertiary);
  font-size: 13px;
  line-height: 20px;
}

.rule-list {
  position: relative;
  display: grid;
  gap: 14px;
}

.rule-row {
  display: grid;
  grid-template-columns: 100px 180px 128px minmax(240px, 1fr) 48px;
  align-items: center;
  gap: 12px;
}

.rule-relation-cell {
  min-height: 32px;
}

.rule-relation-connector {
  position: absolute;
  z-index: 1;
  top: 16px;
  bottom: 16px;
  left: 30px;
  width: 70px;
  height: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
}

.rule-relation-connector::before {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 18px;
  border-top: 1px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border-strong);
  border-left: 1px solid var(--color-border-strong);
  content: '';
}

.rule-relation-control {
  position: absolute;
  top: 50%;
  left: 0;
  display: grid;
  grid-template-rows: 40px 30px;
  width: 40px;
  overflow: hidden;
  border-radius: 5px;
  background: var(--color-border-subtle);
  box-shadow: 0 1px 3px rgba(29, 33, 41, 0.12);
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1;
  transform: translateY(-50%);
  transition:
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.rule-relation-control strong {
  display: grid;
  place-items: center;
  border-radius: 5px;
  color: var(--color-bg-surface);
  background: var(--color-primary);
  font-weight: 600;
}

.rule-relation-control span {
  display: grid;
  place-items: center;
  color: var(--color-text-secondary);
}

.rule-relation-connector:hover .rule-relation-control,
.rule-relation-connector:focus-visible .rule-relation-control {
  box-shadow: 0 3px 8px rgba(22, 93, 255, 0.26);
  transform: translateY(calc(-50% - 1px));
}

.rule-relation-connector:active .rule-relation-control {
  box-shadow: 0 1px 3px rgba(22, 93, 255, 0.2);
  transform: translateY(-50%);
}

.rule-relation-connector:focus-visible {
  outline: 2px solid var(--color-primary-border);
  outline-offset: 2px;
}

.rule-row :deep(.el-select) {
  width: 100%;
}

.rule-value-select :deep(.el-tag) {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-primary-border);
  font-weight: 500;
}

.rule-value-select :deep(.el-tag .el-tag__close) {
  color: var(--color-primary);
}

.rule-value-select :deep(.el-tag .el-tag__close:hover) {
  color: var(--color-bg-surface);
  background: var(--color-primary);
}

.rule-row :deep(.el-button.is-disabled) {
  color: var(--color-border-strong);
}

.rule-builder--fixed .rule-builder-heading {
  align-items: flex-start;
  margin-bottom: 12px;
}

.rule-builder--fixed .rule-builder-title p {
  margin-top: 2px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  line-height: 18px;
}

.rule-builder--fixed .rule-list {
  gap: 16px;
}

.rule-builder--fixed .rule-row {
  grid-template-columns: 180px 96px minmax(240px, 1fr);
  gap: 4px;
}

.rule-builder--fixed .rule-row :deep(.el-select__wrapper) {
  min-height: 32px;
  border-radius: 4px;
  background: var(--color-border-subtle);
  box-shadow: none !important;
}

.rule-builder--fixed .rule-type-fixed {
  display: grid;
  min-height: 32px;
  box-sizing: border-box;
  place-items: center start;
  padding: 0 8px;
  border-radius: 4px;
  color: var(--color-text-primary);
  background: var(--color-border-subtle);
  font-size: 14px;
  line-height: 32px;
}

.rule-builder--fixed .rule-operator-fixed {
  display: grid;
  min-height: 32px;
  box-sizing: border-box;
  place-items: center;
  padding: 0;
  border: 1px solid var(--color-primary-border);
  border-radius: 4px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 14px;
  font-weight: 500;
  line-height: 30px;
  text-align: center;
}

.rule-builder--fixed .rule-value-select :deep(.el-tag) {
  height: 24px;
  padding: 0 7px;
  border: 0;
  border-radius: 2px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 12px;
  line-height: 24px;
}

.rule-builder--dialog .rule-builder-heading {
  align-items: flex-start;
  margin-bottom: 24px;
}

.rule-builder--dialog .rule-builder-heading h3 {
  color: var(--color-text-primary);
  font-size: 26px;
  line-height: 36px;
}

.rule-builder--dialog .rule-builder-step {
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

.rule-builder--dialog .dialog-add-rule {
  height: 48px;
  margin-top: 0;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 20px;
  font-weight: 600;
}

.rule-builder--dialog .dialog-add-rule:hover,
.rule-builder--dialog .dialog-add-rule:focus-visible {
  color: var(--color-bg-surface);
  background: var(--color-primary);
}

.rule-builder--dialog .rule-list {
  gap: 78px;
  padding-left: 72px;
}

.rule-builder--dialog .rule-builder-title p {
  font-size: 20px;
  line-height: 28px;
}

.rule-builder--dialog .rule-row {
  min-height: 108px;
  grid-template-columns: 264px 232px minmax(300px, 1fr) 32px;
  gap: 20px;
  padding: 24px;
  background: var(--color-bg-elevated);
  border-radius: 8px;
}

.rule-builder--dialog .rule-relation-cell {
  display: none;
}

.rule-builder--dialog .rule-relation-connector {
  top: 0;
  bottom: 0;
  left: 0;
  width: 52px;
}

.rule-builder--dialog .rule-relation-connector::before {
  top: 0;
  bottom: 0;
  left: 24px;
  border-top: 0;
  border-bottom: 0;
  border-left-color: var(--color-border);
}

.rule-builder--dialog .rule-relation-control {
  grid-template-rows: 38px 34px;
  width: 52px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-surface);
  box-shadow: 0 2px 6px rgb(29 41 57 / 8%);
  font-size: 16px;
}

.rule-builder--dialog .rule-relation-control strong {
  border-radius: 6px;
  background: var(--color-primary);
}

.rule-builder--dialog .rule-relation-control span {
  color: var(--color-text-tertiary);
}

.rule-builder--dialog .rule-row :deep(.el-select__wrapper) {
  min-height: 64px;
  background: var(--color-bg-surface);
  box-shadow: 0 0 0 1px var(--color-primary-soft) inset;
}

.rule-builder--dialog .rule-row :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--color-primary-border) inset;
}

.rule-builder--dialog .rule-row :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--color-primary) inset;
}

.rule-builder--dialog .rule-row :deep(.el-select__selected-item) {
  color: var(--color-text-primary);
  font-size: 20px;
}

.rule-builder--dialog .rule-value-select :deep(.el-tag) {
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 20px;
  line-height: 36px;
}

.rule-builder--dialog .rule-operator-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
}

.rule-builder--dialog .rule-operator-switch :deep(.el-radio-button__inner) {
  width: 100%;
  height: 64px;
  padding: 0;
  border-color: var(--color-primary-soft);
  box-shadow: none;
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  font-size: 20px;
  line-height: 62px;
}

.rule-builder--dialog
  .rule-operator-switch
  :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 8px 0 0 8px;
}

.rule-builder--dialog
  .rule-operator-switch
  :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 8px 8px 0;
}

.rule-builder--dialog
  .rule-operator-switch
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: var(--color-primary-soft);
  box-shadow: -1px 0 0 0 var(--color-primary-soft);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-weight: 650;
}

.rule-builder--dialog .dialog-remove-rule {
  width: 32px;
  height: 64px;
  padding: 0;
  color: var(--color-text-tertiary);
  font-size: 22px;
}

.rule-builder--dialog .dialog-remove-rule:not(.is-disabled):hover {
  color: var(--color-danger);
}

@media (max-width: 1050px) {
  .rule-row {
    grid-template-columns: 86px 150px 112px minmax(190px, 1fr) 48px;
  }
}

@media (max-width: 980px) {
  .rule-builder--dialog .rule-list {
    padding-left: 58px;
  }

  .rule-builder--dialog .rule-row {
    grid-template-columns: minmax(190px, 1fr) 200px minmax(220px, 1.3fr) 32px;
    gap: 14px;
  }
}

@media (max-width: 840px) {
  .rule-row {
    grid-template-columns: 80px minmax(0, 1fr) 96px 40px;
  }

  .rule-relation-cell {
    grid-row: span 2;
  }

  .rule-row > :nth-child(4) {
    grid-column: 2 / 4;
  }

  .rule-row > :nth-child(5) {
    grid-column: 4;
    grid-row: 1 / 3;
  }
}

@media (max-width: 760px) {
  .rule-builder--dialog .rule-builder-heading {
    gap: 16px;
  }

  .rule-builder--dialog .rule-builder-heading h3 {
    font-size: 22px;
    line-height: 30px;
  }

  .rule-builder--dialog .rule-builder-title p {
    font-size: 16px;
    line-height: 24px;
  }

  .rule-builder--dialog .dialog-add-rule {
    height: 44px;
    padding: 0 14px;
    font-size: 16px;
  }

  .rule-builder--dialog .rule-list {
    gap: 10px;
    padding-left: 56px;
  }

  .rule-builder--dialog .rule-row {
    grid-template-columns: minmax(0, 1fr) 40px;
    gap: 12px;
    padding: 16px;
  }

  .rule-builder--dialog .rule-row > :nth-child(2),
  .rule-builder--dialog .rule-row > :nth-child(3),
  .rule-builder--dialog .rule-row > :nth-child(4) {
    grid-column: 1;
  }

  .rule-builder--dialog .rule-row > :nth-child(5) {
    grid-column: 2;
    grid-row: 3;
  }

  .rule-builder--dialog .rule-relation-connector {
    left: 0;
    width: 40px;
  }

  .rule-builder--dialog .rule-relation-connector::before {
    left: 19px;
  }

  .rule-builder--dialog .rule-relation-control {
    width: 40px;
    font-size: 14px;
  }

  .rule-builder--dialog .rule-row :deep(.el-select__wrapper),
  .rule-builder--dialog .rule-operator-switch :deep(.el-radio-button__inner) {
    min-height: 48px;
    height: 48px;
    line-height: 46px;
  }

  .rule-builder--dialog .rule-row :deep(.el-select__selected-item),
  .rule-builder--dialog .rule-value-select :deep(.el-tag),
  .rule-builder--dialog .rule-operator-switch :deep(.el-radio-button__inner) {
    font-size: 16px;
  }

  .rule-builder--dialog .dialog-remove-rule {
    height: 48px;
  }
}

@container quote-rule-dialog (max-width: 740px) {
  .rule-builder--dialog .rule-builder-heading {
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .rule-builder--dialog .rule-builder-heading h3 {
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    line-height: 22px;
  }

  .rule-builder--dialog .rule-builder-step {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    color: var(--color-primary);
    background: var(--color-primary-light);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    line-height: 24px;
  }

  .rule-builder--dialog .rule-builder-title-main {
    gap: 8px;
  }

  .rule-builder--dialog .rule-builder-title p {
    margin-top: 2px;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-xs);
    line-height: 18px;
  }

  .rule-builder--dialog .dialog-add-rule {
    height: 32px;
    padding: 0 12px;
    border-radius: var(--radius-sm);
    color: var(--color-text-inverse);
    background: var(--color-primary);
    font-size: var(--font-size-md);
  }

  .rule-builder--dialog .dialog-add-rule:hover,
  .rule-builder--dialog .dialog-add-rule:focus-visible {
    color: var(--color-text-inverse);
    background: var(--color-primary);
  }

  .rule-builder--dialog .rule-list {
    gap: 16px;
    padding-left: 0;
    background: transparent;
  }

  .rule-builder--dialog .rule-row {
    min-height: 56px;
    grid-template-columns: 126px 64px minmax(0, 1fr);
    gap: 4px;
    padding: 10px 0;
    border-radius: 2px;
    background: transparent !important;
  }

  .rule-builder--dialog .rule-relation-connector {
    width: 28px;
  }

  .rule-builder--dialog .rule-relation-connector::before {
    left: 13px;
    border-left-color: var(--color-border);
  }

  .rule-builder--dialog .rule-relation-control {
    grid-template-rows: 22px 20px;
    width: 28px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--color-border-subtle);
    box-shadow: none;
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  .rule-builder--dialog .rule-relation-control strong {
    border-radius: 3px;
    background: var(--color-primary);
  }

  .rule-builder--dialog .rule-row :deep(.el-select__wrapper) {
    min-height: 32px;
    border-radius: var(--radius-sm);
    background: var(--color-border-subtle);
    box-shadow: none !important;
  }

  .rule-builder--dialog .rule-type-fixed {
    display: grid;
    min-height: 32px;
    box-sizing: border-box;
    place-items: center start;
    padding: 0 8px;
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    background: var(--color-border-subtle);
    font-size: var(--font-size-md);
    line-height: 32px;
  }

  .rule-builder--dialog .rule-row :deep(.el-select__selected-item) {
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .rule-builder--dialog .rule-operator-fixed {
    display: grid;
    min-height: 32px;
    box-sizing: border-box;
    place-items: center;
    padding: 0;
    border: 1px solid var(--color-primary-border);
    border-radius: var(--radius-sm);
    color: var(--color-primary);
    background: var(--color-primary-light);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-medium);
    line-height: 30px;
    text-align: center;
  }

  .rule-builder--dialog .rule-value-select :deep(.el-tag) {
    height: 24px;
    padding: 0 7px;
    border: 0;
    border-radius: 2px;
    color: var(--color-primary);
    background: var(--color-primary-soft);
    font-size: var(--font-size-xs);
    line-height: 24px;
  }

  .rule-builder--dialog .rule-operator-switch :deep(.el-radio-button__inner) {
    height: 32px;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
    background: var(--color-bg-surface);
    font-size: var(--font-size-md);
    line-height: 30px;
  }

  .rule-builder--dialog
    .rule-operator-switch
    :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  }

  .rule-builder--dialog
    .rule-operator-switch
    :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .rule-builder--dialog
    .rule-operator-switch
    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    border-color: var(--color-primary-border);
    box-shadow: -1px 0 0 0 var(--color-primary-border);
    color: var(--color-primary);
    background: var(--color-primary-light);
    font-weight: var(--font-weight-medium);
  }

  .rule-builder--dialog .dialog-remove-rule {
    width: 32px;
    height: 32px;
    color: var(--color-text-tertiary);
    font-size: 16px;
  }
}
</style>
