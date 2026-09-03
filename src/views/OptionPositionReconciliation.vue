<template>
  <div class="position-reconciliation-page">
    <section class="position-reconciliation-filter" aria-label="期权持仓对账查询条件">
      <header class="position-reconciliation-heading">
        <div>
          <h1>期权持仓对账</h1>
          <p>按持仓核对编号维护父子持仓关系，支持批量手动匹配与解除匹配。</p>
        </div>
      </header>

      <div class="position-reconciliation-filter__form">
        <label>
          <span>估值日期</span>
          <el-date-picker
            v-model="draftFilters.valuationDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            clearable
          />
        </label>
        <label>
          <span>交易渠道</span>
          <el-select v-model="draftFilters.channel" clearable placeholder="请选择">
            <el-option v-for="item in channelOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </label>
        <label>
          <span>标的代码</span>
          <el-input v-model="draftFilters.underlyingCode" clearable placeholder="请输入标的代码" />
        </label>
        <label>
          <span>核对状态</span>
          <el-select v-model="draftFilters.status" clearable placeholder="请选择">
            <el-option label="通过" value="passed" />
            <el-option label="不通过" value="failed" />
          </el-select>
        </label>
        <div class="position-reconciliation-filter__actions">
          <el-button type="primary" :icon="Search" @click="applyFilters">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <section class="position-reconciliation-content" aria-label="期权持仓对账结果">
      <div class="position-reconciliation-toolbar">
        <div class="position-reconciliation-toolbar__actions">
          <el-button
            type="primary"
            :icon="Connection"
            :disabled="selectedParents.length < 2"
            @click="matchParents"
          >
            手动匹配<span v-if="selectedParents.length">（{{ selectedParents.length }}）</span>
          </el-button>
          <el-button
            :icon="Delete"
            :disabled="selectedParents.length === 0"
            @click="unmatchParents"
          >
            解除匹配
          </el-button>
        </div>
        <div class="position-reconciliation-toolbar__actions">
          <el-button :icon="Refresh" @click="loadData">加载数据</el-button>
          <el-button :icon="Download" @click="exportData">导出数据</el-button>
        </div>
      </div>

      <el-table
        :data="filteredParents"
        row-key="id"
        class="position-reconciliation-table"
        table-layout="auto"
        max-height="520"
        empty-text="暂无符合条件的持仓记录"
        @selection-change="handleParentSelection"
      >
        <el-table-column type="selection" width="36" fixed="left" />
        <el-table-column type="expand" width="24" fixed="left">
          <template #default="{ row }">
            <div class="position-reconciliation-children">
              <div class="position-reconciliation-children__heading">
                <div>
                  <strong>子持仓明细</strong>
                  <span>共 {{ row.children.length }} 条</span>
                </div>
                <el-tag :type="statusType(row)" effect="light">{{ statusLabel(row) }}</el-tag>
              </div>
              <el-empty
                v-if="row.children.length === 0"
                :image-size="44"
                description="暂无已匹配子持仓"
              />
              <el-table
                v-else
                :data="row.children"
                size="small"
                class="position-reconciliation-child-table"
              >
                <el-table-column prop="account" label="账号" min-width="104" />
                <el-table-column prop="dataSource" label="数据来源" min-width="116" />
                <el-table-column prop="optionType" label="期权类型" min-width="96" />
                <el-table-column prop="direction" label="方向" min-width="76" />
                <el-table-column prop="tradeUnderlyingCode" label="交易标的代码" min-width="126" />
                <el-table-column prop="strikePrice" label="行权价格" min-width="92" align="right" />
                <el-table-column label="名义本金（万）" min-width="120" align="right">
                  <template #default="{ row: child }">
                    <span
                      :class="{
                        'reconciliation-number--warning': child.nominalPrincipalDifference !== 0,
                      }"
                    >
                      {{ formatNumber(child.nominalPrincipal) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="名义本金差额" min-width="126" align="right">
                  <template #default="{ row: child }">
                    <span
                      :class="{
                        'reconciliation-number--warning': child.nominalPrincipalDifference !== 0,
                      }"
                    >
                      {{ formatNumber(child.nominalPrincipalDifference) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="optionPremium" label="期权费" min-width="88" align="right" />
                <el-table-column label="期权费差额" min-width="112" align="right">
                  <template #default="{ row: child }">
                    <span
                      :class="{
                        'reconciliation-number--warning': child.optionPremiumDifference !== 0,
                      }"
                    >
                      {{ formatNumber(child.optionPremiumDifference) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="tradeDate" label="交易日" min-width="110" />
                <el-table-column prop="maturityDate" label="到期日" min-width="110" />
                <el-table-column prop="valuationDate" label="估值日期" min-width="110" />
                <el-table-column
                  prop="valuationUnderlyingCode"
                  label="估值标的代码"
                  min-width="126"
                />
                <el-table-column prop="currency" label="币种" min-width="74" />
                <el-table-column
                  prop="openingPrice"
                  label="期初价格"
                  min-width="92"
                  align="right"
                />
                <el-table-column
                  prop="backToBackContractNo"
                  label="背靠背合约编号"
                  min-width="142"
                />
                <el-table-column
                  prop="positionReconciliationNo"
                  label="持仓核对编号"
                  min-width="148"
                />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="核对状态"
          width="92"
          fixed="left"
          align="center"
          header-align="center"
          class-name="position-reconciliation-status-cell"
        >
          <template #default="{ row }">
            <el-tag :type="statusType(row)" effect="light">{{ statusLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="渠道" min-width="96" />
        <el-table-column prop="optionType" label="期权类型" min-width="96" />
        <el-table-column prop="direction" label="方向" min-width="76" />
        <el-table-column prop="tradeUnderlyingCode" label="交易标的代码" min-width="126" />
        <el-table-column prop="strikePrice" label="行权价格" min-width="92" align="right" />
        <el-table-column prop="tradeDate" label="交易日" min-width="110" />
        <el-table-column prop="maturityDate" label="到期日" min-width="110" />
        <el-table-column prop="valuationDate" label="估值日期" min-width="110" />
        <el-table-column prop="valuationUnderlyingCode" label="估值标的代码" min-width="126" />
        <el-table-column prop="currency" label="币种" min-width="74" />
        <el-table-column prop="openingPrice" label="期初价格" min-width="92" align="right" />
        <el-table-column label="名义本金（万）" min-width="122" align="right">
          <template #default="{ row }">
            <span
              :class="{
                'reconciliation-number--warning': reconciliationStatus(row) === 'failed',
              }"
            >
              {{ formatNumber(row.nominalPrincipal) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="positionReconciliationNo"
          label="持仓核对编号"
          min-width="156"
          fixed="right"
        />
      </el-table>
    </section>

    <el-dialog
      v-model="actionConfirmVisible"
      :title="actionConfirmTitle"
      width="440px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="position-reconciliation-confirm-dialog"
    >
      <p class="position-reconciliation-confirm-dialog__message">
        {{ actionConfirmMessage }}
      </p>
      <template #footer>
        <el-button @click="actionConfirmVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPendingAction">{{
          actionConfirmButtonText
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Download, Refresh, RefreshLeft, Delete, Search } from '@element-plus/icons-vue'

type ReconciliationStatus = 'passed' | 'failed'

interface PositionChild {
  id: string
  account: string
  dataSource: string
  optionType: string
  direction: string
  tradeUnderlyingCode: string
  strikePrice: number
  nominalPrincipal: number
  nominalPrincipalDifference: number
  optionPremium: number
  optionPremiumDifference: number
  tradeDate: string
  maturityDate: string
  valuationDate: string
  valuationUnderlyingCode: string
  currency: string
  openingPrice: number
  backToBackContractNo: string
  positionReconciliationNo: string
}

interface PositionParent {
  id: string
  channel: string
  optionType: string
  direction: string
  tradeUnderlyingCode: string
  strikePrice: number
  tradeDate: string
  maturityDate: string
  valuationDate: string
  valuationUnderlyingCode: string
  currency: string
  openingPrice: number
  nominalPrincipal: number
  positionReconciliationNo: string
  children: PositionChild[]
}

const parents = ref<PositionParent[]>([
  {
    id: 'parent-001',
    channel: 'CICC',
    optionType: '香草期权',
    direction: '买入',
    tradeUnderlyingCode: '000001.SZ',
    strikePrice: 10.8,
    tradeDate: '2026-08-18',
    maturityDate: '2026-11-18',
    valuationDate: '2026-08-27',
    valuationUnderlyingCode: '000001.SZ',
    currency: 'CNY',
    openingPrice: 10.62,
    nominalPrincipal: 200,
    positionReconciliationNo: 'PCR-20260827-001',
    children: [
      createChild(
        'child-001',
        '2172007',
        '猎盈',
        '机构交易',
        '000001.SZ',
        120,
        0,
        10.62,
        0,
        'B2B-20260818-001',
        'PCR-20260827-001',
      ),
      createChild(
        'child-002',
        '2172101',
        'File',
        '机构交易',
        '000001.SZ',
        80,
        0,
        10.62,
        0,
        'B2B-20260818-002',
        'PCR-20260827-001',
      ),
    ],
  },
  {
    id: 'parent-002',
    channel: 'CICC',
    optionType: '香草期权',
    direction: '卖出',
    tradeUnderlyingCode: '600519.SH',
    strikePrice: 1360,
    tradeDate: '2026-08-19',
    maturityDate: '2026-12-19',
    valuationDate: '2026-08-27',
    valuationUnderlyingCode: '600519.SH',
    currency: 'CNY',
    openingPrice: 1342.5,
    nominalPrincipal: 150,
    positionReconciliationNo: 'PCR-20260827-002',
    children: [
      createChild(
        'child-003',
        '2186007',
        '猎盈',
        '柜台交易',
        '600519.SH',
        401,
        -50,
        1342.5,
        -4.2,
        'B2B-20260819-001',
        'PCR-20260827-002',
      ),
    ],
  },
  {
    id: 'parent-003',
    channel: 'CICC',
    optionType: '看涨价差',
    direction: '买入',
    tradeUnderlyingCode: '000858.SZ',
    strikePrice: 118,
    tradeDate: '2026-08-20',
    maturityDate: '2027-02-20',
    valuationDate: '2026-08-27',
    valuationUnderlyingCode: '000858.SZ',
    currency: 'CNY',
    openingPrice: 115.4,
    nominalPrincipal: 300,
    positionReconciliationNo: 'PCR-20260827-003',
    children: [
      createChild(
        'child-004',
        '2169003',
        'File',
        '机构交易',
        '000858.SZ',
        300,
        0,
        115.4,
        0,
        'B2B-20260820-001',
        'PCR-20260827-003',
      ),
    ],
  },
  {
    id: 'parent-004',
    channel: 'CICC',
    optionType: '香草期权',
    direction: '买入',
    tradeUnderlyingCode: '0700.HK',
    strikePrice: 398,
    tradeDate: '2026-08-21',
    maturityDate: '2026-09-21',
    valuationDate: '2026-08-27',
    valuationUnderlyingCode: '0700.HK',
    currency: 'HKD',
    openingPrice: 391.8,
    nominalPrincipal: 80,
    positionReconciliationNo: 'PCR-20260827-004',
    children: [],
  },
])

const draftFilters = reactive({
  valuationDate: '',
  channel: '',
  underlyingCode: '',
  status: '' as ReconciliationStatus | '',
})
const activeFilters = reactive({ ...draftFilters })
const selectedParents = ref<PositionParent[]>([])
const pendingAction = ref<{ type: 'match' | 'unmatch'; parentIds: string[] } | null>(null)

const channelOptions = computed(() => [...new Set(parents.value.map((item) => item.channel))])
const filteredParents = computed(() =>
  parents.value.filter((parent) => {
    const matchesDate =
      !activeFilters.valuationDate || parent.valuationDate === activeFilters.valuationDate
    const matchesChannel = !activeFilters.channel || parent.channel === activeFilters.channel
    const codeKeyword = activeFilters.underlyingCode.trim().toLowerCase()
    const matchesCode =
      !codeKeyword ||
      parent.tradeUnderlyingCode.toLowerCase().includes(codeKeyword) ||
      parent.valuationUnderlyingCode.toLowerCase().includes(codeKeyword)
    const matchesStatus =
      !activeFilters.status || reconciliationStatus(parent) === activeFilters.status
    return matchesDate && matchesChannel && matchesCode && matchesStatus
  }),
)
const actionConfirmVisible = computed({
  get: () => Boolean(pendingAction.value),
  set: (visible: boolean) => {
    if (!visible) pendingAction.value = null
  },
})
const pendingActionParents = computed(() => {
  const ids = new Set(pendingAction.value?.parentIds ?? [])
  return parents.value.filter((item) => ids.has(item.id))
})
const actionConfirmTitle = computed(() =>
  pendingAction.value?.type === 'match' ? '确认手动匹配' : '确认解除匹配',
)
const actionConfirmButtonText = computed(() =>
  pendingAction.value?.type === 'match' ? '确认匹配' : '确认解除',
)
const actionConfirmMessage = computed(() => {
  if (pendingAction.value?.type === 'match') {
    return `确认将 ${pendingActionParents.value.length} 条父记录合并为一条新的父记录吗？原父记录及其子记录将合并保留。`
  }
  const childCount = pendingActionParents.value.reduce((sum, item) => sum + item.children.length, 0)
  return `确认解除 ${pendingActionParents.value.length} 条父记录的匹配吗？其中 ${childCount} 条子记录将分别生成新的父记录。`
})

function createChild(
  id: string,
  account: string,
  dataSource: string,
  channel: string,
  code: string,
  nominalPrincipal: number,
  nominalPrincipalDifference: number,
  openingPrice: number,
  optionPremiumDifference: number,
  backToBackContractNo: string,
  positionReconciliationNo: string,
): PositionChild {
  return {
    id,
    account,
    dataSource,
    optionType: '香草期权',
    direction: '买入',
    tradeUnderlyingCode: code,
    strikePrice: code === '600519.SH' ? 1360 : code === '000858.SZ' ? 118 : 10.8,
    nominalPrincipal,
    nominalPrincipalDifference,
    optionPremium: Number((nominalPrincipal * 0.055).toFixed(2)),
    optionPremiumDifference,
    tradeDate: channel === '柜台交易' ? '2026-08-19' : '2026-08-18',
    maturityDate: channel === '柜台交易' ? '2026-12-19' : '2026-11-18',
    valuationDate: '2026-08-27',
    valuationUnderlyingCode: code,
    currency: 'CNY',
    openingPrice,
    backToBackContractNo,
    positionReconciliationNo,
  }
}

function reconciliationStatus(parent: PositionParent): ReconciliationStatus {
  if (parent.children.length === 0) return 'failed'
  const childTotal = parent.children.reduce((sum, child) => sum + child.nominalPrincipal, 0)
  return childTotal === parent.nominalPrincipal ? 'passed' : 'failed'
}

function statusLabel(parent: PositionParent) {
  return { passed: '通过', failed: '不通过' }[reconciliationStatus(parent)]
}

function statusType(parent: PositionParent) {
  return { passed: 'success', failed: 'danger' }[reconciliationStatus(parent)]
}

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function applyFilters() {
  Object.assign(activeFilters, draftFilters)
}

function resetFilters() {
  Object.assign(draftFilters, { valuationDate: '', channel: '', underlyingCode: '', status: '' })
  Object.assign(activeFilters, draftFilters)
}

function handleParentSelection(rows: PositionParent[]) {
  const parentIds = new Set(parents.value.map((item) => item.id))
  selectedParents.value = rows.filter((item) => parentIds.has(item.id))
}

function matchParents() {
  if (selectedParents.value.length < 2) {
    ElMessage.warning('请至少选择两条父记录后进行手动匹配')
    return
  }
  pendingAction.value = { type: 'match', parentIds: selectedParents.value.map((item) => item.id) }
}

async function unmatchParents() {
  if (selectedParents.value.length === 0) {
    ElMessage.warning('请先选择需要解除匹配的父记录')
    return
  }

  const currentSelection = [...selectedParents.value]
  const parentsWithChildren = currentSelection.filter((item) => item.children.length)
  const childCount = parentsWithChildren.reduce((sum, item) => sum + item.children.length, 0)
  const message = childCount
    ? `确认解除 ${parentsWithChildren.length} 条父记录的匹配吗？其中 ${childCount} 条子记录将分别生成新的父记录。`
    : '所选父记录没有已匹配的子持仓，确认后将保留现状。'

  try {
    await ElMessageBox.confirm(message, '确认解除匹配', {
      confirmButtonText: '确认解除',
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false,
      closeOnPressEscape: false,
    })
  } catch {
    return
  }

  if (!parentsWithChildren.length) {
    ElMessage.info('所选父记录没有可解除的子持仓')
    return
  }

  completeUnmatch(parentsWithChildren)
}

function confirmPendingAction() {
  const action = pendingAction.value
  if (!action) return
  const actionParents = pendingActionParents.value
  if (action.type === 'match') {
    completeMatch(actionParents)
  } else {
    completeUnmatch(actionParents)
  }
  pendingAction.value = null
}

function completeMatch(currentSelection: PositionParent[]) {
  const children = currentSelection.flatMap((parent) =>
    parent.children.length
      ? parent.children.map((child) => ({ ...child }))
      : [parentToChild(parent)],
  )
  const first = currentSelection[0]
  const combined: PositionParent = {
    ...first,
    id: `parent-${Date.now()}`,
    channel: first.channel,
    optionType: currentSelection.every((item) => item.optionType === first.optionType)
      ? first.optionType
      : '组合期权',
    direction: currentSelection.every((item) => item.direction === first.direction)
      ? first.direction
      : '组合方向',
    nominalPrincipal: currentSelection.reduce((sum, item) => sum + item.nominalPrincipal, 0),
    positionReconciliationNo: `PCR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-M${Date.now().toString().slice(-4)}`,
    children,
  }
  const selectedIds = new Set(currentSelection.map((item) => item.id))
  parents.value = [combined, ...parents.value.filter((item) => !selectedIds.has(item.id))]
  selectedParents.value = []
  ElMessage.success('已完成手动匹配')
}

function completeUnmatch(parentsWithChildren: PositionParent[]) {
  const selectedIds = new Set(parentsWithChildren.map((item) => item.id))
  const restoredParents = parentsWithChildren.flatMap((parent) =>
    parent.children.map((child, index) => childToParent(child, `${parent.id}-${index + 1}`)),
  )
  parents.value = [...restoredParents, ...parents.value.filter((item) => !selectedIds.has(item.id))]
  selectedParents.value = []
  ElMessage.success(`已解除 ${restoredParents.length} 条子持仓`)
}

function parentToChild(parent: PositionParent): PositionChild {
  return {
    id: `child-${parent.id}`,
    account: '待核对账号',
    dataSource: '解除匹配还原',
    optionType: parent.optionType,
    direction: parent.direction,
    tradeUnderlyingCode: parent.tradeUnderlyingCode,
    strikePrice: parent.strikePrice,
    nominalPrincipal: parent.nominalPrincipal,
    nominalPrincipalDifference: 0,
    optionPremium: 0,
    optionPremiumDifference: 0,
    tradeDate: parent.tradeDate,
    maturityDate: parent.maturityDate,
    valuationDate: parent.valuationDate,
    valuationUnderlyingCode: parent.valuationUnderlyingCode,
    currency: parent.currency,
    openingPrice: parent.openingPrice,
    backToBackContractNo: '待补充',
    positionReconciliationNo: parent.positionReconciliationNo,
  }
}

function childToParent(child: PositionChild, suffix: string): PositionParent {
  return {
    id: `unmatched-${Date.now()}-${suffix}`,
    channel: 'CICC',
    optionType: child.optionType,
    direction: child.direction,
    tradeUnderlyingCode: child.tradeUnderlyingCode,
    strikePrice: child.strikePrice,
    tradeDate: child.tradeDate,
    maturityDate: child.maturityDate,
    valuationDate: child.valuationDate,
    valuationUnderlyingCode: child.valuationUnderlyingCode,
    currency: child.currency,
    openingPrice: child.openingPrice,
    nominalPrincipal: child.nominalPrincipal,
    positionReconciliationNo: `UNMATCHED-${child.positionReconciliationNo}-${suffix}`,
    children: [],
  }
}

function loadData() {
  const nextId = `parent-load-${Date.now()}`
  parents.value.unshift({
    id: nextId,
    channel: 'CICC',
    optionType: '香草期权',
    direction: '买入',
    tradeUnderlyingCode: '300750.SZ',
    strikePrice: 232,
    tradeDate: '2026-08-27',
    maturityDate: '2026-12-27',
    valuationDate: '2026-08-27',
    valuationUnderlyingCode: '300750.SZ',
    currency: 'CNY',
    openingPrice: 226.6,
    nominalPrincipal: 100,
    positionReconciliationNo: `PCR-LOAD-${Date.now().toString().slice(-6)}`,
    children: [],
  })
  ElMessage.success('已加载 1 条待核对持仓数据')
}

function exportData() {
  const headers = [
    '渠道',
    '期权类型',
    '方向',
    '交易标的代码',
    '行权价格',
    '交易日',
    '到期日',
    '估值日期',
    '估值标的代码',
    '币种',
    '期初价格',
    '名义本金（万）',
    '核对状态',
    '持仓核对编号',
  ]
  const rows = filteredParents.value.map((item) => [
    item.channel,
    item.optionType,
    item.direction,
    item.tradeUnderlyingCode,
    item.strikePrice,
    item.tradeDate,
    item.maturityDate,
    item.valuationDate,
    item.valuationUnderlyingCode,
    item.currency,
    item.openingPrice,
    item.nominalPrincipal,
    statusLabel(item),
    item.positionReconciliationNo,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
  link.download = `期权持仓对账_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('对账数据已导出')
}
</script>

<style scoped>
.position-reconciliation-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.position-reconciliation-filter,
.position-reconciliation-content {
  padding: 20px;
  background: var(--color-bg-surface);
  border-radius: 8px;
}

.position-reconciliation-heading h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 22px;
  line-height: 32px;
}

.position-reconciliation-heading p {
  margin: 4px 0 18px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.position-reconciliation-filter__form {
  display: flex;
  gap: 16px;
  align-items: end;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-subtle);
}

.position-reconciliation-filter__form label {
  flex: 0 1 196px;
  min-width: 0;
  display: grid;
  gap: 7px;
  width: 196px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.position-reconciliation-filter__form :deep(.el-input__wrapper),
.position-reconciliation-filter__form :deep(.el-select__wrapper) {
  min-height: 34px;
  background: var(--color-bg-elevated) !important;
  box-shadow: none !important;
}

.position-reconciliation-filter__form :deep(.el-input),
.position-reconciliation-filter__form :deep(.el-select),
.position-reconciliation-filter__form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.position-reconciliation-filter__actions,
.position-reconciliation-toolbar,
.position-reconciliation-toolbar__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.position-reconciliation-filter__actions {
  padding-bottom: 0;
}

.position-reconciliation-toolbar {
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.position-reconciliation-table {
  margin-top: 14px;
}

.position-reconciliation-table :deep(th.el-table__cell) {
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  font-weight: 700;
}

.position-reconciliation-table :deep(th.el-table__expand-column .cell),
.position-reconciliation-table :deep(td.el-table__expand-column .cell) {
  padding: 0;
}

.position-reconciliation-table :deep(th.el-table-column--selection .cell),
.position-reconciliation-table :deep(td.el-table-column--selection .cell) {
  padding: 0 0 0 16px;
}

.position-reconciliation-table :deep(.position-reconciliation-status-cell .cell) {
  display: flex;
  justify-content: center;
}

.position-reconciliation-table :deep(.el-table__expanded-cell) {
  padding: 12px 20px 16px 0;
  background: var(--color-bg-elevated);
}

.position-reconciliation-children {
  padding: 14px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.position-reconciliation-children__heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.position-reconciliation-children__heading div {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.position-reconciliation-children__heading strong {
  color: var(--color-text-primary);
  font-size: 14px;
}

.position-reconciliation-children__heading span {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.position-reconciliation-child-table :deep(th.el-table__cell) {
  background: var(--color-bg-elevated);
  font-size: 12px;
}

.reconciliation-number--warning {
  color: var(--color-danger);
  font-weight: 600;
}

.position-reconciliation-confirm-dialog__message {
  margin: 0;
  color: var(--color-text-tertiary);
  line-height: 22px;
}

@media (max-width: 1280px) {
  .position-reconciliation-filter__form {
    flex-wrap: wrap;
  }
}
</style>
