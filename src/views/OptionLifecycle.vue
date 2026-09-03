<template>
  <div class="option-lifecycle-page">
    <section class="option-lifecycle-card" aria-label="期权生命周期">
      <el-tabs v-model="viewMode" class="option-lifecycle-tabs">
        <el-tab-pane label="详细视图" name="complete" />
        <el-tab-pane label="简易视图" name="simple" />
      </el-tabs>

      <form class="option-lifecycle-filter" @submit.prevent="applyFilters">
        <label>
          <span>背靠背合约编号</span>
          <el-select
            v-model="draftFilters.contractNo"
            clearable
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请输入关键词搜索"
          >
            <el-option
              v-for="contractNo in contractNoOptions"
              :key="contractNo"
              :label="contractNo"
              :value="contractNo"
            />
          </el-select>
        </label>
        <label>
          <span>交易对手</span>
          <el-select v-model="draftFilters.counterparty" clearable filterable placeholder="请选择">
            <el-option
              v-for="counterparty in counterpartyOptions"
              :key="counterparty"
              :label="counterparty"
              :value="counterparty"
            />
          </el-select>
        </label>
        <label>
          <span>上手方</span>
          <el-select
            v-model="draftFilters.hedger"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择"
          >
            <el-option label="CICC_option" value="CICC_option" />
            <el-option label="CLSA_option" value="CLSA_option" />
            <el-option label="HTSC_option" value="HTSC_option" />
          </el-select>
        </label>
        <label>
          <span>标的</span>
          <el-input v-model="draftFilters.underlying" clearable placeholder="请输入" />
        </label>
        <label>
          <span>期限</span>
          <el-input
            v-model="draftFilters.tenor"
            clearable
            type="number"
            min="1"
            placeholder="请输入"
          >
            <template #append>M</template>
          </el-input>
        </label>
        <span class="option-lifecycle-filter__break" aria-hidden="true" />
        <label>
          <span>执行价</span>
          <el-input v-model="draftFilters.strikeRate" clearable type="number" placeholder="请输入">
            <template #append>%</template>
          </el-input>
        </label>
        <label>
          <span>状态</span>
          <el-select v-model="draftFilters.status" clearable placeholder="请选择">
            <el-option label="存续" value="存续" />
            <el-option label="了结" value="了结" />
          </el-select>
        </label>
        <div class="option-lifecycle-filter__actions">
          <el-button type="primary" native-type="submit" :icon="Search">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
        </div>
        <div class="option-lifecycle-view-actions">
          <el-tooltip content="导出" placement="top">
            <el-button
              class="option-lifecycle-export-button"
              :icon="Download"
              aria-label="导出"
              @click="exportRows"
            />
          </el-tooltip>
        </div>
      </form>

      <section class="option-lifecycle-table-panel" aria-label="生命周期列表">
        <el-table
          v-if="viewMode === 'complete'"
          :data="pagedRows"
          class="option-lifecycle-table"
          border
          height="100%"
          empty-text="暂无符合条件的生命周期记录"
          :span-method="detailSpanMethod"
        >
          <el-table-column
            v-for="column in detailedTableColumns('基础信息')"
            :key="column.value"
            :prop="column.value"
            :label="column.tableLabel || column.label"
            :width="column.width"
            :fixed="column.fixed"
            :align="column.align"
            :header-align="column.headerAlign"
            :show-overflow-tooltip="column.showOverflowTooltip"
          >
            <template v-if="column.kind === 'optionInfo'" #default="{ row }">
              <span class="option-lifecycle-option-info">{{ row.optionInfo }}</span>
            </template>
            <template v-if="column.kind === 'strikeRate'" #header>
              <span class="option-lifecycle-strike-header">执行价<span>(%)</span></span>
            </template>
          </el-table-column>
          <el-table-column
            v-if="detailedTableColumns('当前名义本金').length"
            label="当前名义本金"
            header-align="center"
          >
            <el-table-column
              v-for="column in detailedTableColumns('当前名义本金')"
              :key="column.value"
              :prop="column.value"
              :label="column.tableLabel || column.label"
              :width="column.width"
              :align="column.align"
            />
          </el-table-column>
          <el-table-column
            v-if="detailedTableColumns('开仓').length"
            label="开仓"
            header-align="center"
          >
            <el-table-column
              v-for="column in detailedTableColumns('开仓')"
              :key="column.value"
              :prop="column.value"
              :label="column.tableLabel || column.label"
              :width="column.width"
              :align="column.align"
              :show-overflow-tooltip="column.showOverflowTooltip"
            />
          </el-table-column>
          <el-table-column
            v-if="detailedTableColumns('平仓').length"
            label="平仓"
            header-align="center"
          >
            <el-table-column
              v-for="column in detailedTableColumns('平仓')"
              :key="column.value"
              :prop="column.value"
              :label="column.tableLabel || column.label"
              :width="column.width"
              :align="column.align"
            />
          </el-table-column>
          <el-table-column
            v-if="detailedTableColumns('中间账户').length"
            label="中间账户"
            header-align="center"
          >
            <el-table-column
              v-for="column in detailedTableColumns('中间账户')"
              :key="column.value"
              :prop="column.value"
              :label="column.tableLabel || column.label"
              :width="column.width"
              :align="column.align"
            />
          </el-table-column>
          <el-table-column
            v-for="column in detailedTableColumns('其他')"
            :key="column.value"
            :prop="column.value"
            :label="column.tableLabel || column.label"
            :width="column.width"
          />
          <el-table-column
            v-if="detailedTableColumns('期权费信息').length"
            label="期权费信息"
            header-align="center"
          >
            <el-table-column
              v-for="column in detailedTableColumns('期权费信息')"
              :key="column.value"
              :prop="column.value"
              :label="column.tableLabel || column.label"
              :width="column.width"
              :align="column.align"
            />
          </el-table-column>
          <el-table-column
            label="操作"
            width="204"
            fixed="right"
            align="center"
            header-align="left"
            column-key="operation"
            class-name="option-lifecycle-operation-column"
          >
            <template #header>
              <div class="option-lifecycle-operation-header">
                <span>操作</span>
                <el-popover
                  v-model:visible="columnSettingsVisible"
                  placement="bottom-end"
                  :width="280"
                  :show-arrow="false"
                  popper-class="option-lifecycle-column-popper"
                  trigger="click"
                  @show="openColumnSettings"
                >
                  <template #reference>
                    <el-button
                      class="option-lifecycle-column-trigger"
                      :icon="Operation"
                      aria-label="自定义列"
                      title="自定义列"
                    />
                  </template>
                  <div class="option-lifecycle-column-settings">
                    <div class="option-lifecycle-column-settings__header">
                      <strong>自定义列设置</strong>
                      <el-button link type="primary" @click="resetColumnSettings"
                        >恢复默认</el-button
                      >
                    </div>
                    <el-checkbox-group v-model="columnDraft">
                      <section
                        v-for="group in activeColumnGroups"
                        :key="group.label || 'columns'"
                        class="option-lifecycle-column-group"
                      >
                        <h4 v-if="group.label">{{ group.label }}</h4>
                        <div class="option-lifecycle-column-list">
                          <div
                            v-for="option in group.options"
                            :key="option.value"
                            class="option-lifecycle-column-item"
                            :class="{ 'is-dragging': draggedColumn?.value === option.value }"
                            @pointerenter="moveColumnDrag(group.label, option.value)"
                          >
                            <span
                              class="option-lifecycle-column-grip"
                              aria-label="拖拽调整列顺序"
                              @pointerdown.prevent="startColumnDrag(group.label, option.value)"
                            >
                              <el-icon><MoreFilled /></el-icon>
                              <el-icon><MoreFilled /></el-icon>
                            </span>
                            <el-checkbox :value="option.value">{{ option.label }}</el-checkbox>
                          </div>
                        </div>
                      </section>
                    </el-checkbox-group>
                    <div class="option-lifecycle-column-settings__footer">
                      <el-button @click="cancelColumnSettings">取消</el-button>
                      <el-button type="primary" @click="saveColumnSettings">保存</el-button>
                    </div>
                  </div>
                </el-popover>
              </div>
            </template>
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button
                link
                type="primary"
                @click="downloadCounterpartyDocuments(row, '交易确认书')"
                >交易确认书</el-button
              >
              <el-button link type="primary" @click="downloadCounterpartyDocuments(row, '估值报告')"
                >估值报告</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <el-table
          v-else
          :data="pagedRows"
          class="option-lifecycle-table"
          border
          height="100%"
          empty-text="暂无符合条件的生命周期记录"
        >
          <el-table-column
            v-for="column in simpleTableColumns"
            :key="column.value"
            :prop="column.value"
            :label="column.tableLabel || column.label"
            :width="column.width"
            :fixed="column.fixed"
            :align="column.align"
            :header-align="column.headerAlign"
            :show-overflow-tooltip="column.showOverflowTooltip"
          >
            <template v-if="column.kind === 'strikeRate'" #header>
              <span class="option-lifecycle-strike-header">执行价<span>(%)</span></span>
            </template>
            <template v-if="column.kind === 'status'" #default="{ row }">
              <el-tag :type="row.status === '存续' ? 'success' : 'info'" effect="light">{{
                row.status
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="90"
            fixed="right"
            align="center"
            header-align="left"
            class-name="option-lifecycle-operation-column"
          >
            <template #header>
              <div class="option-lifecycle-operation-header">
                <span>操作</span>
                <el-popover
                  v-model:visible="columnSettingsVisible"
                  placement="bottom-end"
                  :width="280"
                  :show-arrow="false"
                  popper-class="option-lifecycle-column-popper"
                  trigger="click"
                  @show="openColumnSettings"
                >
                  <template #reference>
                    <el-button
                      class="option-lifecycle-column-trigger"
                      :icon="Operation"
                      aria-label="自定义列"
                      title="自定义列"
                    />
                  </template>
                  <div class="option-lifecycle-column-settings">
                    <div class="option-lifecycle-column-settings__header">
                      <strong>自定义列设置</strong>
                      <el-button link type="primary" @click="resetColumnSettings"
                        >恢复默认</el-button
                      >
                    </div>
                    <el-checkbox-group v-model="columnDraft">
                      <section
                        v-for="group in activeColumnGroups"
                        :key="group.label || 'columns'"
                        class="option-lifecycle-column-group"
                      >
                        <h4 v-if="group.label">{{ group.label }}</h4>
                        <div class="option-lifecycle-column-list">
                          <div
                            v-for="option in group.options"
                            :key="option.value"
                            class="option-lifecycle-column-item"
                            :class="{ 'is-dragging': draggedColumn?.value === option.value }"
                            @pointerenter="moveColumnDrag(group.label, option.value)"
                          >
                            <span
                              class="option-lifecycle-column-grip"
                              aria-label="拖拽调整列顺序"
                              @pointerdown.prevent="startColumnDrag(group.label, option.value)"
                            >
                              <el-icon><MoreFilled /></el-icon>
                              <el-icon><MoreFilled /></el-icon>
                            </span>
                            <el-checkbox :value="option.value">{{ option.label }}</el-checkbox>
                          </div>
                        </div>
                      </section>
                    </el-checkbox-group>
                    <div class="option-lifecycle-column-settings__footer">
                      <el-button @click="cancelColumnSettings">取消</el-button>
                      <el-button type="primary" @click="saveColumnSettings">保存</el-button>
                    </div>
                  </div>
                </el-popover>
              </div>
            </template>
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="option-lifecycle-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredRows.length"
            layout="total, sizes, prev, pager, next"
          />
        </div>
      </section>
    </section>

    <el-drawer
      v-model="detailVisible"
      title="生命周期详情"
      size="62%"
      append-to-body
      class="option-lifecycle-drawer"
    >
      <section class="option-lifecycle-detail-section" aria-label="期权要素">
        <h2>期权要素</h2>
        <el-descriptions :column="2" border class="option-lifecycle-descriptions">
          <el-descriptions-item label="标的物">恒生电子（600570）</el-descriptions-item>
          <el-descriptions-item label="期权类型">香草</el-descriptions-item>
          <el-descriptions-item label="期限">1M</el-descriptions-item>
          <el-descriptions-item label="期权结构">100C</el-descriptions-item>
          <el-descriptions-item label="交易规则">协商敲出 / T+1 / 分红调整</el-descriptions-item>
          <el-descriptions-item label="参与率">100%</el-descriptions-item>
          <el-descriptions-item label="上手方1">CICC_option</el-descriptions-item>
          <el-descriptions-item label="期权费率">9.86% / 7.86%</el-descriptions-item>
          <el-descriptions-item label="上手方2">CLSA_option</el-descriptions-item>
          <el-descriptions-item label="期权费率">9.78% / 7.21%</el-descriptions-item>
          <el-descriptions-item label="客户名义本金（期初/当前）">10,000 / 0</el-descriptions-item>
          <el-descriptions-item label="结算币种">CNY</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="option-lifecycle-detail-section" aria-label="交易现金流">
        <h2>交易现金流</h2>
        <el-table
          :data="transactionCashFlows"
          class="option-lifecycle-detail-table"
          show-summary
          :summary-method="cashFlowSummary"
        >
          <el-table-column prop="date" label="日期" width="108" />
          <el-table-column prop="type" label="类型" width="76" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === '开仓' ? 'danger' : 'success'" effect="light">{{
                row.type
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="名义本金变化" header-align="center">
            <el-table-column prop="customerNotional" label="客户" width="118" align="right" />
            <el-table-column prop="hedgerNotional" label="上手" width="190">
              <template #default="{ row }"
                ><span class="option-lifecycle-multiline">{{ row.hedgerNotional }}</span></template
              >
            </el-table-column>
          </el-table-column>
          <el-table-column label="价格" header-align="center">
            <el-table-column prop="customerPrice" label="客户" width="82" align="right" />
            <el-table-column prop="hedgerPrice" label="上手" width="174">
              <template #default="{ row }"
                ><span class="option-lifecycle-multiline">{{ row.hedgerPrice }}</span></template
              >
            </el-table-column>
          </el-table-column>
          <el-table-column label="现金流（本方方向）" header-align="center">
            <el-table-column label="客户账户" width="126" align="right">
              <template #default="{ row }"
                ><span :class="transactionCashFlowClass(row)">{{
                  row.customerCashFlow
                }}</span></template
              >
            </el-table-column>
            <el-table-column label="中间账户" width="126" align="right">
              <template #default="{ row }"
                ><span :class="transactionCashFlowClass(row)">{{
                  row.middleCashFlow
                }}</span></template
              >
            </el-table-column>
            <el-table-column label="上手账户" width="126" align="right">
              <template #default="{ row }"
                ><span :class="[transactionCashFlowClass(row), 'option-lifecycle-multiline']">{{
                  row.hedgerCashFlow
                }}</span></template
              >
            </el-table-column>
          </el-table-column>
          <el-table-column
            label="操作"
            width="232"
            fixed="right"
            class-name="option-lifecycle-operation-column"
          >
            <template #default="{ row }">
              <el-button link type="primary" @click="openSplitDetail(row)">详情</el-button>
              <el-button
                link
                type="primary"
                @click="downloadCounterpartyDocuments(selectedLifecycleRow, '交易确认书')"
                >交易确认书</el-button
              >
              <el-button
                link
                type="primary"
                @click="downloadCounterpartyDocuments(selectedLifecycleRow, '估值报告')"
                >估值报告</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="option-lifecycle-detail-section" aria-label="客户实际现金流">
        <div class="option-lifecycle-detail-section__heading">
          <h2>客户实际现金流</h2>
          <el-select
            v-model="cashFlowTypes"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部类型"
            style="width: 180px"
          >
            <el-option label="入金" value="入金" />
            <el-option label="出金" value="出金" />
            <el-option label="换汇现金流" value="换汇现金流" />
            <el-option label="划转现金流" value="划转现金流" />
            <el-option label="期权费" value="期权费" />
            <el-option label="期权收益" value="期权收益" />
          </el-select>
        </div>
        <el-table
          :data="filteredActualCashFlows"
          class="option-lifecycle-detail-table option-lifecycle-actual-cashflow-table"
          :class="{
            'option-lifecycle-actual-cashflow-table--negative': actualCashFlowTotalCny < 0,
          }"
          show-summary
          :summary-method="actualCashFlowSummary"
        >
          <el-table-column prop="date" label="日期" width="118" />
          <el-table-column prop="type" label="类型" width="130" />
          <el-table-column label="现金流（本方方向）- 客户账户" width="230" align="right">
            <template #default="{ row }">{{ row.amount }}</template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="260" />
        </el-table>
      </section>
    </el-drawer>

    <el-drawer
      v-model="splitDetailVisible"
      class="option-lifecycle-split-drawer"
      size="980px"
      destroy-on-close
      append-to-body
    >
      <template #header>
        <h2 class="option-lifecycle-split-drawer__title">交易现金流详情</h2>
      </template>

      <div class="option-lifecycle-split-drawer__workspace">
        <div class="option-lifecycle-split-drawer__overview">
          <span>背靠背合约编号：{{ selectedLifecycleRow?.contractNo || '—' }}</span>
          <span>交易对手：{{ selectedLifecycleRow?.counterparty || '—' }}</span>
          <span>交易日期：{{ selectedTransactionCashFlow?.date || '—' }}</span>
          <span>开平类型：{{ selectedTransactionCashFlow?.type || '—' }}</span>
        </div>

        <el-tabs v-model="splitAccountTab" class="option-lifecycle-split-drawer__accounts">
          <el-tab-pane
            v-for="account in splitRows"
            :key="account.accountType"
            :label="account.accountType"
            :name="account.accountType"
          />
        </el-tabs>

        <div class="option-lifecycle-split-drawer__content">
          <section class="option-lifecycle-readonly-section">
            <h3>交易信息</h3>
            <div class="option-lifecycle-readonly-grid">
              <label v-for="field in activeSplitTradeFields" :key="field.label">
                <span>{{ field.label }}</span>
                <div>{{ field.value || '—' }}</div>
              </label>
            </div>
          </section>

          <section class="option-lifecycle-readonly-section">
            <h3>资金信息</h3>
            <div class="option-lifecycle-readonly-grid">
              <label v-for="field in activeSplitCashFlowFields" :key="field.label">
                <span>{{ field.label }}</span>
                <div>{{ field.value || '—' }}</div>
              </label>
            </div>
          </section>
        </div>
      </div>

      <template #footer>
        <div class="option-lifecycle-split-drawer__footer">
          <el-button @click="splitDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import JSZip from 'jszip'
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, MoreFilled, Operation, RefreshLeft, Search } from '@element-plus/icons-vue'

