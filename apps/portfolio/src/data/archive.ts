import pokeEditorArchitecture from '../assets/poke-editor-architecture.html?url'
import { demoExperiences } from './demoExperiences'
import type { PortfolioProject } from './types'
import { cocoWalletProject } from './cocoWallet'
import { elpisProject } from './featured/elpis'

const pokeProject = {
  slug: 'poke-prototype-editor',
  order: 11,
  tier: 'archive',
  provenance: 'personal-product',
  title: 'Poke：高保真移动原型编辑器',
  shortTitle: 'Poke',
  eyebrow: 'EARLY PRODUCT WORK',
  summary: '支持界面绘制、交互编排和实时预览的移动原型工具',
  thesis:
    'Poke 是我在 2016–2018 年独立设计和开发的高保真移动原型编辑器。用户可以绘制页面、管理图层，为点击或滑动配置状态变化和页面跳转，并在网页或 Electron 桌面端实时预览。',
  period: '2016–2018 · 早期个人作品',
  role: '产品设计 · 交互模型 · 客户端架构 · 核心开发',
  status: '历史公开版本 · 公开 Demo 为源码驱动重建',
  technologies: ['React 15', 'Redux', 'Immutable.js', 'Electron'],
  impact: [
    '同一份原型文档支持界面绘制、图层管理、状态变化、手势事件和页面跳转。',
    '网页与 Electron 共用编辑器内核，桌面端通过受限桥接补充本地文件、窗口、更新和设备能力。',
    'Bezier 缓动组件由编辑器中拆分；公开 Demo 基于原始源码和实际运行结果重建。',
  ],
  scope: [
    '项目、页面组、页面、元素与图层工作台',
    '元素多状态与点击、双击、长按、滑动事件',
    '撤销重做、变换、组合、Mask 与实时预览',
    'Web / Electron 双运行时与 IPC 桥接',
  ],
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
    experienceId: 'poke-prototype-editor',
    source: demoExperiences['poke-prototype-editor'].source,
    title: 'Poke Studio · Archive Reconstruction',
    description:
      '基于原始源码和实际运行结果重建。可创建图层、调整属性、配置页面跳转并进入预览；演示使用虚构项目，不连接旧服务。',
    provenanceLabel: 'SOURCE-DRIVEN INTERACTIVE RECONSTRUCTION',
    statusLabel: 'LOCAL',
    toolbar: 'Poke Studio · Synthetic Mobile Prototype',
    badge: 'WEB · DESKTOP · PROTOTYPE',
    height: 760,
    posterVariant: 'prototype-editor',
    ctaLabel: '加载重建 Demo',
    desktopPreferred: true,
  },
  visuals: [
    {
      id: 'poke-editor-architecture',
      source: pokeEditorArchitecture,
      kind: 'html-frame',
      title: '共享编辑器内核与双运行时架构',
      description:
        '网页与 Electron 共用编辑器内核。Electron 补充本地项目、文件、窗口、更新和设备能力，两端读写相同的文档、元素状态与交互事件模型。',
      provenanceLabel: 'ARCHITECTURE RECONSTRUCTED FROM ORIGINAL SOURCE',
    },
  ],
  chapters: [
    {
      id: 'workbench',
      title: '编辑工作台',
      paragraphs: [
        '项目、页面、图层、组件、画布和属性面板集中在同一工作台，支持绘制、变换、组合、Mask、撤销与重做。',
      ],
      phase: '已实现',
    },
    {
      id: 'state-events',
      title: '状态与事件',
      paragraphs: [
        '元素可以保存多个状态，并将点击、双击、长按或滑动连接到状态变化和页面跳转；转移时间与缓动曲线亦可配置。',
      ],
      phase: '已实现',
    },
    {
      id: 'document-model',
      title: '文档模型',
      paragraphs: [
        '项目按“项目—页面组—页面—元素”组织，有序列表负责图层顺序，元素映射支持快速读取；Redux 和 Immutable 管理选择、画布与历史状态。',
      ],
      phase: '已实现',
    },
    {
      id: 'dual-runtime',
      title: '双运行时',
      paragraphs: [
        '网页与 Electron 共用编辑器内核；桌面端通过 IPC 补充本地项目、文件、窗口、更新和设备能力。',
      ],
      phase: '已实现',
    },
    {
      id: 'public-reconstruction',
      title: '公开重建',
      paragraphs: [
        '原始前端包通过合成通信桥运行，公开 Demo 再依据实际交互完成重建。Bezier 编辑器亦由该项目拆分为独立组件。',
      ],
      phase: '公开演示',
    },
  ],
  provenanceNote:
    '原项目是个人产品并有历史 GitHub Release；作品集内嵌 Demo 是基于原始源码和运行结果制作的合成数据重建。',
} satisfies PortfolioProject

