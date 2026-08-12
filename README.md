# Portfolio

陈成的个人作品集。仓库包含两个可独立部署的应用：

- `apps/portfolio`：作品集主站，展示精选案例、职业经历、个人项目集和公开版简历。
- `layered-route-lab`：分层路由与操作 Agent 的公开实验环境，为主站中的 Layered Route × Agent 案例提供交互 Demo。

主站使用真实路径路由和 SPA fallback，不再以 hash 作为主要信息架构；历史 hash 链接会在首次访问时迁移到对应的新路径。

## 信息架构

主站按阅读目的分成五层：

1. **Overview**：个人定位、能力范围和两个精选案例的入口。
2. **Selected Work**：三个不同问题类型与证据边界的完整案例。
   - 企业后台平台化：公开脱敏后的生产系统经历。
   - 百家号编辑器：从 UEditor 深度定制到内部复用包的生产系统演进。
   - Layered Route × Agent：公开重建与个人技术研究。
3. **Experience**：由统一 profile 数据生成、按最近经历优先展示的职业时间线。
4. **Personal Projects**：Elpis、Poke、DataView、Turntable 和 Bezier 等个人产品、独立交付与实验。
5. **Resume**：移动端可直接阅读的 HTML 简历，以及桌面 PDF 预览和下载。

首页只承担定位和精选入口，不把所有项目、长篇技术说明或 iframe 一次性加载。Selected Work 用完整案例讲清问题、职责、结果和取舍；Personal Projects 收录独立产品、旧作与 Demo。

## 路由表

路由定义、页面标题和描述集中在 `apps/portfolio/src/app/router.ts`。除 `/` 外，尾部斜杠会被规范化；查询参数和章节锚点会保留。未知路径展示 Not Found 页面。

| 路径 | 页面 | 内容来源 |
| --- | --- | --- |
| `/` | Overview | `pages/HomePage.tsx`、`data/index.ts` |
| `/work/meican-platform` | 企业后台平台化 | `data/featured/meicanPlatform.ts` |
| `/work/baijiahao-editor` | 百家号编辑器演进 | `data/featured/baijiahaoEditor.ts` |
| `/work/layered-agent` | Layered Route × Agent | `data/featured/layeredAgent.ts` |
| `/experience` | 职业经历 | `pages/ExperiencePage.tsx`、`data/profile.json` |
| `/archive` | 个人项目集 | `pages/ArchivePage.tsx`、`data/archive.ts` |
| `/archive/elpis` | Elpis | `data/featured/elpis.ts` |
| `/archive/coco-wallet` | Coco Wallet | `data/cocoWallet.ts` |
| `/archive/poke-prototype-editor` | Poke 项目档案 | `data/archive.ts` |
| `/archive/dataview-observatory` | DataView 项目档案 | `data/archive.ts` |
| `/archive/turntable-motion-lab` | Turntable 项目档案 | `data/archive.ts` |
| `/archive/bezier-easing-picker` | Bezier 项目档案 | `data/archive.ts` |
| `/resume` | HTML / PDF 简历 | `pages/ResumePage.tsx`、`data/profile.json` |
| `/not-found` | Not Found | `pages/NotFoundPage.tsx` |

`/work/elpis` 作为旧地址保留，并会自动规范化到 `/archive/elpis`。

案例章节使用 `chapters[].id` 作为页内锚点，例如 `/work/layered-agent#behavior-manifest`。锚点也是侧边目录和历史链接迁移的稳定标识，修改时需要同步检查外部链接。

### 历史 hash 路由

`apps/portfolio/src/app/legacyRoutes.ts` 仅在 `/` 或 `/index.html` 首次加载时识别原来的 `#id` 和 `#/id`。正常案例页上的章节锚点不会被误判为旧路由。

| 历史 ID | 新地址 |
| --- | --- |
| `resume` | `/resume` |
| `operations-agent-demo` | `/work/layered-agent#demo` |
| `operations-agent` | `/work/layered-agent` |
| `layered-route-lab` | `/work/layered-agent#demo` |
| `layered-route-lab-notes` | `/work/layered-agent#route-model` |
| `enterprise-console-platform` | `/work/meican-platform#platform-shell` |
| `embedded-operations-platform` | `/work/meican-platform#embedded-pages` |
| `embedded-business-sdk` | `/work/meican-platform#business-sdk` |
| `payment-platform` | `/work/meican-platform#payment` |
| `business-finance-platform` | `/work/meican-platform#finance` |
| `operations-design-system` | `/work/meican-platform#design-system` |
| `poke-prototype-editor` | `/archive/poke-prototype-editor` |
| `dataview-observatory` | `/archive/dataview-observatory` |
| `turntable-motion-lab` | `/archive/turntable-motion-lab` |
| `bezier-easing-picker` | `/archive/bezier-easing-picker` |