type LifecycleStatus = '存续' | '了结'
type ViewMode = 'complete' | 'simple'
type DownloadDocumentType = '交易确认书' | '估值报告'

interface LifecycleFilters {
  contractNo: string[]
  counterparty: string
  hedger: string[]
  underlying: string
  tenor: string
  strikeRate: string
  status: LifecycleStatus | ''
}

interface LifecycleRow {
  id: number
  eventNo: string
  optionInfo: string
  tenor: string
  strikeRate: number
  counterparty: string
  hedger: string
  hedgerCount: number
  customerCurrentNotional: string
  hedgerCurrentNotional: string
  contractNo: string
  underlying: string
  openDate: string
  customerInitialNotional: string
  hedgerInitialNotional: string
  customerPremiumRate: string
  hedgerPremiumRate: string
  customerOpenPrice: string
  hedgerOpenPrice: string
  closeDate: string
  customerClosePrice: string
  hedgerClosePrice: string
  customerSettlement: string
  hedgerSettlement: string
  openRevenue: string
  closeRevenue: string
  currency: string
  customerPremium: string
  hedgerPremium: string
  status: LifecycleStatus
}

interface TransactionCashFlow {
  date: string
  type: '开仓' | '平仓'
  customerNotional: string
  hedgerNotional: string
  customerPrice: string
  hedgerPrice: string
  customerCashFlow: string
  middleCashFlow: string
  hedgerCashFlow: string
}

