import type { PortfolioProject } from '../types'

export const baijiahaoEditorProject = {
  slug: 'baijiahao-editor',
  order: 3,
  tier: 'featured',
  provenance: 'production',
  title: '百家号编辑器：从 UEditor 深度定制到内部复用包',
  shortTitle: '百家号编辑器',
  eyebrow: 'EDITOR PLATFORM EVOLUTION',
  thesis:
    '百家号图文编辑器基于 UEditor 1.4.3 深度定制。我担任内部开源负责人，设计整体方案与架构模块，带领 3 名工程师完成历史代码的迁移、清理和模块化，形成支持 React 与浏览器脚本接入的复用包。',
  period: '2019 · 百度生产项目',
  role: '开源负责人 · 整体方案与架构设计 · 带领 3 名工程师',
  status: '生产系统经历 · 内部复用方案 · 公开内容已脱敏',
  technologies: ['UEditor 1.4.3', 'React 16', 'JavaScript', 'Webpack 4', 'jQuery'],
  impact: [
    '作为内部开源负责人，设计整体方案、划分架构模块，并带领 3 名工程师完成相应模块开发。',
    '在既有 UEditor 深度定制基础上持续交付话题插入、图片编辑与内容解析等业务能力。',
    '维护隔离的 BJH_UE 内核，并处理选区、粘贴、工具栏状态和多实例等富文本边界问题。',
    '将业务仓库中的历史魔改代码迁移、裁剪和解耦，形成边界更清晰的 @baidu/bjh-editor 包。',
    '保留既有 UEditor API 的兼容能力，同时支持 React import 与浏览器 script 两种接入形态。',
    '编写使用开源编辑器替换百家号线上图文编辑器的方案及代码。',
  ],
  scope: [
    'UEditor 内核隔离与模块化封装',
    '业务插件、不可编辑内容块与内容解析',
    '配置、样式、依赖和业务耦合梳理',
    '多实例、选区、焦点、粘贴与工具栏状态',
    'React / UMD 接入示例与内部开源方案',
    '线上图文编辑器替换方案与代码',
  ],
  facts: [
    { label: '类型', value: '生产富文本编辑器 / 内部复用包' },
    { label: '基础', value: 'UEditor 1.4.3 深度定制' },
    { label: '职责', value: '开源负责人 · 架构设计 · 带领 3 名工程师' },
    { label: '时期', value: '2019 · 百度' },
  ],
  chapters: [
    {
      id: 'legacy-baseline',
      title: '从长期魔改的业务基线出发',
      paragraphs: [
        '前期迭代并不是替换 UEditor，而是在 UEditor 1.4.3 上持续叠加百家号图文发布能力。编辑器已经包含图片、视频、音频、表格、话题、商品、小程序和内容辅助等业务扩展，同时存在多层样式覆盖、全局依赖和场景耦合。',
        '这意味着后续工作的首要任务不是重写全部能力，而是先识别哪些属于稳定内核、哪些是通用扩展、哪些只能留在具体业务中。',
      ],
      phase: '既有生产基线',
    },
    {
      id: 'rich-text-boundaries',
      title: '富文本边界与业务插件',
      paragraphs: [
        '我参与话题插入、图片编辑和内容解析等能力的持续迭代。以话题插件为例，需要同时处理“#”触发搜索、浮层定位、选题插入、唯一性约束、粘贴过滤、选区恢复、工具栏状态和埋点，而不只是增加一个按钮。',
        '这些工作沉淀了对光标、选区、焦点、异步浮层和不可编辑内容块的处理经验，也成为后来划分插件边界的重要依据。',
      ],
      phase: '业务持续迭代',
    },
    {
      id: 'isolated-core',
      title: '隔离并模块化 BJH_UE 内核',
      paragraphs: [
        '历史版本将 UEditor 能力挂在浏览器全局对象上。梳理过程中，我维护独立的 BJH_UE 命名空间，并进一步将内核改为模块内导出，由编辑器 Driver 显式引用。',
        '该方式既降低与页面其他编辑器实例的冲突，也保留对既有 UEditor API 的兼容入口，让旧插件可以渐进迁移。',
      ],
      phase: '内核边界整理',
    },
    {
      id: 'migration-pruning',
      title: '迁移、裁剪与依赖清理',
      paragraphs: [
        '我负责把业务仓库中的编辑器代码迁入独立工程，连续清理无关媒体库、重复静态资源、历史业务模块和多层样式覆盖，并重排配置与目录。',
        '裁剪不是按文件后缀机械删除：每一部分都需要核对运行时引用、iframe 内容样式、插件注册和旧内容兼容，确保复用包仍能覆盖原有编辑流程。',
      ],
      phase: '独立包初始梳理',
    },
    {
      id: 'plugin-contract',
      title: 'Driver、插件与内容块契约',
      paragraphs: [
        '独立包通过 init、create 和 addPlugin 组织实例生命周期，并暴露 BJH_UE、BasePlugin 与 Box。工具栏配置决定插件 UI 是否装载，插件再绑定到具体实例，避免页面存在多个编辑器时共享错误状态。',
        '图片、caption 和 feed content 等能力按插件迁移；不可编辑 Box 保存结构化元数据并参与内容变化通知。业务能力由此从“修改内核文件”转向“通过扩展契约接入”。',
      ],
      phase: '多人协作完成',
    },
    {
      id: 'delivery-modes',
      title: 'React 与浏览器脚本双形态输出',
      paragraphs: [
        '工程使用 Webpack 输出可复用产物，既支持在 React 项目中 import，也支持旧页面通过 script 直接创建实例；插件还可以独立构建。配套示例覆盖两种接入方式，降低新旧业务的迁移门槛。',
        '该方案选择兼容式演进，而不是一次性替换 UEditor：代价是仍需维护部分旧接口，但能在生产业务持续迭代时逐步收紧边界。',
      ],
      phase: '内部复用与示例',
    },
    {
      id: 'responsibility-boundary',
      title: '方案设计与团队协作',
      paragraphs: [
        '我担任编辑器内部开源负责人，完成整体开源方案设计与架构模块划分，带领 3 名工程师完成相应模块开发。',
        '我直接负责代码迁移、BJH_UE 模块化、部分插件与多实例机制修正，并编写使用开源编辑器替换百家号线上图文编辑器的方案及代码。Driver、构建和其他插件由团队分工完成。',
      ],
      phase: '本人职责',
    },
  ],
  provenanceNote:
    '本案例依据本人项目经历、代码及工程文档整理，公开内容已脱敏。“内部开源”指百度内部复用与协作，不代表公开 GitHub 项目。',
} satisfies PortfolioProject