const dataViewProject = {
  slug: 'dataview-observatory',
  order: 12,
  tier: 'archive',
  provenance: 'production',
  title: '32:9 实时数据大屏',
  shortTitle: 'DataView',
  eyebrow: 'DATA VISUALIZATION DELIVERY',
  summary: '纯前端实现的超宽屏监测、筛选与动态图形系统',
  thesis:
    '该项目由本人独立完成前端开发，面向 7680 × 2160 双宽屏展示监测指标、排行、趋势和节点分布。首版读取本地数据，可直接部署为静态页面；公开 Demo 使用合成数据重建主要交互。',
  period: '2020–2021 · 独立兼职项目',
  role: '前端架构 · 页面开发 · 图表 · 动效 · 部署版本',
  status: '原项目为前端交付 · 公开 Demo 为离线合成重建',
  technologies: ['React 16', 'ECharts 4', 'React Motion', 'SVG', 'Less'],
  impact: [
    '以 3840 × 1080 逻辑画布统一适配 7680 × 2160 双宽屏和普通开发窗口。',
    '七个初始屏幕共享卡片、表格、标签和图表组件，样本数据与图表配置按场景隔离。',
    '交付可独立运行的纯前端版本；后续继续增加场景、修正视觉并适配字段。',
  ],
  scope: [
    '监测指标、排行、趋势与节点分布',
    'ECharts / SVG 图形和全局缩放',
    '地图筛选、图例、趋势与明细联动',
    '数字、排行、路径与表格滚动动效',
  ],
  facts: [
    { label: '类型', value: '纯前端数据大屏 / 可视化交付' },
    { label: '技术', value: 'React 16 · ECharts 4 · React Motion · SVG · Less' },
    { label: '职责', value: '前端架构 · 页面开发 · 图表 · 动效 · 部署版本' },
    { label: '时期', value: '2020–2021 · 独立兼职项目' },
  ],
  demo: {
    experienceId: 'dataview-observatory',
    source: demoExperiences['dataview-observatory'].source,
    title: 'Distributed Network Observatory',
    description:
      '可切换总览、节点地图、网络画像和协作流，并操作筛选、时间范围、节点详情与自动巡演。演示使用合成数据，不请求接口。',
    provenanceLabel: 'SOURCE-VERIFIED OFFLINE RECONSTRUCTION',
    statusLabel: 'OFFLINE',
    toolbar: 'DataView Observatory · Pure Frontend Dataset',
    badge: '32:9 · SYNTHETIC · 0 REQUESTS',
    height: 760,
    posterVariant: 'data-observatory',
    ctaLabel: '加载离线 Demo',
    desktopPreferred: true,
  },
  chapters: [
    {
      id: 'ultrawide-layout',
      title: '超宽屏适配',
      paragraphs: [
        '应用以 3840 × 1080 逻辑画布计算全局比例，并同步缩放字号、布局、ECharts 与 SVG，在目标双宽屏和普通开发窗口中保持一致。',
      ],
      phase: '已实现',
    },
    {
      id: 'charts-data',
      title: '图表与数据',
      paragraphs: [
        '七个初始屏幕共享卡片、表格、标签和图表组件；各场景的样本数据和图表配置分别位于独立模块，页面负责组合与状态切换。',
      ],
      phase: '已实现',
    },
    {
      id: 'linked-motion',
      title: '联动与动效',
      paragraphs: [
        '地图筛选会同步更新节点、图例、趋势和明细；数字、排行、路径与表格滚动使用统一的低干扰动画节奏。',
      ],
      phase: '已实现',
    },
    {
      id: 'delivery-boundary',
      title: '交付范围',
      paragraphs: [
        '首版交付为可独立运行的纯前端版本。后续继续负责新增页面、视觉修正和字段适配；公开版本已移除品牌、接口与真实数据。',
      ],
      phase: '公开演示',
    },
  ],
  provenanceNote:
    '原项目是实际前端交付；公开 Demo 经源码核对后使用离线合成数据重建，不包含客户品牌、接口或真实数据。',
} satisfies PortfolioProject

