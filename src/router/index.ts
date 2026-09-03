import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'
import SystemLayout from '../modules/system-shell/SystemLayout.vue'
import AuditWorkspace from '../modules/audit-shared/AuditWorkspace.vue'
import { auditPhaseOneRoutes } from '../modules/audit-phase-one/routes'
import Placeholder from '../views/Placeholder.vue'
import QuoteProviderConfig from '../views/QuoteProviderConfig.vue'
import QuoteProviderRuleAlternatives from '../views/QuoteProviderRuleAlternatives.vue'
import QuotePricingReport from '../views/QuotePricingReport.vue'
import OptionPositionReconciliation from '../views/OptionPositionReconciliation.vue'
import OptionBookkeeping from '../views/OptionBookkeeping.vue'
import OptionLifecycle from '../views/OptionLifecycle.vue'

const auditRoutes: RouteRecordRaw[] = [
  {
    path: 'audit-full/dashboard',
    name: 'AuditFullDashboard',
    component: AuditWorkspace,
    meta: { title: '稽核驾驶舱', section: 'dashboard', edition: 'full' },
  },
  {
    path: 'audit-full/issues',
    name: 'AuditFullIssues',
    component: AuditWorkspace,
    meta: { title: '问题中心', section: 'issues', edition: 'full' },
  },
  {
    path: 'audit-full/rules',
    name: 'AuditFullRules',
    component: AuditWorkspace,
    meta: { title: '规则设计', section: 'rules', edition: 'full' },
  },
  {
    path: 'audit-full/operations',
    name: 'AuditFullOperations',
    component: AuditWorkspace,
    meta: { title: '稽核运维', section: 'operations', edition: 'full' },
  },
  {
    path: 'audit-full/strategies',
    name: 'AuditFullStrategies',
    component: AuditWorkspace,
    meta: { title: '高风险策略', section: 'strategies', edition: 'full' },
  },
]

const placeholderRoutes: Array<[string, string]> = [
  ['dashboard', '工作台'],
  ['workflows', '工作流开发'],
  ['sql-dev', '组件开发'],
  ['scheduler/history', '运行实例'],
  ['alerts', '监控规则'],
  ['data-assets', '数据目录'],
  ['field-assets', '词根管理'],
  ['lineage', '数据血缘'],
  ['datasources', '数据源管理'],
  ['monitor', '系统监控'],
  ['admin/users', '用户管理'],
  ['admin/roles', '角色管理'],
  ['admin/notify', '通知配置'],
  ['admin/sso', 'SSO 配置'],
]

const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_MODE === 'hash'
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: SystemLayout,
      redirect: '/audit-phase1/dashboard',
      children: [
        ...auditPhaseOneRoutes,
        ...auditRoutes,
        {
          path: 'option-quote/providers',
          name: 'QuoteProviderConfig',
          component: QuoteProviderConfig,
          meta: { title: '报价方配置', parentTitle: '期权询价' },
        },
        {
          path: 'option-quote/provider-rule-alternatives',
          name: 'QuoteProviderRuleAlternatives',
          component: QuoteProviderRuleAlternatives,
          meta: { title: '报价方配置备选方案', parentTitle: '期权询价' },
        },
        {
          path: 'option-quote/pricing',
          name: 'QuotePricingReport',
          component: QuotePricingReport,
          meta: { title: '定价报表', parentTitle: '期权询价' },
        },
        {
          path: 'report-management/option-position-reconciliation',
          name: 'OptionPositionReconciliation',
          component: OptionPositionReconciliation,
          meta: { title: '期权持仓对账', parentTitle: '报表管理' },
        },
        {
          path: 'option-bookkeeping',
          name: 'OptionBookkeeping',
          component: OptionBookkeeping,
          meta: { title: '期权簿记' },
        },
        {
          path: 'option-lifecycle',
          name: 'OptionLifecycle',
          component: OptionLifecycle,
          meta: { title: '期权生命周期' },
        },
        ...placeholderRoutes.map(([path, title]) => ({
          path,
          component: Placeholder,
          meta: { title },
        })),
        { path: 'audit-phase1', redirect: '/audit-phase1/dashboard' },
        { path: 'audit-full', redirect: '/audit-full/dashboard' },
        { path: 'audit-phase1/results', redirect: '/audit-phase1/issues' },
        { path: 'audit-phase1/history', redirect: '/audit-phase1/operations' },
        { path: 'audit-phase1/access', redirect: '/audit-phase1/issues' },
        { path: 'audit/issues', redirect: '/audit-phase1/issues' },
        { path: 'audit/operations', redirect: '/audit-phase1/operations' },
        { path: 'audit/dashboard', redirect: '/audit-full/dashboard' },
        { path: 'audit/rules', redirect: '/audit-full/rules' },
        { path: 'audit/strategies', redirect: '/audit-full/strategies' },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/audit-phase1/dashboard' },
  ],
})

export default router
