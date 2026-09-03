export type SystemNavigationIcon =
  | 'storage'
  | 'exclamation-circle'
  | 'calendar'
  | 'clock-circle'
  | 'check-circle'
  | 'dashboard'
  | 'grid'
  | 'star'
  | 'bug'
  | 'tool'

export interface SystemNavigationItem {
  index: string
  label: string
  icon: SystemNavigationIcon
  children?: SystemNavigationItem[]
}

export interface SystemNavigationGroup {
  label: string
  items: SystemNavigationItem[]
}

export const systemNavigationGroups: SystemNavigationGroup[] = [
  {
    label: '常用',
    items: [
      { index: 'my-workbench', label: '我的工作台', icon: 'grid' },
      { index: 'my-frequent-menu', label: '常用菜单', icon: 'star' },
    ],
  },
  {
    label: '业务域',
    items: [
      {
        index: 'audit-phase1',
        label: '数据稽核一期',
        icon: 'check-circle',
        children: [
          { index: '/audit-phase1/dashboard', label: '稽核驾驶舱', icon: 'dashboard' },
          { index: '/audit-phase1/issues', label: '问题中心', icon: 'bug' },
          { index: '/audit-phase1/operations', label: '稽核运维', icon: 'tool' },
        ],
      },
      {
        index: 'option-quote',
        label: '期权询价',
        icon: 'storage',
        children: [
          { index: '/option-quote/providers', label: '报价方配置 Plan A', icon: 'check-circle' },
          {
            index: '/option-quote/provider-rule-alternatives',
            label: '报价方配置 Plan B',
            icon: 'clock-circle',
          },
          { index: '/option-quote/pricing', label: '定价报表', icon: 'calendar' },
        ],
      },
      {
        index: 'report-management',
        label: '报表管理',
        icon: 'calendar',
        children: [
          {
            index: '/report-management/option-position-reconciliation',
            label: '期权持仓对账',
            icon: 'storage',
          },
        ],
      },
      {
        index: 'option-bookkeeping',
        label: '期权',
        icon: 'storage',
        children: [
          {
            index: '/option-bookkeeping',
            label: '期权簿记',
            icon: 'storage',
          },
          {
            index: '/option-lifecycle',
            label: '期权生命周期',
            icon: 'clock-circle',
          },
        ],
      },
    ],
  },
]

export const systemNavigationOpenKeys = systemNavigationGroups.flatMap((group) =>
  group.items.filter((item) => item.children?.length).map((item) => item.index),
)
