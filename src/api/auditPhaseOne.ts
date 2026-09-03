import { api } from './index'

export type PhaseOneAuditLayer = 'L0' | 'L1' | 'L2'
export type PhaseOneAuditType = 'BASIC_DATA' | 'TABLE_COMPARISON'
export type PhaseOneExecStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED'
export type PhaseOneAuditStatus =
  'NOT_PRODUCED' | 'PASS' | 'FAIL' | 'BLOCKED' | 'NO_DATA' | 'SKIPPED'
export type PhaseOneDetailType = 'ROW_QUALITY' | 'METRIC_COMPARE'
export type PhaseOneMetricRole = 'FORMAL' | 'DIAGNOSTIC' | 'CONTEXT'

export interface PhaseOneDisplayColumn {
  key: string
  label: string
  width?: number
  fixed?: 'left' | 'right'
  display?: 'primary' | 'number' | 'danger' | 'result'
}

export interface PhaseOneDisplaySchema {
  schemaVersion?: string
  mode?: string
  objectTypeLabel?: string
  leftLabel?: string
  rightLabel?: string
  groupBy?: string
  columns?: PhaseOneDisplayColumn[]
}

export interface PhaseOneRunItem {
  runId: string
  ruleCode: string
  ruleName: string
  dataDomain?: string | null
  checkType?: string | null
  layer: PhaseOneAuditLayer
  layerLabel?: string
  auditType?: PhaseOneAuditType
  auditTypeLabel?: string
  sourceType?: string
  targetType?: string
  targetTypeLabel?: string
  targetName: string
  detailType: PhaseOneDetailType
  execStatus: PhaseOneExecStatus
  execStatusLabel?: string
  auditStatus: PhaseOneAuditStatus
  auditStatusLabel?: string
  totalCount: number | null
  checkedCount?: number | null
  exceptionCount: number
  actualExceptionCount?: number
  candidateDetailCount?: number | null
  persistedDetailCount?: number | null
  detailCount?: number
  detailTruncated?: boolean
  detailLimit?: number | null
  bizDate: string | null
  observationDate?: string | null
  startedAt?: string | null
  finishedAt?: string | null
  executedAt?: string | null
  durationSeconds?: number | null
  summary?: string | null
  errorMessage?: string | null
  displaySchema?: PhaseOneDisplaySchema | null
  runContext?: Record<string, unknown> | null
  superseded?: boolean
  supersededByRunId?: string | null
}

export interface PhaseOneDashboardTrendPoint {
  date: string
  value?: number
  exceptionCount?: number
  abnormalRuns?: number
  failedRuns?: number
  blockedOrNoDataRuns?: number
  ruleCode?: string
  ruleName?: string
}

export interface PhaseOneDashboardResponse {
  observationDate: string
  latestObservationDate?: string | null
  observationDateSource?: 'OBSERVATION_DATE' | 'BIZ_DATE_FALLBACK'
  refreshedAt: string
  source: string
  resultReceiptStatus?: 'RECEIVED' | 'MISSING'
  summary: {
    runCount?: number
    expectedRuns?: number
    completedRuns?: number
    successfulRuns?: number
    failedAuditRuns?: number
    passedRuns?: number
    notTriggeredRuns?: number
    abnormalRuns: number
    failedRuns: number
    sourceUnavailableRuns?: number
    blockedOrNoDataRuns: number
    exceptionCount: number
    rowQualityExceptionCount?: number
    metricCompareExceptionCount?: number
  }
  priorityRuns: PhaseOneRunItem[]
  trend: PhaseOneDashboardTrendPoint[]
  trendByRule?: PhaseOneDashboardTrendPoint[]
  availableObservationDates?: string[]
}

export interface PhaseOneRunListSummary {
  totalRuns?: number
  successfulRuns?: number
  failedRuns?: number
  abnormalRuns?: number
  blockedOrNoDataRuns?: number
  exceptionCount?: number
}

export interface PhaseOneRunListResponse {
  items: PhaseOneRunItem[]
  total: number
  page: number
  pageSize: number
  refreshedAt?: string
  summary?: PhaseOneRunListSummary
}

export interface PhaseOneRunListParams {
  view: 'issues' | 'history'
  bizDateFrom?: string
  bizDateTo?: string
  auditType?: PhaseOneAuditType
  layer?: PhaseOneAuditLayer
  execStatus?: PhaseOneExecStatus
  auditStatus?: PhaseOneAuditStatus
  keyword?: string
  page?: number
  pageSize?: number
}

export interface PhaseOneRunDetail extends PhaseOneRunItem {
  calendarSnapshot?: string | null
  asOfTime?: string | null
  producerVersion?: string | null
}

