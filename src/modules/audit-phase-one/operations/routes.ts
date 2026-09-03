import type { RouteRecordRaw } from 'vue-router'

export const operationsRoutes: RouteRecordRaw[] = [
  {
    path: 'audit-phase1/operations',
    name: 'AuditPhaseOneOperations',
    component: () => import('./OperationsPage.vue'),
    meta: { title: '稽核运维', section: 'operations', edition: 'phase1' },
  },
]
