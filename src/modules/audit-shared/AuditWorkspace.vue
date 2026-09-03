<template>
  <div
    class="audit-page"
    :class="{
      'phase-one-audit-page': isPhaseOne,
      'phase-one-fill-page':
        isPhaseOne && (section === 'dashboard' || section === 'issues' || section === 'operations'),
      'phase-one-dashboard-page': isPhaseOne && section === 'dashboard',
      'phase-one-issues-page': isPhaseOne && section === 'issues',
      'phase-one-operations-page': isPhaseOne && section === 'operations',
      'phase-one-result-page': isPhaseOneDetailPage,
    }"
  >
    <PageHeader
      v-if="
        !(
          isPhaseOne &&
          (section === 'dashboard' || section === 'issues' || section === 'operations')
        )
      "
      :title="pageConfig.title"
      :description="isPhaseOne && section === 'dashboard' ? undefined : pageConfig.description"
    >
      <template #actions>
        <el-space>
          <el-tag
            v-if="!(isPhaseOne && section === 'dashboard')"
            :type="tagType(isPhaseOne ? 'blue' : 'purple')"
            >{{ isPhaseOne ? '一期上线范围' : '完整方案演示' }}</el-tag
          >
          <el-tag v-if="!(isPhaseOne && section === 'dashboard')" type="success">{{
            isPhaseOne ? '上线稽核 · 结果只读' : '开发库只读演示'
          }}</el-tag>
          <el-button v-if="section === 'dashboard'" @click="refreshDashboard">
            <template #icon><icon-refresh /></template>
            刷新
          </el-button>
          <el-button v-if="section === 'issues'" @click="actionMessage('异常结果已导出')">
            <template #icon><icon-download /></template>
            导出异常
          </el-button>
          <el-button v-if="section === 'rules'" type="primary" @click="showRuleModal = true">
            <template #icon><icon-plus /></template>
            新建稽核
          </el-button>
          <el-button
            v-if="section === 'operations' && !isPhaseOne"
            type="primary"
            @click="rerunFailed"
          >
            <template #icon><icon-refresh /></template>
            申请重跑
          </el-button>
          <el-button v-if="section === 'strategies'" type="primary" @click="showStrategyMessage">
            <template #icon><icon-plus /></template>
            新增监控对象
          </el-button>
        </el-space>
      </template>
    </PageHeader>

    <!-- 稽核驾驶舱 -->
    <template v-if="section === 'dashboard'">
      <div v-if="isPhaseOne" class="phase-one-dashboard-overview">
        <div class="phase-one-page-heading">
          <h3>稽核驾驶舱</h3>
          <div class="phase-one-heading-actions">
            <div class="phase-one-dashboard-date-row">
              <span class="context-label">数据稽核日期</span>
              <el-date-picker
                v-model="phaseOneAuditDate"
                class="phase-one-date-picker"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                :clearable="false"
                :disabled-date="disabledPhaseOneDate"
              />
            </div>
            <el-button
              class="phase-one-refresh-button"
              :loading="phaseOneLoading"
              @click="refreshDashboard"
            >
              <template #icon><icon-refresh /></template>
              刷新
            </el-button>
          </div>
        </div>
        <div class="phase-one-stat-cards">
          <button class="phase-one-stat-card" @click="goTo(auditPath('operations'))">
            <span class="phase-one-stat-icon primary"><icon-check-circle /></span>
            <span class="phase-one-stat-content">
              <span class="phase-one-stat-title">稽核项数</span>
              <span class="phase-one-stat-metrics">
                <span class="phase-one-stat-metric primary"
                  >已完成 <strong>{{ phaseOneSummary.completedRuns }}</strong></span
                >
                <span class="phase-one-stat-divider">/</span>
                <span class="phase-one-stat-metric"
                  >应执行 <strong>{{ phaseOneSummary.expectedRuns }}</strong></span
                >
              </span>
            </span>
          </button>
          <button class="phase-one-stat-card" @click="goTo(auditPath('issues'))">
            <span class="phase-one-stat-icon danger"><icon-exclamation-circle /></span>
            <span class="phase-one-stat-content">
              <span class="phase-one-stat-title">发现异常</span>
              <span class="phase-one-stat-metrics">
                <span class="phase-one-stat-metric danger"
                  >异常 <strong>{{ phaseOneSummary.failedAuditRuns }}</strong></span
                >
                <span class="phase-one-stat-divider">/</span>
                <span class="phase-one-stat-metric success"
                  >通过 <strong>{{ phaseOneSummary.passedRuns }}</strong></span
                >
              </span>
            </span>
          </button>
          <button class="phase-one-stat-card" @click="goTo(auditPath('operations'))">
            <span class="phase-one-stat-icon warning"><icon-clock-circle /></span>
            <span class="phase-one-stat-content">
              <span class="phase-one-stat-title">运行异常</span>
              <span class="phase-one-stat-metrics phase-one-stat-metrics-wide">
                <span class="phase-one-stat-metric warning"
                  >未触发 <strong>{{ phaseOneSummary.notTriggeredRuns }}</strong></span
                >
                <span class="phase-one-stat-divider">/</span>
                <span class="phase-one-stat-metric danger"
                  >执行失败 <strong>{{ phaseOneSummary.failedRuns }}</strong></span
                >
                <span class="phase-one-stat-divider">/</span>
                <span class="phase-one-stat-metric warning"
                  >数据未到 <strong>{{ phaseOneSummary.sourceUnavailableRuns }}</strong></span
                >
              </span>
            </span>
          </button>
          <button class="phase-one-stat-card" @click="goTo(auditPath('issues'))">
            <span class="phase-one-stat-icon detail"><icon-storage /></span>
            <span class="phase-one-stat-content">
              <span class="phase-one-stat-title">异常明细</span>
              <span class="phase-one-stat-metrics">
                <span class="phase-one-stat-metric danger">
                  基础数据
                  <strong
                    :title="phaseOneSummary.rowQualityExceptionCount.toLocaleString('zh-CN')"
                    >{{ formatCompactAuditCount(phaseOneSummary.rowQualityExceptionCount) }}</strong
                  >
                </span>
                <span class="phase-one-stat-divider">/</span>
                <span class="phase-one-stat-metric danger">
                  两表对比
                  <strong
                    :title="phaseOneSummary.metricCompareExceptionCount.toLocaleString('zh-CN')"
                    >{{
                      formatCompactAuditCount(phaseOneSummary.metricCompareExceptionCount)
                    }}</strong
                  >
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>
      <div v-else class="context-bar glass-card">
        <div>
          <span class="context-label">观察日期</span>
          <strong>2026-08-05</strong>
          <el-tag size="small">多日历规则汇总</el-tag>
        </div>
        <div class="context-meta">最近刷新 2026-08-06 10:16:08 · 规则版本 audit-v3.2</div>
      </div>
      <el-alert v-if="isPhaseOne && phaseOneLoadError" type="warning" show-icon>{{
        phaseOneLoadError
      }}</el-alert>

      <div v-if="!isPhaseOne" class="stat-grid">
        <button class="stat-card glass-card" @click="goTo(auditPath('issues'))">
          <span class="stat-label">未关闭问题</span>
          <strong class="stat-value danger">11</strong>
          <span class="stat-foot">较昨日 +2</span>
        </button>
        <button class="stat-card glass-card" @click="setPriorityAndGo('P1')">
          <span class="stat-label">P1 紧急问题</span>
          <strong class="stat-value warning">3</strong>
          <span class="stat-foot">1 项即将超时</span>
        </button>
        <button class="stat-card glass-card" @click="goTo(auditPath('operations'))">
          <span class="stat-label">今日稽核执行</span>
          <strong class="stat-value">126</strong>
          <span class="stat-foot">完成 112 · 运行中 4</span>
        </button>
        <button class="stat-card glass-card" @click="goTo(auditPath('rules'))">
          <span class="stat-label">规则覆盖</span>
          <strong class="stat-value success">96.8%</strong>
          <span class="stat-foot">L0 78 · L1/L2 48</span>
        </button>
      </div>

      <div class="dashboard-grid" :class="{ 'phase-one-dashboard-stack': isPhaseOne }">
        <section
          class="glass-card panel priority-panel"
          :class="{ 'phase-one-priority-panel': isPhaseOne }"
        >
          <div class="panel-header">
            <div>
              <h3>{{ isPhaseOne ? '当日优先处理' : '今日优先处理' }}</h3>
              <p>
                {{
                  isPhaseOne
                    ? '按异常、执行失败和阻断结果排列'
                    : '按风险等级、影响范围与 SLA 自动排序'
                }}
              </p>
            </div>
            <el-button
              :type="isPhaseOne ? 'primary' : undefined"
              :plain="!isPhaseOne"
              @click="goTo(auditPath('issues'))"
              >{{
                isPhaseOne ? `全部异常（${phaseOneExceptionResults.length}）` : '查看全部'
              }}</el-button
            >
          </div>
          <div class="priority-list" :class="{ 'phase-one-priority-list': isPhaseOne }">
            <template v-if="isPhaseOne">
              <button
                v-for="(item, index) in phaseOneExceptionResults"
                :key="item.runId"
                class="phase-one-priority-card"
                :class="{ featured: index === 0 }"
                @click="openAuditResult(item)"
              >
                <span class="phase-one-priority-rank" :class="index === 0 ? 'p1' : 'p2'"
                  >P{{ index + 1 }}</span
                >
                <span class="phase-one-priority-main">
                  <span class="phase-one-priority-title-row">
                    <strong>{{ item.checkName }}</strong>
                    <span class="phase-one-priority-action"
                      >查看详情 <icon-right class="phase-one-priority-arrow"
                    /></span>
                  </span>
                  <small>{{ item.objectName }}</small>
                  <span class="phase-one-priority-meta">
                    <span class="phase-one-priority-status"><i></i>{{ item.auditResult }}</span>
                    <span
                      ><strong :title="`${item.anomalyCount.toLocaleString('zh-CN')} 项异常`">{{
                        formatCompactAuditCount(item.anomalyCount)
                      }}</strong>
                      项异常</span
                    >
                    <span
                      >核查类型 <strong>{{ detailTypeLabel(item.detailType) }}</strong></span
                    >
                  </span>
                </span>
              </button>
              <el-empty
                v-if="!phaseOneLoading && phaseOneExceptionResults.length === 0"
                description="所选日期未发现异常稽核项"
              />
            </template>
            <template v-else>
              <button
                v-for="item in auditIssues.slice(0, 3)"
                :key="item.id"
                class="priority-row"
                @click="openIssue(item)"
              >
                <span class="priority-chip" :class="item.priority.toLowerCase()">{{
                  item.priority
                }}</span>
                <span class="priority-main">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.subject }} · {{ item.ruleCode }}</small>
                </span>
                <span class="priority-owner"
                  >{{ item.owner }}<small>{{ item.duration }}</small></span
                >
              </button>
            </template>
          </div>
        </section>

        <section class="glass-card panel" :class="{ 'phase-one-trend-panel': isPhaseOne }">
          <div class="panel-header">
            <div>
              <h3>{{ isPhaseOne ? '近 7 日异常项趋势' : '近 7 日问题趋势' }}</h3>
              <p>
                {{
                  isPhaseOne
                    ? '按业务日期统计所选稽核项的异常项数'
                    : '同一问题连续命中只更新事件，不重复建单'
                }}
              </p>
            </div>
            <el-select
              v-if="isPhaseOne"
              v-model="phaseOneTrendRules"
              class="phase-one-trend-select"
              size="small"
              multiple
              :multiple-limit="5"
              collapse-tags
              :max-collapse-tags="1"
              clearable
              placeholder="全部稽核项"
              aria-label="稽核项筛选"
            >
              <el-option
                v-for="option in phaseOneTrendRuleOptions"
                :key="option.value"
                :value="option.value"
                >{{ option.label }}</el-option
              >
            </el-select>
          </div>
          <div
            v-if="isPhaseOne"
            ref="phaseOneTrendChartRef"
            class="phase-one-trend-chart"
            role="img"
            aria-label="近 7 日异常项趋势折线图"
          ></div>
          <div v-else class="trend-chart" aria-label="近 7 日未关闭问题趋势">
            <div v-for="item in visibleIssueTrend" :key="item.date" class="trend-column">
              <div class="trend-value" :title="`${item.value.toLocaleString('zh-CN')} 项异常`">
                {{ formatCompactAuditCount(item.value) }}
              </div>
              <div class="trend-bar-wrap">
                <div
                  class="trend-bar"
                  :class="{ empty: item.value === 0 }"
                  :style="{ height: trendBarHeight(item.value) }"
                ></div>
              </div>
              <div class="trend-date">{{ item.date }}</div>
            </div>
          </div>
          <div v-if="isPhaseOne" class="phase-one-trend-foot">
            <span class="phase-one-trend-legends">
              <span
                v-for="series in phaseOneTrendSeries"
                :key="series.key"
                class="phase-one-trend-legend"
              >
                <i :style="{ backgroundColor: series.color }"></i>{{ series.name }}
              </span>
            </span>
          </div>
          <div v-if="!isPhaseOne" class="trend-summary">
            <span><i class="dot danger-dot"></i>P1 3</span>
            <span><i class="dot warning-dot"></i>P2 8</span>
            <span>已恢复 17</span>
          </div>
        </section>
      </div>

      <section v-if="!isPhaseOne" class="glass-card panel closure-panel">
        <div class="panel-header">
          <div>
            <h3>{{ isPhaseOne ? '一期结果处理链路' : '问题闭环状态' }}</h3>
            <p>
              {{
                isPhaseOne
                  ? '一期上线核查统一落入标准结果表，页面只读展示异常提示和本次明细'
                  : '发现问题之后，系统持续追踪处置、数据重跑和复核结果'
              }}
            </p>
          </div>
          <el-tag v-if="isPhaseOne" type="primary">只读</el-tag>
        </div>
        <div class="closure-flow">
          <div
            v-for="(step, index) in dashboardFlowSteps"
            :key="step.title"
            class="closure-step"
            :class="{ active: isPhaseOne || index < 4 }"
          >
            <div class="step-index">{{ index + 1 }}</div>
            <div>
              <strong>{{ step.title }}</strong
              ><small>{{ step.desc }}</small>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- 异常与问题中心 -->
    <template v-else-if="section === 'issues' && !isPhaseOneDetailPage">
      <div v-if="isPhaseOne" class="phase-one-page-heading phase-one-issues-heading">
        <h3>问题中心</h3>
        <span class="muted">页面更新 {{ phaseOnePageUpdatedAt }}</span>
      </div>
      <el-tabs
        v-model="issuePageTab"
        class="glass-card issue-page-tabs"
        :class="{ 'phase-one-issues-direct': isPhaseOne }"
      >
        <el-tab-pane v-if="!isPhaseOne" name="closure" label="问题中心">
          <div class="filter-card result-filter-card">
            <el-space wrap>
              <el-select
                v-model="issueFilters.status"
                placeholder="全部状态"
                clearable
                style="width: 140px"
              >
                <el-option value="待确认">待确认</el-option
                ><el-option value="已分派">已分派</el-option
                ><el-option value="修复中">修复中</el-option
                ><el-option value="已恢复">已恢复</el-option>
              </el-select>
              <el-select
                v-model="issueFilters.layer"
                placeholder="全部层级"
                clearable
                style="width: 170px"
              >
                <el-option value="L0">L0 基础质量</el-option
                ><el-option value="L1">L1 业务自洽</el-option
                ><el-option value="L2">L2 报表与风控</el-option>
              </el-select>
              <el-select
                v-model="issueFilters.priority"
                placeholder="全部等级"
                clearable
                style="width: 120px"
                ><el-option value="P1">P1</el-option><el-option value="P2">P2</el-option
                ><el-option value="P3">P3</el-option></el-select
              >
              <el-input
                v-model="issueFilters.keyword"
                placeholder="问题、规则、客户、责任组或负责人"
                clearable
                style="width: 300px"
              />
            </el-space>
            <span class="filter-result">{{ filteredIssues.length }} 条结果</span>
          </div>

          <div class="result-table-heading">
            <div>
              <h3>问题事件</h3>
              <p>同一问题连续命中只更新发生次数，并持续追踪分派、SLA、重跑与恢复。</p>
            </div>
            <el-radio-group v-model="issueScope" size="small"
              ><el-radio-button value="open">未关闭</el-radio-button
              ><el-radio-button value="all">全部</el-radio-button
              ><el-radio-button value="mine">我负责的</el-radio-button></el-radio-group
            >
          </div>
          <el-table :data="filteredIssues" :show-overflow-tooltip="false" :border="false" stripe>
            <el-table-column label="问题编号" prop="id" :width="160" />
            <el-table-column label="等级" :width="72"
              ><template #default="{ row: record }"
                ><span class="priority-chip" :class="record.priority.toLowerCase()">{{
                  record.priority
                }}</span></template
              ></el-table-column
            >
            <el-table-column label="问题" :width="270"
              ><template #default="{ row: record }"
                ><div class="cell-primary">{{ record.title }}</div>
                <div class="cell-secondary">
                  {{ record.ruleCode }} · {{ layerLabel(record.layer) }}
                </div></template
              ></el-table-column
            >
            <el-table-column label="影响对象" :width="190"
              ><template #default="{ row: record }"
                >{{ record.subject }}
                <el-tag v-if="record.riskLabel" type="danger" size="small">{{
                  record.riskLabel
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column label="业务日" prop="bizDate" :width="120" />
            <el-table-column label="状态" :width="100"
              ><template #default="{ row: record }"
                ><el-tag :type="tagType(statusColor(record.status))" size="small">{{
                  record.status
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column label="责任归属" :width="190"
              ><template #default="{ row: record }"
                ><div class="cell-primary">{{ record.responsibleGroup }}</div>
                <div class="cell-secondary">主负责人 · {{ record.owner }}</div></template
              ></el-table-column
            >
            <el-table-column label="持续时间" prop="duration" :width="110" />
            <el-table-column label="操作" :width="90" fixed="right"
              ><template #default="{ row: record }"
                ><el-button link size="small" @click="openIssue(record)">查看</el-button></template
              ></el-table-column
            >
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="results" :label="isPhaseOne ? '异常结果' : '运行异常'">
          <el-alert v-if="!isPhaseOne" type="info" show-icon>
            统一承接 DS 任务与实时指标结果：先定位异常运行，再按 run_id 下钻本次全部核查对象。
          </el-alert>
          <el-alert v-if="isPhaseOne && phaseOneLoadError" type="warning" show-icon>{{
            phaseOneLoadError
          }}</el-alert>
          <div class="filter-card result-filter-card">
            <el-space v-if="isPhaseOne" :size="8" wrap class="phase-one-result-filters">
              <div class="phase-one-biz-date-filter">
                <span>业务日期</span>
                <el-date-picker
                  v-model="resultFilters.dateRange"
                  type="daterange"
                  class="phase-one-biz-date-range"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  clearable
                />
              </div>
              <el-select
                v-model="resultFilters.auditType"
                placeholder="全部稽核类型"
                clearable
                style="width: 170px"
              >
                <el-option value="BASIC_DATA">基础数据稽核</el-option>
                <el-option value="TABLE_COMPARISON">两表对比稽核</el-option>
              </el-select>
              <el-input
                v-model="resultFilters.keyword"
                placeholder="搜索稽核项或核查范围"
                clearable
                style="width: 280px"
              />
            </el-space>
            <el-space v-else wrap>
              <el-radio-group v-model="resultFilters.source" size="small">
                <el-radio-button value="ds">DS 结果</el-radio-button>
                <el-radio-button value="realtime">实时指标</el-radio-button>
                <el-radio-button value="all">全部</el-radio-button>
              </el-radio-group>
              <el-select
                v-model="resultFilters.layer"
                placeholder="全部层级"
                clearable
                style="width: 170px"
              >
                <el-option value="L0">L0 基础质量</el-option>
                <el-option value="L1">L1 业务自洽</el-option>
                <el-option value="L2">L2 报表与风控</el-option>
              </el-select>
              <el-input
                v-model="resultFilters.keyword"
                placeholder="运行编号、检查名称、对象或表"
                clearable
                style="width: 320px"
              />
            </el-space>
            <span v-if="isPhaseOne" class="phase-one-result-count" aria-live="polite">
              <strong>{{ phaseOneIssueTotal }}</strong>
              <span>条异常结果</span>
            </span>
            <span v-else class="filter-result">{{ filteredAuditResults.length }} 次巡检</span>
          </div>

          <div v-if="!isPhaseOne" class="result-table-heading">
            <div>
              <h3>巡检异常汇总</h3>
              <p>
                {{
                  isPhaseOne
                    ? '一期上线稽核独立展示；多指标对比无需选择客户，直接查看完整结果。'
                    : '执行失败与数据异常分开表达；异常数可直接下钻至本次明细。'
                }}
              </p>
            </div>
            <span class="muted">数据截至 2026-08-06 10:16:08</span>
          </div>
          <div :class="{ 'phase-one-results-table-shell': isPhaseOne }">
            <el-table
              :data="isPhaseOne ? pagedPhaseOneAuditResults : filteredAuditResults"
              :loading="isPhaseOne && phaseOneListLoading"
              :show-overflow-tooltip="false"
              :border="false"
              stripe
            >
              <el-table-column v-if="!isPhaseOne" label="run_id" :width="148" fixed="left"
                ><template #default="{ row: record }"
                  ><span class="run-id-cell" :title="record.runId">{{
                    record.runId
                  }}</span></template
                ></el-table-column
              >
              <el-table-column :label="isPhaseOne ? '稽核类型' : '层级'" :width="150"
                ><template #default="{ row: record }"
                  ><el-tag size="small">{{
                    isPhaseOne ? detailTypeLabel(record.detailType) : layerLabel(record.layer)
                  }}</el-tag></template
                ></el-table-column
              >
              <el-table-column :label="isPhaseOne ? '稽核项' : '检查名称'" :width="220"
                ><template #default="{ row: record }"
                  ><div class="cell-primary">{{ record.checkName }}</div>
                  <div v-if="!isPhaseOne" class="cell-secondary">
                    {{ record.source }}
                  </div></template
                ></el-table-column
              >
              <el-table-column v-if="!isPhaseOne" label="执行状态" :width="100"
                ><template #default="{ row: record }"
                  ><el-tag :type="tagType(execStatusColor(record.execStatus))" size="small">{{
                    record.execStatus
                  }}</el-tag></template
                ></el-table-column
              >
              <el-table-column :label="isPhaseOne ? '当前状态' : '稽核结果'" :width="120"
                ><template #default="{ row: record }"
                  ><el-tag :type="tagType(runStatusColor(record.auditResult))" size="small">{{
                    isPhaseOne ? phaseOneCurrentStatus(record) : record.auditResult
                  }}</el-tag></template
                ></el-table-column
              >
              <el-table-column
                :label="isPhaseOne ? '核查范围' : '对象 / 表'"
                prop="objectName"
                :width="230"
              />
              <el-table-column :label="isPhaseOne ? '核查总数' : '总数'" align="right" :width="100"
                ><template #default="{ row: record }">{{
                  record.execStatus === '失败' ? '—' : record.totalCount
                }}</template></el-table-column
              >
              <el-table-column label="业务日期" :width="130"
                ><template #default="{ row: record }"
                  ><span class="nowrap-cell">{{ record.bizDate }}</span></template
                ></el-table-column
              >
              <el-table-column label="执行时间" :width="180"
                ><template #default="{ row: record }"
                  ><span class="nowrap-cell">{{ record.executedAt }}</span></template
                ></el-table-column
              >
              <el-table-column
                :label="isPhaseOne ? '异常项数' : '异常数'"
                align="right"
                :width="100"
                fixed="right"
              >
                <template #default="{ row: record }"
                  ><span v-if="record.execStatus === '失败'">—</span
                  ><el-button
                    v-else-if="record.anomalyCount > 0"
                    link
                    size="small"
                    class="anomaly-count"
                    :aria-label="`查看 ${record.anomalyCount} 条异常明细`"
                    :title="`查看 ${record.anomalyCount} 条异常明细`"
                    @click.stop="openAuditResult(record)"
                    >{{ record.anomalyCount }}</el-button
                  ><span v-else>0</span></template
                >
              </el-table-column>
              <el-table-column label="操作" :width="90" fixed="right"
                ><template #default="{ row: record }"
                  ><el-button
                    link
                    size="small"
                    :disabled="record.anomalyCount === 0"
                    @click="openAuditResult(record)"
                    >查看明细</el-button
                  ></template
                ></el-table-column
              >
              <template v-if="isPhaseOne" #empty>
                <el-empty
                  :description="
                    phaseOneLoadError || '当前条件下没有异常结果，可到稽核运维查看全部运行记录'
                  "
                />
              </template>
            </el-table>
          </div>
          <div v-if="isPhaseOne" class="phase-one-results-pagination">
            <span class="muted">共 {{ phaseOneIssueTotal }} 条</span>
            <el-pagination
              v-model:current-page="phaseOneResultPage"
              v-model:page-size="phaseOneResultPageSize"
              :total="phaseOneIssueTotal"
              :page-sizes="[10, 20, 50]"
              layout="prev, pager, next, sizes, jumper"
              size="small"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- 规则设计 -->
    <template v-else-if="section === 'rules'">
      <div class="glass-card rules-shell">
        <el-tabs v-model="ruleTab">
          <el-tab-pane name="l0" label="通用稽核">
            <el-alert type="info" show-icon>
              不需要编写 SQL：基于元数据快照配置唯一性、完整性、有效性、及时性和数据量 5
              类模板；L0/L1/L2 作为规则标签而不是创建入口。
            </el-alert>
            <div class="mini-stats">
              <div>
                <span>演示资产</span><strong>7</strong><small>hz-trade / hz-data-middle</small>
              </div>
              <div><span>核心模板</span><strong>5</strong><small>覆盖常用数据质量场景</small></div>
              <div>
                <span>自动推荐</span><strong>4</strong><small>索引、非空、日期、低基数</small>
              </div>
              <div>
                <span>可复现异常</span><strong>2</strong><small>空估值价、历史行数骤降</small>
              </div>
            </div>
            <el-table :data="l0AuditRules" :show-overflow-tooltip="false" :border="false" stripe>
              <el-table-column label="规则" :width="230"
                ><template #default="{ row: record }"
                  ><div class="cell-primary">{{ record.name }}</div>
                  <div class="cell-secondary">{{ record.id }}</div></template
                ></el-table-column
              >
              <el-table-column label="类型" prop="type" :width="110" />
              <el-table-column label="层级" :width="105"
                ><template #default
                  ><el-tag type="primary" size="small">L0 基础质量</el-tag></template
                ></el-table-column
              >
              <el-table-column label="数据资产" prop="asset" :width="230" />
              <el-table-column label="字段 / 映射" prop="fields" :width="220" />
              <el-table-column label="强度" :width="90"
                ><template #default="{ row: record }"
                  ><el-tag
                    :type="tagType(record.level === 'BLOCK' ? 'red' : 'orange')"
                    size="small"
                    >{{ record.level }}</el-tag
                  ></template
                ></el-table-column
              >
              <el-table-column label="当前 / 回测" :width="110"
                ><template #default="{ row: record }"
                  ><el-tag :type="tagType(resultColor(record.result))" size="small">{{
                    record.result
                  }}</el-tag></template
                ></el-table-column
              >
              <el-table-column label="操作" :width="90"
                ><template #default="{ row: record }"
                  ><el-button link size="small" @click="selectedL0Id = record.id"
                    >查看</el-button
                  ></template
                ></el-table-column
              >
            </el-table>
            <div class="rule-detail-grid">
              <section class="rule-detail">
                <div class="eyebrow">当前选中</div>
                <h3>{{ selectedL0.name }}</h3>
                <p>{{ selectedL0.evidence }}</p>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="数据资产">{{
                    selectedL0.asset
                  }}</el-descriptions-item>
                  <el-descriptions-item label="字段 / 映射">{{
                    selectedL0.fields
                  }}</el-descriptions-item>
                  <el-descriptions-item label="系统默认值">{{
                    selectedL0.defaultPolicy
                  }}</el-descriptions-item>
                  <el-descriptions-item label="日期与运行">{{
                    selectedL0.schedule
                  }}</el-descriptions-item>
                  <el-descriptions-item label="责任与通知"
                    >{{ selectedL0.responsibleGroup }} · 飞书群 + 邮件兜底</el-descriptions-item
                  >
                  <el-descriptions-item label="快照版本"
                    >meta-dev-20260806-1016</el-descriptions-item
                  >
                </el-descriptions>
              </section>
              <section class="sql-preview">
                <div class="sql-title">
                  <span>系统生成的只读 SQL</span
                  ><el-tag type="success" size="small">已通过语法检查</el-tag>
                </div>
                <pre><code>{{ selectedL0.sampleSql }}</code></pre>
              </section>
            </div>
          </el-tab-pane>

          <el-tab-pane name="l1l2" label="SQL 对比">
            <el-alert type="success" show-icon>
              左右 SQL
              输出别名自动映射，支持聚合指标和明细对比两种模式；既有规则结果仍以“指标、左侧值、右侧值、差额、结果”清晰展示。
            </el-alert>
            <div class="metric-workspace">
              <aside class="metric-rule-list">
                <div class="metric-list-title">
                  <strong>既有 SQL 规则</strong><small>L1 业务自洽 / L2 报表风控</small>
                </div>
                <button
                  v-for="demo in metricAuditDemos"
                  :key="demo.id"
                  :class="{ active: selectedMetricId === demo.id }"
                  @click="selectMetricDemo(demo.id)"
                >
                  <icon-code />
                  <span
                    ><strong>{{ demo.name }}</strong
                    ><small>{{ demo.subject }}</small
                    ><em>{{ demo.summary }}</em></span
                  >
                </button>
              </aside>
              <section class="metric-result">
                <div class="metric-heading">
                  <div>
                    <div class="eyebrow">
                      {{ selectedMetricDemo.id }} · {{ selectedMetricDemo.bizDate }}
                    </div>
                    <h3>{{ selectedMetricDemo.name }}</h3>
                    <p>
                      {{ selectedMetricDemo.subject }} · {{ selectedMetricDemo.calendar }} ·
                      责任组：{{ selectedMetricDemo.owner }}
                    </p>
                  </div>
                  <el-space
                    ><el-button @click="showSqlDrawer = true">查看配置</el-button
                    ><el-button type="primary" @click="runMetricAudit"
                      ><template #icon><icon-play-arrow /></template>立即稽核</el-button
                    ></el-space
                  >
                </div>
                <div class="run-summary">
                  <span>运行 #A20260806-0912</span><strong>{{ selectedMetricDemo.summary }}</strong
                  ><span>耗时 2.84s</span>
                </div>
                <el-table
                  :data="selectedMetricDemo.metrics"
                  :show-overflow-tooltip="false"
                  :border="false"
                  stripe
                  @row-click="selectMetricRow"
                >
                  <el-table-column label="指标" prop="metric" :width="240"
                    ><template #default="{ row: record }"
                      ><strong>{{ record.metric }}</strong></template
                    ></el-table-column
                  >
                  <el-table-column label="左侧值" prop="left" :width="180"
                    ><template #default="{ row: record }"
                      ><span class="number-cell">{{ record.left }}</span></template
                    ></el-table-column
                  >
                  <el-table-column label="右侧值" prop="right" :width="180"
                    ><template #default="{ row: record }"
                      ><span class="number-cell">{{ record.right }}</span></template
                    ></el-table-column
                  >
                  <el-table-column label="差额（左－右）" prop="diff" :width="170"
                    ><template #default="{ row: record }"
                      ><span
                        class="number-cell"
                        :class="{ 'diff-alert': record.result !== '一致' }"
                        >{{ record.diff }}</span
                      ></template
                    ></el-table-column
                  >
                  <el-table-column label="结果" :width="110"
                    ><template #default="{ row: record }"
                      ><el-tag :type="tagType(metricResultColor(record.result))" size="small">{{
                        record.result
                      }}</el-tag></template
                    ></el-table-column
                  >
                </el-table>
                <div class="metric-evidence">
                  <div>
                    <span>指标证据</span><strong>{{ selectedMetric.metric }}</strong>
                  </div>
                  <div>
                    <span>判定规则</span><strong>{{ selectedMetric.comparator }}</strong>
                  </div>
                  <div class="evidence-explain">
                    <span>产品解释</span><strong>{{ selectedMetric.interpretation }}</strong>
                  </div>
                </div>
              </section>
            </div>
          </el-tab-pane>

          <el-tab-pane name="ownership" label="责任分组与通知">
            <el-alert type="info" show-icon>
              规则必须归属责任组；负责人、值班成员、通知渠道和 SLA
              默认从分组继承，单条规则只在确有业务差异时覆盖。
            </el-alert>
            <div class="ownership-stats">
              <div><span>责任分组</span><strong>3</strong><small>覆盖 126 条规则</small></div>
              <div>
                <span>待确认通知</span><strong class="danger-text">2</strong
                ><small>1 条将在 18 分钟后升级</small>
              </div>
              <div>
                <span>今日送达率</span><strong class="success-text">99.6%</strong
                ><small>飞书 312 · 邮件 47</small>
              </div>
              <div>
                <span>无人负责规则</span><strong class="success-text">0</strong
                ><small>发布门禁已启用</small>
              </div>
            </div>
            <div class="table-title-row ownership-title">
              <div>
                <h3>规则责任分组</h3>
                <p>人员变动只调整分组成员，不需要逐条修改规则。</p>
              </div>
              <el-space
                ><el-button @click="goTo('/admin/notify')">管理平台通知渠道</el-button
                ><el-button type="primary" @click="openGroupEditor()"
                  ><template #icon><icon-plus /></template>新增分组</el-button
                ></el-space
              >
            </div>
            <el-table :data="ruleGroups" :show-overflow-tooltip="false" :border="false" stripe>
              <el-table-column label="分组" :width="190"
                ><template #default="{ row: record }"
                  ><div class="cell-primary">{{ record.name }}</div>
                  <div class="cell-secondary">{{ record.code }}</div></template
                ></el-table-column
              >
              <el-table-column label="适用范围" prop="scope" :width="180" />
              <el-table-column label="责任团队" prop="team" :width="140" />
              <el-table-column label="分组负责人" prop="leader" :width="120" />
              <el-table-column label="默认通知" :width="190"
                ><template #default="{ row: record }"
                  ><el-space :size="4"
                    ><el-tag
                      v-for="channel in record.channels"
                      :key="channel"
                      size="small"
                      type="primary"
                      >{{ channel }}</el-tag
                    ></el-space
                  ></template
                ></el-table-column
              >
              <el-table-column label="确认 SLA" prop="sla" :width="100" />
              <el-table-column label="规则数" prop="rules" :width="80" />
              <el-table-column label="超时升级" prop="escalation" :width="150" />
              <el-table-column label="操作" :width="88" fixed="right"
                ><template #default="{ row: record }"
                  ><el-button link size="small" @click="openGroupEditor(record)"
                    >配置</el-button
                  ></template
                ></el-table-column
              >
            </el-table>
            <section class="notification-flow-card">
              <div class="panel-header">
                <div>
                  <h3>一条问题如何完成消息闭环</h3>
                  <p>“发送成功”不等于“问题有人处理”，必须一直追踪到确认和恢复。</p>
                </div>
              </div>
              <div class="notification-flow">
                <div v-for="(step, index) in notificationSteps" :key="step.title">
                  <span>{{ index + 1 }}</span
                  ><strong>{{ step.title }}</strong
                  ><small>{{ step.desc }}</small>
                </div>
              </div>
            </section>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <!-- 巡检历史 -->
    <template v-else-if="section === 'operations'">
      <el-alert v-if="!isPhaseOne" type="info" show-icon class="operations-alert">
        完整保留 DS 与实时巡检记录；点击异常数可按 run_id 深链到本次异常明细。
      </el-alert>
      <div class="ops-stats glass-card" :class="{ 'phase-one-ops-stats': isPhaseOne }">
        <template v-if="isPhaseOne">
          <div class="phase-one-page-heading phase-one-operations-heading">
            <h3>稽核运维</h3>
            <span class="muted">页面更新 {{ phaseOnePageUpdatedAt }}</span>
          </div>
          <div class="phase-one-ops-summary" aria-label="稽核运行统计">
            <div
              v-for="(item, index) in visibleOpsStats"
              :key="item.label"
              class="ops-stat-item"
              :class="[item.tone || 'primary', `metric-${index + 1}`]"
            >
              <span class="phase-one-ops-stat-icon" aria-hidden="true"
                ><component :is="phaseOneOpsStatIcons[index]"
              /></span>
              <span class="phase-one-ops-stat-content">
                <span>{{ item.label }}</span>
                <strong :class="item.tone">{{ item.value }}</strong>
              </span>
            </div>
          </div>
        </template>
        <template v-else>
          <div v-for="item in visibleOpsStats" :key="item.label" class="ops-stat-item">
            <span>{{ item.label }}</span
            ><strong :class="item.tone">{{ item.value }}</strong>
          </div>
        </template>
      </div>
      <el-alert v-if="isPhaseOne && phaseOneLoadError" type="warning" show-icon>{{
        phaseOneLoadError
      }}</el-alert>
      <div v-if="!isPhaseOne" class="glass-card filter-card">
        <el-space wrap>
          <el-date-picker
            v-model="operationFilters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            start-placeholder="业务日期开始"
            end-placeholder="业务日期结束"
            clearable
            style="width: 290px"
          />
          <el-select
            v-if="isPhaseOne"
            v-model="operationFilters.auditType"
            placeholder="全部稽核类型"
            clearable
            style="width: 170px"
            ><el-option value="BASIC_DATA">基础数据稽核</el-option
            ><el-option value="TABLE_COMPARISON">两表对比稽核</el-option></el-select
          >
          <el-select
            v-else
            v-model="operationFilters.layer"
            placeholder="全部层级"
            clearable
            style="width: 170px"
            ><el-option value="L0">L0 基础质量</el-option
            ><el-option value="L1">L1 业务自洽</el-option
            ><el-option value="L2">L2 报表与风控</el-option></el-select
          >
          <el-select
            v-model="operationFilters.execStatus"
            :placeholder="isPhaseOne ? '任务状态' : '执行状态'"
            clearable
            style="width: 130px"
            ><el-option value="运行中">运行中</el-option><el-option value="成功">成功</el-option
            ><el-option value="失败">失败</el-option
            ><el-option value="跳过">跳过</el-option></el-select
          >
          <el-select
            v-model="operationFilters.auditResult"
            placeholder="稽核结果"
            clearable
            style="width: 130px"
            ><el-option value="通过">通过</el-option><el-option value="异常">异常</el-option
            ><el-option value="阻断">阻断</el-option><el-option value="无数据">无数据</el-option
            ><el-option value="未产出">未产出</el-option></el-select
          >
          <el-input
            v-model="operationFilters.keyword"
            :placeholder="isPhaseOne ? '搜索稽核项或核查范围' : '批次、规则或数据源'"
            clearable
            style="width: 250px"
          />
        </el-space>
        <span class="filter-result">{{
          isPhaseOne
            ? `${phaseOneOperationsTotal} 条运行记录`
            : `${filteredAuditRuns.length} 个批次`
        }}</span>
      </div>
      <div class="glass-card table-card">
        <div class="table-title-row">
          <div>
            <h3>{{ isPhaseOne ? '稽核运行记录' : '运行批次' }}</h3>
            <p v-if="!isPhaseOne">区分数据异常、执行失败、上游阻断和依赖跳过。</p>
          </div>
          <span v-if="!isPhaseOne" class="muted">最近刷新 2026-08-06 10:16:08 · 自动刷新 30s</span>
        </div>
        <div v-if="isPhaseOne" class="filter-card phase-one-operation-filters">
          <el-space wrap>
            <el-date-picker
              v-model="operationFilters.dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              start-placeholder="业务日期开始"
              end-placeholder="业务日期结束"
              clearable
              style="width: 290px"
            />
            <el-select
              v-model="operationFilters.auditType"
              placeholder="全部稽核类型"
              clearable
              style="width: 170px"
              ><el-option value="BASIC_DATA">基础数据稽核</el-option
              ><el-option value="TABLE_COMPARISON">两表对比稽核</el-option></el-select
            >
            <el-select
              v-model="operationFilters.execStatus"
              placeholder="任务状态"
              clearable
              style="width: 130px"
              ><el-option value="运行中">运行中</el-option><el-option value="成功">成功</el-option
              ><el-option value="失败">失败</el-option
              ><el-option value="跳过">跳过</el-option></el-select
            >
            <el-select
              v-model="operationFilters.auditResult"
              placeholder="稽核结果"
              clearable
              style="width: 130px"
              ><el-option value="通过">通过</el-option><el-option value="异常">异常</el-option
              ><el-option value="阻断">阻断</el-option><el-option value="无数据">无数据</el-option
              ><el-option value="未产出">未产出</el-option></el-select
            >
            <el-input
              v-model="operationFilters.keyword"
              placeholder="搜索稽核项或核查范围"
              clearable
              style="width: 250px"
            />
          </el-space>
          <span class="filter-result">{{ phaseOneOperationsTotal }} 条运行记录</span>
        </div>
        <el-table
          :data="filteredAuditRuns"
          :loading="isPhaseOne && phaseOneListLoading"
          :show-overflow-tooltip="false"
          :border="false"
          stripe
        >
          <el-table-column v-if="!isPhaseOne" label="run_id" :width="148" fixed="left"
            ><template #default="{ row: record }"
              ><span class="run-id-cell" :title="record.id">{{ record.id }}</span></template
            ></el-table-column
          >
          <el-table-column :label="isPhaseOne ? '稽核类型' : '层级'" :width="isPhaseOne ? 131 : 150"
            ><template #default="{ row: record }"
              ><el-tag size="small">{{
                isPhaseOne ? record.type : layerLabel(record.layer)
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column
            :label="isPhaseOne ? '稽核项' : '检查名称'"
            prop="name"
            :width="isPhaseOne ? 237 : 230"
          />
          <el-table-column
            :label="isPhaseOne ? '任务状态' : '执行状态'"
            :width="isPhaseOne ? 94 : 110"
            ><template #default="{ row: record }"
              ><el-tag :type="tagType(execStatusColor(record.execStatus))" size="small">{{
                record.execStatus
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="稽核结果" :width="isPhaseOne ? 94 : 110"
            ><template #default="{ row: record }"
              ><el-tag :type="tagType(runStatusColor(record.auditResult))" size="small">{{
                record.auditResult
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column v-if="!isPhaseOne" label="来源" :width="100"
            ><template #default="{ row: record }"
              ><el-tag :type="tagType(sourceColor(record.source))" size="small">{{
                record.source
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column v-if="!isPhaseOne" label="类型" prop="type" :width="120" />
          <el-table-column
            :label="isPhaseOne ? '调度方式' : '触发方式'"
            prop="trigger"
            :width="isPhaseOne ? 94 : 110"
          />
          <el-table-column v-if="!isPhaseOne" label="进度" :width="150"
            ><template #default="{ row: record }"
              ><el-progress
                :percent="record.progress / 100"
                size="small"
                :show-text="true" /></template
          ></el-table-column>
          <el-table-column
            :label="isPhaseOne ? '执行耗时' : '耗时'"
            prop="duration"
            :width="isPhaseOne ? 94 : 100"
          />
          <el-table-column label="业务日期" :width="isPhaseOne ? 122 : 110"
            ><template #default="{ row: record }"
              ><span class="nowrap-cell">{{ record.bizDate }}</span></template
            ></el-table-column
          >
          <el-table-column label="执行时间" :width="isPhaseOne ? 188 : 170"
            ><template #default="{ row: record }"
              ><span class="nowrap-cell">{{ record.time }}</span></template
            ></el-table-column
          >
          <el-table-column
            :label="isPhaseOne ? '异常项数' : '异常数'"
            align="right"
            :width="isPhaseOne ? 94 : 100"
            :fixed="isPhaseOne ? undefined : 'right'"
            ><template #default="{ row: record }"
              ><span
                v-if="record.execStatus === '失败'"
                :class="{ 'operation-anomaly-count': isPhaseOne }"
                >—</span
              ><el-button
                v-else-if="record.anomalyCount > 0"
                link
                size="small"
                class="anomaly-count"
                :class="{ 'operation-anomaly-count': isPhaseOne }"
                @click.stop="openRunResult(record.id)"
                >{{ record.anomalyCount }}</el-button
              ><span v-else :class="{ 'operation-anomaly-count': isPhaseOne }">0</span></template
            ></el-table-column
          >
          <el-table-column v-if="!isPhaseOne" label="操作" :width="86" fixed="right"
            ><template #default="{ row: record }"
              ><el-button link size="small" @click="selectedRun = record">查看</el-button></template
            ></el-table-column
          >
          <template v-if="isPhaseOne" #empty>
            <el-empty :description="phaseOneLoadError || '当前条件下没有稽核运行记录'" />
          </template>
        </el-table>
        <div v-if="isPhaseOne" class="phase-one-results-pagination">
          <span class="muted">共 {{ phaseOneOperationsTotal }} 条</span>
          <el-pagination
            v-model:current-page="phaseOneOperationsPage"
            v-model:page-size="phaseOneOperationsPageSize"
            :total="phaseOneOperationsTotal"
            :page-sizes="[10, 20, 50]"
            layout="prev, pager, next, sizes, jumper"
            size="small"
          />
        </div>
        <div v-if="!isPhaseOne" class="run-detail">
          <div>
            <span>当前批次</span><strong>{{ selectedRun.id }}</strong>
          </div>
          <div>
            <span>业务日期</span><strong>{{ selectedRun.bizDate }}</strong>
          </div>
          <div><span>规则版本</span><strong>v3.2</strong></div>
          <div>
            <span>运行日历快照</span><strong>{{ selectedRun.calendarSnapshot }}</strong>
          </div>
          <div class="run-message">
            <span>执行说明</span><strong>{{ selectedRun.message }}</strong>
          </div>
          <el-space
            ><el-button size="small" @click="actionMessage('已加载本次 SQL 与运行参数')"
              >查看 SQL 与参数</el-button
            ><el-button
              v-if="selectedRun.anomalyCount > 0"
              type="primary"
              size="small"
              @click="openRunResult(selectedRun.id)"
              >查看本次异常</el-button
            ></el-space
          >
        </div>
      </div>
    </template>

    <!-- 高风险策略 -->
    <template v-else-if="section === 'strategies'">
      <el-alert type="info" show-icon
        >高风险不是复制规则，而是在同一基础规则上覆盖执行频率、阈值、等级、SLA
        和通知路由。</el-alert
      >
      <div class="strategy-layout">
        <aside class="glass-card target-list">
          <div class="target-list-head">
            <h3>监控对象</h3>
            <span>2 个高风险，1 个重点关注</span>
          </div>
          <el-input placeholder="客户或机构" clearable />
          <button
            v-for="target in riskTargets"
            :key="target.key"
            :class="{ active: selectedRiskKey === target.key }"
            @click="selectedRiskKey = target.key"
          >
            <span class="target-avatar">{{ target.name.slice(0, 1) }}</span>
            <span
              ><strong>{{ target.key }}</strong
              ><small>{{ target.name }}</small></span
            >
            <el-tag :type="tagType(target.level === '高风险' ? 'red' : 'orange')" size="small">{{
              target.level
            }}</el-tag>
          </button>
        </aside>
        <section class="glass-card strategy-detail">
          <div class="strategy-heading">
            <div>
              <div class="eyebrow">{{ selectedRisk.key }}</div>
              <h3>{{ selectedRisk.name }}</h3>
              <p>{{ selectedRisk.summary }}</p>
            </div>
            <el-tag type="success">策略生效中</el-tag>
          </div>
          <div class="strategy-compare">
            <div>
              <span>基础规则</span><strong>客户估值核心指标稽核</strong
              ><small>每日 1 次 · WARN · 容差 10,000</small>
            </div>
            <div class="strategy-arrow">→</div>
            <div class="effective">
              <span>高风险覆盖</span><strong>CNY 交易日盘中每小时 · P1 · 零容差</strong
              ><small>休市与非交易日不触发 · 30 分钟未确认自动升级</small>
            </div>
          </div>
          <el-table :data="strategyOverrides" :show-overflow-tooltip="false" :border="false" stripe>
            <el-table-column label="覆盖项" prop="field" :width="130" />
            <el-table-column label="基础策略" prop="base" :width="180" />
            <el-table-column label="生效策略" :width="190"
              ><template #default="{ row: record }"
                ><strong>{{ record.effective }}</strong></template
              ></el-table-column
            >
            <el-table-column label="原因" prop="reason" />
          </el-table>
          <div class="dedup-note">
            <icon-check-circle /><span
              ><strong>问题仍按 rule_id + target_key + metric 去重</strong
              ><small
                >提高执行频率不会每小时生成新工单，只更新发生次数、最近时间和证据快照。</small
              ></span
            >
          </div>
        </section>
      </div>
    </template>

    <!-- 运行异常结果明细 -->
    <el-drawer
      v-model="resultDrawerVisible"
      :class="['result-detail-drawer', { 'phase-one-result-detail-page': isPhaseOneDetailPage }]"
      :size="
        isPhaseOneDetailPage ? '100%' : isPhaseOne ? 'min(1120px, 100vw)' : 'min(920px, 100vw)'
      "
      :title="selectedAuditResult?.checkName"
      :modal="!isPhaseOneDetailPage"
      :modal-class="isPhaseOneDetailPage ? 'phase-one-result-detail-overlay' : ''"
      :close-on-click-modal="!isPhaseOneDetailPage"
      :show-close="!isPhaseOneDetailPage"
      :close-on-press-escape="!isPhaseOneDetailPage"
      :with-header="!isPhaseOneDetailPage"
      destroy-on-close
      @close="clearResultDeepLink"
    >
      <template v-if="selectedAuditResult">
        <template v-if="!isPhaseOne">
          <div class="drawer-title-line">
            <el-tag :type="tagType(isPhaseOne ? 'blue' : 'purple')">{{
              isPhaseOne ? '一期上线范围' : '完整方案演示'
            }}</el-tag>
            <el-tag>{{
              isPhaseOne
                ? detailTypeLabel(selectedAuditResult.detailType)
                : layerLabel(selectedAuditResult.layer)
            }}</el-tag>
            <el-tag v-if="!isPhaseOne" :type="tagType(sourceColor(selectedAuditResult.source))">{{
              selectedAuditResult.source
            }}</el-tag>
            <el-tag :type="tagType(runStatusColor(selectedAuditResult.auditResult))">{{
              isPhaseOne
                ? phaseOneCurrentStatus(selectedAuditResult)
                : `稽核${selectedAuditResult.auditResult}`
            }}</el-tag>
          </div>
          <h2 class="drawer-subject">{{ selectedAuditResult.objectName }}</h2>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item v-if="!isPhaseOne" label="run_id">{{
              selectedAuditResult.runId
            }}</el-descriptions-item>
            <el-descriptions-item label="业务日期">{{
              selectedAuditResult.bizDate
            }}</el-descriptions-item>
            <el-descriptions-item label="执行时间">{{
              selectedAuditResult.executedAt
            }}</el-descriptions-item>
            <el-descriptions-item label="核查总数">{{
              selectedAuditResult.totalCount
            }}</el-descriptions-item>
            <el-descriptions-item label="异常项数">{{
              selectedAuditResult.anomalyCount
            }}</el-descriptions-item>
            <el-descriptions-item label="执行耗时">{{
              selectedAuditResult.duration
            }}</el-descriptions-item>
            <el-descriptions-item v-if="!isPhaseOne" label="运行日历快照" :span="3">{{
              selectedAuditResult.calendarSnapshot
            }}</el-descriptions-item>
          </el-descriptions>
          <el-alert
            :type="selectedAuditResult.execStatus === '失败' ? 'error' : 'warning'"
            show-icon
            class="result-message"
            >{{ selectedAuditResult.message }}</el-alert
          >
        </template>

        <template v-if="isCompositeMetricResult">
          <div class="result-detail-title composite-title">
            <div>
              <h3>异常客户核对明细</h3>
              <p>
                一期只列出异常客户；进入客户后保留同组全部指标，包括
                PASS，避免只看差额而失去判断上下文。
              </p>
            </div>
            <el-tag type="danger">{{ metricCustomerGroups.length }} 个异常客户</el-tag>
          </div>

          <div class="metric-customer-selector">
            <button
              v-for="customer in metricCustomerGroups"
              :key="customer.objectKey"
              :class="{ active: selectedMetricObjectKey === customer.objectKey }"
              @click="selectedMetricObjectKey = customer.objectKey"
            >
              <span>
                <strong>{{ customer.objectName }}</strong>
                <small
                  >正式 {{ customer.formalCount }} 项 · 诊断
                  {{ customer.diagnosticCount }} 项</small
                >
              </span>
              <el-tag type="danger" size="small"
                >{{ customer.formalAnomalyCount }} 项正式异常</el-tag
              >
            </button>
          </div>

          <template v-if="selectedMetricCustomer">
            <div class="metric-customer-heading">
              <div>
                <span>当前客户</span><strong>{{ selectedMetricCustomer.objectName }}</strong>
              </div>
              <small>异常数只统计正式指标；诊断项仅用于定位原因。</small>
            </div>
            <div class="metric-customer-summary">
              <div>
                <span>正式指标</span><strong>{{ selectedMetricCustomer.formalCount }}</strong>
              </div>
              <div class="danger">
                <span>正式异常</span
                ><strong>{{ selectedMetricCustomer.formalAnomalyCount }}</strong>
              </div>
              <div class="success">
                <span>全部 PASS</span><strong>{{ selectedMetricCustomer.passCount }}</strong>
              </div>
              <div>
                <span>诊断项</span><strong>{{ selectedMetricCustomer.diagnosticCount }}</strong>
              </div>
            </div>

            <section class="metric-detail-section formal-section">
              <div class="metric-section-heading">
                <div>
                  <h4>正式稽核指标</h4>
                  <p>参与异常数量、问题生成和最终稽核结论。</p>
                </div>
                <el-tag type="primary">FORMAL</el-tag>
              </div>
              <el-table
                :data="formalMetrics"
                row-key="metricCode"
                :show-overflow-tooltip="false"
                :border="false"
                stripe
              >
                <el-table-column label="指标 / 判定规则" :width="280">
                  <template #default="{ row: record }"
                    ><div class="metric-name-cell">
                      <strong>{{ record.metric }}</strong
                      ><small>{{ record.comparator }}</small>
                    </div></template
                  >
                </el-table-column>
                <el-table-column
                  :label="selectedAuditResult.leftLabel || '左侧值'"
                  prop="left"
                  :width="155"
                  ><template #default="{ row: record }"
                    ><span class="number-cell">{{ record.left }}</span></template
                  ></el-table-column
                >
                <el-table-column
                  :label="selectedAuditResult.rightLabel || '右侧值'"
                  prop="right"
                  :width="155"
                  ><template #default="{ row: record }"
                    ><span class="number-cell">{{ record.right }}</span></template
                  ></el-table-column
                >
                <el-table-column label="差额" prop="diff" :width="125"
                  ><template #default="{ row: record }"
                    ><span
                      class="number-cell"
                      :class="{ 'diff-alert': record.resultCode !== 'PASS' }"
                      >{{ record.diff }}</span
                    ></template
                  ></el-table-column
                >
                <el-table-column label="结果" :width="120"
                  ><template #default="{ row: record }"
                    ><el-tag
                      :type="tagType(detailResultColor(record.resultCode || record.result))"
                      size="small"
                      >{{ record.result }}</el-tag
                    ></template
                  ></el-table-column
                >
              </el-table>
            </section>

            <section class="metric-detail-section diagnostic-section">
              <div class="metric-section-heading">
                <div>
                  <h4>诊断指标</h4>
                  <p>用于解释差额和提示缺失口径；不可比较不会直接增加正式异常数。</p>
                </div>
                <el-space :size="6"
                  ><el-tag type="info">DIAGNOSTIC</el-tag
                  ><el-tag v-if="selectedMetricCustomer.notComparableCount" type="info"
                    >{{ selectedMetricCustomer.notComparableCount }} 项不可比较</el-tag
                  ></el-space
                >
              </div>
              <el-table
                :data="diagnosticMetrics"
                row-key="metricCode"
                :show-overflow-tooltip="false"
                :border="false"
              >
                <el-table-column label="诊断项 / 说明" :width="320">
                  <template #default="{ row: record }"
                    ><div class="metric-name-cell">
                      <strong>{{ record.metric }}</strong
                      ><small>{{ record.reason }}</small>
                    </div></template
                  >
                </el-table-column>
                <el-table-column
                  :label="selectedAuditResult.leftLabel || '左侧值'"
                  prop="left"
                  :width="155"
                  ><template #default="{ row: record }"
                    ><span class="number-cell">{{ record.left }}</span></template
                  ></el-table-column
                >
                <el-table-column
                  :label="selectedAuditResult.rightLabel || '右侧值'"
                  prop="right"
                  :width="155"
                  ><template #default="{ row: record }"
                    ><span class="number-cell">{{ record.right }}</span></template
                  ></el-table-column
                >
                <el-table-column label="诊断结果" :width="130"
                  ><template #default="{ row: record }"
                    ><el-tag
                      :type="tagType(detailResultColor(record.resultCode || record.result))"
                      size="small"
                      >{{ record.result }}</el-tag
                    ></template
                  ></el-table-column
                >
              </el-table>
            </section>
          </template>
        </template>

        <template v-else>
          <el-alert
            v-if="isPhaseOne && selectedAuditResult.detailTruncated"
            type="warning"
            show-icon
            class="phase-one-retention-alert"
          >
            实际发现 {{ selectedAuditResult.anomalyCount.toLocaleString('zh-CN') }} 项异常，共产生
            {{
              (
                selectedAuditResult.candidateDetailCount ?? selectedAuditResult.anomalyCount
              ).toLocaleString('zh-CN')
            }}
            条明细证据；本次仅保存
            {{
              (
                selectedAuditResult.persistedDetailCount ??
                selectedAuditResult.detailTotal ??
                0
              ).toLocaleString('zh-CN')
            }}
            条可查询证据（上限
            {{ (selectedAuditResult.detailLimit ?? 1000).toLocaleString('zh-CN') }} 条）。
            搜索范围仅覆盖已保存证据，未搜索到不代表该对象没有异常。
          </el-alert>
          <div v-if="isPhaseOne" class="phase-one-detail-toolbar">
            <div class="phase-one-detail-heading">
              <el-button
                v-if="isPhaseOneDetailPage"
                class="phase-one-detail-back"
                link
                circle
                aria-label="返回问题中心"
                title="返回问题中心"
                @click="clearResultDeepLink"
              >
                <template #icon><icon-arrow-left /></template>
              </el-button>
              <h3>{{ isPhaseOneComparisonResult ? '两表对比明细' : '基础数据稽核明细' }}</h3>
            </div>
            <div class="phase-one-run-summary" aria-label="本次稽核运行摘要">
              <div class="phase-one-summary-item metric primary">
                <span class="phase-one-summary-icon"><legacy-icon name="storage" /></span>
                <span class="phase-one-summary-content"
                  ><span>核查总数</span><strong>{{ selectedAuditResult.totalCount }}</strong></span
                >
              </div>
              <div class="phase-one-summary-item metric danger">
                <span class="phase-one-summary-icon"
                  ><legacy-icon name="exclamation-circle"
                /></span>
                <span class="phase-one-summary-content"
                  ><span>异常项数</span
                  ><strong>{{
                    selectedAuditResult.anomalyCount.toLocaleString('zh-CN')
                  }}</strong></span
                >
              </div>
              <div class="phase-one-summary-item datetime">
                <span class="phase-one-summary-icon"><legacy-icon name="calendar" /></span>
                <span class="phase-one-summary-content"
                  ><span>业务日期</span><strong>{{ selectedAuditResult.bizDate }}</strong></span
                >
              </div>
              <div class="phase-one-summary-item datetime">
                <span class="phase-one-summary-icon"><legacy-icon name="clock-circle" /></span>
                <span class="phase-one-summary-content"
                  ><span>执行时间</span><strong>{{ selectedAuditResult.executedAt }}</strong></span
                >
              </div>
            </div>
            <div class="phase-one-detail-filters">
              <div class="phase-one-filter-item">
                <span class="phase-one-filter-label">核查对象</span>
                <el-select
                  v-model="phaseOneDetailFilters.objectKeys"
                  class="phase-one-filter-control"
                  multiple
                  filterable
                  remote
                  clearable
                  collapse-tags
                  :max-collapse-tags="2"
                  :remote-method="handlePhaseOneObjectSearch"
                  :loading="phaseOneDetailLoading"
                  :placeholder="`搜索${phaseOneObjectTypeLabel}编号或名称（可多选）`"
                  @change="handlePhaseOneObjectSelection"
                >
                  <el-option
                    v-for="option in phaseOneDetailObjectOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                    >{{ option.label }}</el-option
                  >
                </el-select>
              </div>
              <div class="phase-one-filter-item">
                <span class="phase-one-filter-label">{{
                  isPhaseOneComparisonResult ? '对比指标' : '核查项'
                }}</span>
                <el-select
                  v-model="phaseOneDetailFilters.metricCodes"
                  class="phase-one-filter-control"
                  multiple
                  filterable
                  clearable
                  collapse-tags
                  :max-collapse-tags="2"
                  :loading="phaseOneDetailOptionsLoading"
                  placeholder="选择字段 / 指标（可多选）"
                >
                  <el-option
                    v-for="option in phaseOneDetailMetricOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                    >{{ option.label }}</el-option
                  >
                </el-select>
              </div>
              <div class="phase-one-detail-query-actions">
                <el-button
                  type="primary"
                  :loading="phaseOneDetailLoading"
                  @click="queryPhaseOneDetailFilters"
                  >查询</el-button
                >
                <el-button @click="resetPhaseOneDetailFilters">重置</el-button>
              </div>
            </div>
          </div>
          <div v-else class="result-detail-title">
            <div>
              <h3>本次异常明细</h3>
              <p>仅展示对象主键和本规则实际核对的值，不强制不同规则共用同一宽表结构。</p>
            </div>
            <el-tag
              >{{ detailTypeLabel(selectedAuditResult.detailType) }} ·
              {{ selectedAuditResult.details.length }} 条</el-tag
            >
          </div>

          <el-alert
            v-if="
              isPhaseOne &&
              selectedAuditResult.detailTruncated &&
              hasPhaseOneDetailFilters &&
              !phaseOneDetailLoading &&
              (selectedAuditResult.detailTotal ?? 0) === 0
            "
            type="warning"
            show-icon
            class="phase-one-retention-search-alert"
            >未在本次已保存证据中找到该对象或指标，不代表它没有异常。</el-alert
          >

          <div
            ref="phaseOneDetailTableShellRef"
            :class="{ 'phase-one-detail-table-shell': isPhaseOne }"
          >
            <el-table
              :data="visibleSelectedAuditDetails"
              :loading="isPhaseOne && phaseOneDetailLoading"
              :show-overflow-tooltip="false"
              :border="false"
              stripe
            >
              <el-table-column
                v-for="(column, index) in selectedAuditResult.displayColumns"
                :key="column.dataIndex"
                :label="column.title"
                :prop="column.dataIndex"
                :width="phaseOneDetailColumnWidth(column, index)"
                :align="
                  isPhaseOne && column.display === 'result'
                    ? 'center'
                    : isPhaseOne && (column.display === 'number' || column.display === 'danger')
                      ? 'right'
                      : undefined
                "
                :sortable="phaseOneDetailColumnSortable(column)"
                :sort-method="phaseOneDetailSortMethod(column)"
              >
                <template #default="{ row: record }">
                  <el-tag
                    v-if="column.display === 'result'"
                    :type="tagType(detailResultColor(record[column.dataIndex]))"
                    size="small"
                    >{{ detailResultText(record[column.dataIndex]) }}</el-tag
                  >
                  <strong
                    v-else-if="column.display === 'primary'"
                    class="detail-primary-cell"
                    :title="record[column.dataIndex]"
                    >{{ record[column.dataIndex] }}</strong
                  >
                  <span
                    v-else
                    :class="{
                      'number-cell': column.display === 'number' || column.display === 'danger',
                      'diff-alert':
                        column.display === 'danger' &&
                        record.resultCode !== 'PASS' &&
                        record.result !== '一致' &&
                        record.result !== '通过',
                    }"
                    >{{ record[column.dataIndex] }}</span
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-if="isPhaseOne" class="phase-one-detail-pagination">
            <span class="muted"
              >共 {{ selectedAuditResult.detailTotal ?? 0 }} 条符合条件的明细</span
            >
            <el-pagination
              v-model:current-page="phaseOneDetailPage"
              v-model:page-size="phaseOneDetailPageSize"
              :total="selectedAuditResult.detailTotal ?? 0"
              :page-sizes="[20, 50, 100, 200]"
              layout="prev, pager, next, sizes, jumper"
              size="small"
              @current-change="handlePhaseOneDetailPageChange"
              @size-change="handlePhaseOneDetailPageSizeChange"
            />
          </div>
        </template>
      </template>
      <template v-if="!isPhaseOneDetailPage" #footer
        ><div class="result-detail-footer">
          <el-space
            ><el-button @click="goTo(auditPath('operations'))">{{
              isPhaseOne ? '返回稽核运维' : '返回巡检历史'
            }}</el-button
            ><el-button type="primary" @click="clearResultDeepLink">关闭</el-button></el-space
          >
        </div></template
      >
    </el-drawer>

    <!-- 问题闭环详情抽屉 -->
    <el-drawer
      v-model="issueDrawerVisible"
      :size="720"
      :title="selectedIssue?.title"
      destroy-on-close
    >
      <template v-if="selectedIssue">
        <div class="drawer-title-line">
          <span class="priority-chip" :class="selectedIssue.priority.toLowerCase()">{{
            selectedIssue.priority
          }}</span
          ><span>{{ selectedIssue.id }}</span
          ><el-tag>{{ layerLabel(selectedIssue.layer) }}</el-tag
          ><el-tag :type="tagType(statusColor(selectedIssue.status))">{{
            selectedIssue.status
          }}</el-tag>
        </div>
        <h2 class="drawer-subject">{{ selectedIssue.subject }}</h2>
        <p class="drawer-impact">{{ selectedIssue.impact }}</p>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="业务日期">{{ selectedIssue.bizDate }}</el-descriptions-item>
          <el-descriptions-item label="责任组">{{
            selectedIssue.responsibleGroup
          }}</el-descriptions-item>
          <el-descriptions-item label="主负责人">{{ selectedIssue.owner }}</el-descriptions-item>
          <el-descriptions-item label="首次发生">{{
            selectedIssue.firstSeen
          }}</el-descriptions-item>
          <el-descriptions-item label="最近发生">{{ selectedIssue.lastSeen }}</el-descriptions-item>
        </el-descriptions>
        <el-tabs default-value="evidence">
          <el-tab-pane name="evidence" label="问题证据">
            <el-alert :type="selectedIssue.metricDemoId ? 'error' : 'warning'" show-icon>{{
              selectedIssue.explanation
            }}</el-alert>
            <el-table
              v-if="selectedIssue.metricDemoId"
              :data="selectedIssueMetrics"
              :show-overflow-tooltip="false"
              :border="false"
              stripe
            >
              <el-table-column label="指标" prop="metric" :width="190" />
              <el-table-column label="左侧值" prop="left" :width="140"
                ><template #default="{ row: record }"
                  ><span class="number-cell">{{ record.left }}</span></template
                ></el-table-column
              >
              <el-table-column label="右侧值" prop="right" :width="140"
                ><template #default="{ row: record }"
                  ><span class="number-cell">{{ record.right }}</span></template
                ></el-table-column
              >
              <el-table-column label="差额（左－右）" prop="diff" :width="150"
                ><template #default="{ row: record }"
                  ><span class="number-cell">{{ record.diff }}</span></template
                ></el-table-column
              >
              <el-table-column label="结果" :width="100"
                ><template #default="{ row: record }"
                  ><el-tag :type="tagType(metricResultColor(record.result))" size="small">{{
                    record.result
                  }}</el-tag></template
                ></el-table-column
              >
            </el-table>
            <div v-else class="evidence-box">
              <strong>系统证据</strong>
              <p>{{ selectedIssue.explanation }}</p>
              <code>{{ selectedIssue.ruleCode }}</code>
            </div>
          </el-tab-pane>
          <el-tab-pane name="timeline" label="处置时间线">
            <el-timeline>
              <el-timeline-item label="09:44"
                >首次命中，保存规则、参数、SQL 与结果快照</el-timeline-item
              >
              <el-timeline-item label="09:45"
                >问题去重完成，生成 P1 通知并开始 SLA 计时</el-timeline-item
              >
              <el-timeline-item label="10:02">已分派至 {{ selectedIssue.owner }}</el-timeline-item>
            </el-timeline>
          </el-tab-pane>
          <el-tab-pane name="notification" label="通知闭环">
            <div class="notification-resolve">
              <div>
                <span>责任分组</span><strong>{{ selectedIssue.responsibleGroup }}</strong>
              </div>
              <div>
                <span>本次负责人快照</span><strong>{{ selectedIssue.owner }}</strong>
              </div>
              <div>
                <span>确认 SLA</span
                ><strong>{{ selectedIssue.priority === 'P1' ? '30 分钟' : '2 小时' }}</strong>
              </div>
              <div><span>升级对象</span><strong>风控值班经理</strong></div>
            </div>
            <el-table
              :data="notificationDeliveries"
              :show-overflow-tooltip="false"
              :border="false"
              stripe
            >
              <el-table-column label="时间" prop="time" :width="72" />
              <el-table-column label="渠道" :width="100"
                ><template #default="{ row: record }"
                  ><el-tag type="primary" size="small">{{ record.channel }}</el-tag></template
                ></el-table-column
              >
              <el-table-column label="收件目标" :width="250"
                ><template #default="{ row: record }"
                  ><div class="cell-primary">{{ record.target }}</div>
                  <div class="cell-secondary">{{ record.note }}</div></template
                ></el-table-column
              >
              <el-table-column label="送达" :width="90"
                ><template #default="{ row: record }"
                  ><el-tag
                    :type="tagType(record.delivery === '已送达' ? 'green' : 'orange')"
                    size="small"
                    >{{ record.delivery }}</el-tag
                  ></template
                ></el-table-column
              >
              <el-table-column label="确认" :width="90"
                ><template #default="{ row: record }"
                  ><el-tag
                    :type="tagType(record.ack === '已确认' ? 'green' : 'orange')"
                    size="small"
                    >{{ record.ack }}</el-tag
                  ></template
                ></el-table-column
              >
            </el-table>
            <el-alert type="success" show-icon
              >负责人在飞书卡片或平台问题页点击“确认处理”后，平台停止首次升级计时；问题恢复时仍会向原收件人发送恢复通知。</el-alert
            >
          </el-tab-pane>
          <el-tab-pane name="run" label="运行追溯"
            ><el-descriptions :column="1" border
              ><el-descriptions-item label="运行批次">AUD-0806-002</el-descriptions-item
              ><el-descriptions-item label="规则版本">audit-v3.2</el-descriptions-item
              ><el-descriptions-item label="元数据快照"
                >meta-dev-20260806-1016</el-descriptions-item
              ></el-descriptions
            ></el-tab-pane
          >
        </el-tabs>
      </template>
      <template #footer>
        <el-space
          ><el-button @click="actionMessage('已分派问题')">分派</el-button
          ><el-button @click="actionMessage('已创建重新稽核批次')">重新稽核</el-button
          ><el-button @click="actionMessage('已发起数据重跑')">发起数据重跑</el-button
          ><el-button type="primary" @click="actionMessage('问题已确认')"
            >确认问题</el-button
          ></el-space
        >
      </template>
    </el-drawer>

    <!-- 左右 SQL 配置 -->
    <el-drawer v-model="showSqlDrawer" :size="980" title="SQL 对比配置" destroy-on-close>
      <div class="contract-grid">
        <div><span>输出模式</span><strong>指标集合 · 每侧 1 行 × N 个 DECIMAL 指标</strong></div>
        <div><span>上下文参数</span><strong>party_id + data_date</strong></div>
        <div><span>NULL 策略</span><strong>保持 NULL，禁止自动转 0</strong></div>
      </div>
      <div class="execution-policy-grid">
        <div>
          <span>日期与运行</span><strong>{{ selectedMetricDemo.calendar }}</strong>
        </div>
        <div>
          <span>责任与通知</span
          ><strong>{{ selectedMetricDemo.owner }} · 飞书群 + 邮件失败兜底 · P1 30 分钟</strong>
        </div>
      </div>
      <div class="sql-compare-grid">
        <section>
          <div class="sql-panel-title">
            <strong>左侧 · {{ selectedMetricDemo.leftName }}</strong
            ><el-tag type="success">只读</el-tag>
          </div>
          <pre><code>{{ selectedMetricDemo.leftSql }}</code></pre>
        </section>
        <section>
          <div class="sql-panel-title">
            <strong>右侧 · {{ selectedMetricDemo.rightName }}</strong
            ><el-tag type="success">只读</el-tag>
          </div>
          <pre><code>{{ selectedMetricDemo.rightSql }}</code></pre>
        </section>
      </div>
      <el-alert type="info" show-icon
        >发布前自动检查：输出行数、字段类型、字段映射、对账键唯一性、SQL
        只读性和历史回测结果。</el-alert
      >
    </el-drawer>

    <AuditRuleCreate
      v-model:visible="showRuleModal"
      @published="actionMessage('新稽核已加入规则列表')"
    />
    <AuditGroupEditor
      v-model:visible="groupEditorVisible"
      :group="editingGroup"
      @save="saveGroupPolicy"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage as Message } from 'element-plus'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  ArrowLeft as IconArrowLeft,
  ArrowRight as IconRight,
  CircleCheck as IconCheckCircle,
  CircleClose as IconCloseCircle,
  Clock as IconClockCircle,
  Document as IconCode,
  Download as IconDownload,
  Files as IconStorage,
  List as IconList,
  Plus as IconPlus,
  Refresh as IconRefresh,
  Remove as IconStop,
  VideoPlay as IconPlayArrow,
  Warning as IconExclamationCircle,
} from '@element-plus/icons-vue'
import PageHeader from '../../components/PageHeader.vue'
import LegacyIcon from '../../components/icons/LegacyIcon.vue'
import AuditRuleCreate from '../../components/audit/AuditRuleCreate.vue'
import AuditGroupEditor, {
  type AuditResponsibilityGroup,
} from '../../components/audit/AuditGroupEditor.vue'
import {
  auditIssues,
  auditRuns,
  auditResults,
  l0AuditRules,
  metricAuditDemos,
  riskTargets,
  type AuditDisplayColumn,
  type AuditIssue,
  type AuditMetric,
  type AuditResultDetail,
  type AuditResultSummary,
  type AuditLayer,
  type AuditRun,
} from '../../data/auditMock'
import {
  getPhaseOneDashboard,
  getPhaseOneRun,
  getPhaseOneRunDetails,
  getPhaseOneRunFilterOptions,
  getPhaseOneRuns,
  type PhaseOneAuditStatus,
  type PhaseOneAuditType,
  type PhaseOneDashboardResponse,
  type PhaseOneDetailItem,
  type PhaseOneDetailListParams,
  type PhaseOneDetailListResponse,
  type PhaseOneDisplaySchema,
  type PhaseOneExecStatus,
  type PhaseOneRunItem,
  type PhaseOneRunListSummary,
} from '../../api/auditPhaseOne'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    section?: string
    edition?: 'phase1' | 'full'
  }>(),
  {
    section: undefined,
    edition: undefined,
  },
)
const route = useRoute()
const router = useRouter()
const section = computed(() => props.section || String(route.meta.section || 'dashboard'))
const edition = computed(() => props.edition || String(route.meta.edition || 'full'))
const isPhaseOne = computed(() => edition.value === 'phase1')
const phaseOneDetailRunId = computed(() =>
  typeof route.params.runId === 'string' ? route.params.runId : '',
)
const isPhaseOneDetailPage = computed(
  () => isPhaseOne.value && section.value === 'issues' && Boolean(phaseOneDetailRunId.value),
)
const phaseOnePageUpdatedAt = ref('—')
const phaseOneAuditDate = ref('')
const phaseOneTrendRules = ref<string[]>([])
const phaseOneTrendChartRef = ref<HTMLDivElement | null>(null)
let phaseOneTrendChart: ReturnType<typeof echarts.init> | null = null
let phaseOneTrendResizeObserver: ResizeObserver | null = null
const phaseOneDashboard = ref<PhaseOneDashboardResponse | null>(null)
const phaseOneApiResults = ref<AuditResultSummary[]>([])
const phaseOneApiRuns = ref<AuditRun[]>([])
const phaseOneIssueTotal = ref(0)
const phaseOneOperationsTotal = ref(0)
const phaseOneOperationsSummary = ref<PhaseOneRunListSummary | null>(null)
const phaseOneLoading = ref(false)
const phaseOneListLoading = ref(false)
const phaseOneDetailLoading = ref(false)
const phaseOneDetailOptionsLoading = ref(false)
const phaseOneLoadError = ref('')
const PHASE_ONE_DETAIL_DEFAULT_PAGE_SIZE = 50
const phaseOneDetailRequestCache = new Map<string, Promise<PhaseOneDetailListResponse>>()
let phaseOneKeywordTimer: ReturnType<typeof setTimeout> | null = null
let phaseOneDetailFilterTimer: ReturnType<typeof setTimeout> | null = null
let phaseOneDetailRequestSequence = 0
let phaseOneDetailFiltersReady = false
const phaseOneDetailTableShellRef = ref<HTMLElement | null>(null)
const phaseOneDetailTableWidth = ref(0)
let phaseOneDetailTableResizeObserver: ResizeObserver | null = null

function formatLocalDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatRefreshTime(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(value)
    .replace(/\//g, '-')
}

function phaseOneDetailRequestKey(runId: string, params: PhaseOneDetailListParams) {
  return JSON.stringify({
    runId,
    page: params.page,
    pageSize: params.pageSize,
    objectKeyword: params.objectKeyword || '',
    objectKeys: [...(params.objectKeys || [])].sort(),
    metricCodes: [...(params.metricCodes || [])].sort(),
    resultCodes: [...(params.resultCodes || [])].sort(),
    resultGroup: params.resultGroup || '',
  })
}

function loadPhaseOneDetailPage(runId: string, params: PhaseOneDetailListParams) {
  const cacheKey = phaseOneDetailRequestKey(runId, params)
  const cached = phaseOneDetailRequestCache.get(cacheKey)
  if (cached) return cached
  if (phaseOneDetailRequestCache.size >= 40) {
    const oldestKey = phaseOneDetailRequestCache.keys().next().value
    if (oldestKey) phaseOneDetailRequestCache.delete(oldestKey)
  }
  const request = getPhaseOneRunDetails(runId, params).catch((error) => {
    phaseOneDetailRequestCache.delete(cacheKey)
    throw error
  })
  phaseOneDetailRequestCache.set(cacheKey, request)
  return request
}

async function refreshDashboard() {
  if (isPhaseOne.value) {
    await refreshPhaseOnePage(true)
    return
  }
  Message.success('驾驶舱已刷新')
}

onMounted(async () => {
  if (isPhaseOne.value) await refreshPhaseOnePage(false)
  await nextTick()
  renderPhaseOneTrendChart()
})
onBeforeUnmount(() => {
  if (phaseOneKeywordTimer) clearTimeout(phaseOneKeywordTimer)
  if (phaseOneDetailFilterTimer) clearTimeout(phaseOneDetailFilterTimer)
  phaseOneDetailTableResizeObserver?.disconnect()
  disposePhaseOneTrendChart()
})
const auditBasePath = computed(() => (isPhaseOne.value ? '/audit-phase1' : '/audit-full'))
function auditPath(target: 'dashboard' | 'issues' | 'rules' | 'operations' | 'strategies') {
  return `${auditBasePath.value}/${target}`
}
function phaseOneIssueDetailPath(runId: string) {
  return `/audit-phase1/issues/detail/${encodeURIComponent(runId)}`
}

const pageMap: Record<string, { title: string; description: string }> = {
  dashboard: { title: '稽核驾驶舱', description: '聚合今天需要处理的问题、风险暴露与处置进度' },
  issues: {
    title: '问题中心',
    description: '聚合异常问题，连续追踪证据、分派、SLA、重跑、复核与恢复',
  },
  rules: { title: '规则设计', description: '通用模板降低配置量，左右 SQL 对比承载复杂业务口径' },
  operations: {
    title: '巡检历史',
    description: '保留每次运行记录，区分执行状态与稽核结果，并按 run_id 深链异常明细',
  },
  strategies: {
    title: '高风险策略',
    description: '针对重点客户覆盖频率、阈值、等级、SLA 和通知路由',
  },
}
const phaseOnePageMap: Record<string, { title: string; description: string }> = {
  dashboard: { title: '稽核驾驶舱', description: '汇总一期上线稽核，只读呈现运行状态与异常提示' },
  issues: { title: '问题中心', description: '查询一期稽核异常，点击明细直接查看本次核对结果' },
  operations: { title: '稽核运维', description: '查询一期全部运行历史，区分执行状态与稽核结果' },
}
const pageConfig = computed(() => {
  const config = isPhaseOne.value ? phaseOnePageMap[section.value] : pageMap[section.value]
  return config || pageMap.dashboard
})

const issueTrend = [
  { date: '07-31', value: 6 },
  { date: '08-01', value: 8 },
  { date: '08-02', value: 7 },
  { date: '08-03', value: 9 },
  { date: '08-04', value: 8 },
  { date: '08-05', value: 9 },
  { date: '08-06', value: 11 },
]
const phaseOneTrendRuleOptions = computed(() => {
  const options = new Map<string, string>()
  const points = phaseOneDashboard.value?.trendByRule || phaseOneDashboard.value?.trend || []
  points.forEach(({ ruleCode, ruleName }) => {
    if (ruleCode) options.set(ruleCode, ruleName || ruleCode)
  })
  return Array.from(options, ([value, label]) => ({ label, value }))
})
const phaseOneIssueTrend = computed(() => {
  const aggregatePoints = phaseOneDashboard.value?.trend || []
  const rulePoints = phaseOneDashboard.value?.trendByRule || []
  const selectedRules = new Set(phaseOneTrendRules.value)
  const selected = selectedRules.size
    ? rulePoints.filter(({ ruleCode }) => Boolean(ruleCode && selectedRules.has(ruleCode)))
    : aggregatePoints
  const grouped = new Map<string, number>()
  selected.forEach((point) =>
    grouped.set(
      point.date,
      (grouped.get(point.date) || 0) + (point.exceptionCount ?? point.value ?? 0),
    ),
  )
  return Array.from(grouped, ([date, value]) => ({ date: date.slice(5), value })).slice(-7)
})
const phaseOneTrendPalette = ['#165dff', '#722ed1', '#f7ba1e', '#00b42a', '#0fc6c2']
const phaseOneTrendSeries = computed(() => {
  const selectedRules = new Set(phaseOneTrendRules.value)
  const rulePoints = phaseOneDashboard.value?.trendByRule || []
  const visibleRulePoints = selectedRules.size
    ? rulePoints.filter(({ ruleCode }) => Boolean(ruleCode && selectedRules.has(ruleCode)))
    : rulePoints
  if (visibleRulePoints.some(({ ruleCode }) => ruleCode)) {
    const seriesMap = new Map<string, { name: string; points: Map<string, number> }>()
    visibleRulePoints.forEach((point) => {
      if (!point.ruleCode) return
      if (!seriesMap.has(point.ruleCode)) {
        seriesMap.set(point.ruleCode, { name: point.ruleName || point.ruleCode, points: new Map() })
      }
      const series = seriesMap.get(point.ruleCode)!
      const date = point.date.slice(5)
      series.points.set(
        date,
        (series.points.get(date) || 0) + (point.exceptionCount ?? point.value ?? 0),
      )
    })
    return Array.from(seriesMap, ([key, series], index) => ({
      key,
      name: series.name,
      color: phaseOneTrendPalette[index % phaseOneTrendPalette.length],
      points: Array.from(series.points, ([date, value]) => ({ date, value })).slice(-7),
    }))
  }
  return [
    {
      key: 'all',
      name: '异常项数',
      color: phaseOneTrendPalette[0],
      points: phaseOneIssueTrend.value,
    },
  ]
})
const phaseOneTrendMax = computed(() =>
  Math.max(1, ...phaseOneIssueTrend.value.map(({ value }) => value)),
)
const visibleIssueTrend = computed(() => (isPhaseOne.value ? phaseOneIssueTrend.value : issueTrend))

function disposePhaseOneTrendChart() {
  phaseOneTrendResizeObserver?.disconnect()
  phaseOneTrendResizeObserver = null
  phaseOneTrendChart?.dispose()
  phaseOneTrendChart = null
}

function renderPhaseOneTrendChart() {
  const element = phaseOneTrendChartRef.value
  if (!element || !isPhaseOne.value || section.value !== 'dashboard') {
    disposePhaseOneTrendChart()
    return
  }
  if (!phaseOneTrendChart) {
    phaseOneTrendChart = echarts.init(element)
    phaseOneTrendChart.on('click', () => goTo(auditPath('issues')))
    phaseOneTrendResizeObserver = new ResizeObserver(() => phaseOneTrendChart?.resize())
    phaseOneTrendResizeObserver.observe(element)
  }
  const trendSeries = phaseOneTrendSeries.value
  const dates = Array.from(
    new Set(trendSeries.flatMap(({ points }) => points.map(({ date }) => date))),
  )
    .sort()
    .slice(-7)
  const maxValue = Math.max(
    0,
    ...trendSeries.flatMap(({ points }) => points.map(({ value }) => value)),
  )
  const yAxisMax = Math.max(10, Math.ceil((maxValue * 1.15) / 10) * 10)
  phaseOneTrendChart.setOption(
    {
      animationDuration: 360,
      grid: { left: 46, right: 28, top: 38, bottom: 42 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params]
          return `${items[0]?.axisValue || ''}<br/>${items.map((item: any) => `${item.marker}${item.seriesName}：${item.value} 项`).join('<br/>')}`
        },
        backgroundColor: '#ffffff',
        borderColor: '#e5e6eb',
        borderWidth: 1,
        textStyle: { color: '#1d2129', fontSize: 12 },
        extraCssText: 'box-shadow:0 6px 18px rgba(29,33,41,.12);border-radius:6px;',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#c9cdd4' } },
        axisTick: { show: false },
        axisLabel: { color: '#86909c', fontSize: 12, margin: 14 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yAxisMax,
        splitNumber: 4,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#86909c', fontSize: 12 },
        splitLine: { lineStyle: { color: '#e5e6eb', type: 'dashed' } },
      },
      series: trendSeries.map((series, index) => {
        const pointMap = new Map(series.points.map(({ date, value }) => [date, value]))
        return {
          name: series.name,
          type: 'line',
          data: dates.map((date) => pointMap.get(date) || 0),
          smooth: false,
          symbol: index % 2 === 0 ? 'circle' : 'diamond',
          symbolSize: 8,
          showSymbol: true,
          lineStyle: { color: series.color, width: 3 },
          itemStyle: { color: series.color, borderColor: '#ffffff', borderWidth: 2 },
          label: {
            show: true,
            position: 'top',
            formatter: ({ value }: { value: number }) =>
              trendSeries.length > 1 && value === 0 ? '' : String(value),
            color: '#4e5969',
            fontSize: 12,
            distance: 10,
          },
          emphasis: { scale: 1.25 },
        }
      }),
    },
    true,
  )
}

watch(
  () => [
    section.value,
    isPhaseOne.value,
    phaseOneTrendRules.value.join('|'),
    ...phaseOneTrendSeries.value.flatMap(({ key, points }) => [
      key,
      ...points.flatMap(({ date, value }) => [date, value]),
    ]),
  ],
  async () => {
    await nextTick()
    renderPhaseOneTrendChart()
  },
)

function phaseOnePickerDate(value: unknown) {
  if (value && typeof (value as { format?: unknown }).format === 'function') {
    return (value as { format: (pattern: string) => string }).format('YYYY-MM-DD')
  }
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return String(value || '').slice(0, 10)
}
function disabledPhaseOneDate(value: unknown) {
  const date = phaseOnePickerDate(value)
  const available = phaseOneDashboard.value?.availableObservationDates || []
  if (available.length > 0) return !available.includes(date)
  return date > formatLocalDate(new Date())
}
function trendBarHeight(value: number) {
  if (!isPhaseOne.value) return `${value * 8}px`
  if (value <= 0) return '0'
  return `${Math.max(12, Math.round((value / phaseOneTrendMax.value) * 88))}%`
}
function formatCompactAuditCount(value: number) {
  const count = Math.max(0, Number(value) || 0)
  const compact = (amount: number, unit: string) =>
    `${amount.toFixed(amount >= 10 ? 0 : 1).replace(/\.0$/, '')}${unit}`
  if (count >= 100_000_000) return compact(count / 100_000_000, '亿')
  if (count >= 10_000) return compact(count / 10_000, '万')
  return count.toLocaleString('zh-CN')
}
const closureSteps = [
  { title: '发现', desc: '保存证据快照' },
  { title: '告警', desc: '去重并分级' },
  { title: '处置', desc: '分派与 SLA' },
  { title: '重跑', desc: '修复数据链路' },
  { title: '复核', desc: '通过后恢复' },
]
const phaseOneFlowSteps = [
  { title: '稽核执行', desc: '执行上线核查' },
  { title: '统一接入', desc: '按标准结构写入' },
  { title: '结果落表', desc: '保存运行与异常证据' },
  { title: '页面提示', desc: '直接展示核对结果' },
  { title: '历史留痕', desc: '保留每次运行记录' },
]
const dashboardFlowSteps = computed(() => (isPhaseOne.value ? phaseOneFlowSteps : closureSteps))

const phaseOneResults = computed(() => phaseOneApiResults.value)
const phaseOneRuns = computed(() => phaseOneApiRuns.value)
const visibleAuditRuns = computed(() => (isPhaseOne.value ? phaseOneRuns.value : auditRuns))
const visibleAuditResults = computed(() =>
  isPhaseOne.value ? phaseOneResults.value : auditResults,
)
const phaseOneExceptionResults = computed(() =>
  (phaseOneDashboard.value?.priorityRuns || []).map((item) => mapPhaseOneRun(item)),
)
function phaseOneCount(value: number | null | undefined) {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0
}

const phaseOneSummary = computed(() => {
  const dashboard = phaseOneDashboard.value
  const summary = dashboard?.summary
  const runCount = phaseOneCount(summary?.runCount)
  const successfulRuns = phaseOneCount(summary?.successfulRuns)
  const legacyAbnormalRuns = phaseOneCount(summary?.abnormalRuns)
  const legacyUnavailableRuns = phaseOneCount(summary?.blockedOrNoDataRuns)
  const completedRuns =
    summary?.completedRuns == null
      ? runCount || successfulRuns + phaseOneCount(summary?.failedRuns)
      : phaseOneCount(summary.completedRuns)
  const expectedRuns =
    summary?.expectedRuns == null
      ? completedRuns
      : Math.max(completedRuns, phaseOneCount(summary.expectedRuns))
  const fallbackExceptionCounts = (dashboard?.priorityRuns || []).reduce(
    (counts, run) => {
      const exceptionCount = phaseOneCount(run.exceptionCount)
      if (run.detailType === 'ROW_QUALITY') counts.rowQuality += exceptionCount
      if (run.detailType === 'METRIC_COMPARE') counts.metricCompare += exceptionCount
      return counts
    },
    { rowQuality: 0, metricCompare: 0 },
  )

  return {
    completedRuns,
    expectedRuns,
    failedAuditRuns:
      summary?.failedAuditRuns == null
        ? Math.max(0, legacyAbnormalRuns - legacyUnavailableRuns)
        : phaseOneCount(summary.failedAuditRuns),
    passedRuns:
      summary?.passedRuns == null
        ? Math.max(0, successfulRuns - legacyAbnormalRuns)
        : phaseOneCount(summary.passedRuns),
    notTriggeredRuns:
      summary?.notTriggeredRuns == null
        ? Math.max(0, expectedRuns - completedRuns)
        : phaseOneCount(summary.notTriggeredRuns),
    failedRuns: phaseOneCount(summary?.failedRuns),
    sourceUnavailableRuns:
      summary?.sourceUnavailableRuns == null
        ? legacyUnavailableRuns
        : phaseOneCount(summary.sourceUnavailableRuns),
    rowQualityExceptionCount:
      summary?.rowQualityExceptionCount == null
        ? fallbackExceptionCounts.rowQuality
        : phaseOneCount(summary.rowQualityExceptionCount),
    metricCompareExceptionCount:
      summary?.metricCompareExceptionCount == null
        ? fallbackExceptionCounts.metricCompare
        : phaseOneCount(summary.metricCompareExceptionCount),
  }
})

function phaseOneObjectLabel(
  targetType?: string,
  schema?: PhaseOneDisplaySchema | null,
  targetTypeLabel?: string,
) {
  if (schema?.objectTypeLabel) return schema.objectTypeLabel
  if (targetTypeLabel) return targetTypeLabel
  const labels: Record<string, string> = {
    CUSTOMER: '交易对手',
    ACCOUNT: '账户',
    INSTRUMENT: '合约',
    REPORT: '报告',
    TABLE: '数据表',
    ROW: '数据记录',
  }
  return labels[String(targetType || '').toUpperCase()] || '核查对象'
}

function normalizeDisplayKey(key: string) {
  const keys: Record<string, string> = {
    object_key: 'objectKey',
    object_name: 'objectName',
    metric_code: 'metricCode',
    metric_name: 'metric',
    actual_value: 'actual',
    expected_value: 'expected',
    left_value: 'left',
    right_value: 'right',
    diff_value: 'diff',
    result_code: 'result',
    reason: 'reason',
  }
  return keys[key] || key
}

function phaseOneDisplayColumns(run: PhaseOneRunItem): AuditDisplayColumn[] {
  const schemaColumns = run.displaySchema?.columns
  if (schemaColumns?.length) {
    const columns = schemaColumns.map((column) => ({
      title: column.label,
      dataIndex: normalizeDisplayKey(column.key),
      width: column.width,
      display: column.display,
    }))
    const objectLabel = phaseOneObjectLabel(run.targetType, run.displaySchema, run.targetTypeLabel)
    const identityColumns: AuditDisplayColumn[] = []
    if (!columns.some(({ dataIndex }) => dataIndex === 'objectKey')) {
      identityColumns.push({
        title: `${objectLabel}ID`,
        dataIndex: 'objectKey',
        width: 210,
        display: 'primary',
      })
    }
    if (
      run.detailType === 'METRIC_COMPARE' &&
      !columns.some(({ dataIndex }) => dataIndex === 'objectName')
    ) {
      identityColumns.push({ title: `${objectLabel}名称`, dataIndex: 'objectName', width: 190 })
    }
    return [...identityColumns, ...columns]
  }
  const objectLabel = phaseOneObjectLabel(run.targetType, run.displaySchema, run.targetTypeLabel)
  if (run.detailType === 'METRIC_COMPARE') {
    return [
      { title: objectLabel, dataIndex: 'objectKey', width: 200, display: 'primary' },
      { title: '核查字段 / 指标', dataIndex: 'metric', width: 210, display: 'primary' },
      {
        title: run.displaySchema?.leftLabel || '我方值',
        dataIndex: 'left',
        width: 180,
        display: 'number',
      },
      {
        title: run.displaySchema?.rightLabel || '对照方值',
        dataIndex: 'right',
        width: 180,
        display: 'number',
      },
      { title: '差额', dataIndex: 'diff', width: 170, display: 'danger' },
      { title: '结果', dataIndex: 'result', width: 110, display: 'result' },
    ]
  }
  return [
    { title: objectLabel, dataIndex: 'objectKey', width: 408, display: 'primary' },
    { title: '核查字段 / 核查项', dataIndex: 'metric', width: 208 },
    { title: '实际值', dataIndex: 'actual', width: 173, display: 'number' },
    { title: '期望值 / 规则', dataIndex: 'expected', width: 231 },
    { title: '结果', dataIndex: 'result', width: 128, display: 'result' },
  ]
}

function phaseOneExecText(code: PhaseOneExecStatus, text?: string) {
  if (text) return text
  return { RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败', SKIPPED: '跳过' }[code]
}

function phaseOneAuditText(code: PhaseOneAuditStatus, text?: string) {
  if (text) return text
  return {
    NOT_PRODUCED: '未产出',
    PASS: '通过',
    FAIL: '异常',
    BLOCKED: '阻断',
    NO_DATA: '无数据',
    SKIPPED: '跳过',
  }[code]
}

function formatApiTime(value?: string | null) {
  if (!value) return '—'
  return value
    .replace('T', ' ')
    .replace(/\.\d+(?=Z|[+-]\d{2}:\d{2}$)/, '')
    .replace(/Z|[+-]\d{2}:\d{2}$/, '')
}

function mapPhaseOneRun(
  run: PhaseOneRunItem,
  details: AuditResultDetail[] = [],
): AuditResultSummary {
  const execStatus = phaseOneExecText(run.execStatus)
  const auditResult = phaseOneAuditText(run.auditStatus, run.auditStatusLabel)
  return {
    runId: run.runId,
    layer: run.layer,
    checkName: run.ruleName,
    objectName: run.targetName,
    source: 'DS 结果',
    execStatus,
    auditResult,
    totalCount: run.totalCount ?? 0,
    anomalyCount: run.exceptionCount,
    candidateDetailCount: run.candidateDetailCount ?? undefined,
    persistedDetailCount: run.persistedDetailCount ?? run.detailCount ?? undefined,
    detailTruncated: Boolean(run.detailTruncated),
    detailLimit: run.detailLimit ?? undefined,
    bizDate: run.bizDate || '—',
    calendarSnapshot: '',
    executedAt: formatApiTime(run.executedAt || run.finishedAt || run.startedAt),
    duration:
      run.durationSeconds === null || run.durationSeconds === undefined
        ? '—'
        : `${run.durationSeconds}s`,
    message: run.errorMessage || run.summary || '',
    detailType: run.detailType === 'METRIC_COMPARE' ? 'comparison' : 'quality',
    detailScope: 'exceptions-only',
    filterable: true,
    objectType: run.targetType?.toLowerCase(),
    objectTypeLabel: phaseOneObjectLabel(run.targetType, run.displaySchema, run.targetTypeLabel),
    leftLabel: run.displaySchema?.leftLabel,
    rightLabel: run.displaySchema?.rightLabel,
    displayColumns: phaseOneDisplayColumns(run),
    details,
  }
}

function mapPhaseOneRunToAuditRun(run: PhaseOneRunItem): AuditRun {
  const execStatus = phaseOneExecText(run.execStatus)
  return {
    id: run.runId,
    layer: run.layer,
    name: run.ruleName,
    source: 'DS 结果',
    type: run.detailType === 'METRIC_COMPARE' ? '两表对比稽核' : '基础数据稽核',
    trigger: '批量调度',
    execStatus,
    auditResult: phaseOneAuditText(run.auditStatus, run.auditStatusLabel),
    totalCount: run.totalCount ?? 0,
    anomalyCount: run.exceptionCount,
    progress: run.execStatus === 'RUNNING' ? 0 : 100,
    duration:
      run.durationSeconds === null || run.durationSeconds === undefined
        ? '—'
        : `${run.durationSeconds}s`,
    message: run.errorMessage || run.summary || '',
    bizDate: run.bizDate || '—',
    calendarSnapshot: '',
    time: formatApiTime(run.executedAt || run.finishedAt || run.startedAt),
  }
}

function phaseOneResultText(item: PhaseOneDetailItem) {
  if (item.resultLabel) return item.resultLabel
  const labels: Record<string, string> = {
    PASS: '一致',
    OVER_THRESHOLD: '超阈值',
    LEFT_ONLY: '左有右无',
    RIGHT_ONLY: '左无右有',
    NOT_COMPARABLE: '不可比较',
    NO_DATA: '无数据',
    FAIL: '异常',
  }
  return labels[item.resultCode] || item.resultCode
}

function phaseOneValue(value?: string | null) {
  return value === null ? 'NULL' : value === undefined || value === '' ? '—' : value
}

function mapPhaseOneDetail(item: PhaseOneDetailItem): AuditResultDetail {
  return {
    objectKey: item.objectKey || undefined,
    objectName: item.objectName || undefined,
    metricCode: item.metricCode || undefined,
    metric: item.metricName || item.metricCode || '核查项',
    role: item.role === 'FORMAL' || item.role === 'DIAGNOSTIC' ? item.role : undefined,
    actual: phaseOneValue(item.actualValue),
    expected: phaseOneValue(item.expectedValue),
    left: phaseOneValue(item.leftValue),
    right: phaseOneValue(item.rightValue),
    diff: phaseOneValue(item.diffValue),
    result: phaseOneResultText(item),
    resultCode: item.resultCode as AuditResultDetail['resultCode'],
    reason: item.reason || undefined,
  }
}

async function loadPhaseOneDashboard() {
  const requestDate = phaseOneAuditDate.value || undefined
  const data = await getPhaseOneDashboard({
    observationDate: requestDate,
    timezone: 'Asia/Shanghai',
  })
  phaseOneDashboard.value = data
  phaseOneLoadError.value = ''
  if (data.observationDate) phaseOneAuditDate.value = data.observationDate
  if (data.refreshedAt) phaseOnePageUpdatedAt.value = formatRefreshTime(new Date(data.refreshedAt))
}

async function loadPhaseOneIssueRuns() {
  if (!isPhaseOne.value || section.value !== 'issues') return
  phaseOneListLoading.value = true
  try {
    const [bizDateFrom, bizDateTo] = resultFilters.dateRange || []
    const data = await getPhaseOneRuns({
      view: 'issues',
      bizDateFrom: bizDateFrom || undefined,
      bizDateTo: bizDateTo || undefined,
      auditType: resultFilters.auditType,
      keyword: resultFilters.keyword.trim() || undefined,
      page: phaseOneResultPage.value,
      pageSize: phaseOneResultPageSize.value,
    })
    phaseOneApiResults.value = data.items.map((item) => mapPhaseOneRun(item))
    phaseOneIssueTotal.value = data.total
    phaseOneLoadError.value = ''
    phaseOnePageUpdatedAt.value = data.refreshedAt
      ? formatRefreshTime(new Date(data.refreshedAt))
      : formatRefreshTime(new Date())
  } finally {
    phaseOneListLoading.value = false
  }
}

function phaseOneExecCode(value?: string): PhaseOneExecStatus | undefined {
  return (
    { 运行中: 'RUNNING', 成功: 'SUCCESS', 失败: 'FAILED', 跳过: 'SKIPPED' } as Record<
      string,
      PhaseOneExecStatus
    >
  )[value || '']
}

function phaseOneAuditCode(value?: string): PhaseOneAuditStatus | undefined {
  return (
    {
      未产出: 'NOT_PRODUCED',
      通过: 'PASS',
      异常: 'FAIL',
      阻断: 'BLOCKED',
      无数据: 'NO_DATA',
      跳过: 'SKIPPED',
    } as Record<string, PhaseOneAuditStatus>
  )[value || '']
}

async function loadPhaseOneOperationRuns() {
  if (!isPhaseOne.value || section.value !== 'operations') return
  phaseOneListLoading.value = true
  try {
    const [bizDateFrom, bizDateTo] = operationFilters.dateRange || []
    const data = await getPhaseOneRuns({
      view: 'history',
      bizDateFrom: bizDateFrom || undefined,
      bizDateTo: bizDateTo || undefined,
      auditType: operationFilters.auditType,
      execStatus: phaseOneExecCode(operationFilters.execStatus),
      auditStatus: phaseOneAuditCode(operationFilters.auditResult),
      keyword: operationFilters.keyword.trim() || undefined,
      page: phaseOneOperationsPage.value,
      pageSize: phaseOneOperationsPageSize.value,
    })
    phaseOneApiRuns.value = data.items.map(mapPhaseOneRunToAuditRun)
    phaseOneOperationsTotal.value = data.total
    phaseOneOperationsSummary.value = data.summary || null
    phaseOneLoadError.value = ''
    phaseOnePageUpdatedAt.value = data.refreshedAt
      ? formatRefreshTime(new Date(data.refreshedAt))
      : formatRefreshTime(new Date())
  } finally {
    phaseOneListLoading.value = false
  }
}

async function refreshPhaseOnePage(showSuccess: boolean) {
  if (!isPhaseOne.value || phaseOneLoading.value) return
  phaseOneLoading.value = true
  try {
    if (section.value === 'dashboard') {
      await loadPhaseOneDashboard()
    } else if (section.value === 'issues') {
      await loadPhaseOneIssueRuns()
    } else if (section.value === 'operations') {
      await loadPhaseOneOperationRuns()
    }
    if (phaseOnePageUpdatedAt.value === '—')
      phaseOnePageUpdatedAt.value = formatRefreshTime(new Date())
    if (showSuccess) Message.success('稽核数据已更新')
  } catch {
    phaseOneLoadError.value = '数据暂时无法加载，请稍后刷新'
  } finally {
    phaseOneLoading.value = false
  }
}

function schedulePhaseOneListRefresh(target: 'issues' | 'operations') {
  if (!isPhaseOne.value || section.value !== target) return
  if (phaseOneKeywordTimer) clearTimeout(phaseOneKeywordTimer)
  phaseOneKeywordTimer = setTimeout(() => {
    if (target === 'issues')
      void loadPhaseOneIssueRuns().catch(() => {
        phaseOneLoadError.value = '数据暂时无法加载，请稍后刷新'
      })
    else
      void loadPhaseOneOperationRuns().catch(() => {
        phaseOneLoadError.value = '数据暂时无法加载，请稍后刷新'
      })
  }, 300)
}

const issuePageTab = ref(isPhaseOne.value ? 'results' : 'closure')
const resultFilters = reactive({
  source: 'ds',
  layer: undefined as AuditLayer | undefined,
  auditType: undefined as PhaseOneAuditType | undefined,
  keyword: '',
  status: undefined as string | undefined,
  dateRange: [] as string[],
})
const filteredAuditResults = computed(() => {
  if (isPhaseOne.value) return phaseOneResults.value
  return visibleAuditResults.value.filter((item) => {
    const keyword = resultFilters.keyword.trim().toLowerCase()
    const sourceMatched =
      resultFilters.source === 'all' ||
      (resultFilters.source === 'ds' && item.source === 'DS 结果') ||
      (resultFilters.source === 'realtime' && item.source === '实时指标')
    const keywordMatched =
      !keyword ||
      [item.runId, item.checkName, item.objectName].some((value) =>
        value.toLowerCase().includes(keyword),
      )
    const statusMatched =
      !resultFilters.status ||
      item.execStatus === resultFilters.status ||
      item.auditResult === resultFilters.status
    return (
      item.auditResult !== '通过' &&
      sourceMatched &&
      (!resultFilters.layer || item.layer === resultFilters.layer) &&
      keywordMatched &&
      statusMatched
    )
  })
})
const phaseOneResultPage = ref(1)
const phaseOneResultPageSize = ref(10)
const phaseOneOperationsPage = ref(1)
const phaseOneOperationsPageSize = ref(10)
const pagedPhaseOneAuditResults = computed(() => phaseOneResults.value)
watch(
  () => [
    resultFilters.auditType,
    resultFilters.layer,
    resultFilters.keyword,
    resultFilters.status,
    resultFilters.dateRange?.join('|'),
  ],
  () => {
    phaseOneResultPage.value = 1
    schedulePhaseOneListRefresh('issues')
  },
)
watch([phaseOneResultPage, phaseOneResultPageSize], () => {
  if (isPhaseOne.value && section.value === 'issues')
    void loadPhaseOneIssueRuns().catch(() => {
      phaseOneLoadError.value = '数据暂时无法加载，请稍后刷新'
    })
})

const resultDrawerVisible = ref(false)
const selectedAuditResult = ref<AuditResultSummary | null>(null)
const selectedMetricObjectKey = ref('')
interface PhaseOneDetailOption {
  value: string
  label: string
}
const phaseOneDetailPage = ref(1)
const phaseOneDetailPageSize = ref(PHASE_ONE_DETAIL_DEFAULT_PAGE_SIZE)
const phaseOneDetailFilters = reactive({
  objectKeyword: '',
  objectKeys: [] as string[],
  metricCodes: [] as string[],
  resultGroup: undefined as 'MATCH' | 'MISMATCH' | 'UNDETERMINED' | undefined,
})
const phaseOneDetailObjectOptions = ref<PhaseOneDetailOption[]>([])
const phaseOneDetailMetricOptions = ref<PhaseOneDetailOption[]>([])
const isPhaseOneComparisonResult = computed(
  () => isPhaseOne.value && selectedAuditResult.value?.detailType === 'comparison',
)
const phaseOneObjectTypeLabel = computed(
  () => selectedAuditResult.value?.objectTypeLabel || '核查对象',
)
const hasPhaseOneDetailFilters = computed(
  () =>
    Boolean(phaseOneDetailFilters.objectKeyword.trim()) ||
    phaseOneDetailFilters.objectKeys.length > 0 ||
    phaseOneDetailFilters.metricCodes.length > 0 ||
    phaseOneDetailFilters.resultGroup,
)
const visibleSelectedAuditDetails = computed(() => {
  const details = selectedAuditResult.value?.details || []
  return details
})
watch(phaseOneDetailTableShellRef, (element) => {
  phaseOneDetailTableResizeObserver?.disconnect()
  phaseOneDetailTableResizeObserver = null
  if (!element) {
    phaseOneDetailTableWidth.value = 0
    return
  }
  const updateWidth = () => {
    phaseOneDetailTableWidth.value = Math.round(element.getBoundingClientRect().width)
  }
  updateWidth()
  phaseOneDetailTableResizeObserver = new ResizeObserver(updateWidth)
  phaseOneDetailTableResizeObserver.observe(element)
})
function phaseOneDetailColumnSortable(column: AuditDisplayColumn) {
  return isPhaseOneComparisonResult.value &&
    (column.display === 'number' || column.display === 'danger')
    ? true
    : false
}
function phaseOneDetailColumnWidth(column: AuditDisplayColumn, index: number) {
  if (!isPhaseOne.value) return column.width
  if (isPhaseOneComparisonResult.value && selectedAuditResult.value?.displayColumns.length === 7) {
    return [190, 290, 200, 180, 180, 190, 110][index] ?? column.width
  }
  if (!isPhaseOneComparisonResult.value && selectedAuditResult.value?.displayColumns.length === 5) {
    return phaseOneQualityDetailColumnWidths()[index] ?? column.width
  }
  return column.width
}
function phaseOneQualityDetailColumnWidths() {
  const baseWidths = [353, 180, 150, 200, 110]
  const baseTotal = baseWidths.reduce((sum, width) => sum + width, 0)
  const targetWidth = Math.max(phaseOneDetailTableWidth.value, baseTotal)
  let assignedWidth = 0
  return baseWidths.map((width, index) => {
    if (index === baseWidths.length - 1) return Math.max(1, targetWidth - assignedWidth)
    const scaledWidth = Math.round((targetWidth * width) / baseTotal)
    assignedWidth += scaledWidth
    return scaledWidth
  })
}
function phaseOneDetailSortMethod(column: AuditDisplayColumn) {
  return (left: AuditResultDetail, right: AuditResultDetail) =>
    comparePhaseOneDetailNumber(
      left[column.dataIndex as keyof AuditResultDetail],
      right[column.dataIndex as keyof AuditResultDetail],
    )
}
function comparePhaseOneDetailNumber(left: unknown, right: unknown) {
  const numericValue = (value: unknown) => {
    const normalized = String(value ?? '')
      .replace(/,/g, '')
      .replace(/[^\d.+-]/g, '')
    return /\d/.test(normalized) ? Number(normalized) : Number.NaN
  }
  const leftValue = numericValue(left)
  const rightValue = numericValue(right)
  if (Number.isNaN(leftValue) && Number.isNaN(rightValue)) return 0
  if (Number.isNaN(leftValue)) return 1
  if (Number.isNaN(rightValue)) return -1
  return leftValue - rightValue
}
function clearPhaseOneDetailFilters() {
  phaseOneDetailFilters.objectKeyword = ''
  phaseOneDetailFilters.objectKeys = []
  phaseOneDetailFilters.metricCodes = []
  phaseOneDetailFilters.resultGroup = undefined
  phaseOneDetailPage.value = 1
}
function resetPhaseOneDetailFilters() {
  clearPhaseOneDetailFilters()
  if (phaseOneDetailFiltersReady) schedulePhaseOneDetailReload(0)
}
function queryPhaseOneDetailFilters() {
  phaseOneDetailPage.value = 1
  schedulePhaseOneDetailReload(0)
}
const isCompositeMetricResult = computed(
  () => selectedAuditResult.value?.detailScope === 'abnormal-object-all-metrics',
)
const metricCustomerGroups = computed(() => {
  if (!isCompositeMetricResult.value || !selectedAuditResult.value) return []

  const grouped = new Map<string, AuditResultDetail[]>()
  selectedAuditResult.value.details.forEach((detail) => {
    if (!detail.objectKey) return
    const current = grouped.get(detail.objectKey) || []
    current.push(detail)
    grouped.set(detail.objectKey, current)
  })

  return Array.from(grouped, ([objectKey, details]) => {
    const formal = details.filter(({ role }) => role === 'FORMAL')
    const diagnostic = details.filter(({ role }) => role === 'DIAGNOSTIC')
    return {
      objectKey,
      objectName: details[0]?.objectName || objectKey,
      details,
      formalCount: formal.length,
      formalAnomalyCount: formal.filter(({ resultCode }) => resultCode !== 'PASS').length,
      passCount: details.filter(({ resultCode }) => resultCode === 'PASS').length,
      diagnosticCount: diagnostic.length,
      notComparableCount: diagnostic.filter(({ resultCode }) => resultCode === 'NOT_COMPARABLE')
        .length,
    }
  }).filter(({ formalAnomalyCount }) => formalAnomalyCount > 0)
})
const selectedMetricCustomer = computed(
  () =>
    metricCustomerGroups.value.find(
      ({ objectKey }) => objectKey === selectedMetricObjectKey.value,
    ) || metricCustomerGroups.value[0],
)
const selectedCustomerDetails = computed(() => selectedMetricCustomer.value?.details || [])
const formalMetrics = computed(() =>
  selectedCustomerDetails.value.filter(({ role }) => role === 'FORMAL'),
)
const diagnosticMetrics = computed(() =>
  selectedCustomerDetails.value.filter(({ role }) => role === 'DIAGNOSTIC'),
)

function currentPhaseOneDetailParams(): PhaseOneDetailListParams {
  const objectKeyword = phaseOneDetailFilters.objectKeyword.trim()
  return {
    page: phaseOneDetailPage.value,
    pageSize: phaseOneDetailPageSize.value,
    objectKeyword: objectKeyword || undefined,
    // While the user is typing a remote object search, do not restrict the
    // suggestions to objects already selected. Selecting an option clears the
    // keyword and applies all selected object keys together.
    objectKeys:
      !objectKeyword && phaseOneDetailFilters.objectKeys.length > 0
        ? phaseOneDetailFilters.objectKeys
        : undefined,
    metricCodes:
      phaseOneDetailFilters.metricCodes.length > 0 ? phaseOneDetailFilters.metricCodes : undefined,
    resultGroup: phaseOneDetailFilters.resultGroup,
  }
}

function mergePhaseOneDetailOptions(
  items: PhaseOneDetailItem[],
  resetObjects = false,
  resetMetrics = false,
) {
  const objects = new Map<string, PhaseOneDetailOption>(
    resetObjects ? [] : phaseOneDetailObjectOptions.value.map((option) => [option.value, option]),
  )
  const metrics = new Map<string, PhaseOneDetailOption>(
    resetMetrics ? [] : phaseOneDetailMetricOptions.value.map((option) => [option.value, option]),
  )
  items.forEach((item) => {
    const objectKey = String(item.objectKey || '').trim()
    if (objectKey) {
      const objectName = String(item.objectName || '').trim()
      objects.set(objectKey, {
        value: objectKey,
        label: objectName && objectName !== objectKey ? `${objectKey} · ${objectName}` : objectKey,
      })
    }
    const metricCode = String(item.metricCode || '').trim()
    if (metricCode) {
      const metricName = String(item.metricName || '').trim()
      metrics.set(metricCode, {
        value: metricCode,
        label:
          metricName && metricName !== metricCode ? `${metricName} · ${metricCode}` : metricCode,
      })
    }
  })
  phaseOneDetailObjectOptions.value = Array.from(objects.values())
  phaseOneDetailMetricOptions.value = Array.from(metrics.values())
}

async function hydratePhaseOneRun(result: AuditResultSummary, resetOptions = false) {
  const requestSequence = ++phaseOneDetailRequestSequence
  const runId = result.runId
  phaseOneDetailLoading.value = true
  try {
    const requestParams = currentPhaseOneDetailParams()
    const response = await loadPhaseOneDetailPage(runId, requestParams)
    if (
      requestSequence !== phaseOneDetailRequestSequence ||
      selectedAuditResult.value?.runId !== runId ||
      !resultDrawerVisible.value
    )
      return false
    const details = response.items.map(mapPhaseOneDetail)
    selectedAuditResult.value = {
      ...result,
      details,
      detailTotal: response.total,
    }
    phaseOneDetailPage.value = response.page
    phaseOneDetailPageSize.value = response.pageSize
    mergePhaseOneDetailOptions(
      response.items,
      resetOptions || Boolean(requestParams.objectKeyword),
      false,
    )
    phaseOneLoadError.value = ''
    return true
  } catch (error) {
    if (requestSequence === phaseOneDetailRequestSequence) {
      phaseOneLoadError.value = '稽核明细暂时无法加载'
    }
    throw error
  } finally {
    if (requestSequence === phaseOneDetailRequestSequence) phaseOneDetailLoading.value = false
  }
}

async function hydratePhaseOneMetricOptions(runId: string) {
  phaseOneDetailOptionsLoading.value = true
  try {
    const response = await getPhaseOneRunFilterOptions(runId)
    if (selectedAuditResult.value?.runId !== runId || !resultDrawerVisible.value) return
    phaseOneDetailMetricOptions.value = response.metrics.map(({ value, label }) => ({
      value,
      label: label && label !== value ? `${label} · ${value}` : value,
    }))
  } catch {
    // 降级保留当前页提取的指标，不阻断明细查看。
  } finally {
    if (selectedAuditResult.value?.runId === runId) phaseOneDetailOptionsLoading.value = false
  }
}

function schedulePhaseOneDetailReload(delay = 300) {
  if (phaseOneDetailFilterTimer) clearTimeout(phaseOneDetailFilterTimer)
  if (
    !phaseOneDetailFiltersReady ||
    !isPhaseOne.value ||
    !resultDrawerVisible.value ||
    !selectedAuditResult.value
  )
    return
  phaseOneDetailFilterTimer = setTimeout(() => {
    phaseOneDetailFilterTimer = null
    const result = selectedAuditResult.value
    if (result) void hydratePhaseOneRun(result).catch(() => undefined)
  }, delay)
}

function handlePhaseOneObjectSearch(value: string) {
  phaseOneDetailFilters.objectKeyword = value
}

function handlePhaseOneObjectSelection() {
  phaseOneDetailFilters.objectKeyword = ''
}

function handlePhaseOneDetailPageChange(page: number) {
  phaseOneDetailPage.value = page
  schedulePhaseOneDetailReload(0)
}

function handlePhaseOneDetailPageSizeChange(pageSize: number) {
  phaseOneDetailPageSize.value = pageSize
  phaseOneDetailPage.value = 1
  schedulePhaseOneDetailReload(0)
}

async function openAuditResult(result: AuditResultSummary, syncRoute = true) {
  if (phaseOneDetailFilterTimer) clearTimeout(phaseOneDetailFilterTimer)
  phaseOneDetailFilterTimer = null
  phaseOneDetailFiltersReady = false
  phaseOneDetailRequestSequence += 1
  clearPhaseOneDetailFilters()
  phaseOneDetailPageSize.value = PHASE_ONE_DETAIL_DEFAULT_PAGE_SIZE
  phaseOneDetailObjectOptions.value = []
  phaseOneDetailMetricOptions.value = []
  phaseOneDetailOptionsLoading.value = false
  selectedAuditResult.value = result
  issuePageTab.value = 'results'
  resultDrawerVisible.value = true
  if (syncRoute && isPhaseOne.value && phaseOneDetailRunId.value !== result.runId) {
    router.push(phaseOneIssueDetailPath(result.runId))
  } else if (
    syncRoute &&
    !isPhaseOne.value &&
    route.path === auditPath('issues') &&
    route.query.run_id !== result.runId
  ) {
    router.replace({ path: auditPath('issues'), query: { run_id: result.runId } })
  }
  if (isPhaseOne.value) {
    phaseOneDetailFiltersReady = true
    try {
      const hydrated = await hydratePhaseOneRun(result, true)
      if (hydrated) void hydratePhaseOneMetricOptions(result.runId)
    } catch {
      /* Error state is set by hydratePhaseOneRun. */
    }
  }
  selectedMetricObjectKey.value =
    selectedAuditResult.value?.detailScope === 'abnormal-object-all-metrics'
      ? selectedAuditResult.value.details.find(({ objectKey }) => Boolean(objectKey))?.objectKey ||
        ''
      : ''
}
function openRunResult(runId: string) {
  if (isPhaseOne.value) {
    router.push(phaseOneIssueDetailPath(runId))
    return
  }
  const result = visibleAuditResults.value.find((item) => item.runId === runId)
  if (!result || result.anomalyCount === 0) {
    Message.info('本次巡检没有可展示的异常明细')
    return
  }
  router.push({ path: auditPath('issues'), query: { run_id: runId } })
}
function clearResultDeepLink() {
  resultDrawerVisible.value = false
  if (isPhaseOneDetailPage.value || (route.path === auditPath('issues') && route.query.run_id)) {
    router.push({ path: auditPath('issues') })
  }
}

const issueFilters = reactive({
  status: undefined as string | undefined,
  layer: undefined as AuditLayer | undefined,
  priority: undefined as string | undefined,
  keyword: '',
})
const issueScope = ref('open')
const filteredIssues = computed(() =>
  auditIssues.filter((item) => {
    const keyword = issueFilters.keyword.trim().toLowerCase()
    const matchesKeyword =
      !keyword ||
      [item.title, item.ruleCode, item.subject, item.responsibleGroup, item.owner].some((v) =>
        v.toLowerCase().includes(keyword),
      )
    const matchesScope =
      issueScope.value === 'all' ||
      (issueScope.value === 'open' && item.status !== '已恢复') ||
      (issueScope.value === 'mine' && item.owner === 'Emily')
    return (
      (!issueFilters.status || item.status === issueFilters.status) &&
      (!issueFilters.layer || item.layer === issueFilters.layer) &&
      (!issueFilters.priority || item.priority === issueFilters.priority) &&
      matchesScope &&
      matchesKeyword
    )
  }),
)

const issueDrawerVisible = ref(false)
const selectedIssue = ref<AuditIssue | null>(null)
function openIssue(issue: AuditIssue) {
  selectedIssue.value = issue
  issueDrawerVisible.value = true
}
const selectedIssueMetrics = computed(
  () =>
    metricAuditDemos.find((item) => item.id === selectedIssue.value?.metricDemoId)?.metrics || [],
)

const ruleTab = ref('l0')
const selectedL0Id = ref(l0AuditRules[0].id)
const selectedL0 = computed(
  () => l0AuditRules.find((item) => item.id === selectedL0Id.value) || l0AuditRules[0],
)
const selectedMetricId = ref(metricAuditDemos[0].id)
const selectedMetricKey = ref(metricAuditDemos[0].metrics[0].key)
const selectedMetricDemo = computed(
  () => metricAuditDemos.find((item) => item.id === selectedMetricId.value) || metricAuditDemos[0],
)
const selectedMetric = computed(
  () =>
    selectedMetricDemo.value.metrics.find((item) => item.key === selectedMetricKey.value) ||
    selectedMetricDemo.value.metrics[0],
)
function selectMetricDemo(id: string) {
  selectedMetricId.value = id
  selectedMetricKey.value = selectedMetricDemo.value.metrics[0].key
}
function selectMetricRow(record: any) {
  selectedMetricKey.value = (record as AuditMetric).key
}

const showRuleModal = ref(false)
const showSqlDrawer = ref(false)
const groupEditorVisible = ref(false)
const editingGroup = ref<Partial<AuditResponsibilityGroup> | null>(null)
function runMetricAudit() {
  Message.success('已创建 SQL 对比运行 #A20260806-R01')
}

const ruleGroups = [
  {
    code: 'AUDIT-VALUATION',
    name: '估值与风险稽核组',
    scope: 'L1/L2 估值、净值、保证金',
    team: '估值运营部',
    leader: 'Emily',
    channels: ['飞书群', '邮件兜底'],
    sla: '30 分钟',
    rules: 48,
    escalation: '风控值班经理',
  },
  {
    code: 'AUDIT-ARRIVAL',
    name: '数据到货与质量组',
    scope: 'L0 到货、空值、波动',
    team: '数据平台部',
    leader: '刘明',
    channels: ['飞书群', '站内信'],
    sla: '1 小时',
    rules: 62,
    escalation: '数据平台主管',
  },
  {
    code: 'AUDIT-REFERENCE',
    name: '主数据治理组',
    scope: 'L0 业务键、枚举、参照',
    team: '数据治理部',
    leader: '张倩',
    channels: ['邮件', '站内信'],
    sla: '2 小时',
    rules: 16,
    escalation: '数据治理负责人',
  },
]
function openGroupEditor(group?: (typeof ruleGroups)[number]) {
  if (!group) {
    editingGroup.value = null
  } else {
    const leaderIds: Record<string, string> = {
      Emily: 'emily',
      刘明: 'liu-ming',
      张倩: 'zhang-qian',
    }
    editingGroup.value = {
      id: group.code,
      name: group.name,
      code: group.code,
      layers: group.scope.includes('L1/L2') ? ['L1', 'L2'] : ['L0'],
      scopes:
        group.code === 'AUDIT-VALUATION'
          ? ['估值核算', '风险管理']
          : group.code === 'AUDIT-ARRIVAL'
            ? ['数据到货']
            : ['主数据'],
      team: group.team,
      leader: leaderIds[group.leader] || group.leader,
      dutyMembers: [leaderIds[group.leader] || group.leader],
      recipientPolicy: 'leader_and_duty',
      channelIds: group.channels.map((channel) =>
        channel.includes('飞书')
          ? group.code === 'AUDIT-VALUATION'
            ? 'feishu-valuation-risk'
            : 'feishu-data-duty'
          : channel.includes('邮件')
            ? 'email-audit-duty'
            : 'inbox-audit-center',
      ),
      acknowledgmentSlaMinutes:
        Number.parseInt(group.sla, 10) * (group.sla.includes('小时') ? 60 : 1),
      escalationEnabled: true,
      escalationTargets: [
        group.code === 'AUDIT-VALUATION' ? 'risk-duty-manager' : 'data-platform-director',
      ],
      recoveryNotification: true,
    }
  }
  groupEditorVisible.value = true
}
function saveGroupPolicy(group: AuditResponsibilityGroup) {
  Message.success(`责任组“${group.name}”已保存，所有绑定规则将继承新策略`)
  groupEditorVisible.value = false
}
const notificationSteps = [
  { title: '解析责任', desc: '按规则分组解析团队、负责人和值班人' },
  { title: '生成消息', desc: '携带问题、证据、影响和确认按钮' },
  { title: '确认送达', desc: '记录飞书、邮件和站内信送达结果' },
  { title: '负责人确认', desc: '确认处理后停止首次响应计时' },
  { title: '超时升级', desc: '未确认或未恢复分别按 SLA 升级' },
  { title: '恢复通知', desc: '重跑复核通过后通知原收件人' },
]
const notificationDeliveries = [
  {
    time: '09:44',
    channel: '飞书群',
    target: '风险稽核值班群 · @Emily',
    delivery: '已送达',
    ack: '已确认',
    note: '09:52 从交互卡片确认处理',
  },
  {
    time: '09:45',
    channel: '平台站内信',
    target: 'Emily',
    delivery: '已送达',
    ack: '已确认',
    note: '与问题中心的闭环状态实时同步',
  },
  {
    time: '09:45',
    channel: '邮件兜底',
    target: 'risk-ops@company.com',
    delivery: '已送达',
    ack: '无需确认',
    note: '用于归档与飞书失败兜底',
  },
]

const opsStats = [
  { label: '演示批次', value: '7', tone: '' },
  { label: '执行成功', value: '6', tone: 'success' },
  { label: '实时结果', value: '1', tone: '' },
  { label: '执行失败', value: '1', tone: 'danger' },
  { label: '稽核异常', value: '5', tone: 'danger' },
  { label: '上游阻断', value: '1', tone: 'warning' },
  { label: '异常明细', value: '17', tone: '' },
]
const phaseOneOpsStats = computed(() => {
  const runs = phaseOneRuns.value
  const completePage = phaseOneOperationsTotal.value === runs.length
  const summary = phaseOneOperationsSummary.value
  const value = (summaryValue: number | undefined, fallback: () => number) =>
    summaryValue === undefined && !completePage ? '—' : String(summaryValue ?? fallback())
  return [
    { label: '运行记录', value: String(phaseOneOperationsTotal.value), tone: '' },
    {
      label: '正常完成',
      value: value(
        summary?.successfulRuns,
        () => runs.filter((item) => item.execStatus === '成功').length,
      ),
      tone: 'success',
    },
    {
      label: '执行失败',
      value: value(
        summary?.failedRuns,
        () => runs.filter((item) => item.execStatus === '失败').length,
      ),
      tone: 'danger',
    },
    {
      label: '发现异常',
      value: value(
        summary?.abnormalRuns,
        () => runs.filter((item) => item.auditResult === '异常').length,
      ),
      tone: 'danger',
    },
    {
      label: '阻断 / 无数据',
      value: value(
        summary?.blockedOrNoDataRuns,
        () =>
          runs.filter((item) => item.auditResult === '阻断' || item.auditResult === '无数据')
            .length,
      ),
      tone: 'warning',
    },
    {
      label: '异常项数',
      value: value(summary?.exceptionCount, () =>
        runs.reduce((sum, item) => sum + item.anomalyCount, 0),
      ),
      tone: '',
    },
  ]
})
const phaseOneOpsStatIcons = [
  IconList,
  IconCheckCircle,
  IconCloseCircle,
  IconExclamationCircle,
  IconStop,
  IconStorage,
]
const visibleOpsStats = computed(() => (isPhaseOne.value ? phaseOneOpsStats.value : opsStats))
const operationFilters = reactive({
  dateRange: [] as string[],
  layer: undefined as AuditLayer | undefined,
  auditType: undefined as PhaseOneAuditType | undefined,
  execStatus: undefined as string | undefined,
  auditResult: undefined as string | undefined,
  keyword: '',
})
const filteredAuditRuns = computed(() => {
  if (isPhaseOne.value) return phaseOneRuns.value
  return visibleAuditRuns.value.filter((item) => {
    const keyword = operationFilters.keyword.trim().toLowerCase()
    const matchesKeyword =
      !keyword ||
      [item.id, item.name, item.source, item.type].some((value) =>
        value.toLowerCase().includes(keyword),
      )
    return (
      (!operationFilters.layer || item.layer === operationFilters.layer) &&
      (!operationFilters.execStatus || item.execStatus === operationFilters.execStatus) &&
      (!operationFilters.auditResult || item.auditResult === operationFilters.auditResult) &&
      matchesKeyword
    )
  })
})
const selectedRun = ref<AuditRun>(auditRuns[0])
function rerunFailed() {
  Message.success('已提交失败批次重跑申请，审批通过后将自动生成新批次')
}

const selectedRiskKey = ref(riskTargets[0].key)
const selectedRisk = computed(
  () => riskTargets.find((item) => item.key === selectedRiskKey.value) || riskTargets[0],
)
const strategyOverrides = [
  {
    field: '运行频率',
    base: '每日 09:45',
    effective: 'CNY 交易日盘中每小时',
    reason: '盘中持续暴露，休市不触发',
  },
  { field: '净值容差', base: '10,000 CNY', effective: '0 CNY', reason: '高风险客户零容差' },
  { field: '问题等级', base: 'P2', effective: 'P1', reason: '优先进入驾驶舱' },
  { field: '确认 SLA', base: '2 小时', effective: '30 分钟', reason: '超时自动升级' },
  { field: '通知路由', base: '数据运营', effective: '风控值班 + 负责人', reason: '双路送达' },
]

function goTo(path: string) {
  router.push(path)
}
function setPriorityAndGo(priority: string) {
  issueFilters.priority = priority
  issuePageTab.value = 'closure'
  router.push(auditPath('issues'))
}
function showStrategyMessage() {
  Message.info('监控对象向导已准备：选择客户后自动继承基础规则')
}
function actionMessage(text: string) {
  Message.success(text)
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
const layerNames: Record<AuditLayer, string> = { L0: '基础质量', L1: '业务自洽', L2: '报表与风控' }
function layerLabel(layer: AuditLayer) {
  return `${layer} ${layerNames[layer]}`
}
function sourceColor(source: string) {
  return source === '实时指标' ? 'purple' : 'blue'
}
function detailTypeLabel(type: string) {
  return type === 'quality'
    ? '基础数据稽核'
    : type === 'comparison'
      ? '两表对比稽核'
      : '实时指标明细'
}
function phaseOneCurrentStatus(record: AuditResultSummary) {
  if (record.execStatus === '失败') return '执行失败'
  if (record.auditResult === '异常') return '发现异常'
  if (record.auditResult === '阻断') return '稽核受阻'
  if (record.auditResult === '无数据') return '无可核查数据'
  if (record.auditResult === '未产出') return '未生成结果'
  return record.auditResult
}
function statusColor(status: string) {
  return status === '已恢复'
    ? 'green'
    : status === '待确认'
      ? 'red'
      : status === '修复中'
        ? 'orange'
        : 'blue'
}
function resultColor(result: string) {
  return result === '通过' ? 'green' : result === '异常' ? 'red' : 'orange'
}
function metricResultColor(result: string) {
  return result === '一致'
    ? 'green'
    : result === '不可比'
      ? 'gray'
      : result === '超阈值'
        ? 'orange'
        : 'red'
}
function detailResultColor(result: string) {
  if (result === 'PASS' || result === '一致' || result === '通过') return 'green'
  if (result === 'NOT_COMPARABLE' || result === '不可比' || result === '不可比较') return 'purple'
  if (result === 'OVER_THRESHOLD' || result === '超阈值') return 'orange'
  return 'red'
}
function detailResultText(result: string) {
  return result === '未维护' ? '异常' : result
}
function runStatusColor(status: string) {
  return status === '通过'
    ? 'green'
    : status === '运行中'
      ? 'blue'
      : status === '异常' || status === '阻断'
        ? 'red'
        : status === '未产出'
          ? 'gray'
          : 'orange'
}
function execStatusColor(status: string) {
  return status === '成功' ? 'green' : status === '运行中' ? 'blue' : 'red'
}

watch(resultDrawerVisible, (visible) => {
  if (visible) return
  phaseOneDetailFiltersReady = false
  phaseOneDetailRequestSequence += 1
  phaseOneDetailLoading.value = false
  phaseOneDetailOptionsLoading.value = false
  if (phaseOneDetailFilterTimer) clearTimeout(phaseOneDetailFilterTimer)
  phaseOneDetailFilterTimer = null
})
watch(phaseOneAuditDate, (date, previousDate) => {
  if (!date || date === previousDate || !isPhaseOne.value || section.value !== 'dashboard') return
  if (date !== phaseOneDashboard.value?.observationDate) void refreshPhaseOnePage(false)
})
watch(
  () => [
    operationFilters.dateRange.join('|'),
    operationFilters.auditType,
    operationFilters.layer,
    operationFilters.execStatus,
    operationFilters.auditResult,
    operationFilters.keyword,
  ],
  () => {
    phaseOneOperationsPage.value = 1
    schedulePhaseOneListRefresh('operations')
  },
)
watch([phaseOneOperationsPage, phaseOneOperationsPageSize], () => {
  if (isPhaseOne.value && section.value === 'operations')
    void loadPhaseOneOperationRuns().catch(() => {
      phaseOneLoadError.value = '数据暂时无法加载，请稍后刷新'
    })
})

watch(
  () => [section.value, isPhaseOne.value] as const,
  ([currentSection, phaseOne], [, previousPhaseOne]) => {
    const editionChanged = phaseOne !== previousPhaseOne
    issueDrawerVisible.value = false
    showSqlDrawer.value = false
    if (currentSection !== 'issues' || editionChanged) resultDrawerVisible.value = false
    if (editionChanged) {
      selectedAuditResult.value = null
      resultFilters.source = 'ds'
      resultFilters.layer = undefined
      resultFilters.auditType = undefined
      resultFilters.keyword = ''
      resultFilters.status = undefined
      resultFilters.dateRange = []
      phaseOneResultPage.value = 1
      operationFilters.layer = undefined
      operationFilters.auditType = undefined
      operationFilters.dateRange = []
      operationFilters.execStatus = undefined
      operationFilters.auditResult = undefined
      operationFilters.keyword = ''
    }
    if (phaseOne) {
      issuePageTab.value = 'results'
      resultFilters.source = 'ds'
      selectedRun.value =
        phaseOneRuns.value.find((item) => item.id === selectedRun.value.id) ||
        phaseOneRuns.value[0] ||
        auditRuns[0]
      void refreshPhaseOnePage(false)
    } else {
      if (!auditRuns.some((item) => item.id === selectedRun.value.id))
        selectedRun.value = auditRuns[0]
      if (editionChanged && currentSection === 'issues') issuePageTab.value = 'closure'
      else if (currentSection === 'issues' && issuePageTab.value !== 'results')
        issuePageTab.value = 'closure'
    }
  },
)
watch(
  () => route.fullPath,
  async () => {
    const queryRunId = typeof route.query.run_id === 'string' ? route.query.run_id : ''
    if (
      isPhaseOne.value &&
      section.value === 'issues' &&
      queryRunId &&
      !phaseOneDetailRunId.value
    ) {
      await router.replace(phaseOneIssueDetailPath(queryRunId))
      return
    }
    const runId = phaseOneDetailRunId.value || queryRunId
    if (section.value === 'issues' && runId) {
      if (selectedAuditResult.value?.runId === runId && resultDrawerVisible.value) return
      const result = visibleAuditResults.value.find((item) => item.runId === runId)
      if (result) await openAuditResult(result, false)
      else if (isPhaseOne.value) {
        try {
          const run = await getPhaseOneRun(runId)
          await openAuditResult(mapPhaseOneRun(run), false)
        } catch {
          resultDrawerVisible.value = false
          selectedAuditResult.value = null
        }
      } else {
        resultDrawerVisible.value = false
        selectedAuditResult.value = null
      }
    } else if (section.value === 'issues') {
      resultDrawerVisible.value = false
      selectedAuditResult.value = null
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.audit-page {
  animation: auditFadeIn 0.25s ease-out;
}
.phase-one-fill-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 96px);
  min-height: calc(100dvh - 96px);
}
.phase-one-dashboard-page .dashboard-grid {
  margin-bottom: 0;
}
:deep(.phase-one-date-picker) {
  width: 150px;
}
:deep(.phase-one-trend-select) {
  flex: 0 0 168px;
  width: 168px;
}
@media (min-height: 680px) {
  .phase-one-issues-page {
    height: calc(100vh - 96px);
    height: calc(100dvh - 96px);
    min-height: 0;
    overflow: hidden;
  }
}
.phase-one-result-page {
  height: auto !important;
  min-height: calc(100vh - 96px);
  min-height: calc(100dvh - 96px);
  overflow: visible !important;
}
:global(.layout-content:has(.phase-one-result-detail-page)) {
  overflow-y: auto !important;
}
:global(.phase-one-result-detail-overlay) {
  position: static !important;
  inset: auto !important;
  z-index: auto !important;
  width: 100%;
  height: auto;
}
:deep(.phase-one-result-detail-page.el-drawer) {
  position: static;
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100% !important;
  height: auto;
  overflow: visible;
  background: transparent;
}
:deep(.phase-one-result-detail-page.el-drawer .el-drawer__body) {
  height: auto;
  padding: var(--space-4);
  overflow: visible;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  box-shadow: 0 2px 10px rgba(29, 33, 41, 0.06);
}
.phase-one-result-detail-page .phase-one-detail-table-shell {
  max-height: calc(100vh - 400px);
  max-height: calc(100dvh - 400px);
}
.phase-one-issues-page .issue-page-tabs {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}
.phase-one-issues-page .issue-page-tabs :deep(.el-tabs__content) {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  padding-top: var(--space-4);
  overflow: hidden;
}
.phase-one-issues-page .issue-page-tabs :deep(.el-tabs__content) {
  flex: 1 1 0;
  min-height: 0;
}
.phase-one-issues-page .issue-page-tabs :deep(.el-tab-pane) {
  align-self: stretch;
  height: 100%;
  min-height: 0;
}
.phase-one-issues-page .issue-page-tabs :deep(.el-tab-pane) {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}
.phase-one-page-heading {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}
.phase-one-page-heading h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}
.phase-one-heading-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}
.phase-one-dashboard-overview {
  flex: 0 0 auto;
  margin-bottom: var(--space-4);
}
.phase-one-dashboard-overview .phase-one-page-heading {
  padding: 0 0 var(--space-4);
  border-bottom: 0;
}
.phase-one-dashboard-date-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  white-space: nowrap;
}
:deep(.phase-one-date-picker) {
  width: 170px;
}
:deep(.phase-one-date-picker.el-date-editor) {
  border-color: var(--color-border-strong);
  background: var(--color-bg-surface);
  box-shadow: 0 1px 3px rgba(29, 33, 41, 0.08);
}
:deep(.phase-one-date-picker.el-date-editor:hover),
:deep(.phase-one-date-picker.is-focus) {
  border-color: var(--color-primary);
}
.phase-one-refresh-button {
  border-color: var(--color-border-strong);
  background: var(--color-bg-surface);
  box-shadow: 0 1px 3px rgba(29, 33, 41, 0.08);
}
.phase-one-refresh-button:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-surface);
  color: var(--color-primary);
}
.phase-one-stat-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}
.phase-one-stat-card {
  appearance: none;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  min-height: 108px;
  padding: var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  box-shadow: 0 2px 8px rgba(29, 33, 41, 0.04);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    box-shadow 0.16s ease,
    transform 0.16s ease;
}
.phase-one-stat-card:hover {
  box-shadow: 0 6px 18px rgba(29, 78, 216, 0.1);
  transform: translateY(-1px);
}
.phase-one-stat-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.phase-one-stat-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 23px;
}
.phase-one-stat-icon.danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
}
.phase-one-stat-icon.warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}
.phase-one-stat-icon.detail {
  background: #f5f0ff;
  color: #722ed1;
}
.phase-one-stat-content {
  display: block;
  min-width: 0;
}
.phase-one-stat-card:nth-child(n + 3) .phase-one-stat-metrics {
  gap: 4px;
  font-size: var(--font-size-xs);
}
.phase-one-stat-card:nth-child(n + 3) .phase-one-stat-metric {
  gap: 2px;
}
.phase-one-stat-card:nth-child(n + 3) .phase-one-stat-metric strong {
  font-size: 18px;
}
.phase-one-stat-card:nth-child(3) {
  grid-template-columns: 40px minmax(0, 1fr);
  gap: var(--space-2);
  padding: var(--space-3);
}
.phase-one-stat-card:nth-child(3) .phase-one-stat-icon {
  width: 40px;
  height: 40px;
  font-size: 21px;
}
.phase-one-stat-card:nth-child(3) .phase-one-stat-metrics {
  font-size: 11px;
  letter-spacing: -0.2px;
}
.phase-one-stat-card:nth-child(3) .phase-one-stat-metric strong {
  font-size: 17px;
}
.phase-one-issues-heading {
  margin-bottom: var(--space-3);
}
.phase-one-issues-page .result-filter-card {
  flex: 0 0 auto;
  padding: var(--space-2) var(--space-4);
  border: 0;
  background: transparent;
}
.phase-one-issues-page .anomaly-count {
  color: var(--color-danger);
}
.phase-one-issues-page .anomaly-count:hover {
  background: transparent;
  color: var(--color-danger);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.phase-one-issues-page .anomaly-count:focus-visible {
  outline: 2px solid var(--color-danger);
  outline-offset: 1px;
}
.phase-one-result-count {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: baseline;
  gap: 6px;
  padding: 2px 0 2px var(--space-3);
  border-left: 2px solid var(--color-danger);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}
.phase-one-result-count strong {
  color: var(--color-danger);
  font-size: var(--font-size-lg);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.phase-one-result-filters {
  min-width: 0;
}
.phase-one-biz-date-filter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
:deep(.phase-one-biz-date-range) {
  width: 210px;
}
.phase-one-results-table-shell {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

/* 问题中心/稽核运维表格列宽超出容器时，让横向滚动条常显，避免右侧列被截断后无法察觉 */
.phase-one-issues-page :deep(.el-scrollbar__bar.is-horizontal),
.phase-one-operations-page :deep(.el-scrollbar__bar.is-horizontal) {
  display: block !important;
  opacity: 0.55;
}
.phase-one-results-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
}
.phase-one-operations-page > .table-card {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
}
.phase-one-operations-page > .table-card > .phase-one-results-pagination {
  margin-top: auto;
}
.filter-card.phase-one-operation-filters {
  align-items: center;
  margin: 0 0 var(--space-4);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.phase-one-operations-page :deep(.el-table__cell) {
  white-space: nowrap;
}
.phase-one-operations-page .operation-anomaly-count {
  color: var(--color-danger);
}
.phase-one-operations-page .anomaly-count:hover {
  background: transparent;
  color: var(--color-danger);
  text-decoration: underline;
  text-underline-offset: 3px;
}
@keyframes auditFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.context-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  color: var(--color-text-secondary);
}
.context-bar > div:first-child {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.context-label {
  color: var(--color-text-tertiary);
}
.context-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.stat-card {
  appearance: none;
  text-align: left;
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.phase-one-dashboard-page .stat-value {
  margin-bottom: 0;
}
.phase-one-stat-title {
  display: block;
  margin-bottom: 9px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}
.phase-one-stat-metrics {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 7px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}
.phase-one-stat-metric {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}
.phase-one-stat-metric strong {
  color: var(--color-text-primary);
  font-size: 21px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.phase-one-stat-metric.primary strong {
  color: var(--color-primary);
}
.phase-one-stat-metric.danger strong {
  color: var(--color-danger);
}
.phase-one-stat-metric.warning strong {
  color: var(--color-warning);
}
.phase-one-stat-metric.success strong {
  color: var(--color-success);
}
.phase-one-stat-divider {
  color: var(--color-border);
}
.phase-one-stat-metrics-wide {
  gap: 5px;
  font-size: var(--font-size-xs);
}
.phase-one-stat-metrics-wide .phase-one-stat-metric {
  gap: 3px;
}
.phase-one-stat-metrics-wide .phase-one-stat-metric strong {
  font-size: 18px;
}
.stat-label,
.stat-foot {
  display: block;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}
.stat-value {
  display: block;
  margin: var(--space-2) 0;
  color: var(--color-primary);
  font-size: 28px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.stat-value.danger {
  color: var(--color-danger);
}
.stat-value.warning {
  color: var(--color-warning);
}
.stat-value.success {
  color: var(--color-success);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.phase-one-dashboard-grid {
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.8fr);
}
.phase-one-dashboard-stack {
  grid-template-columns: minmax(0, 1fr);
}
.phase-one-dashboard-page .phase-one-dashboard-stack > .glass-card {
  border: 0;
  box-shadow: 0 2px 10px rgba(29, 33, 41, 0.06);
}
.phase-one-audit-page .glass-card {
  border: 0;
  box-shadow: 0 2px 10px rgba(29, 33, 41, 0.06);
}
.phase-one-result-panel {
  min-width: 0;
}
.phase-one-scope-list {
  display: grid;
  gap: var(--space-3);
}
.phase-one-scope-list > div {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.phase-one-scope-list span,
.phase-one-scope-list strong,
.phase-one-scope-list small {
  display: block;
}
.phase-one-scope-list span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.phase-one-scope-list strong {
  margin-top: var(--space-1);
  color: var(--color-text-primary);
}
.phase-one-scope-list small {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}
.panel {
  padding: var(--space-5);
}
.panel-header,
.table-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.panel-header h3,
.table-title-row h3,
.metric-heading h3,
.rule-detail h3,
.calendar-example h3,
.strategy-heading h3,
.target-list h3 {
  margin: 0;
  font-size: var(--font-size-lg);
}
.panel-header p,
.table-title-row p,
.metric-heading p,
.strategy-heading p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}
.priority-list {
  display: grid;
}
.priority-row {
  appearance: none;
  display: grid;
  grid-template-columns: 44px 1fr 92px;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) 0;
  border: 0;
  border-bottom: 1px solid var(--color-border-subtle);
  background: transparent;
  text-align: left;
  color: inherit;
  cursor: pointer;
}
.priority-row:last-child {
  border-bottom: 0;
}
.priority-row:hover strong {
  color: var(--color-primary);
}
.priority-chip {
  display: inline-flex;
  width: 34px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.priority-chip.p1 {
  color: var(--color-danger);
  background: var(--color-danger-light);
}
.priority-chip.p2 {
  color: var(--color-warning);
  background: var(--color-warning-light);
}
.priority-chip.p3 {
  color: var(--color-primary);
  background: var(--color-primary-light);
}
.priority-main,
.priority-owner,
.priority-main small,
.priority-owner small {
  display: block;
  min-width: 0;
}
.priority-main small,
.priority-owner small {
  margin-top: var(--space-1);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.priority-owner {
  text-align: right;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.phase-one-priority-panel {
  padding: var(--space-5);
}
.phase-one-priority-panel .panel-header {
  align-items: center;
}
.phase-one-priority-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.phase-one-priority-card {
  appearance: none;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
  width: 100%;
  padding: var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}
.phase-one-priority-card.featured {
  background: var(--color-bg-elevated);
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.07);
}
.phase-one-priority-card:hover {
  background: var(--color-primary-soft);
  box-shadow: 0 5px 16px rgba(29, 78, 216, 0.1);
}
.phase-one-priority-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.phase-one-priority-rank {
  display: inline-flex;
  width: 40px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-inverse);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
}
.phase-one-priority-rank.p1 {
  background: var(--color-danger);
}
.phase-one-priority-rank.p2 {
  background: var(--color-warning);
}
.phase-one-priority-main {
  display: block;
  min-width: 0;
}
.phase-one-priority-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.phase-one-priority-title-row > strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}
.phase-one-priority-main > small {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.phase-one-priority-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}
.phase-one-priority-arrow {
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
}
.phase-one-priority-arrow svg {
  width: 13px;
  height: 13px;
}
.phase-one-priority-card:hover .phase-one-priority-action {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.phase-one-priority-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.phase-one-priority-meta > span {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}
.phase-one-priority-meta > span:not(:first-child) {
  padding-left: var(--space-5);
  border-left: 1px solid var(--color-border-subtle);
}
.phase-one-priority-meta strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
.phase-one-priority-meta > span:nth-child(2) strong {
  color: var(--color-danger);
  font-size: var(--font-size-lg);
  font-variant-numeric: tabular-nums;
}
.phase-one-priority-status {
  color: var(--color-danger);
}
.phase-one-priority-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-danger);
}

.trend-chart {
  height: 150px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  align-items: end;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.trend-column {
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  height: 100%;
  grid-template-rows: 20px 1fr 22px;
  align-items: end;
}
.trend-value,
.trend-date {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.trend-bar-wrap {
  display: flex;
  align-items: end;
  height: 100%;
  width: 24px;
}
.trend-bar {
  width: 100%;
  min-height: 8px;
  max-height: 88px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: var(--color-primary);
  opacity: 0.78;
}
.trend-bar.empty {
  min-height: 0;
}
.trend-summary {
  display: flex;
  gap: var(--space-4);
  padding-top: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: var(--space-1);
}
.danger-dot {
  background: var(--color-danger);
}
.warning-dot {
  background: var(--color-warning);
}
.phase-one-trend-panel {
  min-height: 330px;
  padding: var(--space-5);
}
.phase-one-trend-panel .panel-header {
  align-items: center;
  margin-bottom: var(--space-2);
}
.phase-one-trend-chart {
  width: 100%;
  height: 250px;
}
.phase-one-trend-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.phase-one-trend-foot > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.phase-one-trend-legends {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
}
.phase-one-trend-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
}
.phase-one-trend-legend i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  background: var(--color-primary);
}

.closure-flow {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
}
.closure-step {
  position: relative;
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
}
.closure-step.active {
  color: var(--color-text-primary);
  background: var(--color-primary-light);
}
.step-index {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-bg-surface);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
.closure-step strong,
.closure-step small {
  display: block;
}
.closure-step small {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.filter-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}
.filter-result,
.muted {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.table-card {
  padding: var(--space-4);
  overflow: hidden;
}
.cell-primary {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
.cell-secondary {
  margin-top: 2px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.run-id-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.nowrap-cell {
  white-space: nowrap;
}
.issue-page-tabs {
  padding: 0 var(--space-4) var(--space-4);
  overflow: hidden;
}
.phase-one-issues-direct {
  padding-top: 0;
}
.phase-one-issues-direct :deep(.el-tabs__header) {
  display: none;
}
.phase-one-issues-direct .result-filter-card {
  margin-top: 0;
}
.result-filter-card {
  margin-top: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.result-table-heading,
.result-detail-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin: var(--space-4) 0;
}
.result-table-heading h3,
.result-detail-title h3 {
  margin: 0;
  font-size: var(--font-size-lg);
}
.result-table-heading p,
.result-detail-title p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}
.anomaly-count {
  min-width: 28px;
  padding: 0;
  font-weight: var(--font-weight-semibold);
}
.operations-alert {
  margin-bottom: var(--space-4);
}
.result-message {
  margin-top: var(--space-4);
}
.phase-one-detail-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
  margin: var(--space-2) 0 var(--space-4);
}
.phase-one-retention-alert {
  margin: 0 0 var(--space-4);
}
.phase-one-retention-search-alert {
  margin: 0 0 var(--space-3);
}
.phase-one-detail-toolbar h3 {
  flex: 0 0 auto;
  margin: 0;
  font-size: var(--font-size-lg);
  line-height: 25.144px;
}
.phase-one-detail-heading {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2);
}
.phase-one-detail-back {
  width: 32px;
  height: 32px;
  padding: 0;
  flex: 0 0 auto;
  margin-left: calc(-1 * var(--space-2));
  color: var(--color-text-secondary);
}
.phase-one-detail-filters {
  display: grid;
  grid-template-columns: 420px 210px auto;
  align-items: end;
  column-gap: 24px;
  row-gap: var(--space-3);
  width: 806px;
  max-width: 100%;
  min-width: 0;
}
.phase-one-filter-item {
  display: grid;
  min-width: 0;
  gap: 6px;
}
.phase-one-filter-item :deep(.phase-one-filter-control) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}
.phase-one-detail-query-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.phase-one-detail-table-shell {
  max-height: calc(100vh - 365px);
  max-height: calc(100dvh - 365px);
  overflow: auto;
  scrollbar-gutter: stable;
}
.phase-one-detail-table-shell :deep(.el-table) {
  font-size: 14px;
}
.phase-one-detail-table-shell :deep(.el-table .cell) {
  padding: 0 16px;
  line-height: 22.001px;
}
.phase-one-detail-table-shell :deep(.el-table th.el-table__cell) {
  padding: 0;
}
.phase-one-detail-table-shell :deep(.el-table td.el-table__cell) {
  padding: 9px 0;
}
.phase-one-detail-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
}
.phase-one-filter-label {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 18.858px;
  white-space: nowrap;
}
.result-detail-footer {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
}
.phase-one-run-summary {
  display: grid;
  grid-template-columns: 0.8fr 0.8fr 1.05fr 1.45fr;
  gap: var(--space-3);
  margin: 0;
}
.phase-one-summary-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  min-height: 62px;
  padding: var(--space-3) var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  box-shadow: 0 2px 8px rgba(29, 33, 41, 0.05);
}
.phase-one-summary-item.primary {
  background: var(--color-primary-soft);
}
.phase-one-summary-item.danger {
  background: var(--color-danger-light);
}
.phase-one-summary-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  font-size: 19px;
}
.phase-one-summary-item.primary .phase-one-summary-icon {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.phase-one-summary-item.danger .phase-one-summary-icon {
  background: var(--color-danger-light);
  color: var(--color-danger);
}
.phase-one-summary-content {
  display: block;
  min-width: 0;
}
.phase-one-summary-content > span {
  display: block;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 1.2;
}
.phase-one-summary-content strong {
  display: block;
  min-width: 0;
  margin-top: 5px;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.phase-one-summary-item.metric strong {
  font-size: 22px;
}
.phase-one-summary-item.primary strong {
  color: var(--color-primary);
}
.phase-one-summary-item.danger strong {
  color: var(--color-danger);
}
.detail-primary-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.composite-title {
  margin-bottom: var(--space-3);
}
.metric-customer-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.metric-customer-selector > button {
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  box-shadow: 0 1px 4px rgba(29, 33, 41, 0.05);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease;
}
.metric-customer-selector > button:hover,
.metric-customer-selector > button.active {
  background: var(--color-primary-light);
  box-shadow: 0 3px 10px rgba(29, 78, 216, 0.1);
}
.metric-customer-selector > button.active {
  box-shadow:
    inset 3px 0 var(--color-primary),
    0 3px 10px rgba(29, 78, 216, 0.1);
}
.metric-customer-selector button > span {
  min-width: 0;
}
.metric-customer-selector strong,
.metric-customer-selector small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.metric-customer-selector small {
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.metric-customer-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-5);
}
.metric-customer-heading span,
.metric-customer-heading strong {
  display: block;
}
.metric-customer-heading span,
.metric-customer-heading small {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.metric-customer-heading strong {
  margin-top: 2px;
  font-size: var(--font-size-lg);
}
.metric-customer-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: var(--space-3) 0 var(--space-4);
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  box-shadow: 0 2px 8px rgba(29, 33, 41, 0.05);
}
.metric-customer-summary > div {
  padding: var(--space-3) var(--space-4);
  border-right: 1px solid var(--color-border);
}
.metric-customer-summary > div:last-child {
  border-right: 0;
}
.metric-customer-summary span,
.metric-customer-summary strong {
  display: block;
}
.metric-customer-summary span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.metric-customer-summary strong {
  margin-top: 2px;
  font-size: var(--font-size-xl);
}
.metric-customer-summary .danger strong {
  color: var(--color-danger);
}
.metric-customer-summary .success strong {
  color: var(--color-success);
}
.metric-detail-section {
  margin-top: var(--space-4);
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(29, 33, 41, 0.05);
}
.metric-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
}
.metric-section-heading h4 {
  margin: 0;
  font-size: var(--font-size-md);
}
.metric-section-heading p {
  margin: 3px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.diagnostic-section {
  border-color: #d8c9ff;
}
.diagnostic-section .metric-section-heading {
  background: #faf8ff;
}
.metric-name-cell strong,
.metric-name-cell small {
  display: block;
}
.metric-name-cell small {
  max-width: 310px;
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 1.45;
  white-space: normal;
}

.rules-shell {
  padding: 0 var(--space-5) var(--space-5);
  overflow: hidden;
}
.mini-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin: var(--space-4) 0;
}
.mini-stats > div {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.mini-stats span,
.mini-stats small {
  display: block;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.mini-stats strong {
  display: block;
  margin: var(--space-1) 0;
  font-size: var(--font-size-xl);
  color: var(--color-primary);
}
.rule-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.rule-detail,
.sql-preview {
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.eyebrow {
  margin-bottom: var(--space-1);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.rule-detail p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.sql-title,
.sql-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.sql-preview pre,
.sql-compare-grid pre {
  margin: 0;
  overflow: auto;
  border-radius: var(--radius-md);
  background: var(--color-text-primary);
  color: var(--color-border);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: 1.7;
}
.sql-preview pre {
  height: 210px;
  padding: var(--space-4);
}

.metric-workspace {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.metric-rule-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.metric-list-title {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.metric-list-title strong,
.metric-list-title small {
  display: block;
}
.metric-list-title small {
  margin-top: var(--space-1);
  color: var(--color-text-tertiary);
}
.metric-rule-list button {
  appearance: none;
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 0;
  border-bottom: 1px solid var(--color-border-subtle);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.metric-rule-list button:hover,
.metric-rule-list button.active {
  background: var(--color-primary-light);
}
.metric-rule-list button.active {
  box-shadow: inset 3px 0 var(--color-primary);
}
.metric-rule-list button strong,
.metric-rule-list button small,
.metric-rule-list button em {
  display: block;
}
.metric-rule-list button small {
  margin-top: 3px;
  color: var(--color-text-tertiary);
}
.metric-rule-list button em {
  margin-top: var(--space-2);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-style: normal;
}
.metric-result {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.metric-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}
.run-summary {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  margin: var(--space-4) 0;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.run-summary strong {
  color: var(--color-danger);
}
.number-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.diff-alert {
  color: var(--color-danger);
  font-weight: var(--font-weight-medium);
}
.metric-evidence {
  display: grid;
  grid-template-columns: 1fr 1.2fr 2fr;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.metric-evidence > div {
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}
.metric-evidence span,
.metric-evidence strong {
  display: block;
}
.metric-evidence span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.metric-evidence strong {
  margin-top: var(--space-1);
  font-size: var(--font-size-sm);
}

.ownership-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin: var(--space-4) 0;
}
.ownership-stats > div {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.ownership-stats span,
.ownership-stats small,
.ownership-stats strong {
  display: block;
}
.ownership-stats span,
.ownership-stats small {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.ownership-stats strong {
  margin: var(--space-1) 0;
  font-size: var(--font-size-xl);
}
.danger-text {
  color: var(--color-danger);
}
.success-text {
  color: var(--color-success);
}
.ownership-title {
  margin-top: var(--space-5);
}
.notification-flow-card {
  margin-top: var(--space-5);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.notification-flow {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-2);
}
.notification-flow > div {
  min-width: 0;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}
.notification-flow span {
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-xs);
}
.notification-flow strong,
.notification-flow small {
  display: block;
}
.notification-flow small {
  margin-top: var(--space-1);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.ops-stats {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-4);
}
.ops-stats > .ops-stat-item {
  padding: var(--space-4);
  border-right: 1px solid var(--color-border);
  text-align: center;
}
.ops-stats > .ops-stat-item:last-child {
  border-right: 0;
}
.ops-stats span,
.ops-stats strong {
  display: block;
}
.ops-stats span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.ops-stats strong {
  margin-top: var(--space-1);
  font-size: var(--font-size-xl);
}
.ops-stats .success {
  color: var(--color-success);
}
.ops-stats .danger {
  color: var(--color-danger);
}
.ops-stats .warning {
  color: var(--color-warning);
}
.run-detail {
  display: grid;
  grid-template-columns: repeat(4, 1fr) 2fr auto;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}
.run-detail span,
.run-detail strong {
  display: block;
}
.run-detail span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.run-detail strong {
  margin-top: 2px;
  font-size: var(--font-size-sm);
}
.ops-stats.phase-one-ops-stats {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}
.phase-one-operations-heading {
  margin: 0;
  padding: 0 0 var(--space-3);
}
.phase-one-ops-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-3);
}
.phase-one-ops-summary .ops-stat-item {
  --metric-color: var(--color-primary);
  --metric-soft: var(--color-primary-soft);
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  min-height: 72px;
  padding: var(--space-3) var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  box-shadow: 0 3px 12px rgba(29, 33, 41, 0.07);
}
.phase-one-ops-summary .ops-stat-item.metric-2 {
  --metric-color: var(--color-success);
  --metric-soft: var(--color-success-light);
}
.phase-one-ops-summary .ops-stat-item.metric-3 {
  --metric-color: var(--color-danger);
  --metric-soft: var(--color-danger-light);
}
.phase-one-ops-summary .ops-stat-item.metric-4 {
  --metric-color: var(--color-warning);
  --metric-soft: var(--color-warning-light);
}
.phase-one-ops-summary .ops-stat-item.metric-5 {
  --metric-color: var(--color-warning);
  --metric-soft: var(--color-warning-light);
}
.phase-one-ops-summary .ops-stat-item.metric-6 {
  --metric-color: #722ed1;
  --metric-soft: #f3efff;
}
.phase-one-ops-stat-icon {
  display: inline-flex !important;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--metric-soft);
  color: var(--metric-color) !important;
  font-size: 19px !important;
}
.phase-one-ops-stat-content {
  display: block;
  min-width: 0;
}
.phase-one-ops-summary .phase-one-ops-stat-content > span {
  display: block;
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.phase-one-ops-summary .ops-stat-item strong {
  display: block;
  margin: 5px 0 0;
  color: var(--metric-color);
  font-size: 23px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.strategy-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.target-list {
  padding: var(--space-4);
}
.target-list-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
}
.target-list-head span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.target-list > button {
  appearance: none;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: var(--space-3);
  align-items: center;
  width: 100%;
  padding: var(--space-3);
  margin-top: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.target-list > button:hover,
.target-list > button.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary-border);
}
.target-avatar {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-bg-elevated);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
.target-list button strong,
.target-list button small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.target-list button small {
  margin-top: 2px;
  color: var(--color-text-tertiary);
}
.strategy-detail {
  padding: var(--space-5);
}
.strategy-heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}
.strategy-compare {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  align-items: center;
  margin: var(--space-4) 0;
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}
.strategy-compare span,
.strategy-compare strong,
.strategy-compare small {
  display: block;
}
.strategy-compare span,
.strategy-compare small {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.strategy-compare strong {
  margin: var(--space-1) 0;
}
.strategy-arrow {
  text-align: center;
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}
.strategy-compare .effective strong {
  color: var(--color-primary);
}
.dedup-note {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
}
.dedup-note span,
.dedup-note strong,
.dedup-note small {
  display: block;
}
.dedup-note small {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

.drawer-title-line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}
.drawer-subject {
  margin: var(--space-4) 0 var(--space-1);
}
.drawer-impact {
  margin: 0 0 var(--space-4);
  color: var(--color-text-secondary);
}
.evidence-box {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}
.evidence-box p {
  color: var(--color-text-secondary);
}
.notification-resolve {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.notification-resolve > div {
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}
.notification-resolve span,
.notification-resolve strong {
  display: block;
}
.notification-resolve span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.notification-resolve strong {
  margin-top: var(--space-1);
  font-size: var(--font-size-sm);
}
.contract-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.contract-grid > div {
  padding: var(--space-4);
  border-right: 1px solid var(--color-border);
}
.contract-grid > div:last-child {
  border-right: 0;
}
.contract-grid span,
.contract-grid strong,
.execution-policy-grid span,
.execution-policy-grid strong {
  display: block;
}
.contract-grid span,
.execution-policy-grid span {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}
.contract-grid strong,
.execution-policy-grid strong {
  margin-top: var(--space-1);
}
.execution-policy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.execution-policy-grid > div {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.sql-compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.sql-compare-grid section {
  min-width: 0;
}
.sql-compare-grid pre {
  height: 430px;
  padding: var(--space-4);
  white-space: pre;
}
.rule-steps {
  margin-bottom: var(--space-5);
}
.schedule-preview {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-success-light);
  color: var(--color-success);
}
.schedule-preview span,
.schedule-preview strong,
.schedule-preview small {
  display: block;
}
.schedule-preview small {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

@media (max-width: 1180px) {
  .stat-grid,
  .mini-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .phase-one-stat-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dashboard-grid,
  .strategy-layout {
    grid-template-columns: 1fr;
  }
  .metric-workspace {
    grid-template-columns: 240px minmax(0, 1fr);
  }
  .run-detail {
    grid-template-columns: repeat(3, 1fr);
  }
  .metric-evidence {
    grid-template-columns: 1fr;
  }
  .phase-one-ops-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 860px) {
  .stat-grid,
  .rule-detail-grid,
  .sql-compare-grid,
  .contract-grid,
  .execution-policy-grid,
  .ownership-stats,
  .notification-resolve {
    grid-template-columns: 1fr;
  }
  .dashboard-grid,
  .metric-workspace {
    grid-template-columns: 1fr;
  }
  .closure-flow {
    grid-template-columns: 1fr;
  }
  .ops-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .context-bar,
  .filter-card,
  .metric-heading,
  .phase-one-page-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .phase-one-heading-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .phase-one-dashboard-date-row {
    flex-wrap: wrap;
  }
  .phase-one-priority-meta {
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
  }
  .phase-one-priority-list {
    grid-template-columns: 1fr;
  }
  .phase-one-trend-foot {
    align-items: flex-start;
    flex-direction: column;
  }
  .phase-one-detail-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
  .phase-one-detail-query-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
  .phase-one-detail-table-shell {
    max-height: calc(100vh - 520px);
    max-height: calc(100dvh - 520px);
  }
  .phase-one-run-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .metric-rule-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .metric-list-title {
    grid-column: 1 / -1;
  }
  .metric-rule-list button {
    border-right: 1px solid var(--color-border-subtle);
  }
  .notification-flow {
    grid-template-columns: repeat(2, 1fr);
  }
  .metric-customer-selector {
    grid-template-columns: 1fr;
  }
  .metric-customer-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  .metric-customer-summary > div:nth-child(2) {
    border-right: 0;
  }
  .metric-customer-summary > div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--color-border);
  }
  .metric-customer-heading,
  .metric-section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 560px) {
  .phase-one-stat-cards {
    grid-template-columns: 1fr;
  }
  .phase-one-stat-card {
    min-height: 94px;
  }
  .phase-one-priority-card {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: var(--space-3);
    padding: var(--space-3);
  }
  .phase-one-priority-rank {
    width: 34px;
    height: 28px;
    font-size: var(--font-size-sm);
  }
  .phase-one-priority-title-row {
    align-items: flex-start;
  }
  .phase-one-priority-action {
    font-size: var(--font-size-xs);
  }
  .phase-one-detail-filters {
    grid-template-columns: 1fr;
  }
  .phase-one-detail-table-shell {
    max-height: calc(100vh - 640px);
    max-height: calc(100dvh - 640px);
  }
  .phase-one-run-summary {
    grid-template-columns: 1fr;
  }
  .phase-one-summary-item {
    min-height: 58px;
    padding: var(--space-2) var(--space-3);
  }
  .phase-one-summary-content strong {
    overflow: visible;
    text-overflow: clip;
  }
  .phase-one-ops-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .phase-one-ops-summary .ops-stat-item {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-2);
  }
  .phase-one-operation-filters :deep(.el-space) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }
  .phase-one-operation-filters :deep(.el-space__item),
  .phase-one-operation-filters :deep(.el-date-editor),
  .phase-one-operation-filters :deep(.el-select__wrapper),
  .phase-one-operation-filters :deep(.el-input) {
    width: 100% !important;
    min-width: 0;
  }
}
</style>
