# 数据稽核一期前端

基于 Vue 3、TypeScript、Vite、Element Plus 2.9 和 ECharts 构建的数据稽核一期前端项目。

## 环境要求

- Node.js 20+
- npm 10+

## 本地启动

```bash
npm install
npm run dev
```

默认访问：`http://127.0.0.1:4173/audit-phase1/dashboard`

期权原型入口：

- `/option-bookkeeping`：期权簿记、簿记审批与历史变更
- `/option-lifecycle`：期权生命周期详细视图与简易视图

## 工程命令

```bash
npm run dev          # 启动开发环境
npm run typecheck    # Vue / TypeScript 类型检查
npm run lint         # ESLint 规范检查
npm run lint:fix     # 自动修复可修复的 ESLint 问题
npm run format       # Prettier 格式化
npm run format:check # Prettier 格式检查
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run check        # 执行完整交付检查
```

## 主要页面

- `/audit-phase1/dashboard`：稽核驾驶舱
- `/audit-phase1/issues`：问题中心
- `/audit-phase1/issues/detail/:runId`：稽核结果明细
- `/audit-phase1/operations`：稽核运维

## 项目结构

```text
src/
├── api/          # 接口类型、调用函数和当前 Mock 适配层
├── components/   # 通用与稽核业务组件
├── data/         # 本地演示数据
├── modules/
│   ├── system-shell/       # 系统菜单、顶栏、用户与通知框架
│   ├── audit-phase-one/    # 一期菜单模块
│   │   ├── dashboard/      # 稽核驾驶舱页面与路由
│   │   ├── issues/         # 问题中心、明细页面与路由
│   │   └── operations/     # 稽核运维页面与路由
│   └── audit-shared/       # 稽核页面共享运行时、查询与明细下钻逻辑
├── router/       # 系统路由装配
├── stores/       # 轻量状态管理
├── views/        # 非一期菜单页面
├── App.vue
├── main.ts
└── style.css
```

每个一期菜单都有独立的页面入口和路由文件；菜单框架位于 `modules/system-shell`。
一期菜单之间共用的接口查询、结果映射和明细下钻逻辑位于 `modules/audit-shared`，避免复制相同逻辑导致联调行为不一致。

## 后端联调

当前版本默认通过 `src/api/index.ts` 返回本地 Mock 数据，以保证前端可独立演示。接口路径、请求参数和响应类型集中定义在 `src/api/auditPhaseOne.ts`。

联调时请先阅读 [后端接口联调说明](docs/backend-integration.md)，然后将 `src/api/index.ts` 中的 Mock `api.get` 替换为项目统一 HTTP 客户端。页面组件无需改动。

## 交付说明

- 界面、路由和交互均保持当前确认版本。
- 组件库统一为 `element-plus@^2.9.0`，已移除 Arco Design Vue 依赖。
- `dist/` 为已构建的静态产物。
- 安装依赖时以 `package-lock.json` 为准，推荐执行 `npm ci`。
- 提交代码前请执行 `npm run check`。
- 推送到 `main` 分支后，GitHub Actions 会自动构建并发布 GitHub Pages；线上环境使用 Hash 路由以支持直接访问各功能页面。
