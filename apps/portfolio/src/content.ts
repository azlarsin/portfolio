import resumePdf from '../../../output/pdf/resume-public.pdf?url'
import bezierPickerLab from './assets/bezier-picker-lab.html?url'
import dataviewObservatoryDemo from './assets/dataview-observatory-demo.html?url'
import operationsAgentGraph from './assets/operations-agent-actiongraph.html?url'
import operationsAgentArchitecture from './assets/operations-agent-architecture.html?url'
import pokeEditorArchitecture from './assets/poke-editor-architecture.html?url'
import pokeEditorDemo from './assets/poke-editor-demo.html?url'
import turntableMotionLab from './assets/turntable-motion-lab.html?url'

export const projectGroups = [
  { id: 'meican', label: '美餐' },
  { id: 'other', label: '独立项目' },
] as const
export type ProjectGroupId = (typeof projectGroups)[number]['id']

export type PortfolioItem =
  | {
      id: string
      section: '简历'
      title: string
      eyebrow: string
      description: string
      kind: 'pdf'
      source: string
      fileName: string
      mobileResume: {
        headline: string
        intro: string
        strengths: string[]
        experience: Array<{
          company: string
          role: string
          period: string
          description: string
        }>
      }
    }
  | {
      id: string
      section: '作品'
      title: string
      eyebrow: string
      description: string
      kind: 'iframe'
      source: string
      status: string
    }
  | {
      id: string
      section: '作品'
      title: string
      eyebrow: string
      description: string
      kind: 'gallery'
      images: Array<{ source: string; alt: string; caption?: string }>
    }
  | {
      id: string
      section: '项目描述'
      title: string
      eyebrow: string
      description: string
      kind: 'article'
      group: ProjectGroupId
      intro: string
      facts: Array<{ label: string; value: string }>
      links?: Array<{ label: string; url: string; note?: string }>
      sections: Array<{
        title: string
        body: string
        phase?: '已实现' | '公开演示' | '方案探索' | '后续愿景'
      }>
      demo?: {
        source: string
        title: string
        description: string
        label?: string
        badge?: string
        toolbar?: string
        status?: string
        height?: number
      }
      visuals?: Array<{
        source: string
        title: string
        description: string
      }>
    }

const layeredRouteLabUrl =
  import.meta.env.VITE_LAYERED_ROUTE_LAB_URL || 'http://localhost:3000'
