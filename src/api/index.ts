import {
  auditPhaseOneResults,
  type AuditResultDetail,
  type AuditResultSummary,
} from '../data/auditMock'

const toIso = (value: string) => `${value.replace(' ', 'T')}+08:00`
const execCode = (value: string) =>
  ({ 成功: 'SUCCESS', 失败: 'FAILED', 跳过: 'SKIPPED' })[value] || 'SUCCESS'
const auditCode = (value: string) =>
  ({ 通过: 'PASS', 异常: 'FAIL', 阻断: 'BLOCKED', 未产出: 'NOT_PRODUCED', 跳过: 'SKIPPED' })[
    value
  ] || 'FAIL'

function toRunItem(result: AuditResultSummary, overrides: Record<string, unknown> = {}) {
  return {
    runId: result.runId,
    ruleCode: result.runId,
    ruleName: result.checkName,
    layer: result.layer,
    auditType: result.detailType === 'comparison' ? 'TABLE_COMPARISON' : 'BASIC_DATA',
    auditTypeLabel: result.detailType === 'comparison' ? '两表对比稽核' : '基础数据稽核',
    targetType:
      result.objectType || (result.detailType === 'comparison' ? 'COUNTERPARTY' : 'CONTRACT'),
    targetTypeLabel:
      result.objectTypeLabel || (result.detailType === 'comparison' ? '交易对手' : '合约'),
    targetName: result.objectName,
    detailType: result.detailType === 'comparison' ? 'METRIC_COMPARE' : 'ROW_QUALITY',
    execStatus: execCode(result.execStatus),
    auditStatus: auditCode(result.auditResult),
    totalCount: result.totalCount,
    exceptionCount: result.anomalyCount,
    actualExceptionCount: result.anomalyCount,
    candidateDetailCount: result.anomalyCount,
    persistedDetailCount: result.anomalyCount,
    detailCount: result.anomalyCount,
    detailTruncated: false,
    bizDate: result.bizDate,
    observationDate: result.bizDate,
    startedAt: toIso(result.executedAt),
    finishedAt: toIso(result.executedAt),
    executedAt: toIso(result.executedAt),
    durationSeconds: Number.parseFloat(result.duration) || 0,
    summary: result.message,
    displaySchema: {
      schemaVersion: '1.0',
      objectTypeLabel:
        result.objectTypeLabel || (result.detailType === 'comparison' ? '交易对手' : '合约'),
      leftLabel: result.leftLabel,
      rightLabel: result.rightLabel,
      columns: result.displayColumns.map((column) => ({
        key: column.dataIndex === 'field' ? 'metric' : column.dataIndex,
        label: column.title,
        width: column.width,
        display: column.display,
      })),
    },
    ...overrides,
  }
}

const priceMissing = toRunItem(auditPhaseOneResults[0], {
  ruleCode: 'R1_VALUATION_PRICE_MISSING',
  exceptionCount: 58,
  actualExceptionCount: 58,
  candidateDetailCount: 58,
  persistedDetailCount: 58,
  detailCount: 58,
})
const priceZero = toRunItem(auditPhaseOneResults[0], {
  runId: 'P1-AUD-20260806-002',
  ruleCode: 'R2_VALUATION_PRICE_ZERO',
  ruleName: '估值价格有效性',
  targetName: 'instrument_eval_rep.EVALUATE_PRICE = 0',
  auditStatus: 'PASS',
  exceptionCount: 0,
  actualExceptionCount: 0,
  candidateDetailCount: 0,
  persistedDetailCount: 0,
  detailCount: 0,
  summary: '估值价格为零有效性核查通过。',
})
const fundingSkipped = toRunItem(auditPhaseOneResults[1], {
  runId: 'P1-AUD-20260806-003',
  ruleCode: 'R3_POSITION_WITHOUT_FUNDING',
  execStatus: 'SKIPPED',
  auditStatus: 'SKIPPED',
  exceptionCount: 0,
  actualExceptionCount: 0,
  candidateDetailCount: 0,
  persistedDetailCount: 0,
  detailCount: 0,
  summary: '本批次未满足触发条件，已留痕。',
})
const bctComparison = toRunItem(auditPhaseOneResults[2], {
  runId: 'P1-AUD-20260806-004',
  ruleCode: 'R4_POSITION_BCT_CONSISTENCY',
  exceptionCount: 32,
  actualExceptionCount: 32,
  candidateDetailCount: 32,
  persistedDetailCount: 32,
  detailCount: 32,
})