const turntableProject = {
  slug: 'turntable-motion-lab',
  order: 13,
  tier: 'archive',
  provenance: 'experiment',
  title: 'Turntable Motion Lab',
  shortTitle: 'Turntable',
  eyebrow: 'MOTION EXPERIMENT',
  summary: '基于 SVG 几何与弹簧模型的数据驱动转盘动效',
  thesis:
    '一个用 SVG 和弹簧模型驱动的转盘动效实验。数据变化时，扇区会重新计算并连续过渡；新增、删除或用户打断动画后，整体运动仍保持连贯。',
  period: '2018 · 个人技术作品',
  role: '几何建模 · 动画实现 · 交互实验',
  status: '公开动效实验',
  technologies: ['React 16', 'React Motion', 'SVG'],
  impact: [
    '将数据占比、SVG 几何与渲染状态分开，支持数据重组后的连续路径变化。',
    '使用 staggered spring 传递相邻扇区的当前动画值，处理新增、删除与用户打断。',
  ],
  scope: ['圆弧几何与 SVG Path', '弹簧动画与相邻扇区衔接', '悬停聚焦、双击删除和可调速观察'],
  facts: [
    { label: '类型', value: '动效实验 / 数据可视化原型' },
    { label: '技术', value: 'React 16 · React Motion · SVG' },
    { label: '职责', value: '几何建模 · 动画实现 · 交互实验' },
    { label: '时期', value: '2018 · 个人技术作品' },
  ],
  demo: {
    experienceId: 'turntable-motion-lab',
    source: demoExperiences['turntable-motion-lab'].source,
    title: 'Turntable Motion Lab',
    description: '可重组数据、悬停聚焦、双击删除，并通过滑杆调速观察动画。',
    provenanceLabel: 'INTERACTIVE MOTION EXPERIMENT',
    statusLabel: 'LIVE',
    toolbar: 'Turntable Motion Lab · Data-driven geometry',
    badge: 'SVG · SPRING · SPEED CONTROL',
    height: 620,
    posterVariant: 'motion-lab',
    ctaLabel: '加载动效实验',
    desktopPreferred: true,
  },
  chapters: [
    {
      id: 'geometry',
      title: '几何计算',
      paragraphs: [
        '数值先转换为圆周占比，再计算弧线起止坐标并生成 SVG Path；数据、几何和渲染彼此分开。',
      ],
    },
    {
      id: 'continuous-motion',
      title: '连续运动',
      paragraphs: [
        '后一扇区沿用前一扇区当前的动画值，staggered spring 让新增、删除和重组像一段连续运动。',
      ],
    },
    {
      id: 'scope-boundary',
      title: '项目范围',
      paragraphs: [
        '这是动效实验，不是完整抽奖产品。公开 Demo 保留核心交互，并去掉旧仓库中的无关请求和未完成流程。',
      ],
    },
  ],
  provenanceNote: '本项目为个人动效实验。公开 Demo 保留核心交互，不将其描述为完整抽奖产品。',
} satisfies PortfolioProject

