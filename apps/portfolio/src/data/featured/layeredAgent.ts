import { behaviorManifest } from '../../../../../layered-route-lab/src/agent/generated/behaviorManifest'
import operationsAgentGraph from '../../assets/operations-agent-actiongraph.html?url'
import operationsAgentArchitecture from '../../assets/operations-agent-architecture.html?url'
import { createLayeredRouteLabUrl } from '../../app/layeredRouteLabUrl'
import type { PortfolioProject } from '../types'

const layeredRouteLabUrl = (
  import.meta.env.VITE_LAYERED_ROUTE_LAB_URL || 'http://localhost:3000'
).replace(/\/$/, '')

const operationsAgentDemoUrl = createLayeredRouteLabUrl(
  layeredRouteLabUrl,
  '/products',
  { agent_demo: '1' },
)

export const layeredAgentManifestStats = {
  routeSchemas: behaviorManifest.routeSchemas.length,
  routeNodes: behaviorManifest.routeInstances.length,
  surfaces: behaviorManifest.surfaces.length,
  actions: behaviorManifest.actions.length,
  sources: behaviorManifest.generatedFrom.length,
  sourceHash: behaviorManifest.sourceHash,
  runtimeExploredPages:
    behaviorManifest.analysisMode === 'route-ast+source-feature-scan' ? 0 : null,
} as const

const manifestSummary = [
  `${layeredAgentManifestStats.routeSchemas} 个路由模板`,
  `${layeredAgentManifestStats.routeNodes} 个路由节点`,
  `${layeredAgentManifestStats.surfaces} 类界面层`,
  `${layeredAgentManifestStats.actions} 个动作`,
].join(' · ')