interface LifecycleSpanProps {
  row: LifecycleRow
  column: {
    property?: string
    columnKey?: string
  }
  rowIndex: number
}

interface ColumnOption {
  value: string
  label: string
  tableLabel?: string
  width: number
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  fixed?: true | 'left' | 'right'
  showOverflowTooltip?: boolean
  kind?: 'optionInfo' | 'strikeRate' | 'status'
}

interface ColumnGroup {
  label: string
  options: ColumnOption[]
}

const viewMode = ref<ViewMode>('complete')
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const splitDetailVisible = ref(false)
const selectedLifecycleRow = ref<LifecycleRow | null>(null)
const selectedTransactionCashFlow = ref<TransactionCashFlow | null>(null)
const splitAccountTab = ref('客户账号')
const cashFlowTypes = ref<string[]>([])

const detailedColumnGroups: ColumnGroup[] = [
  {
    label: '基础信息',
    options: [
      { value: 'optionInfo', label: '期权信息', width: 220, kind: 'optionInfo' },
      { value: 'tenor', label: '期限', width: 68 },
      {
        value: 'strikeRate',
        label: '执行价',
        width: 82,
        align: 'right',
        headerAlign: 'right',
        kind: 'strikeRate',
      },
      { value: 'counterparty', label: '交易对手', width: 130, showOverflowTooltip: true },
      {
        value: 'hedger',
        label: '上手方',
        tableLabel: '上手',
        width: 130,
        showOverflowTooltip: true,
      },
    ],
  },
  {
    label: '当前名义本金',
    options: [
      { value: 'customerCurrentNotional', label: '客户', width: 126, align: 'right' },
      { value: 'hedgerCurrentNotional', label: '上手', width: 126, align: 'right' },
    ],
  },
  {
    label: '开仓',
    options: [
      { value: 'contractNo', label: '背靠背合约编号', width: 230, showOverflowTooltip: true },
      { value: 'customerInitialNotional', label: '客户期初名义本金', width: 146, align: 'right' },
      { value: 'hedgerInitialNotional', label: '上手期初名义本金', width: 146, align: 'right' },
      { value: 'customerPremiumRate', label: '客户期权费率', width: 118, align: 'right' },
      { value: 'hedgerPremiumRate', label: '上手期权费率', width: 118, align: 'right' },
      { value: 'customerOpenPrice', label: '客户开仓价', width: 106, align: 'right' },
      { value: 'hedgerOpenPrice', label: '上手开仓价', width: 106, align: 'right' },
    ],
  },
  {
    label: '平仓',
    options: [
      { value: 'closeDate', label: '平仓日期', width: 108 },
      { value: 'customerClosePrice', label: '客户平仓价', width: 106, align: 'right' },
      { value: 'hedgerClosePrice', label: '上手平仓价', width: 106, align: 'right' },
      { value: 'customerSettlement', label: '客户期权结算金额', width: 148, align: 'right' },
      { value: 'hedgerSettlement', label: '上手期权结算金额', width: 148, align: 'right' },
    ],
  },
  {
    label: '中间账户',
    options: [
      { value: 'openRevenue', label: '开仓收益', width: 108, align: 'right' },
      { value: 'closeRevenue', label: '平仓收益', width: 108, align: 'right' },
    ],
  },
  {
    label: '其他',
    options: [{ value: 'currency', label: '结算币种', width: 86 }],
  },
  {
    label: '期权费信息',
    options: [
      { value: 'customerPremium', label: '客户期权费', width: 124, align: 'right' },
      { value: 'hedgerPremium', label: '上手期权费', width: 124, align: 'right' },
    ],
  },
]