const merchantCommerceProject = {
  slug: 'merchant-commerce',
  order: 15,
  tier: 'archive',
  provenance: 'personal-product',
  title: '移动电商系统：Android 客户端、运营后台与订单服务',
  shortTitle: '移动电商系统',
  eyebrow: 'INDEPENDENT FULL-STACK PROJECT / ARCHIVE',
  summary: '独立实现的 Flutter Android 客户端、React 运营后台与 Go 订单服务全栈项目',
  thesis:
    '这是一个 2024.07—2025.06 的独立全栈项目归档。公开内容仅根据保留源码与提交历史说明 Flutter Android 购物端、React 运营后台、Go 服务及容器化运行组合的实现范围；不连接历史服务，也不公开真实记录或部署细节。',
  period: '2024.07—2025.06 · 独立全栈项目（仓库记录）',
  role: '独立全栈实现 · Flutter / React / Go / Docker',
  status: '历史项目归档 · 公开版不连接服务、不包含真实记录',
  technologies: [
    'Flutter',
    'GetX',
    'Dio',
    'React 18',
    'Ant Design 5',
    'Go 1.22',
    'Gin',
    'GORM',
    'MySQL',
    'Redis',
    'Docker Compose',
    'Nginx',
  ],
  impact: [
    '独立实现 Flutter Android 购物端、React 运营后台与 Go API 的端到端协作边界。',
    '覆盖商品目录、搜索、商品、购物车、地址、账号与订单流程，以及运营管理、物流、短信和 WebSocket 支持等已留存实现范围。',
    '保留实现使用 Docker Compose、MySQL、Redis 与 Nginx 组成容器化运行组合；公开案例不披露环境配置。',
  ],
  scope: [
    'Android 端商品目录、搜索、商品、购物车、地址、账号与订单流程',
    '运营管理',
    'Go / Gin / GORM API、MySQL、Redis 与 WebSocket 支持',
    '微信支付下单、支付通知、退款、短信与物流查询的实现边界',
    'Docker Compose 与 Nginx 容器化运行配置',
  ],
  facts: [
    { label: '类型', value: '独立移动电商全栈项目 / 历史归档' },
    { label: '客户端', value: 'Flutter Android · GetX · Dio' },
    { label: '运营后台', value: 'React 18 · Ant Design 5' },
    { label: '服务', value: 'Go / Gin / GORM · MySQL · Redis' },
  ],
  chapters: [
    {
      id: 'delivery-shape',
      title: '项目形态与公开范围',
      paragraphs: [
        '该独立项目由 Android 购物端、Web 运营后台与 Go 服务组成。这里记录经源码和提交历史可核对的工程范围，而不是对历史站点或线上状态的展示。',
        '公开页面不连接任何服务，不展示品牌、商品、用户、订单、接口、配置、证书、截图或部署信息。',
      ],
      phase: '独立项目归档',
    },
    {
      id: 'customer-purchase-flow',
      title: 'Android 购物流程',
      paragraphs: [
        'Flutter Android 客户端使用 GetX 与 Dio 组织路由、状态和请求，覆盖商品目录、搜索、商品、购物车、地址、账号和订单等流程。',
        '该说明仅描述可从源码确认的功能覆盖，不推断历史商品内容、用户规模、安装渠道或当前服务可用性。',
      ],
      phase: 'Flutter Android',
    },
    {
      id: 'operations-console',
      title: '运营后台',
      paragraphs: [
        'React 18 与 Ant Design 5 后台覆盖商品、分类、用户、订单、退款和客服相关管理界面，编辑与运营操作围绕相应服务接口组织。',
        '公开版不复制页面、运营数据、账号权限模型或具体业务规则。',
      ],
      phase: 'React 运营端',
    },
    {
      id: 'transaction-after-sales',
      title: '支付与售后边界',
      paragraphs: [
        '保留实现包含微信支付下单、支付通知和退款流程，以及订单、退款与部分退款的服务端处理边界。',
        '这表示代码层面的集成覆盖，不构成对支付安全、交易结果、合规性或当前渠道状态的声明。',
      ],
      phase: '实现范围',
    },
    {
      id: 'fulfillment-support',
      title: '履约与客服',
      paragraphs: [
        '服务端覆盖订单状态、配送字段、物流查询缓存、短信能力，以及带身份校验、消息、图片和已读状态的 WebSocket 客服支持。',
        '公开页面不包含真实物流、联系人、消息、图片、订单或任何业务记录。',
      ],
      phase: '服务能力',
    },
    {
      id: 'service-delivery',
      title: '服务与容器化运行',
      paragraphs: [
        'Go 1.22 服务采用 Gin 与 GORM，并使用 MySQL、Redis、Docker Compose 和 Nginx 组织运行环境。',
        '公开描述仅保留技术组成；主机、域名、端口、环境变量、证书、密钥和部署配置均不公开。',
      ],
      phase: '容器化运行',
    },
    {
      id: 'public-disclosure-boundary',
      title: '公开披露边界',
      paragraphs: [
        '本案例是独立项目的去标识化工程归档，不是在线商城入口，也不证明当前持续运营、营收、用户量、性能或可用性。',
        '为保护项目和服务安全，作品集不发布源代码、数据、截图、API、配置、凭据、证书或服务链接。',
      ],
      phase: '公开脱敏',
    },
  ],
  provenanceNote:
    '本条目依据保留源码与仓库提交历史整理，仅公开可核对的技术范围。服务主机、部署访问、凭据、证书、真实商品、用户、订单、截图和配置均已排除；页面没有线上 Demo 或外部服务链接。',
} satisfies PortfolioProject

