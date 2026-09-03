<template>
  <div class="pricing-report-page">
    <section class="pricing-filter-panel" aria-label="定价报表查询条件">
      <div class="pricing-page-heading">
        <div>
          <h1>定价报表</h1>
          <p>维护报价方针对不同标的、结构和期限的定价参数</p>
        </div>
      </div>

      <div class="pricing-filter-grid">
        <label class="pricing-filter-item">
          <span>标的名称</span>
          <el-select v-model="draftFilters.underlyingName" clearable placeholder="请选择">
            <el-option
              v-for="option in underlyingOptions"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
        </label>
        <label class="pricing-filter-item">
          <span>报价方</span>
          <el-input
            v-model="draftFilters.provider"
            clearable
            placeholder="请输入"
            :prefix-icon="Search"
            @keyup.enter="applyFilters"
          />
        </label>
        <div class="pricing-filter-actions">
          <el-button type="primary" :icon="Search" @click="applyFilters">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <section class="pricing-content">
      <div class="pricing-toolbar">
        <div class="pricing-toolbar-actions">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增</el-button>
          <el-button
            :icon="EditPen"
            :disabled="selectedReports.length === 0"
            @click="openBatchEditDialog"
          >
            批量编辑<span v-if="selectedReports.length">（{{ selectedReports.length }}）</span>
          </el-button>
        </div>
        <div class="pricing-toolbar-actions pricing-toolbar-actions--right">
          <el-button :icon="Download" @click="downloadTemplate">下载模板</el-button>
          <el-upload
            accept=".csv,text/csv"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImport"
          >
            <el-button type="primary" :icon="Upload">导入</el-button>
          </el-upload>
        </div>
      </div>

      <el-table
        :data="pagedReports"
        :border="false"
        row-key="id"
        table-layout="auto"
        empty-text="暂无符合条件的定价报表"
        class="pricing-report-table"
        @selection-change="handleReportSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="underlyingCode" label="标的代码" min-width="118" />
        <el-table-column prop="underlyingName" label="标的名称" min-width="118" />
        <el-table-column prop="structure" label="结构" min-width="96" />
        <el-table-column prop="strikePrice" label="执行价（%）" min-width="116" align="right" />
        <el-table-column prop="feedbackVolume" label="反馈量（万）" min-width="124" align="right" />
        <el-table-column prop="provider" label="报价方" min-width="110" />
        <el-table-column label="期限报价" min-width="192">
          <template #default="{ row }">
            <div class="pricing-curve-cell">
              <span v-for="curve in row.curves" :key="curve.id">
                <em>{{ curve.tenor }}</em>
                <strong>{{ curve.quote }}%</strong>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="knockoutRule" label="敲出规则" min-width="118" />
        <el-table-column prop="earliestExercise" label="最快行权日" min-width="126" />
        <el-table-column prop="dividendRule" label="分红规则" min-width="132" />
        <el-table-column prop="dataSource" label="数据来源" min-width="126" />
        <el-table-column prop="createdAt" label="创建时间" min-width="168" />
        <el-table-column label="操作" width="112" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="removeReport(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pricing-pagination">
        <span>共 {{ filteredReports.length }} 条</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next, jumper"
          :total="filteredReports.length"
          @size-change="currentPage = 1"
        />
      </div>
    </section>

    <el-dialog
      v-model="batchEditorVisible"
      title="批量编辑定价报表"
      width="1100px"
      class="pricing-batch-dialog"
      destroy-on-close
    >
      <div class="batch-edit-summary">
        <el-tag type="primary" effect="light">已选 {{ batchPricingRows.length }} 个标的</el-tag>
        <span>各标的独立编辑，保存后生效。</span>
      </div>
      <el-table :data="batchPricingRows" max-height="420" class="batch-edit-table">
        <el-table-column label="标的" width="150" fixed="left">
          <template #default="{ row }">
            <div class="batch-target-cell">
              <strong>{{ row.underlyingName }}</strong>
              <span>{{ row.underlyingCode }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报价方" min-width="128">
          <template #default="{ row }">
            <el-select v-model="row.provider" filterable allow-create placeholder="请选择">
              <el-option
                v-for="option in providerOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="结构" min-width="116">
          <template #default="{ row }">
            <el-select v-model="row.structure" placeholder="请选择">
              <el-option
                v-for="option in structureOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="执行价（%）" width="126" align="right">
          <template #default="{ row }">
            <el-input-number
              v-model="row.strikePrice"
              :min="0"
              :max="500"
              :precision="2"
              controls-position="right"
            />
          </template>
        </el-table-column>
        <el-table-column label="反馈量（万）" width="126" align="right">
          <template #default="{ row }">
            <el-input-number
              v-model="row.feedbackVolume"
              :min="0"
              :max="500"
              :precision="2"
              controls-position="right"
            />
          </template>
        </el-table-column>
        <el-table-column label="敲出规则" min-width="128">
          <template #default="{ row }">
            <el-select v-model="row.knockoutRule" placeholder="请选择">
              <el-option
                v-for="option in knockoutOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="最快行权日" min-width="128">
          <template #default="{ row }">
            <el-select v-model="row.earliestExercise" placeholder="请选择">
              <el-option
                v-for="option in exerciseOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="分红规则" min-width="128">
          <template #default="{ row }">
            <el-select v-model="row.dividendRule" placeholder="请选择">
              <el-option
                v-for="option in dividendOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="期限 / 报价" min-width="298">
          <template #default="{ row }">
            <div class="batch-curve-editor">
              <div
                v-for="(curve, index) in row.curves"
                :key="curve.id"
                class="batch-curve-editor__row"
              >
                <el-select v-model="curve.tenor" placeholder="请选择期限">
                  <el-option
                    v-for="option in batchTenorOptions"
                    :key="option"
                    :label="option"
                    :value="option"
                  />
                </el-select>
                <div class="batch-curve-editor__quote">
                  <el-input v-model="curve.quote" inputmode="decimal" placeholder="请输入报价" />
                  <span class="batch-curve-editor__unit">%</span>
                </div>
                <div class="batch-curve-editor__actions">
                  <el-button
                    class="batch-curve-editor__remove"
                    :icon="Minus"
                    plain
                    size="small"
                    :disabled="row.curves.length === 1"
                    title="移除该期限报价"
                    aria-label="移除该期限报价"
                    @click="removeBatchCurve(row, index)"
                  />
                  <el-button
                    v-if="index === 0"
                    class="batch-curve-editor__add"
                    :icon="Plus"
                    plain
                    size="small"
                    :disabled="!canAddBatchCurve(row)"
                    :title="batchCurveAddTitle(row)"
                    aria-label="新增期限报价"
                    @click="addBatchCurve(row)"
                  />
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="72" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="danger" @click="removeBatchPricingRow(row.id)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchEditorVisible = false">取消</el-button>
        <el-button type="primary" :disabled="batchPricingRows.length === 0" @click="saveBatchEdit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editorVisible"
      :title="editingId ? '编辑定价报表' : '新增定价报表'"
      width="min(620px, calc(100vw - 48px))"
      class="pricing-editor-dialog"
      destroy-on-close
      @closed="pricingFormRef?.clearValidate()"
    >
      <el-form
        ref="pricingFormRef"
        :model="pricingForm"
        :rules="pricingFormRules"
        label-position="top"
      >
        <div class="pricing-form-grid">
          <el-form-item label="标的代码" prop="underlyingCode">
            <el-input v-model="pricingForm.underlyingCode" placeholder="例如：000001.SZ" />
          </el-form-item>
          <el-form-item label="标的名称" prop="underlyingName">
            <el-input v-model="pricingForm.underlyingName" placeholder="请输入标的名称" />
          </el-form-item>
          <el-form-item label="结构" prop="structure">
            <el-select v-model="pricingForm.structure" disabled>
              <el-option label="香草" value="香草" />
            </el-select>
          </el-form-item>
          <el-form-item label="执行价" prop="strikePrice">
            <div class="unit-number-field">
              <el-input-number
                v-model="pricingForm.strikePrice"
                :min="0"
                :max="500"
                :precision="2"
                :controls="false"
              />
              <span class="unit-number-field__unit" aria-hidden="true">%</span>
            </div>
          </el-form-item>
          <el-form-item label="反馈量" prop="feedbackVolume">
            <div class="unit-number-field">
              <el-input-number
                v-model="pricingForm.feedbackVolume"
                :min="0"
                :precision="2"
                :controls="false"
              />
              <span class="unit-number-field__unit" aria-hidden="true">万</span>
            </div>
          </el-form-item>
          <el-form-item label="报价方" prop="provider">
            <el-select
              v-model="pricingForm.provider"
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
          <el-form-item label="敲出规则" prop="knockoutRule">
            <el-select v-model="pricingForm.knockoutRule" placeholder="请选择">
              <el-option
                v-for="option in knockoutOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="最快行权日" prop="earliestExercise">
            <el-select v-model="pricingForm.earliestExercise" placeholder="请选择">
              <el-option
                v-for="option in exerciseOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分红规则" prop="dividendRule">
            <el-select v-model="pricingForm.dividendRule" placeholder="请选择">
              <el-option
                v-for="option in dividendOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="数据来源" prop="dataSource">
            <el-input v-model="pricingForm.dataSource" placeholder="请输入数据来源" />
          </el-form-item>
        </div>

        <section class="curve-editor" aria-label="期限报价配置">
          <div class="curve-editor-heading">
            <div>
              <h3>期限报价</h3>
              <p>按不同期限维护对应报价比例</p>
            </div>
            <el-button type="primary" :icon="Plus" @click="addCurve">添加期限</el-button>
          </div>
          <div class="curve-editor-list">
            <div class="curve-editor-column-headings" aria-hidden="true">
              <span>期限</span>
              <span>报价（%）</span>
              <span>操作</span>
            </div>
            <div
              v-for="(curve, index) in pricingForm.curves"
              :key="curve.id"
              class="curve-editor-row"
            >
              <el-select v-model="curve.tenor" placeholder="请选择期限">
                <el-option
                  v-for="option in tenorOptions"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
              <el-input-number
                v-model="curve.quote"
                :min="0"
                :max="500"
                :precision="2"
                controls-position="right"
              />
              <el-button
                link
                type="danger"
                :disabled="pricingForm.curves.length === 1"
                @click="removeCurve(index)"
              >
                删除
              </el-button>
            </div>
          </div>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReport">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download,
  EditPen,
  Minus,
  Plus,
  RefreshLeft,
  Search,
  Upload,
} from '@element-plus/icons-vue'

