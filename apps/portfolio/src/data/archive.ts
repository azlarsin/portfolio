import bezierPickerLab from '../assets/bezier-picker-lab.html?url'
import dataviewObservatoryDemo from '../assets/dataview-observatory-demo.html?url'
import pokeEditorArchitecture from '../assets/poke-editor-architecture.html?url'
import pokeEditorDemo from '../assets/poke-editor-demo.html?url'
import turntableMotionLab from '../assets/turntable-motion-lab.html?url'
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
    source: pokeEditorDemo,
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
    source: dataviewObservatoryDemo,
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
  scope: ['圆弧几何与 SVG Path', '弹簧动画与相邻扇区衔接', '悬停聚焦、双击删除和慢速观察'],
  facts: [
    { label: '类型', value: '动效实验 / 数据可视化原型' },
    { label: '技术', value: 'React 16 · React Motion · SVG' },
    { label: '职责', value: '几何建模 · 动画实现 · 交互实验' },
    { label: '时期', value: '2018 · 个人技术作品' },
  ],
  demo: {
    source: turntableMotionLab,
    title: 'Turntable Motion Lab',
    description: '可重组数据、悬停聚焦、双击删除，并按住 S 降速观察动画。',
    provenanceLabel: 'INTERACTIVE MOTION EXPERIMENT',
    statusLabel: 'LIVE',
    toolbar: 'Turntable Motion Lab · Data-driven geometry',
    badge: 'SVG · SPRING · HOLD S',
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
    source: bezierPickerLab,
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

export const archiveProjects: PortfolioProject[] = [
  elpisProject,
  cocoWalletProject,
  pokeProject,
  dataViewProject,
  turntableProject,
  bezierProject,
]
