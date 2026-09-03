export type AuditPriority = 'P1' | 'P2' | 'P3'
export type AuditLayer = 'L0' | 'L1' | 'L2'

export interface AuditIssue {
  id: string
  priority: AuditPriority
  layer: AuditLayer
  ruleCode: string
  title: string
  subject: string
  riskLabel?: string
  status: string
  responsibleGroup: string
  owner: string
  duration: string
  bizDate: string
  firstSeen: string
  lastSeen: string
  impact: string
  explanation: string
  metricDemoId?: string
}

export const auditIssues: AuditIssue[] = [
  {
    id: 'INC-20260806-001',
    priority: 'P1',
    layer: 'L0',
    ruleCode: 'L0_ARRIVAL_MISSING',
    title: 'ty_* 持仓源表未到',
    subject: '36 张持仓与合约表',
    status: '已分派',
    responsibleGroup: '数据到货与质量组',
    owner: '刘明',
    duration: '6 个交易日',
    bizDate: '2026-08-05',
    firstSeen: '2026-07-28 09:45',
    lastSeen: '2026-08-06 09:45',
    impact: '阻断 L1 业务自洽核对，影响持仓、合约及估值明细验证。',
    explanation:
      '按 CNY 交易日历，业务日 2026-08-05 的持仓数据应在 T+1 09:30 前到达，当前仍未发现有效批次。',
  },
  {
    id: 'INC-20260806-002',
    priority: 'P1',
    layer: 'L1',
    ruleCode: 'L1_NAV_IDENTITY',
    title: '高风险客户净值不一致',
    subject: 'F10081009',
    riskLabel: '高风险',
    status: '待确认',
    responsibleGroup: '估值与风险稽核组',
    owner: 'Emily',
    duration: '32 分钟',
    bizDate: '2026-08-05',
    firstSeen: '2026-08-06 09:44',
    lastSeen: '2026-08-06 10:16',
    impact: '交易对手层 NAV 差额 2,186,000 CNY，已触发高风险客户零容差策略。',
    explanation:
      '左右数据集按 party_id 与 valuation_date 完成匹配，报告口径净值在汇率修正后仍存在真实差异。',
    metricDemoId: 'L1-METRIC-001',
  },
  {
    id: 'INC-20260806-003',
    priority: 'P2',
    layer: 'L2',
    ruleCode: 'L2_CLIENT_MISSING',
    title: '同余估值报告缺少客户',
    subject: '151 个账户',
    status: '修复中',
    responsibleGroup: '估值与风险稽核组',
    owner: '陈乐',
    duration: '2 小时',
    bizDate: '2026-08-05',
    firstSeen: '2026-08-06 08:10',
    lastSeen: '2026-08-06 10:10',
    impact: '我方有、同余无 151 个账户；金额核对已暂停，避免 NULL 被误判为 0。',
    explanation: '双向存在性检查发现左侧账户主键无法在右侧报告中匹配，独立生成缺失问题。',
  },
  {
    id: 'INC-20260806-004',
    priority: 'P2',
    layer: 'L0',
    ruleCode: 'L0_ROWCOUNT_DEVIATION',
    title: 'bct 数据量异常下降',
    subject: 'bct_excess_margin',
    status: '已恢复',
    responsibleGroup: '数据到货与质量组',
    owner: '王睿',
    duration: '已验证',
    bizDate: '2026-07-28',
    firstSeen: '2026-07-29 17:41',
    lastSeen: '2026-08-06 09:45',
    impact: '当日仅 4 行，较近 5 个到货日中位数下降 99.1%。',
    explanation: '数据重跑完成后已自动复核通过，事件保留用于历史追踪。',
  },
]

export interface L0AuditRule {
  id: string
  name: string
  type: string
  asset: string
  fields: string
  defaultPolicy: string
  schedule: string
  responsibleGroup: string
  level: 'BLOCK' | 'WARN'
  result: '通过' | '异常' | '历史异常'
  evidence: string
  sampleSql: string
}

