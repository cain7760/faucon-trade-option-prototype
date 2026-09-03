import type { RouteRecordRaw } from 'vue-router'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: 'audit-phase1/dashboard',
    name: 'AuditPhaseOneDashboard',
    component: () => import('./DashboardPage.vue'),
    meta: { title: '稽核驾驶舱', section: 'dashboard', edition: 'phase1' },
  },
]