export const layeredAgentProject = {
  slug: 'layered-agent',
  order: 4,
  tier: 'featured',
  provenance: 'public-reconstruction',
  title: 'Layered Route × Agent：基于页面行为约束的任务执行',
  shortTitle: 'Layered Route × Agent',
  eyebrow: 'PUBLIC RECONSTRUCTION / RESEARCH',
  thesis:
    '本项目先建立可从 URL 恢复页面、Presenter、Modal 和查询条件的分层路由模型，再从源码生成 Behavior Manifest。Agent 仅使用清单中的动作制定计划，并在每一步执行后检查 URL、页面层级和数据结果。',
  period: '公开重建 · 持续研究',
  role: '路由模型 · Agent 方案 · 核心开发',
  status: '公开实验 · 全部使用合成数据',
  technologies: [
    'React',
    'TypeScript',
    'vinext',
    'Route AST',
    'History API',
    'Behavior Manifest',
    'Puppeteer research',
    'LLM-assisted planning',
  ],
  impact: [
    '页面、Presenter、Modal 和查询条件均可从 URL 恢复，深链刷新后能够重建相同的界面层级。',
    `Behavior Manifest 在构建时从源码生成；当前包含 ${manifestSummary}，数字直接读取生成文件。`,
    '公开 Demo 完整实现检索、计划、宿主命令、执行与结果检查；同一份动作清单亦用于回归测试。',
  ],
  scope: [
    'Layered Route Lab 的分层路由与刷新重建',
    'Route Presenter、同 URL Presenter 与 Modal history',
    '从路由 AST 和源码特征生成 Behavior Manifest',
    '本地检索、有限动作规划、宿主命令和结果检查',
    '自然语言 Agent Demo 与行为图可视化',
  ],
  facts: [
    { label: '类型', value: '公开交互实验 / Agent 研究原型' },
    { label: '数据', value: '完全合成 · 不连接真实业务系统' },
    { label: 'Manifest', value: manifestSummary },
    {
      label: '运行态探索',
      value: `${layeredAgentManifestStats.runtimeExploredPages} 页 · 当前清单由静态源码分析生成`,
    },
  ],
  links: [
    {
      label: 'Layered Route Lab',
      url: layeredRouteLabUrl,
      note: '独立交互实验 · 建议电脑端体验',
    },
    {
      label: 'Agent Demo',
      url: operationsAgentDemoUrl,
      note: '本地规划 · 类型化命令 · 合成数据',
    },
  ],
  demo: {
    source: operationsAgentDemoUrl,
    title: 'Operations Agent × Layered Route Lab',
    description:
      '输入自然语言任务后，可观察行为检索、计划生成、逐步执行与结果检查。Demo 使用合成数据，不连接美餐或其他真实业务系统。',
    provenanceLabel: 'PUBLIC RESEARCH DEMO · SYNTHETIC DATA',
    statusLabel: 'ROUTE AST · LOCAL PLANNER · TYPED BRIDGE',
    toolbar: 'Layered Route Lab · Agent Demo',
    height: 760,
    posterVariant: 'agent-console',
    ctaLabel: '加载交互 Demo',
    desktopPreferred: true,
  },
  visuals: [
    {
      id: 'agent-architecture',
      source: operationsAgentArchitecture,
      kind: 'html-frame',
      title: '页面行为的两类采集方式',
      description:
        '源码可读时，从路由 AST 与界面特征中提取动作；源码不可读或运行态较复杂时，由 Agent 通过浏览器和 DOM 进行探索。两类结果统一写入 Behavior Manifest。',
      provenanceLabel: 'RESEARCH ARCHITECTURE · NOT A PRODUCTION SCREENSHOT',
    },
    {
      id: 'agent-action-graph',
      source: operationsAgentGraph,
      kind: 'html-frame',
      title: '行为图：页面状态与可执行动作',
      description:
        '支持拖拽、缩放、节点选择，并可查看动作来源与测试覆盖。图中数据来自公开 Lab，不包含真实业务数据。',
      provenanceLabel: 'GENERATED FROM PUBLIC LAB · SYNTHETIC DATA',
    },
  ],
  chapters: [
    {
      id: 'problem',
      title: '问题定义：页面操作不等同于坐标点击',
      paragraphs: [
        '复杂 Web 应用中的操作有效性取决于当前页面、目标实体、查询条件、可用动作与完成条件。仅依赖截图或由模型自由生成步骤，难以稳定表达这些约束。',
        '因此，本项目先建立可恢复状态的宿主，再从源码提取页面允许的动作，最后由 Agent 按行为清单执行任务并检查结果。',
      ],
      phase: '公开研究',
    },
    {
      id: 'route-model',
      title: '分层路由与状态恢复',
      summary: 'URL 同时记录目标页面及可恢复的父子路径。',
      paragraphs: [
        'Lab 使用声明式路由树解析集合、实体、关系、记录和动作页面。刷新深链时，服务端按当前路径直接渲染完整父链，避免先渲染默认页面再校正状态。',
        '查询条件按路由模板保存；返回上一级时，此前的筛选条件得以保留。',
      ],
      phase: '已实现',
    },
    {
      id: 'presenter',
      title: 'Presenter 与临时界面层',
      paragraphs: [
        'Route Presenter 可从 URL 恢复；同 URL Presenter 通过 history state 表示临时界面层。两者共用层级与进出场逻辑，同时明确区分是否支持深链恢复。',
        '3D 堆叠与网格检查模式展示各层索引、退出状态和遮挡关系，用于调试上下文保留问题。',
      ],
      phase: '已实现',
    },
    {
      id: 'modal-history',
      title: 'Modal History 与返回顺序',
      paragraphs: [
        'Modal 使用独立句柄记录层级、全屏关系与退出过程，同时将深度写入 History API。触发浏览器返回时，应用先关闭顶层 Modal 或 Presenter，再判断是否切换路由。',
        '临时操作由 history state 表达；需要分享或刷新恢复的页面状态则保留在 URL 中。',
      ],
      phase: '已实现',
    },
    {
      id: 'behavior-manifest',
      title: '从源码生成 Behavior Manifest',
      paragraphs: [
        `生成脚本读取公开 Lab 的路由声明与界面特征，当前输出 ${manifestSummary}。源文件数量和 source hash 同样直接来自 behaviorManifest，避免案例文案与实现不一致。`,
        'Manifest 记录路由参数、父子关系、界面层与动作来源，检索、规划、页面展示和测试均使用同一份数据。',
      ],
      bullets: behaviorManifest.generatedFrom.map((source) => `源码入口：${source}`),
      phase: '构建时生成',
    },
    {
      id: 'planning',
      title: '行为检索与受约束规划',
      paragraphs: [
        '本地索引先按实体、路由和动作缩小候选范围，再根据 Manifest 生成计划；公开 Demo 的主要流程不依赖在线模型。模型可辅助理解语义，但不能绕过参数与前置条件检查。',
        '深层导航沿父链逐层展开，使每一步状态变化均可观察，并便于定位失败发生的层级。',
      ],
      phase: '已实现 / 持续研究',
    },
    {
      id: 'typed-bridge',
      title: '类型化宿主命令',
      paragraphs: [
        'Agent 不直接修改业务组件，也不伪造键盘事件。它仅发送 route.navigate、presenter.advance、modal.open 和 inspection.set 等类型化命令，由宿主按照自身状态模型执行并返回结果。',
        '允许执行的动作受显式协议限制，行为清单、规划器与宿主实现可分别维护。',
      ],
      phase: '已实现',
    },
    {
      id: 'verification',
      title: '执行结果验证',
      paragraphs: [
        '每一步执行后均检查 URL、顶层界面、层级数量与数据结果，再决定继续、重试或报告失败。',
        '同一份 Manifest 还用于检查父链完整性、动作来源、深链 SSR 和交互约定，不仅用于 Demo 配置。',
      ],
      phase: '自动化验证',
    },
    {
      id: 'demo',
      title: '公开 Demo',
      paragraphs: [
        'Demo 覆盖页面导航、跨实体查找、数据整理、Presenter / Modal 操作与检查模式。商品、订单、员工和任务结果均为虚构数据。',
        '交互内容按需加载。移动端支持案例阅读，完整操作与堆叠检查以桌面端为主。',
      ],
      phase: '公开演示',
    },
    {
      id: 'boundaries',
      title: '适用范围与限制',
      paragraphs: [
        '本项目是基于公开 Lab 构建的研究原型，不属于美餐或任何客户的生产环境，也不代表真实业务已接入 Agent。',
        '接入真实系统仍需处理权限、脱敏、审计、写操作确认、失败补偿与模型成本。浏览器探索和 OCR 可作为补充信息来源，但不能替代可验证的结构化行为清单。',
      ],
      phase: '研究边界',
    },
  ],
  provenanceNote:
    '内容来自公开 Agent Demo、Layered Route Lab 与实验笔记。代码、图表和统计均来自本仓库，数据全部为合成数据。',
} satisfies PortfolioProject