const simpleColumnGroups: ColumnGroup[] = [
  {
    label: '',
    options: [
      { value: 'eventNo', label: '事件编号', width: 150, fixed: 'left', showOverflowTooltip: true },
      {
        value: 'contractNo',
        label: '背靠背合约编号',
        width: 230,
        fixed: 'left',
        showOverflowTooltip: true,
      },
      { value: 'underlying', label: '标的', width: 168, fixed: 'left', showOverflowTooltip: true },
      { value: 'openDate', label: '开仓日期', width: 108, fixed: 'left' },
      { value: 'counterparty', label: '交易对手', width: 130, showOverflowTooltip: true },
      { value: 'customerOpenPrice', label: '客户开仓价', width: 106, align: 'right' },
      {
        value: 'strikeRate',
        label: '执行价',
        width: 82,
        align: 'right',
        headerAlign: 'right',
        kind: 'strikeRate',
      },
      { value: 'customerInitialNotional', label: '客户期初名义本金', width: 146, align: 'right' },
      { value: 'hedgerInitialNotional', label: '上手期初名义本金', width: 146, align: 'right' },
      { value: 'hedgerCount', label: '上手方数量', width: 100, align: 'right' },
      { value: 'customerPremium', label: '客户期权费', width: 124, align: 'right' },
      { value: 'hedgerPremium', label: '上手期权费', width: 124, align: 'right' },
      { value: 'status', label: '状态', width: 82, fixed: 'right', kind: 'status' },
      { value: 'customerSettlement', label: '客户期权结算金额', width: 148, align: 'right' },
      { value: 'hedgerSettlement', label: '上手期权结算金额', width: 148, align: 'right' },
    ],
  },
]

const detailedColumnOptions = detailedColumnGroups.flatMap((group) => group.options)
const simpleColumnOptions = simpleColumnGroups.flatMap((group) => group.options)

const detailedVisibleColumns = ref(detailedColumnOptions.map((option) => option.value))
const simpleVisibleColumns = ref(simpleColumnOptions.map((option) => option.value))
const detailedColumnOrder = ref(detailedColumnOptions.map((option) => option.value))
const simpleColumnOrder = ref(simpleColumnOptions.map((option) => option.value))
const columnSettingsVisible = ref(false)
const columnDraft = ref<string[]>([])
const columnOrderDraft = ref<string[]>([])
const draggedColumn = ref<{ groupLabel: string; value: string } | null>(null)
const activeColumnOptions = computed(() =>
  viewMode.value === 'complete' ? detailedColumnOptions : simpleColumnOptions,
)
const activeVisibleColumns = computed<string[]>({
  get: () =>
    viewMode.value === 'complete' ? detailedVisibleColumns.value : simpleVisibleColumns.value,
  set: (value) => {
    if (viewMode.value === 'complete') detailedVisibleColumns.value = value
    else simpleVisibleColumns.value = value
  },
})
const activeColumnOrder = computed<string[]>({
  get: () => (viewMode.value === 'complete' ? detailedColumnOrder.value : simpleColumnOrder.value),
  set: (value) => {
    if (viewMode.value === 'complete') detailedColumnOrder.value = value
    else simpleColumnOrder.value = value
  },
})
const activeColumnGroups = computed(() => {
  const groups = viewMode.value === 'complete' ? detailedColumnGroups : simpleColumnGroups
  const order = columnOrderDraft.value.length ? columnOrderDraft.value : activeColumnOrder.value
  return groups.map((group) => ({ ...group, options: sortColumnOptions(group.options, order) }))
})
const simpleTableColumns = computed(() =>
  sortColumnOptions(simpleColumnOptions, simpleColumnOrder.value).filter((option) =>
    simpleVisibleColumns.value.includes(option.value),
  ),
)

const emptyFilters = (): LifecycleFilters => ({
  contractNo: [],
  counterparty: '',
  hedger: [],
  underlying: '',
  tenor: '',
  strikeRate: '',
  status: '',
})

const draftFilters = reactive<LifecycleFilters>(emptyFilters())
const appliedFilters = ref<LifecycleFilters>(emptyFilters())

