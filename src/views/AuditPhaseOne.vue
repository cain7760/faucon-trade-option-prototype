<template>
  <div class="phase-one-page">
    <PageHeader :title="pageConfig.title" :description="pageConfig.description">
      <template #actions>
        <el-space>
          <el-tag type="success">一期只读</el-tag>
          <el-tag type="primary">仅 DS 标准结果</el-tag>
        </el-space>
      </template>
    </PageHeader>

    <!-- 一期异常结果 -->
    <template v-if="section === 'results'">
      <section class="pipeline-bar glass-card">
        <div class="pipeline-title">
          <span>一期数据链路</span><strong>DS 执行 SQL → 标准落表 → 平台只读展示</strong>
        </div>
        <div class="pipeline-note">
          平台不执行规则、不修改结果，只按 run_id 展示 DS 已落库的汇总与全部异常明细。
        </div>
      </section>

      <div class="stat-grid">
        <div class="stat-card glass-card">
          <span>异常结果批次</span><strong>{{ abnormalDsResults.length }}</strong
          ><small>通过批次仅进入巡检历史</small>
        </div>
        <div class="stat-card glass-card">
          <span>数据异常批次</span><strong class="danger">{{ failedAuditCount }}</strong
          ><small>SQL 执行成功，稽核未通过</small>
        </div>
        <div class="stat-card glass-card">
          <span>异常明细</span><strong class="danger">{{ totalAnomalies }}</strong
          ><small>可按 run_id 全量下钻</small>
        </div>
        <div class="stat-card glass-card">
          <span>执行失败</span><strong class="warning">{{ executionFailedCount }}</strong
          ><small>不等于 0 条数据异常</small>
        </div>
      </div>

      <section class="glass-card table-shell">
        <div class="filter-row">
          <el-space wrap>
            <el-select
              v-model="resultFilters.layer"
              placeholder="全部层级"
              clearable
              style="width: 156px"
            >
              <el-option value="L0">L0 基础质量</el-option
              ><el-option value="L1">L1 业务自洽</el-option
              ><el-option value="L2">L2 报表风控</el-option>
            </el-select>
            <el-select
              v-model="resultFilters.status"
              placeholder="全部稽核结果"
              clearable
              style="width: 150px"
            >
              <el-option value="异常">异常</el-option><el-option value="阻断">阻断</el-option
              ><el-option value="未产出">未产出</el-option>
            </el-select>
            <el-input
              v-model="resultFilters.keyword"
              placeholder="run_id、检查名称或对象 / 表"
              clearable
              style="width: 300px"
            />
          </el-space>
          <span>共 {{ filteredResults.length }} 次 DS 巡检</span>
        </div>
        <div class="table-heading">
          <div>
            <h3>标准稽核异常结果</h3>
            <p>执行状态回答“SQL 是否跑完”，稽核结果回答“数据是否通过”；PASS 仅在巡检历史查看。</p>
          </div>
          <span class="readonly-label">READ ONLY</span>
        </div>
        <el-table :data="filteredResults" :show-overflow-tooltip="false" :border="false" stripe>
          <el-table-column label="run_id" :width="142" fixed="left"
            ><template #default="{ row: record }"
              ><span class="run-id">{{ record.runId }}</span></template
            ></el-table-column
          >
          <el-table-column label="层级" :width="118"
            ><template #default="{ row: record }"
              ><el-tag size="small">{{ layerLabel(record.layer) }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="检查名称" :width="210"
            ><template #default="{ row: record }"
              ><div class="cell-main">{{ record.checkName }}</div>
              <div class="cell-sub">{{ record.objectName }}</div></template
            ></el-table-column
          >
          <el-table-column label="执行状态" :width="96"
            ><template #default="{ row: record }"
              ><el-tag :type="tagType(execStatusColor(record.execStatus))" size="small">{{
                record.execStatus
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="稽核结果" :width="100"
            ><template #default="{ row: record }"
              ><el-tag :type="tagType(auditStatusColor(record.auditResult))" size="small">{{
                record.auditResult
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="业务日期" :width="112"
            ><template #default="{ row: record }"
              ><span class="date-cell">{{ record.bizDate }}</span></template
            ></el-table-column
          >
          <el-table-column label="总数" align="right" :width="80"
            ><template #default="{ row: record }">{{
              record.execStatus === '失败' ? '—' : record.totalCount
            }}</template></el-table-column
          >
          <el-table-column label="执行时间" prop="executedAt" :width="160" />
          <el-table-column label="异常数" align="right" :width="82" fixed="right"
            ><template #default="{ row: record }"
              ><span v-if="record.execStatus === '失败'">—</span
              ><el-button
                v-else-if="record.anomalyCount > 0"
                link
                size="small"
                class="anomaly-link"
                @click.stop="openResult(record)"
                >{{ record.anomalyCount }}</el-button
              ><span v-else>0</span></template
            ></el-table-column
          >
          <el-table-column label="操作" :width="84" fixed="right"
            ><template #default="{ row: record }"
              ><el-button
                link
                size="small"
                :disabled="record.anomalyCount === 0"
                @click="openResult(record)"
                >查看明细</el-button
              ></template
            ></el-table-column
          >
        </el-table>
      </section>
    </template>

    <!-- 一期巡检历史 -->
    <template v-else-if="section === 'history'">
      <el-alert type="info" show-icon class="scope-alert">
        本页只查询 DS 已落库的历史运行记录。平台不提供重跑按钮；如需补跑，由现有 DS
        调度流程执行并生成新的 run_id。
      </el-alert>

      <div class="history-summary glass-card">
        <div>
          <span>运行总数</span><strong>{{ dsRuns.length }}</strong>
        </div>
        <div>
          <span>执行成功</span><strong class="success">{{ successRunCount }}</strong>
        </div>
        <div>
          <span>执行失败</span><strong class="danger">{{ executionFailedCount }}</strong>
        </div>
        <div>
          <span>稽核通过</span><strong class="success">{{ passRunCount }}</strong>
        </div>
        <div>
          <span>稽核异常 / 阻断</span><strong class="danger">{{ failedAuditCount }}</strong>
        </div>
        <div>
          <span>异常明细</span><strong>{{ totalAnomalies }}</strong>
        </div>
      </div>

      <section class="glass-card table-shell history-shell">
        <div class="filter-row">
          <el-space wrap>
            <el-select
              v-model="historyFilters.layer"
              placeholder="全部层级"
              clearable
              style="width: 150px"
              ><el-option value="L0">L0 基础质量</el-option
              ><el-option value="L1">L1 业务自洽</el-option
              ><el-option value="L2">L2 报表风控</el-option></el-select
            >
            <el-select
              v-model="historyFilters.type"
              placeholder="全部稽核类型"
              clearable
              style="width: 142px"
              ><el-option value="通用稽核">通用稽核</el-option
              ><el-option value="SQL 对比">SQL 对比</el-option></el-select
            >
            <el-select
              v-model="historyFilters.execStatus"
              placeholder="全部执行状态"
              clearable
              style="width: 148px"
              ><el-option value="成功">成功</el-option
              ><el-option value="失败">失败</el-option></el-select
            >
            <el-select
              v-model="historyFilters.auditResult"
              placeholder="全部稽核结果"
              clearable
              style="width: 148px"
              ><el-option value="通过">通过</el-option><el-option value="异常">异常</el-option
              ><el-option value="阻断">阻断</el-option
              ><el-option value="未产出">未产出</el-option></el-select
            >
            <el-input
              v-model="historyFilters.keyword"
              placeholder="运行编号或检查名称"
              clearable
              style="width: 250px"
            />
          </el-space>
          <span>{{ filteredRuns.length }} 条历史记录</span>
        </div>
        <div class="table-heading">
          <div>
            <h3>DS 运行历史</h3>
            <p>每次执行保留独立 run_id；同日重跑新增记录，不覆盖历史。</p>
          </div>
          <span class="readonly-label">READ ONLY</span>
        </div>
        <el-table
          :data="filteredRuns"
          :show-overflow-tooltip="false"
          :border="false"
          stripe
          @row-click="openHistoryRun"
        >
          <el-table-column label="run_id" :width="142" fixed="left"
            ><template #default="{ row: record }"
              ><span class="run-id">{{ record.id }}</span></template
            ></el-table-column
          >
          <el-table-column label="层级" :width="118"
            ><template #default="{ row: record }"
              ><el-tag size="small">{{ layerLabel(record.layer) }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="检查名称" prop="name" :width="210" />
          <el-table-column label="执行状态" :width="96"
            ><template #default="{ row: record }"
              ><el-tag :type="tagType(execStatusColor(record.execStatus))" size="small">{{
                record.execStatus
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="稽核结果" :width="100"
            ><template #default="{ row: record }"
              ><el-tag :type="tagType(auditStatusColor(record.auditResult))" size="small">{{
                record.auditResult
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="类型" prop="type" :width="112" />
          <el-table-column label="触发" prop="trigger" :width="92" />
          <el-table-column label="业务日期" :width="112"
            ><template #default="{ row: record }"
              ><span class="date-cell">{{ record.bizDate }}</span></template
            ></el-table-column
          >
          <el-table-column label="耗时" prop="duration" :width="82" />
          <el-table-column label="执行时间" prop="time" :width="160" />
          <el-table-column label="异常数" align="right" :width="82" fixed="right"
            ><template #default="{ row: record }"
              ><span v-if="record.execStatus === '失败'">—</span
              ><el-button
                v-else-if="record.anomalyCount > 0"
                link
                size="small"
                class="anomaly-link"
                @click.stop="goToResult(record.id)"
                >{{ record.anomalyCount }}</el-button
              ><span v-else>0</span></template
            ></el-table-column
          >
          <el-table-column label="操作" :width="84" fixed="right"
            ><template #default="{ row: record }"
              ><el-button
                link
                size="small"
                :disabled="record.anomalyCount === 0"
                @click.stop="goToResult(record.id)"
                >异常明细</el-button
              ></template
            ></el-table-column
          >
        </el-table>
      </section>
    </template>

    <!-- 一期接入说明 -->
    <template v-else>
      <el-alert type="success" show-icon class="scope-alert">
        一期采用“DS 公共 SQL 包装步骤直写结果库”。业务 SQL
        无需迁入平台，平台账号仅拥有三张结果表的只读权限。
      </el-alert>

      <section class="glass-card access-section">
        <div class="section-heading">
          <div>
            <h3>统一结果模型</h3>
            <p>一次运行一个 run_id，汇总与异常明细分离，既轻量又支持全部 N 条异常下钻。</p>
          </div>
          <el-tag type="success">平台只读</el-tag>
        </div>
        <div class="model-flow">
          <article class="model-card">
            <div><span>01</span><el-tag type="primary" size="small">DS 读取</el-tag></div>
            <h4>audit_rule_registry</h4>
            <p>规则登记与展示元数据</p>
            <code>rule_code · rule_name · audit_layer<br />maintainer · display_schema</code>
          </article>
          <span class="flow-arrow">→</span>
          <article class="model-card primary">
            <div><span>02</span><el-tag type="warning" size="small">每次运行 1 行</el-tag></div>
            <h4>audit_run_result</h4>
            <p>执行状态与稽核结论汇总</p>
            <code
              >run_id · exec_status · audit_status<br />total_count · exception_count ·
              is_empty</code
            >
          </article>
          <span class="flow-arrow">→</span>
          <article class="model-card">
            <div><span>03</span><el-tag type="info" size="small">0～N 行</el-tag></div>
            <h4>audit_exception_detail</h4>
            <p>本次全部异常与动态展示值</p>
            <code>run_id · detail_seq · object_key<br />detail_payload · result_code</code>
          </article>
        </div>
      </section>

      <div class="access-bottom-grid">
        <section class="glass-card access-section compact">
          <div class="section-heading">
            <div>
              <h3>DS 接入 4 步</h3>
              <p>业务只维护检查 SQL，公共包装负责标准落表。</p>
            </div>
          </div>
          <div class="ds-steps">
            <div><span>1</span><strong>登记规则</strong><small>分配稳定 rule_code</small></div>
            <div><span>2</span><strong>启动运行</strong><small>生成 run_id，写 RUNNING</small></div>
            <div><span>3</span><strong>写入异常</strong><small>业务 SQL 结果逐行落明细</small></div>
            <div><span>4</span><strong>完成汇总</strong><small>计算总数、异常数和结论</small></div>
          </div>
        </section>

        <section class="glass-card access-section compact status-contract">
          <div class="section-heading">
            <div>
              <h3>结果口径</h3>
              <p>执行失败绝不能被展示成“0 条异常”。</p>
            </div>
          </div>
          <div class="status-row head">
            <span>场景</span><span>执行状态</span><span>稽核结论</span><span>页面表达</span>
          </div>
          <div v-for="item in statusContract" :key="item.scene" class="status-row">
            <strong>{{ item.scene }}</strong
            ><code>{{ item.exec }}</code
            ><code>{{ item.audit }}</code
            ><span>{{ item.display }}</span>
          </div>
        </section>
      </div>
    </template>

    <el-drawer
      v-model="detailVisible"
      :size="900"
      :title="selectedResult?.checkName"
      destroy-on-close
      @close="clearDeepLink"
    >
      <template v-if="selectedResult">
        <div class="drawer-tags">
          <el-tag type="success">一期只读</el-tag
          ><el-tag>{{ layerLabel(selectedResult.layer) }}</el-tag
          ><el-tag :type="tagType(execStatusColor(selectedResult.execStatus))"
            >执行{{ selectedResult.execStatus }}</el-tag
          ><el-tag :type="tagType(auditStatusColor(selectedResult.auditResult))"
            >稽核{{ selectedResult.auditResult }}</el-tag
          >
        </div>
        <h2>{{ selectedResult.objectName }}</h2>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="run_id">{{ selectedResult.runId }}</el-descriptions-item
          ><el-descriptions-item label="业务日期">{{ selectedResult.bizDate }}</el-descriptions-item
          ><el-descriptions-item label="执行时间">{{
            selectedResult.executedAt
          }}</el-descriptions-item>
          <el-descriptions-item label="核查总数">{{
            selectedResult.totalCount
          }}</el-descriptions-item
          ><el-descriptions-item label="异常数">{{
            selectedResult.anomalyCount
          }}</el-descriptions-item
          ><el-descriptions-item label="耗时">{{ selectedResult.duration }}</el-descriptions-item>
        </el-descriptions>
        <el-alert type="warning" show-icon class="detail-message">{{
          selectedResult.message
        }}</el-alert>
        <div class="detail-heading">
          <div>
            <h3>本次全部异常明细</h3>
            <p>列结构由规则的 display_schema 决定，不强制所有规则共用一张宽表。</p>
          </div>
          <el-tag>{{ selectedResult.details.length }} 条</el-tag>
        </div>
        <el-table
          :data="selectedResult.details"
          :show-overflow-tooltip="false"
          :border="false"
          stripe
        >
          <el-table-column
            v-for="column in selectedResult.displayColumns"
            :key="column.dataIndex"
            :label="column.title"
            :prop="column.dataIndex"
            :width="column.width"
          >
            <template #default="{ row: record }">
              <el-tag
                v-if="column.display === 'result'"
                :type="tagType(detailStatusColor(record[column.dataIndex]))"
                size="small"
                >{{ record[column.dataIndex] }}</el-tag
              >
              <strong v-else-if="column.display === 'primary'">{{
                record[column.dataIndex]
              }}</strong>
              <span
                v-else
                :class="{
                  'number-cell': column.display === 'number' || column.display === 'danger',
                  'danger-text': column.display === 'danger',
                }"
                >{{ record[column.dataIndex] }}</span
              >
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer><el-button type="primary" @click="clearDeepLink">关闭</el-button></template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import {
  auditResults,
  auditRuns,
  type AuditLayer,
  type AuditResultSummary,
} from '../data/auditMock'

const route = useRoute()
const router = useRouter()
const section = computed(() => String(route.meta.section || 'results'))

const pageMap: Record<string, { title: string; description: string }> = {
  results: {
    title: '异常结果',
    description: '一期统一读取 DS 标准落表异常，并按运行批次查看全部异常明细',
  },
  history: {
    title: '巡检历史',
    description: '只读保留每次 DS 运行记录，严格区分执行状态与数据稽核结论',
  },
  access: {
    title: '一期接入说明',
    description: '业务 SQL 保留在 DS，通过公共包装步骤接入统一结果模型',
  },
}
const pageConfig = computed(() => pageMap[section.value] || pageMap.results)

const dsResults = computed(() => auditResults.filter((item) => item.source === 'DS 结果'))
const abnormalDsResults = computed(() =>
  dsResults.value.filter((item) => item.auditResult !== '通过'),
)
const dsRuns = computed(() => auditRuns.filter((item) => item.source === 'DS 结果'))
const failedAuditCount = computed(
  () =>
    dsResults.value.filter((item) => item.auditResult === '异常' || item.auditResult === '阻断')
      .length,
)
const executionFailedCount = computed(
  () => dsResults.value.filter((item) => item.execStatus === '失败').length,
)
const totalAnomalies = computed(() =>
  dsResults.value.reduce((sum, item) => sum + item.anomalyCount, 0),
)
const successRunCount = computed(
  () => dsRuns.value.filter((item) => item.execStatus === '成功').length,
)
const passRunCount = computed(
  () => dsRuns.value.filter((item) => item.auditResult === '通过').length,
)

const resultFilters = reactive({
  layer: undefined as AuditLayer | undefined,
  status: undefined as string | undefined,
  keyword: '',
})
const filteredResults = computed(() =>
  abnormalDsResults.value.filter((item) => {
    const keyword = resultFilters.keyword.trim().toLowerCase()
    return (
      (!resultFilters.layer || item.layer === resultFilters.layer) &&
      (!resultFilters.status || item.auditResult === resultFilters.status) &&
      (!keyword ||
        [item.runId, item.checkName, item.objectName].some((value) =>
          value.toLowerCase().includes(keyword),
        ))
    )
  }),
)

const historyFilters = reactive({
  layer: undefined as AuditLayer | undefined,
  type: undefined as string | undefined,
  execStatus: undefined as string | undefined,
  auditResult: undefined as string | undefined,
  keyword: '',
})
const filteredRuns = computed(() =>
  dsRuns.value.filter((item) => {
    const keyword = historyFilters.keyword.trim().toLowerCase()
    return (
      (!historyFilters.layer || item.layer === historyFilters.layer) &&
      (!historyFilters.type || item.type === historyFilters.type) &&
      (!historyFilters.execStatus || item.execStatus === historyFilters.execStatus) &&
      (!historyFilters.auditResult || item.auditResult === historyFilters.auditResult) &&
      (!keyword || [item.id, item.name].some((value) => value.toLowerCase().includes(keyword)))
    )
  }),
)

const detailVisible = ref(false)
const selectedResult = ref<AuditResultSummary | null>(null)

function openResult(result: AuditResultSummary, syncRoute = true) {
  if (result.source !== 'DS 结果' || result.anomalyCount === 0) return
  selectedResult.value = result
  detailVisible.value = true
  if (syncRoute && route.query.run_id !== result.runId)
    router.replace({ path: '/audit-phase1/results', query: { run_id: result.runId } })
}
function goToResult(runId: string) {
  router.push({ path: '/audit-phase1/results', query: { run_id: runId } })
}
function openHistoryRun(record: Record<string, any>) {
  if (Number(record.anomalyCount) > 0) goToResult(String(record.id))
}
function clearDeepLink() {
  detailVisible.value = false
  if (section.value === 'results' && route.query.run_id)
    router.replace({ path: '/audit-phase1/results' })
}

const statusContract = [
  { scene: '正常通过', exec: 'SUCCESS', audit: 'PASS', display: '0 条异常' },
  { scene: '发现异常', exec: 'SUCCESS', audit: 'FAIL', display: '异常数可下钻' },
  { scene: '执行失败', exec: 'FAILED', audit: 'NOT_PRODUCED', display: '数量显示 —' },
  { scene: '应有但表空', exec: 'SUCCESS', audit: 'NO_DATA', display: '单独标记表空' },
]

const layerNames: Record<AuditLayer, string> = { L0: '基础质量', L1: '业务自洽', L2: '报表风控' }
function layerLabel(layer: AuditLayer) {
  return `${layer} ${layerNames[layer]}`
}
function tagType(color?: string) {
  return (
    {
      blue: 'primary',
      green: 'success',
      red: 'danger',
      orange: 'warning',
      purple: 'info',
      gray: 'info',
    }[color || ''] || 'info'
  )
}
function execStatusColor(status: string) {
  return status === '成功' ? 'green' : status === '运行中' ? 'blue' : 'red'
}
function auditStatusColor(status: string) {
  return status === '通过'
    ? 'green'
    : status === '未产出'
      ? 'gray'
      : status === '阻断'
        ? 'red'
        : 'orange'
}
function detailStatusColor(status: string) {
  return status === '一致' || status === '通过'
    ? 'green'
    : status === '不可比'
      ? 'gray'
      : status === '超阈值'
        ? 'orange'
        : 'red'
}

watch(
  () => route.fullPath,
  () => {
    if (section.value !== 'results') {
      detailVisible.value = false
      return
    }
    const runId = typeof route.query.run_id === 'string' ? route.query.run_id : ''
    if (!runId) return
    const result = dsResults.value.find((item) => item.runId === runId)
    if (result?.anomalyCount) openResult(result, false)
  },
  { immediate: true },
)
</script>

<style scoped>
.phase-one-page {
  animation: phaseOneIn 0.22s ease-out;
}
@keyframes phaseOneIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.pipeline-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;
  margin-bottom: 14px;
  padding: 13px 18px;
  border-left: 3px solid rgb(var(--primary-6));
}
.pipeline-title span,
.pipeline-title strong {
  display: block;
}
.pipeline-title span {
  color: var(--color-text-3);
  font-size: 11px;
}
.pipeline-title strong {
  margin-top: 3px;
  font-size: 14px;
}
.pipeline-note {
  max-width: 560px;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}
.stat-card {
  padding: 13px 16px;
}
.stat-card span,
.stat-card small {
  display: block;
  color: var(--color-text-3);
  font-size: 11px;
}
.stat-card strong {
  display: block;
  margin: 4px 0 2px;
  color: rgb(var(--primary-6));
  font-size: 23px;
  line-height: 1.05;
}
.stat-card strong.danger,
.danger {
  color: rgb(var(--danger-6));
}
.stat-card strong.warning,
.warning {
  color: rgb(var(--warning-6));
}
.success {
  color: rgb(var(--success-6)) !important;
}
.table-shell {
  padding: 14px 16px;
  overflow: hidden;
}
.filter-row,
.table-heading,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.filter-row {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-1);
}
.filter-row > span {
  color: var(--color-text-3);
  font-size: 12px;
  white-space: nowrap;
}
.table-heading {
  padding: 12px 0 10px;
}
.table-heading h3,
.section-heading h3,
.detail-heading h3 {
  margin: 0;
  font-size: 15px;
}
.table-heading p,
.section-heading p,
.detail-heading p {
  margin: 3px 0 0;
  color: var(--color-text-3);
  font-size: 11px;
}
.readonly-label {
  padding: 3px 8px;
  border: 1px solid var(--color-success-light);
  border-radius: 10px;
  color: var(--color-success);
  font-family: var(--font-family-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
}
.run-id {
  color: rgb(var(--primary-6));
  font-family: var(--font-family-mono);
  font-size: 11px;
}
.date-cell {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.cell-main {
  font-weight: 600;
}
.cell-sub {
  max-width: 195px;
  margin-top: 2px;
  overflow: hidden;
  color: var(--color-text-3);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.anomaly-link {
  color: rgb(var(--danger-6));
  font-weight: 700;
}
.scope-alert {
  margin-bottom: 14px;
}
.history-summary {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  margin-bottom: 14px;
  padding: 12px 0;
}
.history-summary > div {
  padding: 0 16px;
  border-right: 1px solid var(--color-border-1);
}
.history-summary > div:last-child {
  border: 0;
}
.history-summary span,
.history-summary strong {
  display: block;
}
.history-summary span {
  color: var(--color-text-3);
  font-size: 11px;
}
.history-summary strong {
  margin-top: 4px;
  font-size: 20px;
}
.history-shell {
  padding-top: 12px;
}
.access-section {
  padding: 14px 17px;
}
.section-heading {
  margin-bottom: 12px;
}
.model-flow {
  display: grid;
  grid-template-columns: 1fr 36px 1.14fr 36px 1fr;
  align-items: center;
  gap: 8px;
}
.model-card {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-surface);
}
.model-card.primary {
  border-color: rgb(var(--primary-4));
  background: rgb(var(--primary-1));
}
.model-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.model-card > div > span {
  color: rgb(var(--primary-6));
  font-size: 11px;
  font-weight: 700;
}
.model-card h4 {
  margin: 8px 0 2px;
  font-family: var(--font-family-mono);
  font-size: 14px;
}
.model-card p {
  margin: 0 0 8px;
  color: var(--color-text-3);
  font-size: 11px;
}
.model-card code {
  color: var(--color-text-2);
  font-size: 10px;
  line-height: 1.5;
}
.flow-arrow {
  color: rgb(var(--primary-5));
  font-size: 22px;
  text-align: center;
}
.access-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 14px;
  margin-top: 14px;
}
.access-section.compact {
  min-width: 0;
}
.ds-steps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ds-steps > div {
  display: grid;
  grid-template-columns: 25px 1fr;
  column-gap: 8px;
  padding: 8px;
  border-radius: 6px;
  background: var(--color-fill-1);
}
.ds-steps > div > span {
  grid-row: 1 / 3;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgb(var(--primary-6));
  color: var(--color-bg-surface);
  font-size: 10px;
}
.ds-steps strong {
  font-size: 11px;
}
.ds-steps small {
  color: var(--color-text-3);
  font-size: 9px;
}
.status-contract {
  overflow: hidden;
}
.status-row {
  display: grid;
  grid-template-columns: 1fr 0.9fr 1.15fr 1.25fr;
  align-items: center;
  min-height: 30px;
  padding: 3px 8px;
  border-bottom: 1px solid var(--color-border-1);
  font-size: 10px;
}
.status-row.head {
  min-height: 26px;
  background: var(--color-fill-1);
  color: var(--color-text-3);
}
.status-row code {
  font-size: 9px;
}
.drawer-tags {
  display: flex;
  gap: 7px;
}
.drawer-tags + h2 {
  margin: 14px 0;
  font-size: 20px;
}
.detail-message {
  margin: 14px 0;
}
.detail-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.number-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.danger-text {
  color: rgb(var(--danger-6));
  font-weight: 600;
}
@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .history-summary {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 12px;
  }
  .access-bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
