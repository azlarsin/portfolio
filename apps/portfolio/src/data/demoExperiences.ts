import bezierPickerLab from '../assets/bezier-picker-lab.html?url'
import dataviewObservatoryDemo from '../assets/dataview-observatory-demo.html?url'
import irregularShapeLayoutLab from '../assets/irregular-shape-layout-lab.html?url'
import operationsAgentGraph from '../assets/operations-agent-actiongraph.html?url'
import pokeEditorDemo from '../assets/poke-editor-demo.html?url'
import turntableMotionLab from '../assets/turntable-motion-lab.html?url'
import { createLayeredRouteLabUrl } from '../app/layeredRouteLabUrl'
import type { DemoExperienceId, DemoPosterVariant, ProjectProvenance } from './types'

export interface DemoExperienceGuide {
  duration: number
  summary: string
  boundary: string
  steps: readonly string[]
}

export interface DemoExperience {
  id: DemoExperienceId
  name: {
    zh: string
    en: string
  }
  source: string
  sandbox: string
  allow: string
  casePath: string
  provenance: ProjectProvenance
  status: string
  posterVariant: DemoPosterVariant
  guide: {
    zh: DemoExperienceGuide
    en: DemoExperienceGuide
  }
}

const layeredRouteLabUrl = (
  import.meta.env.VITE_LAYERED_ROUTE_LAB_URL || 'http://localhost:3000'
).replace(/\/$/, '')

const layeredRouteAgentSource = createLayeredRouteLabUrl(layeredRouteLabUrl, '/products', {
  agent_demo: '1',
  embed: '1',
})

const localSandbox = 'allow-scripts'
const pokePreviewSandbox = 'allow-scripts allow-same-origin'
const routeLabSandbox =
  'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox'
const standardAllow = 'clipboard-write; fullscreen'