const baseRows: Omit<LifecycleRow, 'id' | 'eventNo'>[] = [
  {
    optionInfo: '688027.SH-100C-100%-1M-20260119-20260320',
    tenor: '1M',
    strikeRate: 100,
    counterparty: 'caowen_option',
    hedger: 'CICC_option',
    hedgerCount: 1,
    customerCurrentNotional: '1,100,000',
    hedgerCurrentNotional: '1,000,000',
    contractNo: 'CLSA-OPT-Hughie-20260812-0002',
    underlying: '恒生电子（600570）',
    openDate: '2026-02-21',
    customerInitialNotional: '1,100,000',
    hedgerInitialNotional: '1,000,000',
    customerPremiumRate: '9.86%',
    hedgerPremiumRate: '7.86%',
    customerOpenPrice: '9.99',
    hedgerOpenPrice: '9.79',
    closeDate: '—',
    customerClosePrice: '—',
    hedgerClosePrice: '—',
    customerSettlement: '—',
    hedgerSettlement: '—',
    openRevenue: '100,000',
    closeRevenue: '—',
    currency: 'CNY',
    customerPremium: '999,999',
    hedgerPremium: '999,999',
    status: '存续',
  },
  {
    optionInfo: '000858.SZ-95P-100%-3M-20260203-20260504',
    tenor: '3M',
    strikeRate: 95,
    counterparty: 'Hughie',
    hedger: 'CLSA_option',
    hedgerCount: 2,
    customerCurrentNotional: '30,000,000',
    hedgerCurrentNotional: '30,000,000',
    contractNo: 'Multi-OPT-Hughie-20260203-0001',
    underlying: '五粮液（000858）',
    openDate: '2026-02-03',
    customerInitialNotional: '30,000,000',
    hedgerInitialNotional: '30,000,000',
    customerPremiumRate: '4.60%',
    hedgerPremiumRate: '4.20%',
    customerOpenPrice: '128.20',
    hedgerOpenPrice: '127.88',
    closeDate: '—',
    customerClosePrice: '—',
    hedgerClosePrice: '—',
    customerSettlement: '—',
    hedgerSettlement: '—',
    openRevenue: '120,000',
    closeRevenue: '—',
    currency: 'CNY',
    customerPremium: '1,380,000',
    hedgerPremium: '1,260,000',
    status: '存续',
  },
  {
    optionInfo: '600519.SH-100C-100%-2M-20260108-20260309',
    tenor: '2M',
    strikeRate: 100,
    counterparty: 'YAO YUAN_option',
    hedger: 'CICC_option',
    hedgerCount: 1,
    customerCurrentNotional: '0',
    hedgerCurrentNotional: '0',
    contractNo: 'CICC-OPT-YAO YUAN_option-20260108-0008',
    underlying: '贵州茅台（600519）',
    openDate: '2026-01-08',
    customerInitialNotional: '20,000,000',
    hedgerInitialNotional: '20,000,000',
    customerPremiumRate: '5.20%',
    hedgerPremiumRate: '4.85%',
    customerOpenPrice: '1,430.00',
    hedgerOpenPrice: '1,429.50',
    closeDate: '2026-03-09',
    customerClosePrice: '1,468.80',
    hedgerClosePrice: '1,467.90',
    customerSettlement: '542,600',
    hedgerSettlement: '510,000',
    openRevenue: '70,000',
    closeRevenue: '32,600',
    currency: 'CNY',
    customerPremium: '1,040,000',
    hedgerPremium: '970,000',
    status: '了结',
  },
]

const simpleLifecycleRows: LifecycleRow[] = Array.from({ length: 14 }, (_, index) => ({
  ...baseRows[index % baseRows.length],
  id: index + 1,
  eventNo: String(39457839 + index),
}))

const multiRecordRows: Omit<LifecycleRow, 'id' | 'eventNo'>[] = [
  {
    ...baseRows[1],
    hedger: 'CLSA_option',
    hedgerCount: 2,
    hedgerCurrentNotional: '18,000,000',
    hedgerInitialNotional: '18,000,000',
    hedgerPremiumRate: '4.20%',
    hedgerOpenPrice: '127.88',
    closeDate: '2026-04-15',
    customerClosePrice: '131.26',
    hedgerClosePrice: '131.02',
    customerSettlement: '320,000',
    hedgerSettlement: '302,000',
    closeRevenue: '18,000',
    hedgerPremium: '756,000',
  },
  {
    ...baseRows[1],
    hedger: 'CLSA_option',
    hedgerCount: 2,
    hedgerCurrentNotional: '12,000,000',
    hedgerInitialNotional: '18,000,000',
    hedgerPremiumRate: '4.20%',
    hedgerOpenPrice: '127.88',
    closeDate: '2026-05-04',
    customerClosePrice: '133.10',
    hedgerClosePrice: '132.92',
    customerSettlement: '465,000',
    hedgerSettlement: '448,000',
    closeRevenue: '17,000',
    hedgerPremium: '756,000',
  },
  {
    ...baseRows[1],
    hedger: 'CICC_option',
    hedgerCount: 2,
    hedgerCurrentNotional: '12,000,000',
    hedgerInitialNotional: '12,000,000',
    hedgerPremiumRate: '4.28%',
    hedgerOpenPrice: '127.95',
    closeDate: '2026-05-04',
    customerClosePrice: '133.10',
    hedgerClosePrice: '132.98',
    customerSettlement: '465,000',
    hedgerSettlement: '452,000',
    closeRevenue: '13,000',
    hedgerPremium: '513,600',
  },
  {
    ...baseRows[1],
    hedger: 'CICC_option',
    hedgerCount: 2,
    hedgerCurrentNotional: '0',
    hedgerInitialNotional: '12,000,000',
    hedgerPremiumRate: '4.28%',
    hedgerOpenPrice: '127.95',
    closeDate: '2026-05-18',
    customerClosePrice: '134.05',
    hedgerClosePrice: '133.88',
    customerSettlement: '510,000',
    hedgerSettlement: '492,000',
    closeRevenue: '18,000',
    hedgerPremium: '513,600',
  },
]

const detailedLifecycleRows: LifecycleRow[] = [
  ...multiRecordRows,
  ...Array.from({ length: 10 }, (_, index) => baseRows[index % baseRows.length]),
].map((row, index) => ({
  ...row,
  id: index + 1,
  eventNo: String(39457839 + index),
}))

const sourceRows = computed(() =>
  viewMode.value === 'complete' ? detailedLifecycleRows : simpleLifecycleRows,
)

const contractNoOptions = [...new Set(detailedLifecycleRows.map((row) => row.contractNo))]
const counterpartyOptions = [...new Set(detailedLifecycleRows.map((row) => row.counterparty))]

const transactionCashFlows: TransactionCashFlow[] = [
  {
    date: '2026-08-03',
    type: '开仓',
    customerNotional: '1,000,000',
    hedgerNotional: 'CLSA_option：500,000',
    customerPrice: '50.30',
    hedgerPrice: '50.30',
    customerCashFlow: '+9,860 CNY',
    middleCashFlow: '+2,000 CNY',
    hedgerCashFlow: 'CICC_option：-9,860 CNY',
  },
  {
    date: '2026-09-03',
    type: '平仓',
    customerNotional: '1,000,000',
    hedgerNotional: 'CLSA_option：-500,000\nCICC_option：-500,000',
    customerPrice: '50.30',
    hedgerPrice: 'CLSA_option：50.20\nCICC_option：50.30',
    customerCashFlow: '-105,000 CNY',
    middleCashFlow: '0 CNY',
    hedgerCashFlow: 'CICC_option：+105,000 CNY\nCLSA_option：0',
  },
]

const latestMidRatesToCny: Record<string, number> = {
  CNY: 1,
  USD: 6.7886,
  HKD: 0.8713,
}