export const l0AuditRules: L0AuditRule[] = [
  {
    id: 'L0-UNIQUE-001',
    name: '交易对手业务键唯一性',
    type: '唯一性',
    asset: 'hz-trade.party_info',
    fields: 'party_id',
    defaultPolicy: '重复组数 = 0',
    schedule: 'CNY 交易日 · 数据日 T-1 · 非运行日跳过并留痕',
    responsibleGroup: '主数据治理组',
    level: 'BLOCK',
    result: '通过',
    evidence: '开发库 491 行，491 个唯一 party_id，当前重复组 0。',
    sampleSql: `SELECT party_id, COUNT(*) AS duplicate_count\nFROM hz_trade.party_info\nGROUP BY party_id\nHAVING COUNT(*) > 1`,
  },
  {
    id: 'L0-NOTNULL-002',
    name: '存续合约估值价完整性',
    type: '非空完整性',
    asset: 'hz-trade.instrument_eval_rep',
    fields: 'EVALUATE_PRICE',
    defaultPolicy: '存续合约空值数 = 0',
    schedule: 'CNY 交易日 · 数据日 T-1 · 非运行日跳过并留痕',
    responsibleGroup: '数据到货与质量组',
    level: 'WARN',
    result: '异常',
    evidence: '2026-08-05 共 3,583 条存续合约，其中 6 条估值价为空。',
    sampleSql: `SELECT party_id, CONTRACT_CODE, ERROR_MESSAGE\nFROM hz_trade.instrument_eval_rep\nWHERE ADJUST_VALUATION_DATE = \${data_date}\n  AND CONTRACT_STATUS = '存续'\n  AND EVALUATE_PRICE IS NULL`,
  },
  {
    id: 'L0-REF-003',
    name: '估值报告交易对手参照完整性',
    type: '参照完整性',
    asset: 'hz-trade.bct_excess_margin',
    fields: 'party_id → party_info.party_id',
    defaultPolicy: '参照缺失数 = 0',
    schedule: 'CNY 交易日 · 数据日 T-1 · 非运行日跳过并留痕',
    responsibleGroup: '主数据治理组',
    level: 'BLOCK',
    result: '通过',
    evidence: '2026-08-05 共 464 条报告记录，交易对手主数据缺失 0。',
    sampleSql: `SELECT b.party_id\nFROM hz_trade.bct_excess_margin b\nWHERE b.valuation_date = \${data_date}\n  AND NOT EXISTS (SELECT 1 FROM hz_trade.party_info p WHERE p.party_id = b.party_id)`,
  },
  {
    id: 'L0-ENUM-004',
    name: '交易对手状态有效性',
    type: '枚举有效性',
    asset: 'hz-trade.party_info',
    fields: 'party_status',
    defaultPolicy: '仅允许：正常、禁用、销户',
    schedule: '工作日日历 workday-v2 · 运行日 T',
    responsibleGroup: '主数据治理组',
    level: 'WARN',
    result: '通过',
    evidence: '当前分布：正常 465、禁用 23、销户 3，非法值 0。',
    sampleSql: `SELECT party_id, party_status\nFROM hz_trade.party_info\nWHERE party_status IS NULL\n   OR party_status NOT IN ('正常', '禁用', '销户')`,
  },
  {
    id: 'L0-ARRIVAL-005',
    name: '同余估值报告按自然日到货',
    type: '到货及时性',
    asset: 'hz-trade.bct_excess_margin',
    fields: 'valuation_date / created_at',
    defaultPolicy: '自然日 T+1 09:30 前到达',
    schedule: '自然日 · 数据日 T-1 · 周末有报告仍执行',
    responsibleGroup: '数据到货与质量组',
    level: 'BLOCK',
    result: '通过',
    evidence: '最新报告数据日为 2026-08-05；该源周末会合法补数，因此使用自然日。',
    sampleSql: `SELECT MAX(valuation_date) AS latest_data_date,\n       MAX(created_at) AS latest_arrival_time\nFROM hz_trade.bct_excess_margin\nWHERE valuation_date = \${biz_date_minus_1_natural_day}`,
  },
  {
    id: 'L0-VOLUME-006',
    name: '同余估值报告行数波动',
    type: '数据量波动',
    asset: 'hz-trade.bct_excess_margin',
    fields: 'COUNT(*)',
    defaultPolicy: '较近 5 个到货日中位数下降不超过 30%',
    schedule: '自然日 · 数据日 T-1 · 无到货批次时跳过并留痕',
    responsibleGroup: '数据到货与质量组',
    level: 'BLOCK',
    result: '历史异常',
    evidence: '2026-07-28 仅 4 行，常态约 464–467 行，下降约 99.1%。',
    sampleSql: `SELECT valuation_date, COUNT(*) AS row_count\nFROM hz_trade.bct_excess_margin\nWHERE valuation_date BETWEEN \${window_start} AND \${data_date}\nGROUP BY valuation_date\nORDER BY valuation_date`,
  },
]

export interface AuditMetric {
  key: string
  metric: string
  left: string
  right: string
  diff: string
  result: '一致' | '不一致' | '超阈值' | '不可比'
  comparator: string
  interpretation: string
}

export interface MetricAuditDemo {
  id: string
  layer: 'L1' | 'L2'
  name: string
  subject: string
  bizDate: string
  calendar: string
  owner: string
  summary: string
  leftName: string
  rightName: string
  leftSql: string
  rightSql: string
  metrics: AuditMetric[]
}