const runItems = [priceMissing, priceZero, fundingSkipped, bctComparison]
const resultByRunId = new Map<string, AuditResultSummary>([
  [String(priceMissing.runId), auditPhaseOneResults[0]],
  [String(bctComparison.runId), auditPhaseOneResults[2]],
])

function detailResultCode(detail: AuditResultDetail) {
  if (detail.resultCode) return detail.resultCode
  if (['通过', '一致'].includes(detail.result || '')) return 'PASS'
  if (detail.result === '左有右无') return 'LEFT_ONLY'
  if (detail.result === '右有左无') return 'RIGHT_ONLY'
  if (detail.result === '不可比较') return 'NOT_COMPARABLE'
  return detail.diff ? 'OVER_THRESHOLD' : 'FAIL'
}

function toDetail(detail: AuditResultDetail, index: number) {
  return {
    detailSeq: index + 1,
    objectType: 'AUDIT_OBJECT',
    objectKey: detail.objectKey || detail.target || `DETAIL-${index + 1}`,
    objectName: detail.objectName || detail.objectKey || detail.target || '',
    metricCode: detail.metricCode || detail.field || `metric_${index + 1}`,
    metricName: detail.metric || detail.field || '核查项',
    actualValue: detail.actual,
    expectedValue: detail.expected || detail.threshold,
    leftValue: detail.left,
    rightValue: detail.right,
    diffValue: detail.diff,
    resultCode: detailResultCode(detail),
    resultLabel: detail.result || '异常',
    reason: detail.reason,
    role: detail.role || 'FORMAL',
  }
}

function paramsValue(params: unknown, key: string) {
  if (params instanceof URLSearchParams) return params.get(key) || undefined
  return (params as Record<string, unknown> | undefined)?.[key]
}

function detailsForRun(runId: string, params?: unknown) {
  const source = resultByRunId.get(runId)
  let items = (source?.details || []).map(toDetail)
  const targetCount = Number(
    runItems.find((item) => item.runId === runId)?.exceptionCount || items.length,
  )
  if (items.length > 0 && items.length < targetCount) {
    const samples = [...items]
    while (items.length < targetCount) {
      const sample = samples[items.length % samples.length]
      const copyIndex = items.length + 1
      items.push({
        ...sample,
        detailSeq: copyIndex,
        objectKey: `${sample.objectKey} / SAMPLE-${String(copyIndex).padStart(3, '0')}`,
      })
    }
  }
  const keyword = String(paramsValue(params, 'objectKeyword') || '')
    .trim()
    .toLowerCase()
  const resultGroup = paramsValue(params, 'resultGroup')
  if (keyword)
    items = items.filter((item) =>
      `${item.objectKey} ${item.objectName}`.toLowerCase().includes(keyword),
    )
  if (resultGroup === 'MATCH') items = items.filter((item) => item.resultCode === 'PASS')
  if (resultGroup === 'MISMATCH')
    items = items.filter((item) => !['PASS', 'NOT_COMPARABLE'].includes(item.resultCode))
  if (resultGroup === 'UNDETERMINED')
    items = items.filter((item) => item.resultCode === 'NOT_COMPARABLE')
  return items
}