interface PricingCurve {
  id: number
  tenor: string
  quote: number
}

interface BatchPricingCurve extends Omit<PricingCurve, 'quote'> {
  quote: string
}

interface PricingReport {
  id: number
  underlyingCode: string
  underlyingName: string
  structure: string
  strikePrice: number
  feedbackVolume: number
  provider: string
  knockoutRule: string
  earliestExercise: string
  dividendRule: string
  dataSource: string
  createdAt: string
  curves: PricingCurve[]
}

type PricingForm = Omit<PricingReport, 'id' | 'createdAt'>

interface BatchPricingRow {
  id: number
  underlyingCode: string
  underlyingName: string
  provider: string
  structure: string
  strikePrice: number
  feedbackVolume: number
  knockoutRule: string
  earliestExercise: string
  dividendRule: string
  curves: BatchPricingCurve[]
}

const structureOptions = ['香草', '自动赎回', '固定收益凭证']
const knockoutOptions = ['主3创2', '五连板', '协商敲出', '无要求']
const exerciseOptions = ['T+1', 'T+2', 'T+5', '无要求']
const dividendOptions = ['分红不调整', '向下调整', '无要求']
const tenorOptions = ['1M', '2M', '3M', '6M', '9M', '1Y']
const batchTenorOptions = tenorOptions
const maxBatchCurveCount = 10