const actualCashFlows = [
  { date: '2026-08-03', type: '入金', amount: '+9,860 CNY', description: '—' },
  { date: '2026-09-03', type: '出金', amount: '-105,000 CNY', description: '—' },
  {
    date: '2026-09-03',
    type: '换汇现金流',
    amount: '-105,000 CNY',
    description: 'FX Convert @6.7886',
  },
  { date: '2026-09-03', type: '划转现金流', amount: '+105,000 CNY', description: '—' },
  {
    date: '2026-10-03',
    type: '期权费',
    amount: '-105,000 CNY',
    description: 'WI-23IWU32483956784232564',
  },
  { date: '2026-10-06', type: '期权收益', amount: '+105,000 CNY', description: '交易编号' },
]

const splitRows = [
  {
    accountType: '客户账号',
    tradeNo: 'OPT-2172007-2608030001',
    role: '甲方',
    notional: '+1,000,000',
    cashFlow: '+2,000',
  },
  {
    accountType: '内部账号-卖',
    tradeNo: 'OPT-2172007-2608030002',
    role: '乙方',
    notional: '+1,000,000',
    cashFlow: '-2,000',
  },
  {
    accountType: '内部账号-买',
    tradeNo: 'OPT-2172007-2608030003',
    role: '甲方',
    notional: '+1,000,000',
    cashFlow: '+2,000',
  },
  {
    accountType: '对冲账户',
    tradeNo: 'OPT-2172007-2608030004',
    role: '乙方',
    notional: '+1,000,000',
    cashFlow: '-2,000',
  },
]

const activeSplitAccount = computed(
  () => splitRows.find((row) => row.accountType === splitAccountTab.value) || splitRows[0],
)

const activeSplitTradeFields = computed(() => [
  { label: '账户类型', value: activeSplitAccount.value.accountType },
  { label: '交易编号', value: activeSplitAccount.value.tradeNo },
  { label: '交易日期', value: selectedTransactionCashFlow.value?.date || '—' },
  { label: '开平类型', value: selectedTransactionCashFlow.value?.type || '—' },
  { label: '背靠背合约编号', value: selectedLifecycleRow.value?.contractNo || '—' },
  { label: '标的', value: selectedLifecycleRow.value?.underlying || '—' },
  { label: '交易对手', value: selectedLifecycleRow.value?.counterparty || '—' },
  { label: '上手方', value: selectedLifecycleRow.value?.hedger || '—' },
  { label: '我方角色', value: activeSplitAccount.value.role },
])

const activeSplitCashFlowFields = computed(() => [
  { label: '名义本金变化', value: activeSplitAccount.value.notional },
  { label: '现金流（本方方向）', value: activeSplitAccount.value.cashFlow },
  { label: '结算币种', value: selectedLifecycleRow.value?.currency || '—' },
])