export const metricAuditDemos: MetricAuditDemo[] = [
  {
    id: 'L1-METRIC-001',
    layer: 'L1',
    name: '客户估值核心指标稽核',
    subject: 'F10081009 · 高风险客户',
    bizDate: '2026-08-05',
    calendar: '自然日 · 报告日 T，稽核日 T+1',
    owner: '估值运营',
    summary: '2 项需处理 / 3 项指标',
    leftName: '同余估值报告',
    rightName: '我方清算系统',
    leftSql: `SELECT SUM(nav * fx_ref_cny) AS nav_cny,\n       SUM(Total_Market_Value * fx_ref_cny) AS market_value_cny,\n       SUM(excess_margin * fx_ref_cny) AS excess_margin_cny\nFROM hz_trade.bct_excess_margin\nWHERE valuation_date = \${data_date}\n  AND party_id = \${party_id}`,
    rightSql: `SELECT SUM(beg_party_amout_new + unrealized_equity_income\n       - bill_in_transit - closed_accrual_adjust) AS nav_cny,\n       SUM(position_market_value_cny) AS market_value_cny,\n       SUM(excess_margin) AS excess_margin_cny\nFROM audit_our_valuation_component\nWHERE init_date = \${data_date}\n  AND party_id = \${party_id}`,
    metrics: [
      {
        key: 'nav',
        metric: '净值 NAV（CNY）',
        left: '12,860,000.00',
        right: '10,674,000.00',
        diff: '+2,186,000.00',
        result: '不一致',
        comparator: 'ABS(差额) ≤ 1.00',
        interpretation: '报告口径净值存在真实差异，进入现金、三项和浮动盈亏归因。',
      },
      {
        key: 'mv',
        metric: '总市值（CNY）',
        left: '8,421,506.28',
        right: '8,421,506.28',
        diff: '0.00',
        result: '一致',
        comparator: 'ABS(差额) ≤ 1.00',
        interpretation: '持仓市值口径一致，无需生成问题。',
      },
      {
        key: 'margin',
        metric: '可用保证金（CNY）',
        left: '3,570,400.00',
        right: '3,532,000.00',
        diff: '+38,400.00',
        result: '超阈值',
        comparator: '绝对差 ≤ 10,000 或差异率 ≤ 0.10%',
        interpretation: '超出业务容差，作为独立指标问题处置。',
      },
    ],
  },
  {
    id: 'L2-METRIC-002',
    layer: 'L2',
    name: '日内风险估值差异归因',
    subject: 'Nomura_CHEN JIAN',
    bizDate: '2026-08-04',
    calendar: '自然日 · 数据日 2026-08-04',
    owner: '风险数据组',
    summary: '4 项不一致 / 5 项指标',
    leftName: '同余落库副本',
    rightName: '我方口径组件',
    leftSql: `SELECT nav AS nav_cny,\n       Total_Market_Value AS market_value_cny,\n       total_cash_balance AS cash_balance_cny,\n       trade_interest_adjustment + monthly_interest_adjustment\n       + dividend_adjustment AS interest_dividend_cny,\n       excess_margin AS excess_margin_cny\nFROM hz_trade.bct_excess_margin\nWHERE valuation_date = \${data_date} AND party_id = \${party_id}`,
    rightSql: `SELECT sys_nav_report_caliber_cny AS nav_cny,\n       sys_market_value_cny AS market_value_cny,\n       sys_cash_cny + under_margin_t_cny AS cash_balance_cny,\n       sys_interest_dividend_cny AS interest_dividend_cny,\n       sys_excess_margin_cny AS excess_margin_cny\nFROM audit_intraday_valuation_component\nWHERE data_date = \${data_date} AND party_id = \${party_id}`,
    metrics: [
      {
        key: 'nav',
        metric: '报告口径净值（CNY）',
        left: '-20,295,621.80',
        right: '-20,302,831.39',
        diff: '+7,209.59',
        result: '不一致',
        comparator: '精确核对，容差 1.00',
        interpretation: '差异未被在途票据和已了结应计解释。',
      },
      {
        key: 'mv',
        metric: '总市值（CNY）',
        left: '6,707,262.34',
        right: '6,709,299.17',
        diff: '-2,036.83',
        result: '不一致',
        comparator: '精确核对，容差 1.00',
        interpretation: '优先检查 Excel 到落库副本是否丢失非报告币种持仓。',
      },
      {
        key: 'cash',
        metric: '现金余额（CNY）',
        left: '3,412,800.00',
        right: '3,405,344.70',
        diff: '+7,455.30',
        result: '超阈值',
        comparator: 'ABS(差额) ≤ 1.00',
        interpretation: '现金侧可以解释净值差异的主要部分。',
      },
      {
        key: 'three',
        metric: '融资利息＋返息＋股息',
        left: '-53,370.16',
        right: '-53,386.37',
        diff: '+16.21',
        result: '不一致',
        comparator: '精确核对，容差 1.00',
        interpretation: '需结合已了结应计在三项合计层面调整。',
      },
      {
        key: 'excess',
        metric: '可用保证金（CNY）',
        left: '-24,186,026.74',
        right: '-24,194,417.75',
        diff: '+8,391.01',
        result: '不一致',
        comparator: 'ABS(差额) ≤ 1.00',
        interpretation: '业务产出指标不一致，生成 P1 问题。',
      },
    ],
  },
  {
    id: 'L2-METRIC-003',
    layer: 'L2',
    name: '报告落库忠实性稽核',
    subject: 'HuataiEST_PROP',
    bizDate: '2026-08-04',
    calendar: '自然日 · Excel 报告版本 08:10',
    owner: '报表接入组',
    summary: '1 项待核验 / 3 项指标',
    leftName: '原始 Excel 摘要组件',
    rightName: 'bct_excess_margin',
    leftSql: `SELECT party_id,\n       nav AS nav_cny,\n       total_market_value AS market_value_cny,\n       monthly_interest_adjustment AS monthly_interest_adjustment_cny\nFROM source_excel_valuation_snapshot\nWHERE report_date = \${data_date} AND party_id = \${party_id}`,
    rightSql: `SELECT party_id,\n       nav AS nav_cny,\n       Total_Market_Value AS market_value_cny,\n       monthly_interest_adjustment AS monthly_interest_adjustment_cny\nFROM hz_trade.bct_excess_margin\nWHERE valuation_date = \${data_date} AND party_id = \${party_id}`,
    metrics: [
      {
        key: 'nav',
        metric: '原始报告净值',
        left: '-844,041,840.13',
        right: '-844,041,840.13',
        diff: '0.00',
        result: '一致',
        comparator: '精确相等',
        interpretation: '原始报告与落库副本一致。',
      },
      {
        key: 'mv',
        metric: '原始报告总市值',
        left: '1,262,223,316.37',
        right: '1,262,223,316.37',
        diff: '0.00',
        result: '一致',
        comparator: '精确相等',
        interpretation: '本日市值未发生解析丢字段。',
      },
      {
        key: 'interest',
        metric: '月度返息调整',
        left: '待解析',
        right: '0.00',
        diff: '—',
        result: '不可比',
        comparator: 'NULL 不转 0',
        interpretation: 'Excel 单元格公式异常时必须回明细 Sheet 汇总，不能静默兜底。',
      },
    ],
  },
]