const reports = ref<PricingReport[]>([
  {
    id: 1,
    underlyingCode: '000001.SZ',
    underlyingName: '平安银行',
    structure: '香草',
    strikePrice: 100,
    feedbackVolume: 200,
    provider: '致富',
    knockoutRule: '主3创2',
    earliestExercise: 'T+1',
    dividendRule: '分红不调整',
    dataSource: 'Zhangqh',
    createdAt: '2026-08-20 09:30:00',
    curves: [
      { id: 1, tenor: '2M', quote: 100 },
      { id: 2, tenor: '3M', quote: 110 },
    ],
  },
  {
    id: 2,
    underlyingCode: '600519.SH',
    underlyingName: '贵州茅台',
    structure: '自动赎回',
    strikePrice: 98,
    feedbackVolume: 150,
    provider: 'CLSA',
    knockoutRule: '五连板',
    earliestExercise: 'T+2',
    dividendRule: '向下调整',
    dataSource: '报价清单导入',
    createdAt: '2026-08-19 15:20:00',
    curves: [
      { id: 1, tenor: '3M', quote: 96.5 },
      { id: 2, tenor: '6M', quote: 104 },
    ],
  },
  {
    id: 3,
    underlyingCode: '000858.SZ',
    underlyingName: '五粮液',
    structure: '固定收益凭证',
    strikePrice: 102,
    feedbackVolume: 300,
    provider: 'NOMURA',
    knockoutRule: '协商敲出',
    earliestExercise: 'T+1',
    dividendRule: '分红不调整',
    dataSource: 'Zhangqh',
    createdAt: '2026-08-18 11:10:00',
    curves: [
      { id: 1, tenor: '1M', quote: 92 },
      { id: 2, tenor: '3M', quote: 101.5 },
    ],
  },
])

