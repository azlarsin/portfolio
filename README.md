# Portfolio

个人作品合集。主站提供接近文档工具的浏览体验：左侧目录负责在简历、作品和项目描述之间切换，顶部展示当前内容的说明与操作，主体区域渲染 PDF、独立 Web 应用、图片或文字内容。

## 当前内容

- 简历：内嵌根目录中的 `陈成的个人简历.pdf`
- 作品：`layered-route-lab`，开发时以内嵌页面展示
- 项目描述：主站中的结构化项目介绍

## 开始开发

环境要求：Node.js 22.13+、pnpm 10。

```bash
pnpm install
pnpm dev
```

`pnpm dev` 会并行启动 workspace 中所有带有 `dev` 脚本的项目：

| 服务 | 默认地址 | 用途 |
| --- | --- | --- |
| Portfolio | `http://localhost:5173` | 作品集主站 |
| Layered Route Lab | `http://localhost:3000` | 当前独立作品 |

也可以只启动一个项目：

```bash
pnpm dev:portfolio
pnpm dev:layered-route-lab
```

## 目录结构

```text
.
├── apps/
│   └── portfolio/          # 主站壳应用
├── projects/               # 后续独立作品（约定目录）
├── layered-route-lab/      # 已有独立作品
├── 陈成的个人简历.pdf       # 简历源文件
├── package.json            # 全仓库命令
└── pnpm-workspace.yaml     # workspace 项目发现规则
```

## 添加新作品

1. 将独立项目放进 `projects/<project-name>`。
2. 确保项目有自己的 `package.json`，并提供 `dev` 和 `build` 脚本。
3. 为开发服务器指定一个不冲突的固定端口。
4. 在 `apps/portfolio/src/content.ts` 中登记作品入口与项目描述。
5. 再次执行 `pnpm install`；之后根目录的 `pnpm dev` 会自动启动它。

主站内容采用数据驱动结构。当前支持：

- `pdf`：PDF 文档预览与下载
- `iframe`：独立 SPA / Web 项目内嵌
- `gallery`：图片组
- `article`：项目描述等结构化文字

如果作品已经单独部署，可通过环境变量覆盖其内嵌地址。复制环境变量模板后修改即可：

```bash
cp apps/portfolio/.env.example apps/portfolio/.env.local
```

## 构建与检查

```bash
pnpm build
pnpm check
```

根命令会递归处理所有 workspace 项目。新增项目时应保证这两条命令持续可用。