export type AuditResultSource = 'DS 结果' | '实时指标'
export type AuditDetailType = 'quality' | 'comparison' | 'realtime'
export type AuditDetailRole = 'FORMAL' | 'DIAGNOSTIC'
export type AuditDetailResultCode =
  'PASS' | 'OVER_THRESHOLD' | 'LEFT_ONLY' | 'RIGHT_ONLY' | 'NOT_COMPARABLE' | 'NO_DATA'

export interface AuditResultDetail {
  [key: string]: string | undefined
  objectKey?: string
  objectName?: string
  metricCode?: string
  metric?: string
  role?: AuditDetailRole
  left?: string
  right?: string
  diff?: string
  result?: string
  resultCode?: AuditDetailResultCode
  comparator?: string
  reason?: string
}

export interface AuditDisplayColumn {
  title: string
  dataIndex: string
  width?: number
  display?: 'primary' | 'number' | 'danger' | 'result'
}

const qualityDisplayColumns: AuditDisplayColumn[] = [
  { title: '对象主键', dataIndex: 'objectKey', width: 250, display: 'primary' },
  { title: '异常字段 / 核查项', dataIndex: 'field', width: 180 },
  { title: '实际值', dataIndex: 'actual', width: 150, display: 'number' },
  { title: '期望值 / 规则', dataIndex: 'expected', width: 200 },
  { title: '结果', dataIndex: 'result', width: 110, display: 'result' },
]
const comparisonDisplayColumns: AuditDisplayColumn[] = [
  { title: '指标', dataIndex: 'metric', width: 260, display: 'primary' },
  { title: '左侧值', dataIndex: 'left', width: 170, display: 'number' },
  { title: '右侧值', dataIndex: 'right', width: 170, display: 'number' },
  { title: '差额（左－右）', dataIndex: 'diff', width: 170, display: 'danger' },
  { title: '结果', dataIndex: 'result', width: 120, display: 'result' },
]
function createPhaseOneComparisonColumns(
  objectTitle: string,
  leftTitle: string,
  rightTitle: string,
  relationTitle: string,
): AuditDisplayColumn[] {
  return [
    { title: objectTitle, dataIndex: 'objectKey', width: 200, display: 'primary' },
    { title: '对比字段 / 指标', dataIndex: 'metric', width: 200, display: 'primary' },
    { title: leftTitle, dataIndex: 'left', width: 180, display: 'number' },
    { title: rightTitle, dataIndex: 'right', width: 180, display: 'number' },
    { title: relationTitle, dataIndex: 'diff', width: 190, display: 'danger' },
    { title: '结果', dataIndex: 'result', width: 110, display: 'result' },
  ]
}
const phaseOnePositionFundingColumns = createPhaseOneComparisonColumns(
  '交易对手',
  '持仓表数据',
  '入金表数据',
  '关系判断',
)
const phaseOneValuationComparisonColumns = createPhaseOneComparisonColumns(
  '交易对手',
  '我方值',
  'BCT / 同余值',
  '差额（我方－BCT）',
)
const realtimeDisplayColumns: AuditDisplayColumn[] = [
  { title: '标的 / 对象', dataIndex: 'target', width: 245, display: 'primary' },
  { title: '实时指标', dataIndex: 'metric', width: 170 },
  { title: '当前值', dataIndex: 'actual', width: 120, display: 'danger' },
  { title: '阈值 / 比较', dataIndex: 'threshold', width: 130 },
  { title: '事件时间', dataIndex: 'eventTime', width: 140 },
  { title: '结果', dataIndex: 'result', width: 100, display: 'result' },
]

export interface AuditResultSummary {
  runId: string
  layer: AuditLayer
  checkName: string
  objectName: string
  source: AuditResultSource
  execStatus: string
  auditResult: string
  totalCount: number
  anomalyCount: number
  candidateDetailCount?: number
  persistedDetailCount?: number
  detailTruncated?: boolean
  detailLimit?: number
  bizDate: string
  calendarSnapshot: string
  executedAt: string
  duration: string
  message: string
  detailType: AuditDetailType
  detailScope?: 'exceptions-only' | 'abnormal-object-all-metrics'
  filterable?: boolean
  objectType?: string
  objectTypeLabel?: string
  leftLabel?: string
  rightLabel?: string
  displayColumns: AuditDisplayColumn[]
  details: AuditResultDetail[]
  detailTotal?: number
}