const draftFilters = reactive({ underlyingName: '', provider: '' })
const activeFilters = reactive({ underlyingName: '', provider: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const editorVisible = ref(false)
const editingId = ref<number | null>(null)
const pricingFormRef = ref<FormInstance>()
const pricingForm = reactive<PricingForm>(emptyPricingForm())
const selectedReports = ref<PricingReport[]>([])
const batchEditorVisible = ref(false)
const batchPricingRows = ref<BatchPricingRow[]>([])

const pricingFormRules: FormRules<PricingForm> = {
  underlyingCode: [{ required: true, message: '请输入标的代码', trigger: 'blur' }],
  underlyingName: [{ required: true, message: '请输入标的名称', trigger: 'blur' }],
  structure: [{ required: true, message: '请选择结构', trigger: 'change' }],
  provider: [{ required: true, message: '请选择报价方', trigger: 'change' }],
  knockoutRule: [{ required: true, message: '请选择敲出规则', trigger: 'change' }],
  earliestExercise: [{ required: true, message: '请选择最快行权日', trigger: 'change' }],
  dividendRule: [{ required: true, message: '请选择分红规则', trigger: 'change' }],
}

const underlyingOptions = computed(() => [
  ...new Set(reports.value.map((report) => report.underlyingName)),
])
const providerOptions = computed(() => [...new Set(reports.value.map((report) => report.provider))])
const filteredReports = computed(() => {
  const providerKeyword = activeFilters.provider.trim().toLowerCase()
  return reports.value.filter((report) => {
    const underlyingMatched =
      !activeFilters.underlyingName || report.underlyingName === activeFilters.underlyingName
    const providerMatched =
      !providerKeyword || report.provider.toLowerCase().includes(providerKeyword)
    return underlyingMatched && providerMatched
  })
})
const pagedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredReports.value.slice(start, start + pageSize.value)
})

function emptyPricingForm(): PricingForm {
  return {
    underlyingCode: '',
    underlyingName: '',
    structure: '香草',
    strikePrice: 100,
    feedbackVolume: 0,
    provider: '',
    knockoutRule: '无要求',
    earliestExercise: '无要求',
    dividendRule: '无要求',
    dataSource: '手工新增',
    curves: [{ id: 1, tenor: '3M', quote: 0 }],
  }
}