## 项目内容模型

项目类型定义位于 `apps/portfolio/src/data/types.ts`。每个 `PortfolioProject` 至少需要明确：

- `slug`、`order` 和 `tier`：地址、排序与 Featured / Archive 层级。
- `provenance`：项目证据来源。
- `title`、`thesis`、`period`、`role` 和 `status`：案例定位与责任边界。
- `impact`：页面最先展示的可观察结果。
- `scope`：实际覆盖范围。
- `chapters`：完整案例正文；每个 `id` 必须在项目内唯一且适合作为 URL 锚点。
- `demo`、`visuals`、`links`：可选的交互证据、视觉证据和公开链接。
- `provenanceNote`：公开页面底部的来源与脱敏说明。

所有项目由 `apps/portfolio/src/data/index.ts` 汇总；导航章节由 `data/navigation.ts` 从项目数据生成。

### 新增 Featured 案例

1. 在 `apps/portfolio/src/data/featured/` 新建 `<slug>.ts`，使用 `satisfies PortfolioProject` 并设置 `tier: 'featured'`。
2. 使用唯一、稳定的 `slug` 和 `order`，补齐 `provenance`、结果、范围、章节和公开边界。
3. 在 `data/index.ts` 导入并加入 `featuredProjects`；当前数组显式声明为三个元素的 tuple，增减项目时也要同步调整该类型。在 `data/navigation.ts` 加入精选案例顺序。
4. 在 `app/router.ts` 添加 `/work/<slug>` 的路由和页面 metadata，并在主应用的路由渲染映射中接入该项目。
5. 在 `components/layout/Sidebar.tsx` 更新 Selected Work；在 `components/case-study/NextCase.tsx` 更新案例阅读顺序。
6. 为首页卡片提供明确视觉，并在 `components/home/FeaturedCase.tsx` 中按 slug 映射。不要让未知 slug 误用其他项目的视觉。
7. 如果项目曾使用旧 hash 地址，在 `app/legacyRoutes.ts` 增加精确迁移规则。
8. 运行 `pnpm verify:local`，并逐一打开新路径、章节锚点、侧栏和下一案例链接。

Featured 的数量和首页叙事是有意控制的。新增前应确认它是否真的代表新的核心能力或证据类型；独立产品与较小实验优先进入 Personal Projects。

### 新增 Personal Projects 项目

1. 在 `apps/portfolio/src/data/archive.ts` 添加项目，或拆成独立文件后从该文件汇总；设置 `tier: 'archive'`。
2. 使用唯一 `slug` 和 `order`，补齐来源、简短结果、章节与 `provenanceNote`。
3. 在 `app/router.ts` 添加 `/archive/<slug>`，并在主应用的路由渲染映射中接入项目。
4. `ArchivePage` 和项目导航会从 `archiveProjects` 读取个人项目集条目；确认排序和标签符合预期。
5. 如有 Demo，优先复用现有 `posterVariant`。新增类型时同步更新 `DemoPosterVariant` 和 `components/common/DemoPoster.tsx`。
6. 如有历史地址，补充 `legacyRoutes.ts`，最后运行 `pnpm verify:local`。

## Provenance 与公开边界

`provenance` 不是装饰标签，而是对读者说明“这个案例的证据来自哪里”。当前四类含义如下：

| 值 | 含义 | 公开要求 |
| --- | --- | --- |
| `production` | 本人参与的生产系统经历 | 只描述经脱敏的职责、架构和工程结果，不展示内部页面或数据 |
| `public-reconstruction` | 基于公开代码或可核验实现的重建与研究 | 明确标注 reconstruction / research，Demo 使用合成数据 |
| `personal-product` | 本人独立推进的产品 | 只陈述已确认功能与交付范围，示意图不得冒充真实截图 |
| `experiment` | 个人技术实验或历史作品 | 明确项目范围，不包装成成熟业务系统 |

项目级使用 `provenance` 和 `provenanceNote`；Demo 与视觉分别使用 `provenanceLabel`。生产经历、公开重建、个人产品和实验不能混写成相同证据等级。

公开仓库、页面、静态资源和 Demo **禁止使用真实业务数据**，包括但不限于：

