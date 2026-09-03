# 后端接口联调说明

## 1. 对接原则

- 页面只调用 `src/api/auditPhaseOne.ts` 导出的业务函数。
- 请求参数和响应结构均已在同文件中提供 TypeScript 类型。
- 联调时替换 `src/api/index.ts` 的 Mock 请求实现，不要在页面组件中直接调用 `fetch` 或 HTTP 库。
- 后端建议直接返回类型定义中的业务数据；如果存在统一响应包裹，请在 HTTP 客户端层统一解包。
- 时间字段建议使用 ISO 8601，当前页面按 `Asia/Shanghai` 展示。

## 2. 一期接口清单

| 方法 | 路径                                                   | 用途                       | 前端函数                      |
| ---- | ------------------------------------------------------ | -------------------------- | ----------------------------- |
| GET  | `/audit/phase1/dashboard`                              | 驾驶舱汇总、优先处理和趋势 | `getPhaseOneDashboard`        |
| GET  | `/audit/phase1/runs`                                   | 问题中心或稽核运行记录列表 | `getPhaseOneRuns`             |
| GET  | `/audit/phase1/runs/:runId`                            | 单次稽核运行信息           | `getPhaseOneRun`              |
| GET  | `/audit/phase1/runs/:runId/filter-options`             | 明细页核查项筛选选项       | `getPhaseOneRunFilterOptions` |
| GET  | `/audit/phase1/runs/:runId/details`                    | 基础数据或两表对比明细     | `getPhaseOneRunDetails`       |
| GET  | `/audit/phase1/runs/:runId/objects`                    | 对象汇总列表               | `getPhaseOneRunObjects`       |
| GET  | `/audit/phase1/runs/:runId/objects/:objectKey/metrics` | 对象指标明细               | `getPhaseOneObjectMetrics`    |
| GET  | `/audit/phase1/rules`                                  | 稽核规则列表               | `getPhaseOneRules`            |

## 3. 关键查询参数

### 运行列表 `/audit/phase1/runs`

- `view`: `issues` 或 `history`
- `bizDateFrom` / `bizDateTo`: 业务日期范围
- `auditType`: `BASIC_DATA` 或 `TABLE_COMPARISON`
- `execStatus`: `RUNNING`、`SUCCESS`、`FAILED`、`SKIPPED`
- `auditStatus`: `NOT_PRODUCED`、`PASS`、`FAIL`、`BLOCKED`、`NO_DATA`、`SKIPPED`
- `keyword`: 稽核项或稽核范围关键字
- `page` / `pageSize`: 分页参数

### 运行明细 `/audit/phase1/runs/:runId/details`

- `objectKeyword`: 对象模糊搜索
- `objectKeys`: 对象主键多选，可重复传参
- `metricCodes`: 核查项多选，可重复传参
- `resultCodes`: 结果多选，可重复传参
- `resultGroup`: `MATCH`、`MISMATCH` 或 `UNDETERMINED`
- `page` / `pageSize`: 分页参数

## 4. 响应类型入口

主要响应类型位于 `src/api/auditPhaseOne.ts`：

- `PhaseOneDashboardResponse`
- `PhaseOneRunListResponse`
- `PhaseOneRunDetail`
- `PhaseOneDetailListResponse`
- `PhaseOneDetailFilterOptionsResponse`
- `PhaseOneObjectListResponse`
- `PhaseOneObjectMetricsResponse`
- `PhaseOneRuleListResponse`

后端字段命名请保持 camelCase，避免页面层增加字段转换逻辑。

## 5. HTTP 客户端接入示例

以下示例仅展示接口形态，具体客户端应使用接收方项目已有封装：

```ts
export const api = {
  get<T>(url: string, options?: { params?: unknown }) {
    return httpClient.get<T>(url, options)
  },
}
```

如后端响应为 `{ code, message, data }`，请在 `httpClient` 的响应拦截器中返回 `data`，使业务函数继续获得本文定义的响应结构。

## 6. 联调检查清单

- [ ] 驾驶舱日期切换和手动刷新
- [ ] 趋势图多选，最多选择 5 个稽核项
- [ ] 问题中心组合筛选、分页和明细跳转
- [ ] 基础数据明细对象/核查项多选、查询、重置和分页
- [ ] 两表对比明细数值排序
- [ ] 稽核运维筛选、状态展示和分页
- [ ] 401/403 登录失效处理
- [ ] 网络异常、空数据和服务端错误提示