function clonePricingForm(report: PricingReport): PricingForm {
  const { id: _id, createdAt: _createdAt, ...form } = report
  return { ...form, curves: form.curves.map((curve) => ({ ...curve })) }
}

function assignPricingForm(value: PricingForm) {
  Object.assign(pricingForm, value)
  pricingForm.curves = value.curves.map((curve) => ({ ...curve }))
}

function applyFilters() {
  Object.assign(activeFilters, draftFilters)
  currentPage.value = 1
}

function resetFilters() {
  Object.assign(draftFilters, { underlyingName: '', provider: '' })
  Object.assign(activeFilters, draftFilters)
  currentPage.value = 1
}

function openCreateDialog() {
  editingId.value = null
  assignPricingForm(emptyPricingForm())
  editorVisible.value = true
}

function openEditDialog(report: PricingReport) {
  editingId.value = report.id
  assignPricingForm(clonePricingForm(report))
  pricingForm.structure = '香草'
  editorVisible.value = true
}

function handleReportSelectionChange(selection: PricingReport[]) {
  selectedReports.value = selection
}

function openBatchEditDialog() {
  if (selectedReports.value.length === 0) {
    ElMessage.warning('请先勾选需要配置的标的')
    return
  }
  batchPricingRows.value = selectedReports.value.map((report) => ({
    id: report.id,
    underlyingCode: report.underlyingCode,
    underlyingName: report.underlyingName,
    provider: report.provider,
    structure: report.structure,
    strikePrice: report.strikePrice,
    feedbackVolume: report.feedbackVolume,
    knockoutRule: report.knockoutRule,
    earliestExercise: report.earliestExercise,
    dividendRule: report.dividendRule,
    curves: report.curves.length
      ? report.curves.map((curve) => ({ ...curve, quote: String(curve.quote) }))
      : [{ id: 1, tenor: batchTenorOptions[0], quote: '0' }],
  }))
  batchEditorVisible.value = true
}

function saveBatchEdit() {
  if (batchPricingRows.value.length === 0) {
    ElMessage.warning('请至少保留一个标的进行批量编辑')
    return
  }
  const invalidRow = batchPricingRows.value.find(
    (row) =>
      !row.provider ||
      !row.structure ||
      !row.knockoutRule ||
      !row.earliestExercise ||
      !row.dividendRule ||
      row.curves.length === 0 ||
      row.curves.length > maxBatchCurveCount ||
      row.curves.some(
        (curve) =>
          !batchTenorOptions.includes(curve.tenor) ||
          !Number.isFinite(Number(curve.quote)) ||
          Number(curve.quote) < 0,
      ) ||
      new Set(row.curves.map((curve) => curve.tenor)).size !== row.curves.length,
  )
  if (invalidRow) {
    ElMessage.warning(`请完整填写“${invalidRow.underlyingName}”的可编辑参数`)
    return
  }

  batchPricingRows.value.forEach((row) => {
    const report = reports.value.find((item) => item.id === row.id)
    if (!report) return
    Object.assign(report, {
      provider: row.provider,
      structure: row.structure,
      strikePrice: row.strikePrice,
      feedbackVolume: row.feedbackVolume,
      knockoutRule: row.knockoutRule,
      earliestExercise: row.earliestExercise,
      dividendRule: row.dividendRule,
      curves: row.curves.map((curve, index) => ({
        ...curve,
        id: index + 1,
        quote: Number(curve.quote),
      })),
    })
  })
  batchEditorVisible.value = false
  ElMessage.success(`已更新 ${batchPricingRows.value.length} 条定价报表`)
}

function removeBatchPricingRow(id: number) {
  batchPricingRows.value = batchPricingRows.value.filter((row) => row.id !== id)
}

function nextAvailableBatchTenor(row: BatchPricingRow) {
  return batchTenorOptions.find((option) => !row.curves.some((curve) => curve.tenor === option))
}

function canAddBatchCurve(row: BatchPricingRow) {
  return row.curves.length < maxBatchCurveCount && Boolean(nextAvailableBatchTenor(row))
}