export const auditResults: AuditResultSummary[] = [
  {
    runId: 'AUD-0806-001',
    layer: 'L0',
    checkName: '持仓源表到货及时性',
    objectName: 'ty_* 持仓与合约表',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '阻断',
    totalCount: 48,
    anomalyCount: 3,
    bizDate: '2026-08-05',
    calendarSnapshot: 'CNY 交易日 · 2026-v3 · 数据日 T-1',
    executedAt: '2026-08-06 09:45:18',
    duration: '18.4s',
    message: 'DS 任务执行成功，3 张必到表未在 T+1 09:30 前产出有效批次。',
    detailType: 'quality',
    displayColumns: qualityDisplayColumns,
    details: [
      {
        objectKey: 'ty_position_detail',
        field: '到货批次',
        actual: '未检测到',
        expected: 'T+1 09:30 前到达',
        result: '未到货',
      },
      {
        objectKey: 'ty_contract_detail',
        field: '到货批次',
        actual: '未检测到',
        expected: 'T+1 09:30 前到达',
        result: '未到货',
      },
      {
        objectKey: 'ty_security_balance',
        field: '数据日',
        actual: '2026-08-04',
        expected: '2026-08-05',
        result: '数据过期',
      },
    ],
  },
  {
    runId: 'AUD-0806-004',
    layer: 'L0',
    checkName: '存续合约估值价完整性',
    objectName: 'instrument_eval_rep.EVALUATE_PRICE',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '异常',
    totalCount: 3583,
    anomalyCount: 6,
    bizDate: '2026-08-05',
    calendarSnapshot: 'CNY 交易日 · 2026-v3 · 数据日 T-1',
    executedAt: '2026-08-06 10:03:14',
    duration: '12.1s',
    message: 'DS 完成空值检查，3,583 条存续合约中发现 6 条估值价为 NULL。',
    detailType: 'quality',
    displayColumns: qualityDisplayColumns,
    details: [
      {
        objectKey: 'F10081009 / SWAP-240812-01',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '存续合约必须非空',
        result: '异常',
      },
      {
        objectKey: 'F10081009 / SWAP-240812-02',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '存续合约必须非空',
        result: '异常',
      },
      {
        objectKey: 'CICC_PROP / OPT-240731-17',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '存续合约必须非空',
        result: '异常',
      },
      {
        objectKey: 'NOMURA / EQS-250115-04',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '存续合约必须非空',
        result: '异常',
      },
      {
        objectKey: 'HUATAI / SWAP-251201-03',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '存续合约必须非空',
        result: '异常',
      },
      {
        objectKey: 'CITIC / OPT-260228-09',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '存续合约必须非空',
        result: '异常',
      },
    ],
  },
  {
    runId: 'AUD-0806-002',
    layer: 'L1',
    checkName: '客户保证金组合指标稽核',
    objectName: '2 个异常客户 · 保证金组合核对',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '异常',
    totalCount: 4,
    anomalyCount: 2,
    bizDate: '2026-08-05',
    calendarSnapshot: '自然日 · system · 报告日 T-1',
    executedAt: '2026-08-06 09:46:02',
    duration: '31.2s',
    message:
      '左右 SQL 按 party_id + data_date 对齐，2 个客户各有 1 项正式指标异常；同组 PASS 指标与诊断项一并保留，便于直接定位差异原因。',
    detailType: 'comparison',
    detailScope: 'abnormal-object-all-metrics',
    leftLabel: '同余估值报告',
    rightLabel: '我方清算系统',
    displayColumns: comparisonDisplayColumns,
    details: [
      {
        objectKey: 'F10081009',
        objectName: 'F10081009 · 高风险客户',
        metricCode: 'initial_margin_cny',
        metric: '初始保证金（CNY）',
        role: 'FORMAL',
        left: '4,297,800.00',
        right: '4,297,800.00',
        diff: '0.00',
        result: '通过',
        resultCode: 'PASS',
        comparator: 'ABS(差额) ≤ 1.00',
        reason: '正式业务指标一致；作为同一客户的完整上下文保留。',
      },
      {
        objectKey: 'F10081009',
        objectName: 'F10081009 · 高风险客户',
        metricCode: 'excess_margin_cny',
        metric: '超额保证金（CNY）',
        role: 'FORMAL',
        left: '3,570,400.00',
        right: '3,532,000.00',
        diff: '+38,400.00',
        result: '超阈值',
        resultCode: 'OVER_THRESHOLD',
        comparator: '绝对差 ≤ 10,000 或差异率 ≤ 0.10%',
        reason: '正式业务指标超出容差，计入本次异常数并生成问题。',
      },
      {
        objectKey: 'F10081009',
        objectName: 'F10081009 · 高风险客户',
        metricCode: 'report_currency_fx',
        metric: '报告币种折 CNY 汇率',
        role: 'DIAGNOSTIC',
        left: '1.000000',
        right: '1.000000',
        diff: '0.000000',
        result: '通过',
        resultCode: 'PASS',
        comparator: '币种与汇率版本一致',
        reason: '汇率口径一致，可排除报告币种换算导致的差异。',
      },
      {
        objectKey: 'F10081009',
        objectName: 'F10081009 · 高风险客户',
        metricCode: 'floating_pnl_landed',
        metric: '浮动盈亏落库诊断',
        role: 'DIAGNOSTIC',
        left: '+38,400.00',
        right: 'NULL',
        diff: '—',
        result: '不可比较',
        resultCode: 'NOT_COMPARABLE',
        comparator: '两侧均有值后再比较',
        reason: '右侧诊断字段未落库；仅提示排查方向，不直接增加正式异常数。',
      },
      {
        objectKey: 'NOMURA_CHEN_JIAN',
        objectName: 'Nomura_CHEN JIAN · 重点客户',
        metricCode: 'initial_margin_cny',
        metric: '初始保证金（CNY）',
        role: 'FORMAL',
        left: '7,420,500.00',
        right: '7,399,800.00',
        diff: '+20,700.00',
        result: '超阈值',
        resultCode: 'OVER_THRESHOLD',
        comparator: 'ABS(差额) ≤ 10,000',
        reason: '正式业务指标超出容差，计入本次异常数并生成问题。',
      },
      {
        objectKey: 'NOMURA_CHEN_JIAN',
        objectName: 'Nomura_CHEN JIAN · 重点客户',
        metricCode: 'excess_margin_cny',
        metric: '超额保证金（CNY）',
        role: 'FORMAL',
        left: '-24,194,417.75',
        right: '-24,194,417.75',
        diff: '0.00',
        result: '通过',
        resultCode: 'PASS',
        comparator: 'ABS(差额) ≤ 1.00',
        reason: '正式业务指标一致；作为同一客户的完整上下文保留。',
      },
      {
        objectKey: 'NOMURA_CHEN_JIAN',
        objectName: 'Nomura_CHEN JIAN · 重点客户',
        metricCode: 'cross_currency_fx',
        metric: '交叉汇率完整性诊断',
        role: 'DIAGNOSTIC',
        left: 'JPY/CNY 0.048212',
        right: '汇率键缺失',
        diff: '—',
        result: '不可比较',
        resultCode: 'NOT_COMPARABLE',
        comparator: '币种对与汇率版本均存在',
        reason: '右侧缺少 JPY/CNY 汇率键；仅作为差异归因线索，不改变正式问题结论。',
      },
      {
        objectKey: 'NOMURA_CHEN_JIAN',
        objectName: 'Nomura_CHEN JIAN · 重点客户',
        metricCode: 'report_arrival',
        metric: '报告到货状态诊断',
        role: 'DIAGNOSTIC',
        left: '08:07:13 已到货',
        right: '08:07:13 已入库',
        diff: '0 秒',
        result: '通过',
        resultCode: 'PASS',
        comparator: '到货后 5 分钟内入库',
        reason: '报告链路正常，可排除到货延迟造成的口径错位。',
      },
    ],
  },
  {
    runId: 'AUD-0806-003',
    layer: 'L2',
    checkName: '外部报告客户双向存在性',
    objectName: '同余估值报告 ↔ 我方客户清单',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '异常',
    totalCount: 464,
    anomalyCount: 3,
    bizDate: '2026-08-05',
    calendarSnapshot: '自然日 · system · 报告日 T-1',
    executedAt: '2026-08-06 10:01:09',
    duration: '9.7s',
    message: '双向存在性 SQL 完成，演示数据中 3 个客户仅在我方存在。',
    detailType: 'comparison',
    displayColumns: comparisonDisplayColumns,
    details: [
      {
        metric: '客户存在性 · F10082017',
        left: '存在',
        right: '缺失',
        diff: '—',
        result: '左有右无',
      },
      {
        metric: '客户存在性 · F10083022',
        left: '存在',
        right: '缺失',
        diff: '—',
        result: '左有右无',
      },
      {
        metric: '客户存在性 · F10084006',
        left: '存在',
        right: '缺失',
        diff: '—',
        result: '左有右无',
      },
    ],
  },
  {
    runId: 'AUD-0806-005',
    layer: 'L2',
    checkName: '高风险标的波动实时监控',
    objectName: '高风险客户持仓标的',
    source: '实时指标',
    execStatus: '成功',
    auditResult: '异常',
    totalCount: 286,
    anomalyCount: 3,
    bizDate: '2026-08-06',
    calendarSnapshot: 'CNY 交易日盘中 · 2026-v3',
    executedAt: '2026-08-06 10:16:08',
    duration: '0.08s',
    message: '风控核心通过消息流推送 Metric，3 个标的实时波动超过高风险策略阈值。',
    detailType: 'realtime',
    displayColumns: realtimeDisplayColumns,
    details: [
      {
        target: 'F10081009 / 00700.HK',
        metric: '5 分钟价格波动',
        actual: '+4.82%',
        threshold: '≤ 3.00%',
        eventTime: '10:15:42.286',
        result: '超阈值',
      },
      {
        target: 'Nomura_CHEN JIAN / NVDA.O',
        metric: '日内涨跌幅',
        actual: '-6.13%',
        threshold: '≥ -5.00%',
        eventTime: '10:15:51.904',
        result: '超阈值',
      },
      {
        target: 'HuataiEST_PROP / 600519.SH',
        metric: '持仓市值变动',
        actual: '+12.40%',
        threshold: '≤ 10.00%',
        eventTime: '10:16:03.117',
        result: '超阈值',
      },
    ],
  },
  {
    runId: 'AUD-0806-006',
    layer: 'L2',
    checkName: '跨市场行情一致性',
    objectName: 'SSE / HKEX 行情快照',
    source: 'DS 结果',
    execStatus: '失败',
    auditResult: '未产出',
    totalCount: 0,
    anomalyCount: 0,
    bizDate: '2026-08-06',
    calendarSnapshot: '组合日历 SSE 2026-v2 + HKEX 2026-v1',
    executedAt: '2026-08-06 10:08:31',
    duration: '60.0s',
    message: '执行器超时，本次没有产出业务稽核结论，不应计为“数据通过”。',
    detailType: 'quality',
    displayColumns: qualityDisplayColumns,
    details: [],
  },
  {
    runId: 'AUD-0806-007',
    layer: 'L0',
    checkName: '交易对手业务键唯一性',
    objectName: 'party_info.party_id',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '通过',
    totalCount: 491,
    anomalyCount: 0,
    bizDate: '2026-08-05',
    calendarSnapshot: 'CNY 交易日 · 2026-v3 · 数据日 T-1',
    executedAt: '2026-08-06 10:12:22',
    duration: '4.6s',
    message: '491 条交易对手主数据主键全部唯一，本次巡检通过。',
    detailType: 'quality',
    displayColumns: qualityDisplayColumns,
    details: [],
  },
]