const bezierProject = {
  slug: 'bezier-easing-picker',
  order: 14,
  tier: 'archive',
  provenance: 'experiment',
  title: 'Bezier Easing Picker',
  shortTitle: 'Bezier',
  eyebrow: 'REUSABLE COMPONENT',
  summary: '可视化编辑和预览 cubic-bezier 缓动曲线',
  thesis:
    '一个可视化 cubic-bezier 编辑器。选择预设或拖动控制点后，曲线、参数和运动预览会同步变化，结果通过 onChange 返回。',
  period: '2017 · 从 Poke 抽离',
  role: '组件拆分 · SVG 编辑交互 · 构建与接口设计',
  status: '公开可复用组件实验',
  technologies: ['React 15', 'SVG', 'SCSS', 'Webpack'],
  impact: [
    '将 Poke 的缓动配置从编辑器上下文拆分为独立 React 组件。',
    '用 SVG 同步表达曲线、控制线、拖拽点和运动预览，并以最小接口返回 CSS 参数。',
  ],
  scope: ['常用缓动预设', '控制点拖拽与坐标换算', '实时运动预览', '尺寸、默认曲线与 onChange 接口'],
  facts: [
    { label: '类型', value: 'React 组件 / 动效工具' },
    { label: '技术', value: 'React 15 · SVG · SCSS · Webpack' },
    { label: '接口', value: '尺寸 · 默认曲线 · onChange' },
    { label: '时期', value: '2017 · 从 Poke 抽离' },
  ],
  demo: {
    experienceId: 'bezier-easing-picker',
    source: demoExperiences['bezier-easing-picker'].source,
    title: 'Bezier Easing Picker',
    description:
      '选择常用预设或拖动控制点，右侧运动轨迹与 CSS 参数会同步更新。公开版本同时修正了旧 Demo 的状态和边界问题。',
    provenanceLabel: 'REUSABLE COMPONENT RECONSTRUCTION',
    statusLabel: 'LIVE',
    toolbar: 'Bezier Picker · Live timing preview',
    badge: 'SVG · CUBIC-BEZIER',
    height: 620,
    posterVariant: 'easing-picker',
    ctaLabel: '加载组件 Demo',
    desktopPreferred: true,
  },
  chapters: [
    {
      id: 'origin',
      title: '来源',
      paragraphs: [
        '组件最初用于 Poke 的交互面板，后来从编辑器上下文中拆出，成为可独立使用的 React 组件。',
      ],
    },
    {
      id: 'editing-preview',
      title: '编辑与预览',
      paragraphs: [
        'SVG 同时绘制曲线、控制线和拖拽点；坐标实时转换为四个参数，并立即应用到右侧运动预览。',
      ],
    },
    {
      id: 'component-api',
      title: '组件接口',
      paragraphs: [
        '对外只提供尺寸、默认曲线和 onChange。生产产物将 React 设为外部依赖，业务侧可以直接生成 CSS 缓动参数或保存结果。',
      ],
    },
  ],
  provenanceNote: '从 Poke 抽离的个人组件作品；公开 Demo 对旧示例的状态和边界问题做了修正。',
} satisfies PortfolioProject