function batchCurveAddTitle(row: BatchPricingRow) {
  if (row.curves.length >= maxBatchCurveCount) {
    return `最多 ${maxBatchCurveCount} 组期限报价`
  }
  return nextAvailableBatchTenor(row) ? '新增期限报价' : '可选期限均已配置'
}

function addBatchCurve(row: BatchPricingRow) {
  const tenor = nextAvailableBatchTenor(row)
  if (!canAddBatchCurve(row) || !tenor) {
    ElMessage.warning(batchCurveAddTitle(row))
    return
  }
  row.curves.push({
    id: Math.max(0, ...row.curves.map((curve) => curve.id)) + 1,
    tenor,
    quote: '0',
  })
}

function removeBatchCurve(row: BatchPricingRow, index: number) {
  if (row.curves.length === 1) {
    ElMessage.warning('每个标的至少保留一组期限报价')
    return
  }
  row.curves.splice(index, 1)
}

function addCurve() {
  pricingForm.curves.push({
    id: Math.max(0, ...pricingForm.curves.map((curve) => curve.id)) + 1,
    tenor: '3M',
    quote: 0,
  })
}

function removeCurve(index: number) {
  if (pricingForm.curves.length === 1) return
  pricingForm.curves.splice(index, 1)
}

async function saveReport() {
  const valid = await pricingFormRef.value?.validate().catch(() => false)
  if (!valid) return
  if (pricingForm.curves.some((curve) => !curve.tenor || curve.quote < 0)) {
    ElMessage.warning('请完整填写期限报价')
    return
  }

  const timestamp = formatDateTime(new Date())
  const payload = { ...pricingForm, curves: pricingForm.curves.map((curve) => ({ ...curve })) }
  if (editingId.value) {
    const report = reports.value.find((item) => item.id === editingId.value)
    if (report) Object.assign(report, payload)
    ElMessage.success('定价报表已更新')
  } else {
    reports.value.unshift({
      id: Math.max(0, ...reports.value.map((item) => item.id)) + 1,
      ...payload,
      createdAt: timestamp,
    })
    ElMessage.success('定价报表已新增')
  }
  editorVisible.value = false
}

async function removeReport(report: PricingReport) {
  const confirmed = await ElMessageBox.confirm(
    `确认删除“${report.underlyingName} - ${report.provider}”定价报表吗？`,
    '删除定价报表',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' },
  ).then(
    () => true,
    () => false,
  )
  if (!confirmed) return
  reports.value = reports.value.filter((item) => item.id !== report.id)
  if (pagedReports.value.length === 0 && currentPage.value > 1) currentPage.value -= 1
  ElMessage.success('定价报表已删除')
}

function downloadTemplate() {
  const headers = [
    '标的代码',
    '标的名称',
    '结构',
    '执行价（%）',
    '反馈量（万）',
    '报价方',
    '敲出规则',
    '最快行权日',
    '分红规则',
    '数据来源',
    '期限报价',
  ]
  const example = [
    '000001.SZ',
    '平安银行',
    '香草',
    '100',
    '200',
    '致富',
    '主3创2',
    'T+1',
    '分红不调整',
    '手工新增',
    '2M:100|3M:110',
  ]
  const blob = new Blob([`\ufeff${headers.join(',')}\n${example.join(',')}\n`], {
    type: 'text/csv;charset=utf-8;',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '定价报表导入模板.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

async function handleImport(file: UploadFile) {
  if (!file.raw) return
  if (!file.raw.name.toLowerCase().endsWith('.csv')) {
    ElMessage.warning('请导入 CSV 模板文件')
    return
  }
  const lines = (await file.raw.text())
    .replace(/^\ufeff/, '')
    .trim()
    .split(/\r?\n/)
  if (lines.length < 2) {
    ElMessage.warning('导入文件没有可用数据')
    return
  }

  const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim()))
  const imported = rows
    .filter((cells) => cells[0] && cells[1])
    .map((cells, index): PricingReport => ({
      id: Math.max(0, ...reports.value.map((report) => report.id)) + index + 1,
      underlyingCode: cells[0],
      underlyingName: cells[1],
      structure: cells[2] || '香草',
      strikePrice: Number(cells[3]) || 0,
      feedbackVolume: Number(cells[4]) || 0,
      provider: cells[5] || '未填写',
      knockoutRule: cells[6] || '无要求',
      earliestExercise: cells[7] || '无要求',
      dividendRule: cells[8] || '无要求',
      dataSource: cells[9] || '模板导入',
      createdAt: formatDateTime(new Date()),
      curves: parseCurves(cells[10]),
    }))

  if (imported.length === 0) {
    ElMessage.warning('未识别到有效的定价报表数据')
    return
  }
  reports.value.unshift(...imported)
  applyFilters()
  ElMessage.success(`已导入 ${imported.length} 条定价报表`)
}

function parseCurves(value: string | undefined): PricingCurve[] {
  const curves = (value || '')
    .split('|')
    .map((item, index) => {
      const [tenor, quote] = item.split(':')
      return { id: index + 1, tenor: tenor?.trim(), quote: Number(quote) }
    })
    .filter((curve) => curve.tenor && Number.isFinite(curve.quote))
  return curves.length ? curves : [{ id: 1, tenor: '3M', quote: 0 }]
}

function formatDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}
</script>