/**
 * 数据稽核一期上线范围。
 *
 * 与“数据稽核完整”使用独立数据集，避免一期页面混入完整版本的到货、
 * 行情、主数据等规则。三个结果均按一次真实 DS 运行展示。
 */
export const auditPhaseOneResults: AuditResultSummary[] = [
  {
    runId: 'P1-AUD-20260806-001',
    layer: 'L0',
    checkName: '估值价格未维护',
    objectName: 'instrument_eval_rep.EVALUATE_PRICE',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '异常',
    totalCount: 3583,
    anomalyCount: 6,
    bizDate: '2026-08-05',
    calendarSnapshot: 'CNY 交易日 · 2026-v3 · 数据日 T-1',
    executedAt: '2026-08-06 10:03:14',
    duration: '12.1s',
    message: '检查估值价格字段是否为 NULL 或 0；3,583 条存续合约中发现 6 条未维护记录。',
    detailType: 'quality',
    objectType: 'contract',
    objectTypeLabel: '合约',
    displayColumns: qualityDisplayColumns,
    details: [
      {
        objectKey: 'F10081009 / SWAP-240812-01',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '必须非空且不为 0',
        result: '未维护',
      },
      {
        objectKey: 'F10081009 / SWAP-240812-02',
        field: 'EVALUATE_PRICE',
        actual: '0.00',
        expected: '必须非空且不为 0',
        result: '未维护',
      },
      {
        objectKey: 'CICC_PROP / OPT-240731-17',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '必须非空且不为 0',
        result: '未维护',
      },
      {
        objectKey: 'NOMURA / EQS-250115-04',
        field: 'EVALUATE_PRICE',
        actual: '0.00',
        expected: '必须非空且不为 0',
        result: '未维护',
      },
      {
        objectKey: 'HUATAI / SWAP-251201-03',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '必须非空且不为 0',
        result: '未维护',
      },
      {
        objectKey: 'CITIC / OPT-260228-09',
        field: 'EVALUATE_PRICE',
        actual: 'NULL',
        expected: '必须非空且不为 0',
        result: '未维护',
      },
    ],
  },
  {
    runId: 'P1-AUD-20260806-002',
    layer: 'L1',
    checkName: '有持仓未入金',
    objectName: '客户持仓表 ↔ 入金流水表',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '异常',
    totalCount: 468,
    anomalyCount: 3,
    bizDate: '2026-08-05',
    calendarSnapshot: 'CNY 交易日 · 2026-v3 · 数据日 T-1',
    executedAt: '2026-08-06 10:05:26',
    duration: '8.6s',
    message: '按业务日期和客户编号比较持仓表与入金表，发现 3 个客户存在持仓但没有有效入金记录。',
    detailType: 'comparison',
    detailScope: 'exceptions-only',
    objectType: 'counterparty',
    objectTypeLabel: '交易对手',
    leftLabel: '客户持仓表',
    rightLabel: '入金流水表',
    displayColumns: phaseOnePositionFundingColumns,
    details: [
      {
        objectKey: 'F10082017',
        metricCode: 'funding_record_presence',
        metric: '入金记录存在性',
        left: '存在 · 12 笔 / 1,864,200.00',
        right: '缺失 · 0 笔 / 0.00',
        diff: 'A 有 · B 无',
        result: '左有右无',
        resultCode: 'LEFT_ONLY',
      },
      {
        objectKey: 'F10083022',
        metricCode: 'funding_record_presence',
        metric: '入金记录存在性',
        left: '存在 · 7 笔 / 926,400.00',
        right: '缺失 · 0 笔 / 0.00',
        diff: 'A 有 · B 无',
        result: '左有右无',
        resultCode: 'LEFT_ONLY',
      },
      {
        objectKey: 'F10084006',
        metricCode: 'funding_record_presence',
        metric: '入金记录存在性',
        left: '存在 · 3 笔 / 348,600.00',
        right: '缺失 · 0 笔 / 0.00',
        diff: 'A 有 · B 无',
        result: '左有右无',
        resultCode: 'LEFT_ONLY',
      },
    ],
  },
  {
    runId: 'P1-AUD-20260806-003',
    layer: 'L1',
    checkName: '持仓与 BCT 同余估值报告核对',
    objectName: '3 个异常客户 · 我方持仓/估值 ↔ BCT 同余估值报告',
    source: 'DS 结果',
    execStatus: '成功',
    auditResult: '异常',
    totalCount: 9,
    anomalyCount: 5,
    bizDate: '2026-08-05',
    calendarSnapshot: '自然日 · system · 报告日 T-1',
    executedAt: '2026-08-06 10:08:42',
    duration: '15.3s',
    message:
      '按客户和业务日期对齐我方数据与 BCT 同余估值报告；本次 3 个客户共核对 9 项指标，其中 5 项超过容差。',
    detailType: 'comparison',
    filterable: true,
    objectType: 'counterparty',
    objectTypeLabel: '交易对手',
    leftLabel: '我方系统',
    rightLabel: 'BCT 同余报告',
    displayColumns: phaseOneValuationComparisonColumns,
    details: [
      {
        objectKey: 'F10081009',
        metricCode: 'nav_cny',
        metric: 'NAV（CNY）',
        left: '12,860,000.00',
        right: '10,674,000.00',
        diff: '+2,186,000.00',
        result: '超阈值',
        resultCode: 'OVER_THRESHOLD',
      },
      {
        objectKey: 'F10081009',
        metricCode: 'market_value_cny',
        metric: '总市值（CNY）',
        left: '8,421,506.28',
        right: '8,421,506.28',
        diff: '0.00',
        result: '一致',
        resultCode: 'PASS',
      },
      {
        objectKey: 'F10081009',
        metricCode: 'excess_margin_cny',
        metric: '超额保证金（CNY）',
        left: '3,570,400.00',
        right: '3,532,000.00',
        diff: '+38,400.00',
        result: '超阈值',
        resultCode: 'OVER_THRESHOLD',
      },
      {
        objectKey: 'NOMURA_CHEN_JIAN',
        metricCode: 'nav_cny',
        metric: 'NAV（CNY）',
        left: '-20,302,831.39',
        right: '-20,295,621.80',
        diff: '-7,209.59',
        result: '超阈值',
        resultCode: 'OVER_THRESHOLD',
      },
      {
        objectKey: 'NOMURA_CHEN_JIAN',
        metricCode: 'market_value_cny',
        metric: '总市值（CNY）',
        left: '6,709,299.17',
        right: '6,707,262.34',
        diff: '+2,036.83',
        result: '超阈值',
        resultCode: 'OVER_THRESHOLD',
      },
      {
        objectKey: 'NOMURA_CHEN_JIAN',
        metricCode: 'excess_margin_cny',
        metric: '超额保证金（CNY）',
        left: '-24,194,417.75',
        right: '-24,194,417.75',
        diff: '0.00',
        result: '一致',
        resultCode: 'PASS',
      },
      {
        objectKey: 'HUATAI_EST_PROP',
        metricCode: 'nav_cny',
        metric: 'NAV（CNY）',
        left: '-844,041,840.13',
        right: '-844,041,840.13',
        diff: '0.00',
        result: '一致',
        resultCode: 'PASS',
      },
      {
        objectKey: 'HUATAI_EST_PROP',
        metricCode: 'market_value_cny',
        metric: '总市值（CNY）',
        left: '1,262,223,316.37',
        right: '1,262,223,316.37',
        diff: '0.00',
        result: '一致',
        resultCode: 'PASS',
      },
      {
        objectKey: 'HUATAI_EST_PROP',
        metricCode: 'excess_margin_cny',
        metric: '超额保证金（CNY）',
        left: '118,640,500.00',
        right: '118,612,000.00',
        diff: '+28,500.00',
        result: '超阈值',
        resultCode: 'OVER_THRESHOLD',
      },
    ],
  },
]