export const demoExperiences = {
  'layered-route-agent': {
    id: 'layered-route-agent',
    name: {
      zh: 'Layered Route × Agent',
      en: 'Layered Route × Agent',
    },
    source: layeredRouteAgentSource,
    sandbox: routeLabSandbox,
    allow: standardAllow,
    casePath: '/work/layered-agent',
    provenance: 'public-reconstruction',
    status: 'ROUTE AST · LOCAL PLANNER · TYPED BRIDGE',
    posterVariant: 'agent-console',
    guide: {
      zh: {
        duration: 4,
        summary: '从自然语言任务到受约束规划、逐步执行和结果验证的公开研究演示。',
        boundary: '全部数据为合成数据；播放器不读取 Lab DOM，也不与其交换消息。',
        steps: [
          '从预设任务开始，观察行为检索与计划。',
          '逐步执行动作，留意 URL、页面层级与结果检查。',
          '使用 Lab 内置控件探索深层路由和检查模式。',
        ],
      },
      en: {
        duration: 4,
        summary: 'A public research demo from natural-language task to constrained planning, execution, and verification.',
        boundary: 'All data is synthetic. The player neither reads the Lab DOM nor exchanges messages with it.',
        steps: [
          'Start with a preset task and observe retrieval and planning.',
          'Run actions step by step; watch the URL, layer stack, and verification.',
          'Use the Lab controls to explore deep routes and inspection mode.',
        ],
      },
    },
  },
  'layered-agent-action-graph': {
    id: 'layered-agent-action-graph',
    name: {
      zh: '行为动作图',
      en: 'Behavior Action Graph',
    },
    source: operationsAgentGraph,
    sandbox: localSandbox,
    allow: standardAllow,
    casePath: '/work/layered-agent',
    provenance: 'public-reconstruction',
    status: 'GENERATED ACTION GRAPH · SYNTHETIC DATA',
    posterVariant: 'agent-console',
    guide: {
      zh: {
        duration: 2,
        summary: '行为图的交互查看器，用于检查页面状态、可执行动作及其来源和覆盖信息。',
        boundary: '图中数据来自公开 Lab 的合成研究资料，不代表任何生产系统。',
        steps: ['拖拽画布浏览状态关系。', '缩放并选择节点查看动作详情。', '切换来源与覆盖信息理解动作边界。'],
      },
      en: {
        duration: 2,
        summary: 'An interactive behavior-graph viewer for inspecting page states, executable actions, provenance, and coverage.',
        boundary: 'Its synthetic research data comes from the public Lab and does not represent a production system.',
        steps: ['Pan across the state graph.', 'Zoom and select nodes to inspect action details.', 'Switch provenance and coverage views to understand boundaries.'],
      },
    },
  },
  'poke-prototype-editor': {
    id: 'poke-prototype-editor',
    name: {
      zh: 'Poke 原型编辑器',
      en: 'Poke Prototype Editor',
    },
    source: pokeEditorDemo,
    sandbox: pokePreviewSandbox,
    allow: standardAllow,
    casePath: '/archive/poke-prototype-editor',
    provenance: 'personal-product',
    status: 'QR PREVIEW · URL-EMBEDDED SYNTHETIC DATA',
    posterVariant: 'prototype-editor',
    guide: {
      zh: {
        duration: 3,
        summary: '原型编辑工作台重建，包含画布、图层、系统栏、交互设置与手机扫码预览。',
        boundary: '使用虚构项目，不连接历史 Poke 服务或用户内容。',
        steps: ['在画布中选择元素。', '通过右侧面板调整图层、Status Bar 或 Tab Bar。', '配置 interaction 后点击“扫码预览”，在二维码或实时运行时中检查动效。'],
      },
      en: {
        duration: 3,
        summary: 'A reconstructed prototyping workspace with canvas, layers, system bars, interactions, and QR mobile preview.',
        boundary: 'It uses a fictitious project and never connects to historical Poke services or user content.',
        steps: ['Select an element on the canvas.', 'Adjust a layer, Status Bar, or Tab Bar in the inspector.', 'Configure an interaction, then open QR Preview to test its motion in the live runtime.'],
      },
    },
  },
  'dataview-observatory': {
    id: 'dataview-observatory',
    name: {
      zh: 'DataView 观测台',
      en: 'DataView Observatory',
    },
    source: dataviewObservatoryDemo,
    sandbox: localSandbox,
    allow: standardAllow,
    casePath: '/archive/dataview-observatory',
    provenance: 'production',
    status: 'OFFLINE VISUALIZATION · SYNTHETIC DATA',
    posterVariant: 'data-observatory',
    guide: {
      zh: {
        duration: 3,
        summary: '面向超宽屏场景的离线监测大屏重建，包含场景切换、筛选与联动。',
        boundary: '仅使用合成离线数据，不请求原项目接口或呈现客户指标。',
        steps: ['移动端可左右滑动查看完整超宽看板。', '在不同监测场景间切换。', '修改时间或节点筛选条件。', '打开节点详情，观察相关视图的联动。'],
      },
      en: {
        duration: 3,
        summary: 'An offline reconstruction of an ultra-wide monitoring wall with scenes, filters, and linked views.',
        boundary: 'It uses synthetic offline data only—no historical APIs or client metrics are requested or shown.',
        steps: ['On mobile, swipe horizontally to inspect the full ultra-wide board.', 'Switch among monitoring scenes.', 'Change the time or node filters.', 'Open node detail and observe linked views update.'],
      },
    },
  },
  'turntable-motion-lab': {
    id: 'turntable-motion-lab',
    name: {
      zh: 'Turntable 动效实验',
      en: 'Turntable Motion Lab',
    },
    source: turntableMotionLab,
    sandbox: localSandbox,
    allow: standardAllow,
    casePath: '/archive/turntable-motion-lab',
    provenance: 'experiment',
    status: 'SVG · SPRING · DATA-DRIVEN',
    posterVariant: 'motion-lab',
    guide: {
      zh: {
        duration: 2,
        summary: '以 SVG 几何和弹簧模型表现数据重组时连续扇区运动的实验。',
        boundary: '这是独立动效实验，不是抽奖或交易产品。',
        steps: ['改变数据组合观察扇区重排。', '使用均分或随机占满，让当前全部扇区重新分配 100% 空间。', '拖动速度滑杆后继续操作按钮，慢速检查连续运动。'],
      },
      en: {
        duration: 2,
        summary: 'An SVG-geometry and spring-motion study of continuous sector movement during data reordering.',
        boundary: 'This is an independent motion experiment, not a prize-draw or transaction product.',
        steps: ['Change the data composition to reorder sectors.', 'Use equal or random full-space allocation to redistribute 100% across the current slices.', 'Adjust the playback-speed slider, then keep using the controls to inspect the motion.'],
      },
    },
  },
  'bezier-easing-picker': {
    id: 'bezier-easing-picker',
    name: {
      zh: 'Bezier 缓动选择器',
      en: 'Bezier Easing Picker',
    },
    source: bezierPickerLab,
    sandbox: localSandbox,
    allow: standardAllow,
    casePath: '/archive/bezier-easing-picker',
    provenance: 'experiment',
    status: 'SVG · DRAG · CUBIC-BEZIER',
    posterVariant: 'easing-picker',
    guide: {
      zh: {
        duration: 2,
        summary: '将 cubic-bezier 参数变为曲线、控制点和运动预览的可操作组件。',
        boundary: '公开演示仅保留组件交互，不包含旧编辑器项目内容。',
        steps: ['从预设曲线开始。', '拖动控制点调整曲线。', '对照参数和运动预览查看变化。'],
      },
      en: {
        duration: 2,
        summary: 'A manipulable component that turns cubic-bezier parameters into a curve, control points, and motion preview.',
        boundary: 'The public demo retains component interaction only, not content from the older editor project.',
        steps: ['Start from an easing preset.', 'Drag control points to adjust the curve.', 'Compare the parameters with the live motion preview.'],
      },
    },
  },
  'irregular-shape-arrangement': {
    id: 'irregular-shape-arrangement',
    name: {
      zh: '不规则形状布局实验',
      en: 'Irregular Shape Layout Lab',
    },
    source: irregularShapeLayoutLab,
    sandbox: localSandbox,
    allow: standardAllow,
    casePath: '/archive/irregular-shape-layout',
    provenance: 'public-reconstruction',
    status: 'SAMPLED SVG · BOUNDED SEARCH · SYNTHETIC BLOBS',
    posterVariant: 'irregular-geometry',
    guide: {
      zh: {
        duration: 3,
        summary: '项目原始用途是根据餐盘与异形食品包装的轮廓进行自动摆放，为食品宣传图建立整洁、美观的构图基础；当前 Lab 仅以中心预设和种子化合成外轮廓展示这项采样几何研究。',
        boundary:
          '这是 clean-room 采样几何研究，仅用中心预设和种子化合成外轮廓；并非精确装箱或全局最优，不包含上游裁切、模型实现或产品算法。动画是对当前公开算法的全新 clean-room 可视化，不复现或还原历史内部代码、界面、节奏或速度。',
        steps: [
          '选择中心形状预设，再设置总数、外轮廓种子、目标间隙和边界采样密度。',
          '可选开启计算 / 搜索动画，并选择回放速度。',
          '点击“编排”，检查最终状态、计算耗时和调试信息；动画与即时模式共享同一确定性计算与结果。',
        ],
      },
      en: {
        duration: 3,
        summary: 'The original project intent was to arrange plates and irregular food packaging by contour as a tidy, visually appealing composition foundation for food promotional imagery; this Lab demonstrates only that sampled-geometry study with center presets and seeded synthetic outer contours.',
        boundary:
          'This is a clean-room sampled-geometry study using only selected center presets and seeded synthetic outer contours. It is not exact packing or a global optimum and excludes upstream cut-out, model implementation, and product algorithms. Its animation is a new clean-room visualization of the current public algorithm, not a reproduction or restoration of historical internal code, UI, timing, or speed.',
        steps: [
          'Choose a center shape preset, then set total count, outer seed, target gap, and boundary-sample density.',
          'Optionally enable calculation/search playback and choose its speed.',
          'Arrange and inspect the final status, compute time, and debug overlay; animated and immediate modes share the same deterministic calculation and result.',
        ],
      },
    },
  },
} as const satisfies Record<DemoExperienceId, DemoExperience>

export function getDemoExperience(id: string | null | undefined): DemoExperience | null {
  if (!id || !Object.prototype.hasOwnProperty.call(demoExperiences, id)) return null
  return demoExperiences[id as DemoExperienceId]
}

export function demoPlayerPath(experienceId: DemoExperienceId) {
  return `/demo?experience=${encodeURIComponent(experienceId)}`
}