const operationsAgentDemoUrl = `${layeredRouteLabUrl.replace(/\/$/, '')}/products?agent_demo=1`

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'resume',
    section: '简历',
    title: '个人简历',
    eyebrow: 'CURRICULUM VITAE',
    description: '工作经历、代表项目与技术方向',
    kind: 'pdf',
    source: resumePdf,
    fileName: '陈成-前端负责人-简历.pdf',
    mobileResume: {
      headline: '前端负责人 / Full Stack Engineer',
      intro:
        '10+ 年前端与全栈开发经验，长期负责复杂后台、业务 SDK、跨端应用与内部平台。现负责 6 人前端团队，并承担架构设计、项目推进与跨团队技术支持。',
      strengths: [
        '复杂 B 端后台、业务 SDK 与跨端应用的架构和长期治理',
        'React 技术栈、组件抽象、微前端与工程质量建设',
        '团队管理、方案评审、任务推进与 Code Review',
        'Node.js、Python、Go、数据库、容器与部署维护经验',
      ],
      experience: [
        {
          company: '美餐网',
          role: '前端负责人',
          period: '2019.11 — 至今',
          description: '负责企业运营后台、跨端交易能力、业务 SDK 与内部平台，也负责团队管理和项目推进。',
        },
        {
          company: '百度',
          role: '高级研发工程师',
          period: '2017.11 — 2019.11',
          description: '参与地图数据采集与核验工具、空间数据平台和内容编辑器的开发。',
        },
        {
          company: '北京度家科技有限公司',
          role: '桌面 App / 前后端主程',
          period: '2017.03 — 2017.11',
          description: '负责跨平台原型编辑器、移动端预览及相关 Web 与后端功能。',
        },
        {
          company: '三亚汪汪信息科技有限公司',
          role: '研发负责人',
          period: '2015.08 — 2017.03',
          description: '负责 H5 用户端、后端业务系统以及服务器部署维护。',
        },
        {
          company: '爱旅行',
          role: '高级工程师',
          period: '2012.09 — 2015.08',
          description: '负责海外供应商后台，并参与航班数据和站内业务系统开发。',
        },
      ],
    },
  },
  {
    id: 'operations-agent-demo',
    section: '作品',
    title: 'Agent × Layered Route Lab Demo',
    eyebrow: 'LIVE AGENT DEMO',
    description: '用自然语言完成页面导航、数据查询与结果验证',
    kind: 'iframe',
    source: operationsAgentDemoUrl,
    status: '路由 AST · 本地规划 · 合成数据',
  },
  {
    id: 'layered-route-lab',
    section: '作品',
    title: 'Layered Route Lab',
    eyebrow: 'INTERACTIVE WORK',
    description: '验证模态层、分支导航与页面状态恢复',
    kind: 'iframe',
    source: layeredRouteLabUrl,
    status: '交互实验 · 建议电脑端体验',
  },
  {
    id: 'operations-agent',
    section: '项目描述',
    group: 'meican',
    title: '行为图驱动的操作 Agent',
    eyebrow: 'AGENTIC INTERACTION',
    description: '把自然语言任务转成可执行、可验证的页面操作',
    kind: 'article',
    intro:
      '我为复杂 Web 后台设计了一套旁路 Agent。它先从源码或运行页面生成行为图，再把自然语言任务转成受约束的操作计划；原业务无须为模型重写，执行结果也会由页面状态再次验证。',
    facts: [
      { label: '类型', value: 'AI Agent / 交互基础设施' },
      { label: '技术', value: 'React · AST · Puppeteer · LLM · ActionGraph' },
      { label: '职责', value: '问题建模 · Agent 编排 · 核心开发 · 验证体系' },
      { label: '阶段', value: '内部原型 · 公开 Demo · 持续演进' },
    ],
    demo: {
      source: operationsAgentDemoUrl,
      title: 'Operations Agent × Layered Route Lab',
      description:
        '输入自然语言任务，查看检索、计划、执行和验证过程。演示使用合成数据，不连接真实业务系统。',
    },
    visuals: [
      {
        source: operationsAgentArchitecture,
        title: '双路径架构：静态分析与运行态探索',
        description:
          '源码可读项目使用路由 AST 与源码特征扫描；源码不透明或运行态复杂的项目由 Agent 编排 Puppeteer / DOM 探索。两条路径输出同一种 Behavior Manifest，并复用检索、计划、执行与测试链路。',
      },
      {
        source: operationsAgentGraph,
        title: '行为图：从页面状态到可执行知识',
        description:
          '公开演示使用完全虚构的数据。可拖拽、缩放、点选节点，并切换“行为先验”与“回归覆盖”视图。',
      },
    ],
    sections: [
      {
        title: '旁路接入',
        phase: '已实现',
        body: 'Agent 不直接操纵业务组件。它读取外部生成的行为知识，把 route.navigate、modal.open 等类型化命令交给宿主应用，由应用更新状态并返回结果。',
      },
      {
        title: '两种建图方式',
        phase: '已实现',
        body: '源码可读时，通过 AST 扫描路由、页面层级和动作签名；源码不透明时，由浏览器探索 DOM 与运行状态。两种方式都输出统一的 Behavior Manifest。',
      },
      {
        title: '受约束的执行',
        phase: '已实现',
        body: '本地索引先缩小候选，必要时再由模型补全语义。每一步都会检查参数、前置条件和当前状态，执行后验证 URL、页面层级与数据结果。',
      },
      {
        title: 'Demo 与测试',
        phase: '公开演示',
        body: '公开 Demo 跑通页面导航、跨实体查询、数据汇总和任务分享。同一份行为图也用于生成回归用例；所有演示数据均为合成内容。',
      },
      {
        title: '当前边界',
        phase: '方案探索',
        body: '当前是合成数据原型。真实业务接入还需补齐权限、脱敏、审计和写操作确认；OCR 经验证不适合作为主链路，已降为探索性补充。',
      },
    ],
  },
  {
    id: 'layered-route-lab-notes',
    section: '项目描述',
    group: 'meican',
    title: 'Layered Route Lab：分层路由实验',
    eyebrow: 'PROJECT NOTES',
    description: '验证模态层、分支导航和页面状态恢复',
    kind: 'article',
    intro:
      '一个用于验证复杂后台导航模型的交互实验。它把页面、模态层和分支路径放进同一套可观察的路由结构，并支持从 URL 恢复界面层级。',
    facts: [
      { label: '类型', value: '交互实验 / Web 应用' },
      { label: '技术', value: 'React · TypeScript · vinext' },
      { label: '职责', value: '产品设计 · 前端实现' },
      { label: '状态', value: '持续迭代' },
    ],
    sections: [
      {
        title: '为什么做',
        body: '传统单层路由难以同时表达页面、弹层和分支流程，刷新或分享链接后也不容易恢复完整上下文。',
      },
      {
        title: '怎么做',
        body: '将路由状态、页面上下文和呈现器拆开，通过层级视图观察每一层的创建、切换和退出。',
      },
      {
        title: '验证结果',
        body: 'Demo 支持分支路径重建、多呈现器切换和过渡动画，也成为行为图 Agent 的公开验证环境。',
      },
    ],
  },
  {
    id: 'enterprise-console-platform',
    section: '项目描述',
    group: 'meican',
    title: '企业后台微前端平台',
    eyebrow: 'PLATFORM ARCHITECTURE',
    description: '让多个业务应用独立开发、发布并接入同一后台',
    kind: 'article',
    intro:
      '我主导把集中式运营后台拆分为统一宿主和多个业务应用。宿主负责导航、权限与应用装载，业务团队可以独立开发、发布和回滚。',
    facts: [
      { label: '类型', value: '微前端平台 / B 端基础设施' },
      { label: '技术', value: 'React · Module Federation · Node.js · CI/CD' },
      { label: '职责', value: '架构设计 · 核心实现 · 接入规范 · 发布治理' },
      { label: '周期', value: '持续演进' },
    ],
    sections: [
      {
        title: '问题',
        body: '业务域和协作团队增加后，局部改动也常需要修改公共宿主并整体发布，跨团队协调成本持续上升。',
      },
      {
        title: '架构',
        body: '统一宿主管理导航、权限和路由；业务应用通过元数据注册、按需加载，并通过约定事件完成跨应用通信。',
      },
      {
        title: '交付',
        body: '存量应用可分阶段迁移，新应用可独立部署和回滚，日常业务迭代不再频繁改动公共宿主。',
      },
    ],
  },
  {
    id: 'embedded-operations-platform',
    section: '项目描述',
    group: 'meican',
    title: '可嵌入运营页面',
    eyebrow: 'EMBEDDED OPERATIONS',
    description: '把数据分析、资源管理等工具独立部署并复用到不同后台',
    kind: 'article',
    intro:
      '我为多个企业后台设计了可嵌入的运营页面，覆盖数据分析、资源管理和配置工具。页面独立开发和部署，再通过统一适配层接入不同宿主。',
    facts: [
      { label: '类型', value: '运营平台 / 嵌入式 Web 应用' },
      { label: '技术', value: 'React · TypeScript · Webpack · Axios' },
      { label: '职责', value: '架构设计 · 核心开发 · 长期维护' },
      { label: '周期', value: '持续演进' },
    ],
    sections: [
      {
        title: '运行边界',
        body: '运营工具需要适配多个后台版本，并稳定处理复杂筛选、导出、异步任务和错误反馈。',
      },
      {
        title: '实现方式',
        body: '页面按业务域独立构建；公共请求层统一状态、错误、下载和任务处理；适配层负责不同宿主的运行差异。',
      },
      {
        title: '扩展与复用',
        body: '新页面按目录约定接入，无需维护不断增长的中心配置。同一能力可以在多个后台复用并独立发布。',
      },
    ],
  },
  {
    id: 'embedded-business-sdk',
    section: '项目描述',
    group: 'meican',
    title: '嵌入式业务 SDK',
    eyebrow: 'SDK PLATFORM',
    description: '以统一接口在不同系统中嵌入完整业务页面',
    kind: 'article',
    intro:
      '我设计了一套前端 SDK，把完整业务页面封装成统一的渲染与事件接口。调用方只需传入容器、环境和业务参数，不必了解内部实现。',
    facts: [
      { label: '类型', value: '业务 SDK / 前端平台化' },
      { label: '技术', value: 'JavaScript · Webpack · Monorepo' },
      { label: '职责', value: 'SDK 设计 · 构建体系 · 核心开发 · 版本治理' },
      { label: '规模', value: '多个业务包独立发布 · 持续演进' },
    ],
    sections: [
      {
        title: '接入问题',
        body: '不同系统重复实现完整业务页面，会同时复制业务逻辑、环境适配和发布成本。',
      },
      {
        title: 'SDK 边界',
        body: '基础层统一渲染生命周期、输入参数和事件回传；业务包在共同约定上保留各自的参数模型和能力。',
      },
      {
        title: '构建与发布',
        body: '多个业务包由 monorepo 管理，共享构建和本地调试工具，但保持独立版本。调用方无须了解页面内部实现。',
      },
    ],
  },
  {
    id: 'payment-platform',
    section: '项目描述',
    group: 'meican',
    title: '跨端收银 SDK',
    eyebrow: 'PAYMENT INFRASTRUCTURE',
    description: '统一 Web 与小程序端的支付流程、状态和接入协议',
    kind: 'article',
    intro:
      '我负责统一收银接入层的关键演进，把分散在各终端的交易流程整理成 SDK 和稳定接口，同时保留 Web 与小程序各自的交互和渠道适配。',
    facts: [
      { label: '类型', value: '支付 SDK / 跨端基础设施' },
      { label: '技术', value: 'React · Taro · Webpack 5 · Rollup' },
      { label: '职责', value: 'SDK 设计 · 核心开发 · 跨端治理' },
      { label: '范围', value: '多种 Web 形态 · 主流小程序平台' },
    ],
    sections: [
      {
        title: '接入问题',
        body: '不同宿主、终端和支付渠道各有差异，交易又包含多个异步阶段，分别实现容易造成状态和异常处理分叉。',
      },
      {
        title: '核心设计',
        body: '统一输入输出、回调和错误模型，并拆分流程状态、渠道适配、结果查询与页面渲染。',
      },
      {
        title: '结果',
        body: '上层系统共用同一接入契约和异常兜底；渠道或流程变化集中在适配层处理，SDK 与界面组件可独立发布。',
      },
    ],
  },
  {
    id: 'business-finance-platform',
    section: '项目描述',
    group: 'meican',
    title: '业财一致平台',
    eyebrow: 'BUSINESS & FINANCE',
    description: '让业务单据、审批、结算和财务结果在同一流程中核对',
    kind: 'article',
    intro:
      '我负责平台初始前端架构和关键交互基建。系统把多来源业务单据接入审批、调整、结算和分析流程，减少在线下表格与分散系统之间反复核对。',
    facts: [
      { label: '类型', value: '业财一体化 / 财务运营平台' },
      { label: '技术', value: 'React · Webpack · Axios · 内部设计系统' },
      { label: '职责', value: '架构设计 · 核心基建 · 团队推进' },
      { label: '周期', value: '长期演进' },
    ],
    sections: [
      {
        title: '业务场景',
        body: '平台需要承载多类账务单据和处理流程，并保留清晰的状态、凭据与上下文。',
      },
      {
        title: '交互设计',
        body: '功能按业务对象和处理阶段组织；叠层工作流让用户打开详情或审批任务时仍能保留列表上下文。',
      },
      {
        title: '结果',
        body: '业务记录、审批动作和财务结果可以围绕同一上下文流转；统一页面约定和组件底座也便于团队扩展新模块。',
      },
    ],
  },
  {
    id: 'operations-design-system',
    section: '项目描述',
    group: 'meican',
    title: '运营后台设计系统',
    eyebrow: 'DESIGN SYSTEM',
    description: '为财务与运营后台提供统一组件、设计规范和工程工具',
    kind: 'article',
    intro:
      '我发起并搭建运营后台设计系统，把反复出现的表格、表单、筛选、导航和反馈整理成共享 React 组件，同时统一设计变量、文档和发布流程。',
    facts: [
      { label: '类型', value: '设计系统 / React 组件库' },
      { label: '技术', value: 'React · TypeScript · Less · Storybook' },
      { label: '职责', value: '项目发起 · 原型基建 · 设计变量落地 · 协作维护' },
      { label: '体系', value: '组件资产 · 设计规范 · 文档工具 · 多项目复用' },
    ],
    sections: [
      {
        title: '问题',
        body: '多个后台重复实现相同模式，视觉、行为和无障碍细节会逐渐分叉，设计规范也难以持续落到代码。',
      },
      {
        title: '组件与规范',
        body: '用带类型约束的 React 组件承载高频交互，并以设计变量统一颜色、状态和布局规则。',
      },
      {
        title: '协作与发布',
        body: '组件、示例和文档在多包工程中版本化发布，并通过预览和检查验证公共资产变更。多个后台可直接复用同一底座。',
      },
    ],
  },
  {
    id: 'poke-prototype-editor',
    section: '项目描述',
    group: 'other',
    title: 'Poke 高保真原型编辑器',
    eyebrow: 'EARLY PRODUCT WORK',
    description: '支持界面绘制、交互编排和实时预览的移动原型工具',
    kind: 'article',
    intro:
      'Poke 是我在 2016–2018 年独立设计和开发的高保真移动原型编辑器。用户可以绘制页面、管理图层，为点击或滑动配置状态变化和页面跳转，并在网页或 Electron 桌面端实时预览。',
    facts: [
      { label: '类型', value: '桌面应用 / Web 编辑器 / 原型工具' },
      { label: '技术', value: 'React 15 · Redux · Immutable.js · Electron' },
      { label: '职责', value: '产品设计 · 交互建模 · 客户端架构 · 核心开发' },
      { label: '时期', value: '2016–2018 · 早期个人作品' },
    ],
    links: [
      {
        label: 'Poke v1.0.5 发布页',
        url: 'https://github.com/azlarsin/productpoke/releases/tag/v1.0.5',
        note: 'GitHub Release · 历史公开版本',
      },
    ],
    demo: {
      source: pokeEditorDemo,
      title: 'Poke Studio · Archive Reconstruction',
      description:
        '基于原始源码和实际运行结果重建。可创建图层、调整属性、配置页面跳转并进入预览；演示使用虚构项目，不连接旧服务。',
      label: 'SOURCE-DRIVEN INTERACTIVE RECONSTRUCTION',
      badge: 'WEB · DESKTOP · PROTOTYPE',
      toolbar: 'Poke Studio · Synthetic Mobile Prototype',
      status: 'LOCAL',
      height: 760,
    },
    visuals: [
      {
        source: pokeEditorArchitecture,
        title: '共享编辑器内核与双运行时架构',
        description:
          '网页运行时承载完整编辑体验；Electron 通过窄化桥接补充本地项目、文件、窗口、更新与设备能力。两端共用同一份文档、元素状态与交互事件模型。',
      },
    ],
    sections: [
      {
        title: '编辑工作台',
        phase: '已实现',
        body: '项目、页面、图层、组件、画布和属性面板集中在同一工作台，支持绘制、变换、组合、Mask、撤销与重做。',
      },
      {
        title: '状态与事件',
        phase: '已实现',
        body: '元素可以保存多个状态，并把点击、双击、长按或滑动连接到状态变化和页面跳转；转移时间与缓动曲线也可配置。',
      },
      {
        title: '文档模型',
        phase: '已实现',
        body: '项目按“项目—页面组—页面—元素”组织，有序列表负责图层顺序，元素映射支持快速读取；Redux 和 Immutable 管理选择、画布与历史状态。',
      },
      {
        title: '双运行时',
        phase: '已实现',
        body: '网页与 Electron 共用编辑器内核；桌面端通过 IPC 补充本地项目、文件、窗口、更新和设备能力。',
      },
      {
        title: '公开重建',
        phase: '公开演示',
        body: '我用合成通信桥启动并操作原始前端包，再按真实交互重建公开 Demo。Bezier 编辑器也从该项目中抽成独立组件。',
      },
    ],
  },
  {
    id: 'dataview-observatory',
    section: '项目描述',
    group: 'other',
    title: '32:9 实时数据大屏',
    eyebrow: 'DATA VISUALIZATION DELIVERY',
    description: '纯前端实现的超宽屏监测、筛选与动态图形系统',
    kind: 'article',
    intro:
      '这是我独立完成的前端交付：面向 7680 × 2160 双宽屏，把监测指标、排行、趋势和节点分布组织成可持续运行的数据大屏。首版由本地数据驱动，可直接部署为静态页面；公开 Demo 使用合成数据重建核心交互。',
    facts: [
      { label: '类型', value: '纯前端数据大屏 / 可视化交付' },
      { label: '技术', value: 'React 16 · ECharts 4 · React Motion · SVG · Less' },
      { label: '职责', value: '前端架构 · 屏幕实现 · 图表组件 · 动效系统 · 静态交付' },
      { label: '时期', value: '2020–2021 · 独立兼职项目' },
    ],
    demo: {
      source: dataviewObservatoryDemo,
      title: 'Distributed Network Observatory',
      description:
        '可切换总览、节点地图、网络画像和协作流，并操作筛选、时间范围、节点详情与自动巡演。演示使用合成数据，不请求接口。',
      label: 'SOURCE-VERIFIED OFFLINE RECONSTRUCTION',
      badge: '32:9 · SYNTHETIC · 0 REQUESTS',
      toolbar: 'DataView Observatory · Pure Frontend Dataset',
      status: 'OFFLINE',
      height: 760,
    },
    sections: [
      {
        title: '超宽屏适配',
        phase: '已实现',
        body: '应用以 3840 × 1080 逻辑画布计算全局比例，并同步缩放字号、布局、ECharts 与 SVG，在目标双宽屏和普通开发窗口中保持一致。',
      },
      {
        title: '图表与数据',
        phase: '已实现',
        body: '七个初始屏幕共享卡片、表格、标签和图表组件；每个场景把样本数据和图表配置放在独立模块，页面只负责组合与状态切换。',
      },
      {
        title: '联动与动效',
        phase: '已实现',
        body: '地图筛选会同步更新节点、图例、趋势和明细；数字、排行、路径与表格滚动使用统一的低干扰动画节奏。',
      },
      {
        title: '交付边界',
        phase: '公开演示',
        body: '最初交付是可独立运行的纯前端版本。后续协作中，我继续负责新增前端场景、视觉修正和字段适配；公开版本移除了品牌、接口和真实数据。',
      },
    ],
  },
  {
    id: 'turntable-motion-lab',
    section: '项目描述',
    group: 'other',
    title: 'Turntable Motion Lab',
    eyebrow: 'MOTION EXPERIMENT',
    description: '基于 SVG 几何与弹簧模型的数据驱动转盘动效',
    kind: 'article',
    intro:
      '一个用 SVG 和弹簧模型驱动的转盘动效实验。数据变化时，扇区会重新计算并连续过渡；新增、删除或用户打断动画后，整体运动仍保持连贯。',
    facts: [
      { label: '类型', value: '动效实验 / 数据可视化原型' },
      { label: '技术', value: 'React 16 · React Motion · SVG' },
      { label: '职责', value: '几何建模 · 动画实现 · 交互实验' },
      { label: '时期', value: '2018 · 个人技术作品' },
    ],
    demo: {
      source: turntableMotionLab,
      title: 'Turntable Motion Lab',
      description:
        '可重组数据、悬停聚焦、双击删除，并按住 S 降速观察动画。',
      badge: 'SVG · SPRING · HOLD S',
      toolbar: 'Turntable Motion Lab · Data-driven geometry',
      status: 'LIVE',
      height: 620,
    },
    sections: [
      {
        title: '几何计算',
        body: '数值先转换为圆周占比，再计算弧线起止坐标并生成 SVG Path；数据、几何和渲染彼此分开。',
      },
      {
        title: '连续运动',
        body: '后一扇区沿用前一扇区当前的动画值，staggered spring 让新增、删除和重组像一段连续运动。',
      },
      {
        title: '项目范围',
        body: '这是动效实验，不是完整抽奖产品。公开 Demo 保留核心交互，并去掉旧仓库中的无关请求和未完成流程。',
      },
    ],
  },
  {
    id: 'bezier-easing-picker',
    section: '项目描述',
    group: 'other',
    title: 'Bezier Easing Picker',
    eyebrow: 'REUSABLE COMPONENT',
    description: '可视化编辑和预览 cubic-bezier 缓动曲线',
    kind: 'article',
    intro:
      '一个可视化 cubic-bezier 编辑器。选择预设或拖动控制点后，曲线、参数和运动预览会同步变化，结果通过 onChange 返回。',
    facts: [
      { label: '类型', value: 'React 组件 / 动效工具' },
      { label: '技术', value: 'React 15 · SVG · SCSS · Webpack' },
      { label: '接口', value: '尺寸 · 默认曲线 · onChange' },
      { label: '时期', value: '2017 · 从 Poke 抽离' },
    ],
    demo: {
      source: bezierPickerLab,
      title: 'Bezier Easing Picker',
      description:
        '选择常用预设或拖动控制点，右侧运动轨迹与 CSS 参数会同步更新。公开版本同时修正了旧 Demo 的状态和边界问题。',
      badge: 'SVG · CUBIC-BEZIER',
      toolbar: 'Bezier Picker · Live timing preview',
      status: 'LIVE',
      height: 620,
    },
    sections: [
      {
        title: '来源',
        body: '组件最初用于 Poke 的交互面板，后来从编辑器上下文中拆出，成为可独立使用的 React 组件。',
      },
      {
        title: '编辑与预览',
        body: 'SVG 同时绘制曲线、控制线和拖拽点；坐标实时转换为四个参数，并立即应用到右侧运动预览。',
      },
      {
        title: '组件接口',
        body: '对外只提供尺寸、默认曲线和 onChange。生产产物将 React 设为外部依赖，业务侧可以直接生成 CSS 缓动参数或保存结果。',
      },
    ],
  },
]

export const sections = ['简历', '作品', '项目描述'] as const