export interface AuditRun {
  id: string
  layer: AuditLayer
  name: string
  source: AuditResultSource
  type: string
  trigger: string
  execStatus: string
  auditResult: string
  totalCount: number
  anomalyCount: number
  progress: number
  duration: string
  message: string
  bizDate: string
  calendarSnapshot: string
  time: string
}

export const auditRuns: AuditRun[] = auditResults.map((result) => ({
  id: result.runId,
  layer: result.layer,
  name: result.checkName,
  source: result.source,
  type:
    result.detailType === 'quality'
      ? '通用稽核'
      : result.detailType === 'comparison'
        ? 'SQL 对比'
        : '实时指标',
  trigger: result.source === 'DS 结果' ? 'DS 调度' : '消息推送',
  execStatus: result.execStatus,
  auditResult: result.auditResult,
  totalCount: result.totalCount,
  anomalyCount: result.anomalyCount,
  progress: result.execStatus === '失败' ? 36 : 100,
  duration: result.duration,
  message: result.message,
  bizDate: result.bizDate,
  calendarSnapshot: result.calendarSnapshot,
  time: result.executedAt,
}))

export const auditPhaseOneRuns: AuditRun[] = auditPhaseOneResults.map((result) => ({
  id: result.runId,
  layer: result.layer,
  name: result.checkName,
  source: result.source,
  type: result.detailType === 'quality' ? '通用稽核' : 'SQL 对比',
  trigger: 'DS 调度',
  execStatus: result.execStatus,
  auditResult: result.auditResult,
  totalCount: result.totalCount,
  anomalyCount: result.anomalyCount,
  progress: result.execStatus === '失败' ? 36 : 100,
  duration: result.duration,
  message: result.message,
  bizDate: result.bizDate,
  calendarSnapshot: result.calendarSnapshot,
  time: result.executedAt,
}))

