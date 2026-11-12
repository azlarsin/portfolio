# Azlar Blog 全量代码审查记录

> 审查日期：2026-08-31（Asia/Taipei）
> 当前源码：`portfolio/apps/blog`（Astro 7 / Pagefind / pnpm）
> 基线分支：`deploy/mobile-interactions-20260821`，审查前 HEAD `a7cde5b`
> 状态：实现与本地验证完成，尚未触发发布 workflow

## 1. 结论

本次首先纠正了项目事实源：线上 Blog 已由 `portfolio/apps/blog` 的 Astro 静态构建发布，`blog/code_b` 不再是当前源码；本地 `azlarsin.github.io` 也只是落后远端三个提交的旧 React 产物。所有实现均已转到 Astro 源码，旧构建器没有运行，也没有触发任何 commit、push 或发布操作。

当前 Blog 的主要优点是：正文构建期渲染、公开/未列出内容分离、旧 URL 契约完整、Pagefind 只索引公开文章、发布流程手动且构建命令无 Git 副作用。审查中确认的发布边界、坏链、搜索竞态、性能和可访问性问题已经修复，并补入回归契约。

最终本地门禁：

- Astro check：26 个源文件，0 error / 0 warning / 0 hint。
- 静态构建：146 个页面。
- Pagefind：21 篇公开文章、7,480 个词。
- 契约测试：13/13 通过。
- 生成页内部链接：0 个坏链。
- Blog 依赖链：0 条已知 audit advisory。

## 2. 审查范围与事实源

已逐项审查：

- `apps/blog/src`：布局、组件、内容模型、页面、搜索脚本和全局样式。
- `apps/blog/scripts`：一次性迁移脚本与新增静态媒体优化脚本。
- `apps/blog/tests`：内容、URL、索引、发布和生成物契约。
- `apps/blog/package.json`、根 `package.json`、`pnpm-lock.yaml`。
- `.github/workflows/publish-blog-pages.yml`。
- 29 篇迁移后 Markdown、86 个历史图片和 7 个 Demo 文件的边界与生成结果。
- legacy 三仓库：`blog-source`、`code_b`、`azlarsin.github.io`。
- 当前发布仓库远端 `master` 与 GitHub Actions 生成关系。

未把 `apps/portfolio` 和 `layered-route-lab` 的业务实现纳入 Blog 全量 review；但根 workspace 依赖审计结果已记录，因为 Blog 发布 workflow 会执行 workspace 级安装。

权威发布链为：

```text
portfolio/apps/blog
  -> pnpm verify:blog
  -> 手动 publish-blog-pages workflow
  -> rsync apps/blog/dist（保留目标 .git）
  -> azlarsin/azlarsin.github.io master
```

远端发布库最新产物提交 `75bd8ef` 来自源码提交 `eff14ccd`。其后 `a7cde5b` 的 workflow 也成功执行，但产物无差异，因此没有生成新的发布提交，这是正常行为。

## 3. 已修复问题