export interface PhaseOneDetailItem {
  detailSeq: number
  objectType?: string | null
  objectKey?: string | null
  objectName?: string | null
  metricCode?: string | null
  metricName?: string | null
  actualValue?: string | null
  expectedValue?: string | null
  leftValue?: string | null
  rightValue?: string | null
  diffValue?: string | null
  resultCode: string
  resultLabel?: string | null
  reason?: string | null
  role?: PhaseOneMetricRole | null
}

export interface PhaseOneDetailListResponse {
  items: PhaseOneDetailItem[]
  total: number
  page: number
  pageSize: number
  displaySchema?: PhaseOneDisplaySchema | null
}

export interface PhaseOneDetailListParams {
  page?: number
  pageSize?: number
  objectKeyword?: string
  objectKeys?: string[]
  metricCodes?: string[]
  resultCodes?: string[]
  resultGroup?: 'MATCH' | 'MISMATCH' | 'UNDETERMINED'
  // Keep the singular fields for callers that still use the original API.
  objectKey?: string
  metricCode?: string
  resultCode?: string
}

export interface PhaseOneObjectSummary {
  objectKey: string
  objectName?: string | null
  formalMetricCount: number
  formalExceptionCount: number
  passCount: number
  diagnosticCount: number
}

export interface PhaseOneObjectListResponse {
  items: PhaseOneObjectSummary[]
  total: number
  page: number
  pageSize: number
}

export interface PhaseOneObjectMetricsResponse {
  objectKey: string
  objectName?: string | null
  total: number
  items: PhaseOneDetailItem[]
}

export interface PhaseOneRuleItem {
  ruleCode: string
  ruleName: string
  layer: PhaseOneAuditLayer
  targetType: string
  targetName: string
  detailType: PhaseOneDetailType
  enabled: boolean
}

export interface PhaseOneRuleListResponse {
  items: PhaseOneRuleItem[]
  total: number
}

export interface PhaseOneDetailFilterOption {
  value: string
  label: string
}

export interface PhaseOneDetailFilterOptionsResponse {
  runId: string
  metrics: PhaseOneDetailFilterOption[]
}

const response = <T>(request: unknown) => request as Promise<T>

export const getPhaseOneDashboard = (params?: { observationDate?: string; timezone?: string }) =>
  response<PhaseOneDashboardResponse>(api.get('/audit/phase1/dashboard', { params }))

export const getPhaseOneRuns = (params: PhaseOneRunListParams) =>
  response<PhaseOneRunListResponse>(api.get('/audit/phase1/runs', { params }))

export const getPhaseOneRun = (runId: string) =>
  response<PhaseOneRunDetail>(api.get(`/audit/phase1/runs/${encodeURIComponent(runId)}`))

export const getPhaseOneRunFilterOptions = (runId: string) =>
  response<PhaseOneDetailFilterOptionsResponse>(
    api.get(`/audit/phase1/runs/${encodeURIComponent(runId)}/filter-options`),
  )

function phaseOneDetailSearchParams(params?: PhaseOneDetailListParams) {
  if (!params) return undefined
  const search = new URLSearchParams()
  const appendValue = (key: string, value?: string | number) => {
    if (value !== undefined && value !== '') search.append(key, String(value))
  }
  appendValue('page', params.page)
  appendValue('pageSize', params.pageSize)
  appendValue('objectKeyword', params.objectKeyword)
  appendValue('objectKey', params.objectKey)
  appendValue('metricCode', params.metricCode)
  appendValue('resultCode', params.resultCode)
  appendValue('resultGroup', params.resultGroup)
  params.objectKeys?.forEach((value) => appendValue('objectKeys', value))
  params.metricCodes?.forEach((value) => appendValue('metricCodes', value))
  params.resultCodes?.forEach((value) => appendValue('resultCodes', value))
  return search
}

export const getPhaseOneRunDetails = (runId: string, params?: PhaseOneDetailListParams) =>
  response<PhaseOneDetailListResponse>(
    api.get(`/audit/phase1/runs/${encodeURIComponent(runId)}/details`, {
      params: phaseOneDetailSearchParams(params),
    }),
  )

export const getPhaseOneRunObjects = (
  runId: string,
  params?: { page?: number; pageSize?: number },
) =>
  response<PhaseOneObjectListResponse>(
    api.get(`/audit/phase1/runs/${encodeURIComponent(runId)}/objects`, { params }),
  )

export const getPhaseOneObjectMetrics = (runId: string, objectKey: string) =>
  response<PhaseOneObjectMetricsResponse>(
    api.get(
      `/audit/phase1/runs/${encodeURIComponent(runId)}/objects/${encodeURIComponent(objectKey)}/metrics`,
    ),
  )

export const getPhaseOneRules = (params?: { keyword?: string; layer?: PhaseOneAuditLayer }) =>
  response<PhaseOneRuleListResponse>(api.get('/audit/phase1/rules', { params }))
