# Portfolio

陈成的个人作品集。主站集中展示公开版简历、项目说明和交互 Demo；`layered-route-lab` 是独立运行的服务，用作分层路由和操作 Agent 的公开验证环境。

## 环境要求

- Node.js 22（见 `.nvmrc`）
- pnpm 10

```bash
pnpm install --frozen-lockfile
```

## 本地开发

```bash
pnpm dev
```

| 服务 | 默认地址 | 用途 |
| --- | --- | --- |
| Portfolio | `http://localhost:5173` | 作品集主站 |
| Layered Route Lab | `http://localhost:3000` | 独立交互 Demo |

也可以分别启动：

```bash
pnpm dev:portfolio
pnpm dev:layered-route-lab
```

## 检查与本地生产验证

```bash
pnpm verify:local
pnpm start:local
```

`verify:local` 会完成类型检查、lint、本地生产构建和 Lab 测试。它与 `start:local` 都明确把公开地址设置为本机，只用于构建与生产态联调。`start:local` 会并行启动两个生产产物：Portfolio 默认监听 `4173`，Layered Route Lab 默认监听 `3000`。

```bash
curl --fail http://127.0.0.1:4173/healthz
curl --fail http://127.0.0.1:3000/products
```

Portfolio 的正式静态服务器支持 gzip、PDF Range 请求、SPA fallback 和缓存头；`vite preview` 仅保留给快速预览，不作为公网服务。

## 正式构建

Vite 会在构建时写入 Demo 地址。正式构建不允许缺省值或 `localhost`，避免部署后把访问者引向自己的电脑。

```bash
cp apps/portfolio/.env.production.example apps/portfolio/.env.production.local
cp layered-route-lab/.env.production.example layered-route-lab/.env.production.local
# 将两个模板中的示例域名改为真实 HTTPS 地址
pnpm build
pnpm start
```

公开地址会在构建时写入产物；缺失或使用 `localhost` 时构建会直接退出，换域名后也必须重新构建。`pnpm start` 只启动已经验证过的生产产物。若由 systemd、PM2 或容器分别管理进程，也可以使用 `pnpm start:portfolio` 与 `pnpm start:demo`。

构建产物：

- `apps/portfolio/dist`：静态主站
- `layered-route-lab/dist`：vinext 服务产物

正式构建直接使用仓库中的 `output/pdf/resume-public.pdf` 和 `apps/portfolio/src/assets/`；部署前要确认它们已纳入版本控制。Server 不运行本机的简历生成脚本。

环境变量：

| 变量 | 阶段 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `VITE_LAYERED_ROUTE_LAB_URL` | build | 无 | Demo 的公开 HTTPS 地址，正式构建必填 |
| `NEXT_PUBLIC_SITE_URL` | build | 无 | Layered Route Lab 的公开 HTTPS origin，用于社交分享元数据 |
| `PORTFOLIO_HOST` | start | `0.0.0.0` | Portfolio 监听地址 |
| `PORTFOLIO_PORT` | start | `4173` | Portfolio 端口 |
| `HOST` | start | `0.0.0.0` | 两个服务支持的通用监听地址 |
| `PORT` | start | `3000` / Portfolio fallback | Layered Route Lab 端口；并行启动时优先为 Portfolio 设置 `PORTFOLIO_PORT` |

## Server 部署建议

推荐使用两个 HTTPS 域名，避免两个应用都使用根路径 `/assets/*` 时发生冲突：

```text
portfolio.example.com  -> Portfolio :4173
demo.example.com       -> Layered Route Lab :3000
```

由 Nginx 或 Caddy 负责 TLS、Brotli/gzip 和反向代理；进程由 systemd、PM2 或容器平台监管。代理层建议：

- HTML 不做长期缓存。
- 带内容哈希的 `/assets/*` 使用 `public, max-age=31536000, immutable`。
- 对 HTML、JS、CSS、SVG、JSON 开启 Brotli 或 gzip。
- 将两个健康检查地址接入部署探针。

如果必须部署到同一域名的不同子路径，需要同时配置 Portfolio 的 Vite `base`、Layered Route Lab 的 `basePath/assetPrefix` 和反向代理重写；当前默认配置按独立域名设计。

## 目录结构

```text
.
├── apps/portfolio/             # 作品集主站
├── layered-route-lab/          # 分层路由与 Agent Demo
├── output/pdf/                 # 可公开部署的简历产物
├── scripts/                    # 简历等离线生成脚本
├── projects/                   # 后续独立项目约定目录
├── package.json
└── pnpm-workspace.yaml
```

主站内容位于 `apps/portfolio/src/content.ts`，支持 PDF、独立 Demo、图片组和项目文章。新增独立项目后，应确保它提供 `dev`、`build`、`check` 和适用的生产启动方式，并让根目录的 `pnpm verify:local` 持续通过。
