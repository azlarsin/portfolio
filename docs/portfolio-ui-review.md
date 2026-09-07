# Portfolio UI Review

日期：2026-09-07。范围：`apps/portfolio`，即 `me.azlar.cc`。
Review 基线：`9923c93`；本地 main 整合完成于 `9d17aeb`。
UI 实验分支：`ui/portfolio-refresh-20260907`。

## 代码问题

| 级别 | 问题与影响 | 本次处理 |
| --- | --- | --- |
| P1 | `ThemeToggle.tsx` 在 state 初始化时直接访问 localStorage。浏览器阻止存储时，异常会中断站点渲染。 | 读取和写入均增加容错，保留内存中的选择；补浏览器用例。 |
| P2 | `AppShell.tsx` 的 drawer 状态只随路由关闭。移动菜单打开后扩大窗口，正文可能继续处于 inert 状态，body 仍被锁定滚动。 | 导航改为原生 modal dialog，跨断点关闭并恢复滚动；补焦点循环、Escape 和返回焦点。 |
| P2 | `CaseToc.tsx` 用章节可见比例决定当前目录。长章节的比例和阅读进度并不一致，多个章节相邻时容易跳选。 | 以已经越过固定导航下沿的最后一个章节标题为准，滚动处理通过 requestAnimationFrame 合并。 |
| P3 | 案例首屏的 `CaseHero` 和 `CaseFacts` 重复展示职责、状态与来源，正文和结果被向后推移。 | 合并为一组时间、职责、状态、范围；保留来源标识和全部正文结果。 |

相关实现：

- [导航与焦点](../apps/portfolio/src/components/layout/AppShell.tsx)
- [主题容错与同步](../apps/portfolio/src/components/common/ThemeToggle.tsx)
- [章节目录](../apps/portfolio/src/components/case-study/CaseToc.tsx)
- [浏览器回归用例](../apps/portfolio/tests/ui/navigation.pw.ts)

## UI 方向

1. **让作品承担主要表达。** 首页顺序调整为姓名与定位、精选案例、个人实验、工作范围。首页提炼每个案例的一个结果，完整叙述留在详情页。
2. **按访问目的组织导航。** 桌面顶部保留精选案例、个人项目、经历、简历四个入口。手机菜单保留细分案例，Demo 快捷列表默认折叠。
3. **让视觉证据更具体。** 生产经历使用标明来源的架构示意；个人实验使用可运行 Demo 的实际截图。项目缩略图、标题都可直接进入对应内容。
4. **控制阅读密度。** 统一页面宽度、固定字号、行距与间距；取消占满视口的介绍区和大段重复信息。个人项目的 Demo 区取消外层卡片，避免卡片嵌套。
5. **建立可维护的视觉基础。** 使用中性背景与绿色操作色，案例分别用绿、蓝、红、黄区分；深色主题使用同一套语义变量。新增图标来自 Lucide。

## 素材

`apps/portfolio/public/previews/` 中的五张 WebP 均来自仓库已有的公开 Demo：Poke、DataView、Bezier、Turntable、不规则形状布局。
截图保留完整视口，使用合成内容，不是历史生产界面。尺寸为 960 × 600，总计约 108 KB，默认延迟加载。
缩略图路径集中在 `src/data/projectPreviews.ts`。生产项目的封面示意集中在 `components/home/CaseCover.tsx`。

## 验证

- Portfolio 的 47 项 Vitest 合约测试。
- 10 项 Playwright 用例覆盖菜单焦点、Escape、跨断点关闭、主题同步、存储被禁用、偏好持久化和章节锚点。
- 布局用例覆盖 320、390、768、1024、1440px，以及中英文；320px 使用 568px 高的小屏视口。
- 五类页面在桌面中文、移动中文、移动英文和桌面深色英文下完成 20 组截图与 axe 检查。
- 全部 16 个公开内容路由检查页面溢出；Elpis 的手机示意保留区域内横向滚动。
- Production 构建与四项静态 SEO 合约测试，保留既有路径、canonical、sitemap 和 noindex 规则。
- 七个 Demo 入口检查实际 iframe 内容；本次开发服务使用本地静态 Demo，避免 Vite 将静态目录入口回退到主站。

运行：

```sh
pnpm --filter @portfolio/web test
pnpm --filter @portfolio/web test:ui
VITE_LAYERED_ROUTE_LAB_URL=https://me.azlar.cc/demos/layered-route-lab pnpm --filter @portfolio/web build
pnpm --filter @portfolio/web test:built
```

首次运行浏览器用例需执行 `pnpm --filter @portfolio/web exec playwright install chromium`。
已有开发服务时可指定 `PORTFOLIO_UI_URL=http://localhost:5173`；否则测试会启动 5184 端口的服务。
本次截图与 axe 结果位于被 git 忽略的 `work/ui-review/`。
本次本地预览为 `http://localhost:5173/`；4174 端口运行现有 `scripts/serve.mjs`，为 Agent 提供已构建的静态 Demo。

## 后续建议

- 优先补 Elpis 的真实产品截图和公开产品链接，具体缺口见 [内容清单](portfolio-content-gaps.md)。这比继续增加首页自述更能帮助读者判断产品能力。
- 当前构建仍有约 502 KB 的单个 JS 文件，gzip 约 163 KB。下一步可将 Demo 播放器、Poke 手机渲染器按路由加载，并同时验证 SEO 预渲染的行为。
- 现有合约测试大量依赖源码字符串。后续新增交互应优先覆盖浏览器中的可观察行为，减少对代码格式的依赖。

本次未进行远端推送或部署。Blog 的已有修改只随基线保存和合并，UI 重构未修改 Blog。
