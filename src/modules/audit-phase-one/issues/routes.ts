import type { RouteRecordRaw } from 'vue-router'

export const issuesRoutes: RouteRecordRaw[] = [
  {
    path: 'audit-phase1/issues/detail/:runId',
    name: 'AuditPhaseOneIssueDetail',
    component: () => import('./IssuesPage.vue'),
    meta: { title: '稽核结果明细', section: 'issues', edition: 'phase1', detail: true },
  },
  {
    path: 'audit-phase1/issues',
    name: 'AuditPhaseOneIssues',
    component: () => import('./IssuesPage.vue'),
    meta: { title: '问题中心', section: 'issues', edition: 'phase1' },
  },
]