- 真实客户、员工、儿童、订单、商品、金额、账号、联系方式和业务记录。
- 内部域名、接口地址、请求响应、访问令牌、配置、日志和源码片段。
- 未获授权的生产截图、客户品牌、业务指标或运营数据。
- 无法核验的用户量、收入、下载量、评分、留存率、效率或稳定性结论。

需要展示数据流程时，使用确定性合成数据和匿名实体，并在页面上清楚标注。生产案例可以说明本人实际承担的架构与交付责任，但不能把公开重建说成生产实现，也不能为了增强说服力补写无法公开验证的数字。

## Poster-first Demo

交互 Demo 和 HTML 架构图默认先显示轻量 Poster，由 `components/common/DeferredFrame.tsx` 在用户明确点击后再加载 iframe。这样设计有四个原因：

1. 避免多个远程或大型 iframe 在首屏同时下载、执行和占用内存。
2. Demo 不可用或网络较慢时，案例正文、结果与公开边界仍然可读。
3. 移动端以阅读简历和项目为主，不挂载完整交互 iframe；用户仍可在新窗口打开 Demo。
4. Poster、加载按钮和 provenance 标签能明确区分“内容摘要”“交互重建”和“真实截图”。

桌面端点击后仍使用 lazy iframe，并提供超时提示、重试、新窗口入口、sandbox 和 referrer policy。新增 Demo 时应设置准确的 `provenanceLabel`、`statusLabel`、`posterVariant`、`ctaLabel`；需要大屏或键盘操作时设置 `desktopPreferred: true`。

## Profile 与公开版 PDF

`apps/portfolio/src/data/profile.json` 是个人资料、职业经历和技能的单一事实源：

- `data/profile.ts` 提供 TypeScript 类型与经历要点展开函数。
- Experience、Resume 和全站页脚直接读取同一份 JSON。
- `scripts/generate_public_resume.py` 读取同一 JSON 生成 PDF，不再硬编码工作经历。
- `data/resume.ts` 导入稳定产物 `output/pdf/resume-public.pdf`，并由 Web 层设置下载文件名。

修改履历时先更新 `profile.json`，同时检查 HTML 页面与 PDF。不要直接编辑生成后的 PDF，也不要只改网页副本。

生成 PDF 需要 Python 3、ReportLab 和可用的中文字体：

```bash
python3 -m pip install -r requirements-resume.txt
```

```bash
RESUME_FONT_REGULAR=/absolute/path/to/regular.ttf \
RESUME_FONT_BOLD=/absolute/path/to/bold.ttf \
pnpm resume:generate
```

环境变量未设置时，脚本会依次检查内置的 macOS 和常见 Linux 字体候选；全部不可用时会列出检查过的路径并退出。生成结果固定写入：

```text
output/pdf/resume-public.pdf
```

生成后应把 PDF 渲染为图片检查分页、字体、重叠和裁切，再提交稳定产物。Server 只部署仓库中的 PDF，不在启动或请求期间运行生成脚本。

## 环境要求

- Node.js 22（见 `.nvmrc`）
- pnpm 10
- Python 3 与 ReportLab（仅重新生成简历时需要）

```bash
pnpm install --frozen-lockfile
```

## 本地开发

同时启动主站和 Demo：

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

开发环境默认使用 `http://localhost:3000` 作为 Lab 地址。

## `VITE_LAYERED_ROUTE_LAB_URL`

`VITE_LAYERED_ROUTE_LAB_URL` 是 Portfolio 的构建时变量，用于生成 Layered Route Lab 和 Agent Demo 的公开链接。

Lab 独立运行在域名根路径时，使用普通路径路由：

```text
${VITE_LAYERED_ROUTE_LAB_URL}/products?agent_demo=1
```

Lab 发布在静态子目录时，入口固定为目录下的 `index.html`，业务路由写入 `route` 查询参数：

```text
${VITE_LAYERED_ROUTE_LAB_URL}/?route=/products&agent_demo=1
```