<style scoped>
.pricing-report-page {
  min-height: calc(100vh - 96px);
  padding: 20px 24px 32px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
}

.pricing-filter-panel {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.pricing-page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: 20px;
}

.pricing-page-heading h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
}

.pricing-page-heading p {
  margin: 4px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  line-height: 20px;
}

.pricing-filter-grid {
  display: grid;
  grid-template-columns: 320px 320px auto;
  align-items: end;
  gap: 20px 28px;
}

.pricing-filter-item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.pricing-filter-item > span {
  text-align: right;
}

.pricing-filter-actions,
.pricing-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pricing-filter-actions :deep(.el-button + .el-button),
.pricing-toolbar-actions :deep(.el-button + .el-button),
.pricing-report-table :deep(.el-button + .el-button) {
  margin-left: 0;
}

.pricing-content {
  padding-top: 20px;
}

.pricing-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: 12px;
}

.pricing-toolbar-actions--right {
  margin-left: auto;
}

.pricing-report-table {
  width: 100%;
  --el-table-header-bg-color: var(--color-border-subtle);
  --el-table-header-text-color: var(--color-text-primary);
  --el-table-row-hover-bg-color: var(--color-bg-elevated);
  --el-table-border-color: var(--color-border-subtle);
}

.pricing-report-table :deep(.el-table__header th) {
  height: 44px;
  font-weight: var(--font-weight-semibold);
}

.pricing-report-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.pricing-report-table :deep(.cell) {
  line-height: 22px;
  white-space: nowrap;
}

.pricing-curve-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.pricing-curve-cell > span {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}

.pricing-curve-cell > span + span::before {
  width: 1px;
  height: 12px;
  margin-right: 6px;
  background: var(--color-border-subtle);
  content: '';
}

.pricing-curve-cell em {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-style: normal;
}

.pricing-curve-cell strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.pricing-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  min-height: 56px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.batch-edit-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

:deep(.pricing-batch-dialog) {
  display: flex;
  flex-direction: column;
  width: min(1100px, calc(100vw - 48px));
  height: 720px;
  max-height: calc(100vh - 48px);
}

:deep(.pricing-batch-dialog .el-dialog__body) {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

:deep(.pricing-batch-dialog .el-dialog__title) {
  font-size: 16px;
}

:deep(.pricing-batch-dialog .el-dialog__footer) {
  flex: 0 0 auto;
}

.batch-edit-table {
  margin-top: 16px;
  --el-table-header-bg-color: var(--color-bg-elevated);
  --el-table-header-text-color: var(--color-text-primary);
  --el-table-row-hover-bg-color: transparent;
  --el-table-border-color: var(--color-border-subtle);
}

.batch-edit-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.batch-edit-table :deep(.el-select),
.batch-edit-table :deep(.el-input),
.batch-edit-table :deep(.el-input-number) {
  width: 100%;
}

.batch-target-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 20px;
}