const irregularShapeLayoutProject = {
  slug: 'irregular-shape-layout',
  order: 16,
  tier: 'archive',
  provenance: 'public-reconstruction',
  provenanceDisplay: {
    label: '原创 CLEAN-ROOM 公开重建',
    description: '原创 clean-room 公开重建；使用本地确定性合成几何',
  },
  title: '不规则形状布局：采样几何与有界搜索实验',
  shortTitle: '不规则形状布局',
  eyebrow: 'PUBLIC RECONSTRUCTION / GEOMETRY STUDY',
  summary: '以合成 SVG 轮廓检查边界采样、径向距离搜索与邻角细化的公开重建实验',
  thesis:
    '2025.04—2025.05 的未完成内部原型中，我实现了计算部分的探索：沿预期由上游提供的裁切 SVG 边界采样，估计最小距离，以有界距离搜索进行径向放置，再以有界的粗到细搜索细化相邻角度。当前页面是全新、独立的公开重建实验，只使用确定性合成形状，不复现历史实现或声称产品算法、上游裁切或模型能力。',
  period: '2025.04—2025.05 · 未完成内部原型 / 公开重建',
  role: '计算部分探索 · SVG 边界采样 · 径向放置与角度细化',
  status: '未完成内部原型 · 当前为独立 clean-room 公开实验',
  technologies: ['SVG Path API', '采样边界几何', '有界二分搜索', '粗到细角度搜索'],
  impact: [
    '将不规则轮廓的距离估计、径向放置和邻角调整拆成可观察的计算步骤，并以合成形状独立呈现。',
    '通过线段相交与点在多边形内守卫，将检测到的重叠判为无效，而非误报为较大的正间隙。',
    '提供采样点、最近点对、径向搜索界限和裁切信息，便于检查近似方法的结果与限制。',
  ],
  scope: [
    '确定性程序生成的不规则 SVG 轮廓',
    '基于 SVG 长度 API 的边界采样与显式世界坐标变换',
    '带上限的径向二分搜索与邻角粗到细搜索',
    '采样最小距离、相交与包含守卫',
    '收敛状态、迭代次数、耗时和调试叠层',
  ],
  facts: [
    { label: '类型', value: '内部原型计算探索 / 公开 clean-room 重建' },
    { label: '时期', value: '2025.04—2025.05 · 未完成内部原型' },
    { label: '本人职责', value: '计算部分：采样、径向放置、角度细化探索' },
    { label: '公开输入', value: '确定性合成 SVG 形状 · 无外部请求' },
  ],
  demo: {
    experienceId: 'irregular-shape-arrangement',
    source: demoExperiences['irregular-shape-arrangement'].source,
    title: 'Irregular Shape Layout · Clean-room Lab',
    description:
      '选择中心形状预设，设置总数、外轮廓种子、目标间隙和采样密度；可选显示并按速度回放有界搜索。原项目用途是根据餐盘与异形食品包装的轮廓进行自动摆放，为食品宣传图建立整洁、美观的构图基础；当前 Lab 仅以合成轮廓展示这项采样几何研究。回放与即时计算得到同一确定性近似结果，不是精确装箱或全局最优。',
    provenanceLabel: 'CLEAN-ROOM PUBLIC RECONSTRUCTION · SYNTHETIC GEOMETRY',
    statusLabel: 'SAMPLED SVG · BOUNDED SEARCH',
    toolbar: 'Irregular Shape Layout · Sampled Geometry Lab',
    badge: 'SVG · APPROXIMATE · LOCAL ONLY',
    height: 700,
    posterVariant: 'irregular-geometry',
    ctaLabel: '加载几何实验',
    desktopPreferred: true,
  },
  chapters: [
    {
      id: 'problem-input-contract',
      title: '问题与输入契约',
      paragraphs: [
        '原始概念假定上游模型提供裁切后的 SVG 路径；计算层再根据这些轮廓安排位置。我只实现和探索了后者，不将上游裁切、模型层或完整 UX / 产品算法归为本人工作。',
        '公开 Lab 从中心形状预设出发，以外轮廓种子确定地生成合成异形轮廓，仅用于展示上述采样几何与摆放研究，不将抽象轮廓冒充真实餐盘或包装，也不生成最终宣传图。它不包含上游裁切、模型实现或产品算法，也不复现历史素材、界面或代码。',
      ],
      phase: '计算探索 / 公开重建',
    },
    {
      id: 'sampled-geometry',
      title: '采样边界几何',
      paragraphs: [
        '每个路径通过 SVG 的 getTotalLength 与 getPointAtLength 均匀采样；再以显式旋转和平移把局部点转换到世界坐标。最小间隙是采样点之间的近似距离，而非连续曲线的精确距离。',
        '为避免“轮廓已经相交却仍显示正距离”，公开实验额外检查采样多边形的线段相交和点在多边形内包含；任何命中的重叠都被标记为无效。',
      ],
      phase: '近似几何',
    },
    {
      id: 'radial-search',
      title: '径向有界搜索',
      paragraphs: [
        '形状按中心辐射方向逐个放置。每次先在明确上限内验证候选距离，再以有限轮次二分收缩到满足目标间隙的最小近似半径。',
        '当有限上限内没有有效距离时，实验保留该状态并在结果中如实报告，而不是假设已经找到可行解。',
      ],
      phase: '有界二分',
    },
    {
      id: 'angle-refinement',
      title: '邻角粗到细细化',
      paragraphs: [
        '径向初排之后，后续形状围绕各自半径在有限邻域内尝试角度。搜索优先有效候选；若预算内没有有效位置，则依次减少重叠与目标间隙缺口并如实报告未收敛。有效候选再比较相邻编号形状的采样间隙总量；搜索从较粗步长开始逐轮缩小，并使用固定的同分决策，保证相同输入得到相同结果。',
        '它只是在受限预算内改善局部相邻关系，并不求解全局最优或精确的不规则形状装箱。',
      ],
      phase: '局部改进',
    },
    {
      id: 'diagnostics-public-reconstruction',
      title: '诊断与公开重建',
      paragraphs: [
        '实验报告实测最小间隙、迭代次数、耗时与诚实的收敛状态。调试叠层显示边界样本、最近点对、径向射线与界限，以及 SVG 视口和裁切提示。',
        '可选开启计算 / 搜索动画，按所选速度显示当前公开算法的搜索检查点；动画是全新的 clean-room 可视化，和即时模式共享同一确定性计算与结果，不复现或还原历史内部代码、界面、节奏或速度。',
      ],
      phase: '公开实验',
    },
    {
      id: 'unfinished-boundary',
      title: '未完成边界',
      paragraphs: [
        '历史跟踪的工作在未完成状态停止；这里不推测原因，也不把探索性计算描述为已交付的完整系统。',
        '可见布局即使没有完全收敛仍可用于检查近似几何，但应结合采样密度、重叠守卫、裁切提示和迭代上限理解其结果。',
      ],
      phase: '边界说明',
    },
  ],
  provenanceNote:
    '此条目区分 2025.04—2025.05 未完成内部原型中的计算探索与当前原创 clean-room 公开重建。公开 Lab 仅使用确定性合成 SVG 形状，保留采样、径向搜索和角度细化的研究性说明；不包含或暗示历史界面、代码、品牌、素材、上游裁切或模型能力，也不宣称完整 UX / 产品算法或全局最优结果。',
} satisfies PortfolioProject

export const archiveProjects: PortfolioProject[] = [
  elpisProject,
  cocoWalletProject,
  pokeProject,
  dataViewProject,
  turntableProject,
  bezierProject,
  merchantCommerceProject,
  irregularShapeLayoutProject,
]