| 级别 | 问题 | 处理结果 |
| --- | --- | --- |
| P0 | 初始工作目录指向旧 React 构建器，可能在错误代码上实现并触发旧发布副作用 | 定位真实 Astro 源；停止旧依赖恢复；未运行 `code_b` 生产命令 |
| High | `visibility: unlisted` 在 `ignore` 漂移时可能被公开，存在未来内容泄露风险 | `visibility` 改为唯一发布边界；public/unlisted/private 失败关闭 |
| High | Blog 链存在已知构建依赖漏洞 | Astro 7.2.4 升至 7.2.9；锁定修复版 `js-yaml` 与 `fast-uri`；Blog 路径 audit 清零 |
| Medium | 未列出文章复用可点击标签，但对应 tag 页面只为公开文章生成 | 未列出页面的标签改为纯文本，不再生成死链 |
| Medium | 文章正文存在两个错误外链和一个指向错误路由的内部链接 | 修正 Cloudflare、CSDN 和 `/前端面试整理/` 链接；新增全站链接契约 |
| Medium | 搜索清空关键词后保留旧结果，快速查询可能被较慢旧请求覆盖 | 空查询清理结果；用递增 request token 在数据返回后、DOM commit 前二次校验 |
| Medium | Disqus 在文章首屏立即加载，带来第三方网络、CPU 与隐私成本 | 进入评论区前 600px 才用 IntersectionObserver 载入，旧浏览器安全降级 |
| Medium | 文章图片和 iframe 缺少 lazy 属性；图片无固有尺寸导致 CLS | 构建后、Pagefind 前补 `loading`、`decoding`、本地图片尺寸和 iframe title |
| Medium | sticky header 使用 `backdrop-filter: blur(16px)`，滚动时存在持续合成/重绘成本 | 改为不透明 token 混合背景，移除 blur |
| Medium | 浅色主题弱文字仅 3.53:1；深色 accent 控件白字仅 2.18:1 | 弱文字提高到 4.69:1；增加浅/深主题 `--on-accent` token |
| Medium | 首页 eyebrow 被 `.home-hero p` 覆盖 | 收窄选择器为 `.home-hero > p:not(.eyebrow)` |
| Medium | 无目录文章仍输出空 aside 和双栏 | 只在有 headings 时输出目录；无目录文章改为单栏居中 |
| Medium | `<time datetime>` 使用带空格且无时区的非标准值 | 统一输出 `YYYY-MM-DDTHH:mm:ss+08:00` |
| Medium | 内容日期只校验非空，错误日期可能破坏排序和 JSON-LD | schema 固定校验台北时区的 legacy 日期格式与实际日历有效性 |
| Low | 移动菜单打开后 label 仍为“打开”，搜索和单 tag 页无当前导航状态 | 使用中性 label，并补齐 `aria-current` 映射 |
| Low | 404 可被索引且 canonical 指向构建中不存在的 `/404/` | 增加 `noindex`，canonical 指向 `/404.html` |
| Low | 首页标题写“最近更新”，实际按发布时间排序 | 改为“最近发布” |
| Low | QNAP 卡片摘要显示 `[TOC]`，游戏文章更新时间停在 2024 | 写入真实摘要；更新时间修正为正文最新的 2025-12-27 |
| Low | 四个代码块语言名拼错，Shiki 降级为纯文本 | 修正为 `javascript`、`shell` 和 `text` |

## 4. 轻量特效设计

本次没有加入粒子、视差、持续循环动画、滚动监听器或动画库。全部效果集中在 `src/styles/global.css`，沿用现有 token：

- 首屏 hero、页面标题和文章 header 做一次 360–520ms 的 `opacity + transform` 入场；不动画整篇长文。
- 文章卡片在 hover / focus 时横移 4px，并用伪元素显示短 accent 线。
- 按钮、标签、分页、归档和目录链接只移动 2–3px。
- 桌面导航使用 `scaleX` underline；移动汉堡使用三个 span 的 transform / opacity 切换为关闭图标。
- 主题图标切换时做一次短促的 rotate / scale / opacity 反馈。
- 静态背景使用一次普通渐变，不使用 fixed background 或 blur。
- `hover: hover`、`pointer: fine` 限定鼠标专属反馈；键盘仍有 `focus-within` 和全局 focus ring。
- `prefers-reduced-motion: reduce` 下把所有动画/过渡缩短为不可感知值。

性能约束已通过契约固定：不允许对 `.article-page` 整体做动画，不允许重新引入 `backdrop-filter`，媒体属性必须存在。

## 5. 新增或加强的契约

`tests/blog-contract.test.mjs` 现在额外覆盖：