.batch-target-cell strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.batch-target-cell span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.batch-curve-editor {
  display: grid;
  gap: 6px;
}

.batch-curve-editor__row {
  display: grid;
  grid-template-columns: 94px minmax(96px, 1fr) 72px;
  align-items: center;
  gap: 6px;
}

.batch-curve-editor__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-curve-editor__row :deep(.el-select),
.batch-curve-editor__row :deep(.el-input) {
  width: 100%;
}

.batch-curve-editor__quote {
  position: relative;
  min-width: 0;
}

.batch-curve-editor__quote :deep(.el-input__inner) {
  padding-right: 24px;
  text-align: left;
}

.batch-curve-editor__unit {
  position: absolute;
  top: 50%;
  right: 8px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  line-height: 1;
  pointer-events: none;
  transform: translateY(-50%);
}

.batch-curve-editor__add,
.batch-curve-editor__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 32px;
  min-width: 32px;
  height: 32px;
  padding: 0;
  line-height: 1;
  border-radius: 4px !important;
}

.batch-curve-editor__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.batch-curve-editor__row :deep(.el-select__wrapper),
.batch-curve-editor__row :deep(.el-input__wrapper) {
  min-height: 32px;
}

.pricing-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.pricing-form-grid :deep(.el-form-item) {
  margin-bottom: 16px;
}

.pricing-form-grid :deep(.el-select),
.pricing-form-grid :deep(.el-input-number) {
  width: 100%;
}

.unit-number-field {
  position: relative;
  width: 100%;
}

.unit-number-field :deep(.el-input__inner) {
  padding-right: 32px;
  text-align: left;
}

.unit-number-field__unit {
  position: absolute;
  top: 50%;
  right: 12px;
  z-index: 1;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  line-height: 1;
  pointer-events: none;
  transform: translateY(-50%);
}

.curve-editor {
  padding-top: 16px;
  border-top: 1px solid var(--color-border-subtle);
}

.curve-editor-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: 12px;
}

.curve-editor-heading h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.curve-editor-heading p {
  margin: 4px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.curve-editor-list {
  display: grid;
  gap: 8px;
}

.curve-editor-column-headings,
.curve-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px;
  align-items: center;
  gap: 8px;
}

.curve-editor-column-headings {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 20px;
}

.curve-editor-column-headings > :last-child {
  text-align: center;
}

.curve-editor-row {
  padding: 0;
}

.curve-editor-row :deep(.el-select),
.curve-editor-row :deep(.el-input-number) {
  width: 100%;
}

.curve-editor-row :deep(.el-input-number .el-input__inner) {
  text-align: left;
}

@media (max-width: 900px) {
  .pricing-filter-grid {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }

  .pricing-filter-actions {
    grid-column: 1 / -1;
    padding-left: 84px;
  }
}

@media (max-width: 640px) {
  .pricing-report-page {
    padding: 16px;
  }

  .pricing-filter-grid,
  .pricing-form-grid {
    grid-template-columns: 1fr;
  }

  .pricing-filter-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .pricing-filter-item > span {
    text-align: left;
  }

  .pricing-filter-actions {
    grid-column: auto;
    padding-left: 0;
  }

  .pricing-toolbar {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .pricing-toolbar-actions--right {
    width: 100%;
    margin-left: 0;
  }

  .curve-editor-row {
    grid-template-columns: 1fr 40px;
  }

  .curve-editor-column-headings {
    grid-template-columns: 1fr 40px;
  }

  .curve-editor-column-headings > :nth-child(2) {
    grid-column: 1;
    grid-row: 2;
  }

  .curve-editor-column-headings > :last-child {
    grid-column: 2;
    grid-row: 1 / 3;
  }

  .curve-editor-row > :nth-child(2) {
    grid-column: 1;
  }

  .curve-editor-row > :nth-child(3) {
    grid-column: 2;
    grid-row: 1 / 3;
  }
}
</style>