- 正式构建必须提供绝对 `http://` 或 `https://` 地址。
- 正式构建默认拒绝 `localhost`、`127.0.0.1` 和 `::1`。
- 值会写入静态产物；部署后修改 Server 环境变量不会改变已经构建的链接，换域名必须重新构建。
- GitHub Pages 部署使用同域静态路径：`https://me.azlar.cc/demos/layered-route-lab`。构建会自动补齐目录结尾 `/`，并生成 `?route=/products&agent_demo=1`。
- 该目录发布物只有一个 `index.html` 入口和相对资源。Demo 路由显示在浏览器地址栏的 `route` 查询参数中，例如 `?route=/product/1/order/2/edit`；刷新、分享和浏览器前进/后退都据此重建 Presenter 父链，因此不依赖服务器的路由重写。
- 如迁移到其他静态托管，只需整体复制 `layered-route-lab/dist-static/` 到目标目录；入口仍为该目录下的 `index.html`。
- `ALLOW_LOCAL_DEMO_URL=1` 只供 `build:local` 和本地测试使用，生产环境禁止设置。

配置正式环境：

```bash
cp apps/portfolio/.env.production.example apps/portfolio/.env.production.local
cp layered-route-lab/.env.production.example layered-route-lab/.env.production.local
# 将模板中的示例域名改为真实 HTTPS 地址
```

Layered Route Lab 自己使用 `NEXT_PUBLIC_SITE_URL` 生成公开 origin 和分享 metadata；它通常与 `VITE_LAYERED_ROUTE_LAB_URL` 指向同一 Demo 域名。

## 检查与本地生产验证

提交或部署前的标准入口：

```bash
pnpm verify:local
```

该命令依次执行：

1. `pnpm check`：Portfolio TypeScript 检查和 Layered Route Lab lint。
2. `pnpm build:local`：使用明确的 localhost 地址构建两个生产产物。
3. `pnpm --filter @portfolio/web test`：验证主站路由、内容、Profile、Demo URL 与旧资源契约。
4. `pnpm --filter layered-route-lab test:built`：验证已构建 Lab 的路由、HTML 和 Agent manifest 契约。

需要检查生产态页面时：

```bash
pnpm start:local
```

`start:local` 并行启动已经构建的产物：Portfolio 默认监听 `4173`，Layered Route Lab 默认监听 `3000`。

```bash
curl --fail http://127.0.0.1:4173/healthz
curl --fail http://127.0.0.1:4173/work/meican-platform >/dev/null
curl --fail http://127.0.0.1:3000/products >/dev/null
```

除了命令检查，还应手动验证桌面和移动宽度下的首页、两个 Selected Work、Experience、Personal Projects、Resume、Not Found、旧链接迁移、章节锚点、Poster 加载和新窗口 Demo。

## 正式构建与部署

常规服务端/Worker 部署完成生产环境配置后：

```bash
pnpm build
pnpm start
```

构建产物：

- `apps/portfolio/dist`：静态 Portfolio。
- `layered-route-lab/dist`：vinext 服务产物。

`pnpm start` 启动两个已构建应用；也可分别使用 `pnpm start:portfolio` 和 `pnpm start:demo`。Portfolio 的正式静态服务器提供 SPA fallback、gzip、PDF Range 请求、缓存头和 `/healthz`；`vite preview` 只用于快速预览。

推荐使用两个 HTTPS 域名：

```text
portfolio.example.com  -> Portfolio :4173
demo.example.com       -> Layered Route Lab :3000
```

由 Nginx、Caddy、systemd、PM2 或容器平台负责 TLS、反向代理和进程监管。HTML 不做长期缓存；带内容哈希的 `/assets/*` 使用长期 immutable 缓存。

### GitHub Pages：`me.azlar.cc`

GitHub Pages 部署主站和静态 Demo 只需执行：

```bash
pnpm build:github-pages
```

产物位于 `apps/portfolio/dist/`，其中 `demos/layered-route-lab/index.html` 是 Demo 的唯一 HTML 入口。构建还会生成 `404.html`，使主站的 SPA 深链在 GitHub Pages 上能交给前端路由处理。主站中的 Demo 链接固定为 `https://me.azlar.cc/demos/layered-route-lab`。

## 目录结构

```text
.
├── apps/portfolio/
│   ├── src/app/               # 路由、旧链接迁移与页面 metadata
│   ├── src/components/        # 布局、案例、首页与 Poster-first 组件
│   ├── src/data/              # Selected Work、Personal Projects、profile 与内容类型
│   ├── src/pages/             # Overview、Case、Experience、Personal Projects、Resume
│   └── src/assets/            # 仅含可公开部署的重建 Demo 与示意资源
├── layered-route-lab/         # 分层路由与 Agent 公开实验
├── output/pdf/                # 经检查的公开版简历产物
├── scripts/                   # 离线生成脚本
├── docs/                      # 内容缺口与维护记录
├── package.json
└── pnpm-workspace.yaml
```
