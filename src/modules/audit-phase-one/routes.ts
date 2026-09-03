import type { RouteRecordRaw } from 'vue-router'
import { dashboardRoutes } from './dashboard/routes'
import { issuesRoutes } from './issues/routes'
import { operationsRoutes } from './operations/routes'

export const auditPhaseOneRoutes: RouteRecordRaw[] = [
  ...dashboardRoutes,
  ...issuesRoutes,
  ...operationsRoutes,
]