const filteredRows = computed(() => {
  const filters = appliedFilters.value
  return sourceRows.value.filter(
    (row) =>
      (!filters.contractNo.length || filters.contractNo.includes(row.contractNo)) &&
      (!filters.counterparty || row.counterparty === filters.counterparty) &&
      (!filters.hedger.length || filters.hedger.includes(row.hedger)) &&
      (!filters.underlying || row.underlying.includes(filters.underlying.trim())) &&
      (!filters.tenor || row.tenor.replace(/M$/i, '') === filters.tenor.trim()) &&
      (!filters.strikeRate || String(row.strikeRate).includes(filters.strikeRate.trim())) &&
      (!filters.status || row.status === filters.status),
  )
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const filteredActualCashFlows = computed(() =>
  cashFlowTypes.value.length
    ? actualCashFlows.filter((row) => cashFlowTypes.value.includes(row.type))
    : actualCashFlows,
)

const actualCashFlowTotalCny = computed(() =>
  filteredActualCashFlows.value.reduce((total, row) => total + cashFlowAmountToCny(row.amount), 0),
)

const optionMergedProperties = new Set([
  'optionInfo',
  'tenor',
  'strikeRate',
  'counterparty',
  'customerCurrentNotional',
  'contractNo',
  'customerInitialNotional',
  'customerPremiumRate',
  'customerOpenPrice',
  'currency',
  'customerPremium',
])

const hedgerMergedProperties = new Set([
  'hedger',
  'hedgerInitialNotional',
  'hedgerPremiumRate',
  'hedgerOpenPrice',
  'hedgerPremium',
])

function sortColumnOptions(options: ColumnOption[], order: string[]) {
  const orderMap = new Map(order.map((value, index) => [value, index]))
  return [...options].sort(
    (left, right) =>
      (orderMap.get(left.value) ?? Number.MAX_SAFE_INTEGER) -
      (orderMap.get(right.value) ?? Number.MAX_SAFE_INTEGER),
  )
}

function detailedTableColumns(groupLabel: string) {
  const group = detailedColumnGroups.find((item) => item.label === groupLabel)
  if (!group) return []
  return sortColumnOptions(group.options, detailedColumnOrder.value).filter((option) =>
    detailedVisibleColumns.value.includes(option.value),
  )
}

function openColumnSettings() {
  columnDraft.value = [...activeVisibleColumns.value]
  columnOrderDraft.value = [...activeColumnOrder.value]
}

function resetColumnSettings() {
  columnDraft.value = activeColumnOptions.value.map((option) => option.value)
  columnOrderDraft.value = activeColumnOptions.value.map((option) => option.value)
}

function cancelColumnSettings() {
  draggedColumn.value = null
  columnSettingsVisible.value = false
}

function saveColumnSettings() {
  activeVisibleColumns.value = [...columnDraft.value]
  activeColumnOrder.value = [...columnOrderDraft.value]
  draggedColumn.value = null
  columnSettingsVisible.value = false
}

function startColumnDrag(groupLabel: string, value: string) {
  draggedColumn.value = { groupLabel, value }
  window.addEventListener('pointerup', endColumnDrag, { once: true })
}

function moveColumnDrag(groupLabel: string, targetValue: string) {
  const dragged = draggedColumn.value
  if (!dragged || dragged.groupLabel !== groupLabel || dragged.value === targetValue) return

  const nextOrder = [...columnOrderDraft.value]
  const sourceIndex = nextOrder.indexOf(dragged.value)
  if (sourceIndex < 0) return

  const [movedValue] = nextOrder.splice(sourceIndex, 1)
  const targetIndex = nextOrder.indexOf(targetValue)
  if (!movedValue || targetIndex < 0) return

  nextOrder.splice(targetIndex, 0, movedValue)
  columnOrderDraft.value = nextOrder
}

function endColumnDrag() {
  draggedColumn.value = null
  window.removeEventListener('pointerup', endColumnDrag)
}

function applyFilters() {
  appliedFilters.value = {
    ...draftFilters,
    contractNo: [...draftFilters.contractNo],
    hedger: [...draftFilters.hedger],
  }
  currentPage.value = 1
}

function resetFilters() {
  Object.assign(draftFilters, emptyFilters())
  appliedFilters.value = emptyFilters()
  currentPage.value = 1
}

function openDetail(row: LifecycleRow) {
  selectedLifecycleRow.value = row
  detailVisible.value = true
}

function openSplitDetail(row: TransactionCashFlow) {
  selectedTransactionCashFlow.value = row
  splitAccountTab.value = splitRows[0].accountType
  splitDetailVisible.value = true
}

function mergedSpan(rowIndex: number, equals: (current: LifecycleRow | undefined) => boolean) {
  if (rowIndex > 0 && equals(pagedRows.value[rowIndex - 1])) return [0, 0]

  let rowSpan = 1
  while (
    rowIndex + rowSpan < pagedRows.value.length &&
    equals(pagedRows.value[rowIndex + rowSpan])
  ) {
    rowSpan += 1
  }
  return [rowSpan, 1]
}

function detailSpanMethod({ row, column, rowIndex }: LifecycleSpanProps) {
  if (column.columnKey === 'operation' || optionMergedProperties.has(column.property || '')) {
    return mergedSpan(rowIndex, (current) => current?.optionInfo === row.optionInfo)
  }

  if (hedgerMergedProperties.has(column.property || '')) {
    return mergedSpan(
      rowIndex,
      (current) => current?.optionInfo === row.optionInfo && current?.hedger === row.hedger,
    )
  }

  return [1, 1]
}

function cashFlowSummary() {
  return [
    '汇总：',
    '',
    '2,000,000',
    '',
    '',
    '',
    '1,000,000 CNY',
    '20,000 CNY',
    '10,001,000 CNY',
    '',
  ]
}

function actualCashFlowSummary() {
  return ['汇总：', '', formatCnyAmount(actualCashFlowTotalCny.value), '']
}

function transactionCashFlowClass(row: TransactionCashFlow) {
  const balance =
    parseCashFlowAmount(row.customerCashFlow) +
    parseCashFlowAmount(row.middleCashFlow) +
    parseCashFlowAmount(row.hedgerCashFlow)

  return Math.abs(balance) > 0.005 ? 'option-lifecycle-cashflow--mismatch' : ''
}

function parseCashFlowAmount(value: string) {
  return value.split('\n').reduce((total, line) => {
    const lineParts = line.split(/[：:]/)
    const amountText = lineParts[lineParts.length - 1]?.trim() || ''
    const match = amountText.match(/[+-]?\d[\d,]*(?:\.\d+)?/)
    return total + (match ? Number(match[0].replace(/,/g, '')) : 0)
  }, 0)
}

function cashFlowAmountToCny(value: string) {
  const match = value.trim().match(/([+-]?\d[\d,]*(?:\.\d+)?)\s*([A-Z]{3})$/)
  if (!match) return 0

  const amount = Number(match[1].replace(/,/g, ''))
  const rate = latestMidRatesToCny[match[2]]
  return typeof rate === 'number' ? amount * rate : 0
}

function formatCnyAmount(value: number) {
  const normalizedValue = Math.abs(value) < 0.005 ? 0 : value
  const sign = normalizedValue > 0 ? '+' : ''
  return `${sign}${normalizedValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} CNY`
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '_')
}

async function downloadCounterpartyDocuments(
  row: LifecycleRow | null,
  documentType: DownloadDocumentType,
) {
  if (!row) {
    ElMessage.warning('请先选择一条生命周期记录')
    return
  }

  const relatedRows = detailedLifecycleRows.filter(
    (current) => current.counterparty === row.counterparty,
  )
  const hedgers = [
    ...new Set((relatedRows.length ? relatedRows : [row]).map((item) => item.hedger)),
  ]
  const zip = new JSZip()

  hedgers.forEach((hedger) => {
    const hedgerRows = relatedRows.filter((item) => item.hedger === hedger)
    const contracts = [
      ...new Set((hedgerRows.length ? hedgerRows : [row]).map((item) => item.contractNo)),
    ]
    const content = [
      documentType,
      `交易对手：${row.counterparty}`,
      `上手方：${hedger}`,
      `背靠背合约编号：${contracts.join('、')}`,
    ].join('\n')

    zip.file(`${safeFileName(hedger)}-${documentType}.txt`, content)
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeFileName(row.counterparty)}-${documentType}.zip`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  ElMessage.success(`已打包 ${hedgers.length} 个上手方的${documentType}`)
}

function exportRows() {
  ElMessage.success('导出任务已创建')
}
</script>

<style scoped>
.option-lifecycle-page {
  display: flex;
  min-width: 0;
  min-height: calc(100dvh - 134px);
  overflow: hidden;
}

.option-lifecycle-card {
  display: flex;
  min-width: 0;
  min-height: calc(100dvh - 134px);
  flex: 1;
  flex-direction: column;
  padding: 0 24px 20px;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
}

.option-lifecycle-tabs {
  flex: 0 0 auto;
}

.option-lifecycle-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.option-lifecycle-tabs :deep(.el-tabs__content) {
  display: none;
}

.option-lifecycle-tabs :deep(.el-tabs__item) {
  height: 48px;
  padding: 0 20px;
  color: #4e5969;
  font-size: 14px;
  line-height: 48px;
}

.option-lifecycle-tabs :deep(.el-tabs__item.is-active) {
  color: #165dff;
  font-weight: 600;
}

.option-lifecycle-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
}

.option-lifecycle-filter {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  column-gap: 18px;
  align-items: end;
  padding: 20px 0 16px;
}

.option-lifecycle-filter label {
  display: grid;
  max-width: calc(20% - 14.4px);
  min-width: 180px;
  flex: 1 1 180px;
  gap: 7px;
  color: #344054;
  font-size: 13px;
  font-weight: 600;
}

.option-lifecycle-filter__break {
  width: 100%;
  height: 16px;
  flex: 0 0 100%;
}

.option-lifecycle-filter :deep(.el-input),
.option-lifecycle-filter :deep(.el-select) {
  width: 100%;
}

.option-lifecycle-filter__actions,
.option-lifecycle-view-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
}

.option-lifecycle-view-actions {
  margin-left: auto;
}

.option-lifecycle-export-button {
  width: 32px;
  min-width: 32px;
  height: 32px;
  flex: 0 0 32px;
  padding: 0;
}

.option-lifecycle-operation-header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.option-lifecycle-column-trigger {
  width: 28px;
  min-width: 28px;
  height: 28px;
  margin-left: auto;
  padding: 0;
}

:global(.option-lifecycle-column-popper.el-popover) {
  overflow: hidden;
  padding: 0;
}

.option-lifecycle-column-settings__header {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5e6eb;
}

.option-lifecycle-column-settings__header > strong {
  color: #1d2129;
  font-size: 16px;
  font-weight: 600;
}

.option-lifecycle-column-settings :deep(.el-checkbox-group) {
  display: block;
  max-height: min(360px, 30vh);
  padding: 8px 0;
  overflow-y: auto;
}

.option-lifecycle-column-group {
  margin: 0;
  padding: 0;
}

.option-lifecycle-column-group + .option-lifecycle-column-group {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #f0f1f3;
}

.option-lifecycle-column-group h4 {
  margin: 0;
  padding: 4px 14px 2px 42px;
  color: #86909c;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
}

.option-lifecycle-column-list {
  display: flex;
  flex-direction: column;
}

.option-lifecycle-column-item {
  display: flex;
  height: 28px;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  user-select: none;
}

.option-lifecycle-column-item:hover {
  background: #f7f8fa;
}

.option-lifecycle-column-item.is-dragging {
  background: #f2f3f5;
  opacity: 0.55;
}

.option-lifecycle-column-grip {
  display: inline-flex;
  width: 18px;
  flex: 0 0 18px;
  align-items: center;
  justify-content: center;
  color: #86909c;
  cursor: grab;
}

.option-lifecycle-column-grip:active {
  cursor: grabbing;
}

.option-lifecycle-column-grip .el-icon {
  width: 7px;
  height: 14px;
  font-size: 14px;
  transform: rotate(90deg);
}

.option-lifecycle-column-settings :deep(.el-checkbox) {
  flex: 1;
  min-width: 0;
  margin-right: 0;
}

.option-lifecycle-column-settings :deep(.el-checkbox__label) {
  overflow: hidden;
  font-size: 12px;
  line-height: 28px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-lifecycle-column-settings__footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e6eb;
}

.option-lifecycle-column-settings__footer :deep(.el-button) {
  min-width: 64px;
  font-size: 12px;
}

.option-lifecycle-table-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.option-lifecycle-table {
  width: 100%;
  min-width: 0;
  flex: 1;
}

.option-lifecycle-option-info {
  display: -webkit-box;
  overflow: hidden;
  line-height: 18px;
  white-space: normal;
  word-break: break-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.option-lifecycle-strike-header {
  display: inline-flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-end;
  line-height: 16px;
  white-space: normal;
}

.option-lifecycle-table :deep(th .cell),
:global(.option-lifecycle-drawer .el-table th .cell),
:global(.el-dialog .option-lifecycle-detail-table th .cell) {
  white-space: nowrap;
  word-break: keep-all;
}

.option-lifecycle-table :deep(.el-button.is-link),
:global(.option-lifecycle-drawer .el-button.is-link) {
  margin: 0 8px 0 0;
  padding: 0;
}

.option-lifecycle-table :deep(.option-lifecycle-operation-column .cell),
:global(.option-lifecycle-drawer .option-lifecycle-operation-column .cell) {
  overflow: visible;
  padding-right: 8px;
  padding-left: 8px;
  text-overflow: clip;
  white-space: nowrap;
  word-break: keep-all;
}

.option-lifecycle-table :deep(.option-lifecycle-operation-column .el-button.is-link),
:global(.option-lifecycle-drawer .option-lifecycle-operation-column .el-button.is-link) {
  margin-right: 6px;
}

.option-lifecycle-table :deep(.option-lifecycle-operation-column .el-button.is-link:last-child),
:global(.option-lifecycle-drawer .option-lifecycle-operation-column .el-button.is-link:last-child) {
  margin-right: 0;
}

.option-lifecycle-pagination {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding-top: 16px;
}

:global(.option-lifecycle-drawer .el-drawer__header) {
  box-sizing: border-box;
  min-height: 52px;
  margin: 0;
  padding: 0 20px;
  color: #1d2129;
  border-bottom: 1px solid #e5e6eb;
  font-size: 16px;
  font-weight: 600;
}

:global(.option-lifecycle-drawer .el-drawer__body) {
  padding: 20px;
}

:global(.option-lifecycle-split-drawer .el-drawer__header) {
  box-sizing: border-box;
  height: 52px;
  min-height: 52px;
  margin: 0;
  padding: 0 24px;
  border-bottom: 1px solid #e5eaf2;
}

:global(.option-lifecycle-split-drawer .el-drawer__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

:global(.option-lifecycle-split-drawer .el-drawer__footer) {
  padding: 14px 24px;
  border-top: 1px solid #e5eaf2;
}

.option-lifecycle-split-drawer__title {
  margin: 0;
  color: #1d2129;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}

.option-lifecycle-split-drawer__workspace {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.option-lifecycle-split-drawer__overview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding: 14px 24px;
  color: #4e5969;
  font-size: 13px;
  background: #f7f9fc;
  border-bottom: 1px solid #e5eaf2;
}

.option-lifecycle-split-drawer__accounts {
  flex: 0 0 auto;
  margin-top: 12px;
  padding: 0 24px;
}

.option-lifecycle-split-drawer__accounts :deep(.el-tabs__header) {
  margin: 0;
}

.option-lifecycle-split-drawer__accounts :deep(.el-tabs__content) {
  display: none;
}

.option-lifecycle-split-drawer__accounts :deep(.el-tabs__item) {
  height: 44px;
  padding: 0 18px;
  line-height: 44px;
}

.option-lifecycle-split-drawer__content {
  min-height: 0;
  padding: 20px 24px 28px;
  overflow-y: auto;
  border-top: 1px solid #e5eaf2;
}

.option-lifecycle-readonly-section + .option-lifecycle-readonly-section {
  margin-top: 28px;
}

.option-lifecycle-readonly-section h3 {
  margin: 0 0 14px;
  color: #1d2129;
  font-size: 15px;
  font-weight: 600;
}

.option-lifecycle-readonly-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 16px;
}

.option-lifecycle-readonly-grid label {
  display: grid;
  min-width: 0;
  gap: 7px;
  color: #344054;
  font-size: 13px;
  font-weight: 500;
}

.option-lifecycle-readonly-grid label > div {
  min-height: 32px;
  padding: 7px 11px;
  overflow: hidden;
  color: #1d2129;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}

.option-lifecycle-split-drawer__footer {
  display: flex;
  justify-content: center;
}

.option-lifecycle-detail-section + .option-lifecycle-detail-section {
  margin-top: 20px;
}

.option-lifecycle-detail-section h2 {
  margin: 0 0 12px;
  padding-left: 10px;
  color: #344054;
  border-left: 3px solid #165dff;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.option-lifecycle-detail-section__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.option-lifecycle-detail-section__heading h2 {
  margin-bottom: 0;
}

.option-lifecycle-descriptions :deep(.el-descriptions__label) {
  width: 166px;
  color: #666;
  background: #f7f8fa;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.option-lifecycle-descriptions :deep(.el-descriptions__content) {
  color: #1d2129;
  font-size: 13px;
}

.option-lifecycle-detail-table {
  --el-table-border-color: #e5e6eb;
  --el-table-header-bg-color: #f7f8fa;
  --el-table-header-text-color: #666;
  --el-table-row-hover-bg-color: #fafafa;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}

.option-lifecycle-detail-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.option-lifecycle-detail-table :deep(th.el-table__cell) {
  color: #666;
  background: #f7f8fa;
  font-weight: 600;
}

.option-lifecycle-detail-table :deep(.el-table__body tr:last-child td.el-table__cell) {
  border-bottom: 0;
}

.option-lifecycle-multiline {
  white-space: pre-line;
}

.option-lifecycle-cashflow--mismatch {
  color: #f53f3f;
  font-weight: 600;
}

.option-lifecycle-actual-cashflow-table--negative
  :deep(.el-table__footer-wrapper td:nth-child(3) .cell) {
  color: #f53f3f;
  font-weight: 600;
}

@media (max-width: 1120px) {
  .option-lifecycle-filter label {
    max-width: none;
  }

  .option-lifecycle-readonly-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