- `visibility` 是唯一公开边界。
- 所有 Astro 生成页的同域 `<a>` 都有实际目标文件。
- 公开和未列出文章的图片均为 lazy + async；本地图片有 width / height。
- iframe 均为 lazy 且有 title。
- 所有界面 `<time>` 使用带 `+08:00` 的合法机器时间。
- 浅色弱文字、浅色 accent、深色 accent 对比度均达到 4.5:1。
- 页面尊重 reduced motion，不对长文章整体建立动画层。
- 评论使用 IntersectionObserver 延迟加载。
- 清空搜索会清空旧结果，只有最新异步查询可提交 DOM。
- 404 为 noindex 且 canonical 指向真实生成文件。
- article slug 与 tag slug 非空且唯一；日期格式和日期值有效。

## 6. Legacy 审查摘要

### `code_b`

该仓库是 React 16 + Webpack 3 的历史实现，不应再用于当前 Blog：

- `webpack.config.prod.js` 的 done hook 会调用 `build.js -build`。
- `build.js` 把构建、覆盖发布仓库、提交和 push 两个仓库绑在一个命令中；会顺带提交无关工作区改动，且两次 push 不具备事务性。
- package-lock 与 yarn.lock 不一致，`node-sass` 版本也不一致；干净 clone 缺少当前 webpack 配置依赖的未跟踪 HTML 模板。
- Markdown 允许原始 HTML，并在浏览器中直接注入；历史 “Run code” iframe 没有 sandbox。
- 当前工作树已有用户未提交改动和 vendored Swiper 删除，本次未清理、回滚或覆盖。

禁止从该仓库运行 `npm run p` 或 `node build.js -build`。

### `blog-source`

- 远端不是当前事实源；29 篇正文已经进入 Astro 仓库。
- 本地游戏文章的未提交更新也已经被当前 Astro 内容吸收。
- 后续应只维护 Astro Markdown；若仍保留 legacy 仓库，应明确标记为只读归档。

### `azlarsin.github.io`

- 本地 checkout 干净但落后远端三个 Astro 发布提交。
- 它是发布产物，不是源码；不应直接人工编辑。
- 发布只能继续走 `publish-blog-pages.yml` 的手动 workflow。

## 7. 仍待处理

### P1

1. **人工补图片替代文本**：公开文章 65 张图中，27 张没有 `alt`，38 张是空 `alt`。构建已补尺寸和延迟加载，但有意义的 alt 不能从文件名可靠推断，需要逐图编辑。
2. **处理 workspace 其他应用依赖告警**：Blog 依赖路径已是 0，但根 workspace 仍报告 1 critical、21 high、16 moderate、3 low，主要来自 `apps/portfolio` 与 `layered-route-lab`。Blog workflow 会安装整个 workspace，因此应另开任务升级 Vitest、Next/Cloudflare 链等依赖。
3. **迁移脚本原子化**：`migrate-legacy-content.mjs` 当前先删除目标目录再逐项写入；如仍保留迁移能力，应先写临时目录、完成校验后再整体替换。

### P2

1. 为 Blog 增加 PR/push 级只读验证 workflow；当前只有手动发布前才会执行完整门禁。
2. 将测试中依赖本地 `git diff` 的 workflow 不变断言替换为更稳定的 fixture/hash 契约；干净 CI 中该断言证明力有限。
3. 若重视第三方隐私同意，可把 Disqus 从“接近视口自动加载”进一步改为用户点击后加载。
4. 逐步把协议相对的 `//blog.azlar.cc/images/...` 改为根相对 `/images/...`，减少内容与域名耦合。

## 8. 发布与回滚

本次没有发布。准备上线时：

1. 复查本文件的 P1 是否接受延后。
2. 在源码仓库提交变更并再次执行 `pnpm verify:blog`。
3. 手动触发 `Publish Blog to GitHub Pages repository` workflow。
4. 确认 workflow 来源 commit 与发布仓库 commit message 对应。
5. 若需回滚，回滚源码提交后重新手动发布；不要在 `azlarsin.github.io` 直接混合修改两代产物。

## 9. 验证命令

```bash
pnpm install --frozen-lockfile
pnpm verify:blog
pnpm audit --json
git diff --check
```

审查完成时，前三项中的 Blog 构建/测试/依赖路径均通过；workspace 其他应用的审计遗留见上文。