async function mockGet(url: string, options?: { params?: unknown }) {
  if (url === '/audit/phase1/dashboard') {
    return {
      observationDate: '2026-08-04',
      latestObservationDate: '2026-08-04',
      observationDateSource: 'OBSERVATION_DATE',
      refreshedAt: '2026-08-09T17:59:58+08:00',
      source: 'LOCAL_RESTORED_MOCK',
      resultReceiptStatus: 'RECEIVED',
      summary: {
        runCount: 3,
        expectedRuns: 4,
        completedRuns: 3,
        successfulRuns: 3,
        failedAuditRuns: 2,
        passedRuns: 1,
        notTriggeredRuns: 1,
        abnormalRuns: 2,
        failedRuns: 0,
        sourceUnavailableRuns: 0,
        blockedOrNoDataRuns: 0,
        exceptionCount: 90,
        rowQualityExceptionCount: 58,
        metricCompareExceptionCount: 32,
      },
      priorityRuns: [priceMissing, bctComparison],
      trend: ['07-29', '07-30', '07-31', '08-01', '08-02', '08-03', '08-04'].map((date, index) => ({
        date: `2026-${date}`,
        exceptionCount: index === 6 ? 90 : 0,
        value: index === 6 ? 90 : 0,
      })),
      trendByRule: [
        ...['07-29', '07-30', '07-31', '08-01', '08-02', '08-03', '08-04'].map((date, index) => ({
          date: `2026-${date}`,
          exceptionCount: index === 6 ? 58 : 0,
          ruleCode: 'R1_VALUATION_PRICE_MISSING',
          ruleName: '估值价格未维护',
        })),
        ...['07-29', '07-30', '07-31', '08-01', '08-02', '08-03', '08-04'].map((date, index) => ({
          date: `2026-${date}`,
          exceptionCount: index === 6 ? 32 : 0,
          ruleCode: 'R4_POSITION_BCT_CONSISTENCY',
          ruleName: '持仓与 BCT 同余估值报告核对',
        })),
      ],
      availableObservationDates: ['2026-08-04'],
    }
  }
  if (url === '/audit/phase1/runs') {
    const view = paramsValue(options?.params, 'view')
    const items = view === 'issues' ? [priceMissing, bctComparison] : runItems
    return {
      items,
      total: items.length,
      page: Number(paramsValue(options?.params, 'page') || 1),
      pageSize: Number(paramsValue(options?.params, 'pageSize') || 10),
      refreshedAt: '2026-08-09T17:59:58+08:00',
      summary: {
        totalRuns: 4,
        successfulRuns: 3,
        failedRuns: 0,
        abnormalRuns: 2,
        blockedOrNoDataRuns: 0,
        exceptionCount: 90,
      },
    }
  }
  const detailMatch = url.match(/^\/audit\/phase1\/runs\/([^/]+)\/details$/)
  if (detailMatch) {
    const runId = decodeURIComponent(detailMatch[1])
    const filteredItems = detailsForRun(runId, options?.params)
    const run = runItems.find((item) => item.runId === runId)
    const page = Number(paramsValue(options?.params, 'page') || 1)
    const pageSize = Number(paramsValue(options?.params, 'pageSize') || 50)
    const items = filteredItems.slice((page - 1) * pageSize, page * pageSize)
    return { items, total: filteredItems.length, page, pageSize, displaySchema: run?.displaySchema }
  }
  const optionsMatch = url.match(/^\/audit\/phase1\/runs\/([^/]+)\/filter-options$/)
  if (optionsMatch) {
    const runId = decodeURIComponent(optionsMatch[1])
    const metricMap = new Map(
      detailsForRun(runId).map((item) => [item.metricCode, item.metricName]),
    )
    const metrics = Array.from(metricMap, ([value, label]) => ({ value, label }))
    return { runId, metrics }
  }
  const runMatch = url.match(/^\/audit\/phase1\/runs\/([^/]+)$/)
  if (runMatch)
    return runItems.find((item) => item.runId === decodeURIComponent(runMatch[1])) || runItems[0]
  if (url === '/audit/phase1/rules') return { items: runItems, total: runItems.length }
  return { list: [], unread: 0 }
}

export const api = { get: mockGet }
export const getNotifications = async (_params?: unknown) => ({ list: [], unread: 0 })
export const markNotifRead = async (_id: string | number) => ({ ok: true })
export const markAllRead = async () => ({ ok: true })