export const auditCalendars = [
  {
    market: 'CNY',
    name: '中国银行间及交易所',
    type: '交易日',
    year: '2026',
    days: 365,
    version: '2026-v3',
    status: '有效',
  },
  {
    market: 'SSE',
    name: '上海证券交易所',
    type: '交易日',
    year: '2026',
    days: 365,
    version: '2026-v2',
    status: '有效',
  },
  {
    market: 'SZSE',
    name: '深圳证券交易所',
    type: '交易日',
    year: '2026',
    days: 365,
    version: '2026-v2',
    status: '有效',
  },
  {
    market: 'HKEX',
    name: '香港交易所',
    type: '交易日',
    year: '2026',
    days: 365,
    version: '2026-v1',
    status: '有效',
  },
  {
    market: 'NATURAL',
    name: '自然日',
    type: '自然日',
    year: '永久',
    days: 365,
    version: 'system',
    status: '系统内置',
  },
]

export const riskTargets = [
  {
    key: 'F10081009',
    name: '示例高风险客户',
    level: '高风险',
    summary: '净值与可用保证金零容差；连续异常影响交易额度。',
  },
  {
    key: 'Nomura_CHEN JIAN',
    name: '跨币种重点账户',
    level: '高风险',
    summary: '自然日持续监控，汇率修正后仍有差异立即升级。',
  },
  {
    key: 'HuataiEST_PROP',
    name: '华泰机构自营户',
    level: '重点关注',
    summary: '先验证原始报告到落库副本忠实性，再判定业务差异。',
  },
]
