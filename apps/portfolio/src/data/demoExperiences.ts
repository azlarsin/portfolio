import bezierPickerLab from '../assets/bezier-picker-lab.html?url'
import dataviewObservatoryDemo from '../assets/dataview-observatory-demo.html?url'
import irregularShapeLayoutLab from '../assets/irregular-shape-layout-lab.html?url'
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
const pokePreviewSandbox = 'allow-scripts allow-same-origin allow-downloads'
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
        duration: 1,
        summary: "验证订单导航、分层返回与深链恢复。",
        boundary: "示例数据与本地规则匹配；可恢复的页面路径来自 Lab 的路由清单。",
        steps: ["选择“进入编辑页”，确认产品和订单后运行。", "点“查看页面”，用 Back 返回上一级。", "复制页面链接或刷新页面，验证路由层级恢复。"],
      },
      en: {
        duration: 1,
        summary: "Validate order navigation, back navigation, and deep-link restoration.",
        boundary: "Sample data and local rules. Restorable pages are defined by the Lab route manifest.",
        steps: ["Choose the edit task, check the product and order, and run it.", "Close the assistant, inspect the page, and navigate to its parent.", "Copy the page link or refresh to restore its route layers."],
      },
    },
  },
  'layered-agent-action-graph': {
    id: 'layered-agent-action-graph',
    name: {
      zh: '行为动作图',
      en: 'Behavior Action Graph',
    },
    source: createLayeredRouteLabUrl(layeredRouteLabUrl, '/products', { graph: '1', embed: '1' }),
    sandbox: routeLabSandbox,
    allow: standardAllow,
    casePath: '/work/layered-agent',
    provenance: 'public-reconstruction',
    status: 'GENERATED ACTION GRAPH · SYNTHETIC DATA',
    posterVariant: 'agent-console',
    guide: {
      zh: {
        duration: 1,
        summary: "查看订单页面的路由层级、父子关系与分支。",
        boundary: "节点直接来自当前 Lab 的 Behavior Manifest。",
        steps: ["选择一个节点，查看它的路径和参数。", "打开对应页面，观察左侧层级变化。"],
      },
      en: {
        duration: 1,
        summary: "Explore the parents and branches of an order page.",
        boundary: "Nodes come directly from the current Lab behavior manifest.",
        steps: ["Select a node to inspect its route and parameters.", "Open that page and watch its layer stack change."],
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
        duration: 1,
        summary: "编辑原型元素，配置交互并验证移动端预览。",
        boundary: "这是基于历史 Poke 源码与运行结果重建的示例。保存的草稿留在本机浏览器，导出的文件可以重新打开。",
        steps: ["选中蓝色按钮，在右侧修改颜色或文字。", "打开“扫码预览”，点按钮观察标题移动和页面切换。", "保存到本机后刷新，或导出项目，再用“打开文件”恢复。"],
      },
      en: {
        duration: 1,
        summary: "Edit prototype elements and validate interactions in the mobile preview.",
        boundary: "A reconstruction of the original Poke editor. Saved drafts stay in this browser; exported files can be reopened.",
        steps: ["Select the blue button and change its color or text.", "Open QR preview and tap the button to move the title and change pages.", "Save and refresh, or export the project and reopen its file."],
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
        duration: 2,
        summary: "通过网络筛选与节点选择，查看地图、分布与明细的联动。",
        boundary: "使用离线示例数据重建，数字不代表实际业务指标。",
        steps: ["切换到节点地图，筛选一个网络。", "打开节点详情，对照地图高亮与指标。", "点击刷新数据，或播放演示查看其他场景。"],
      },
      en: {
        duration: 2,
        summary: "Filter networks and select a node to see the map, distribution, and details update together.",
        boundary: "Rebuilt with offline sample data; the numbers are not business metrics.",
        steps: ["Open the node map and filter by network.", "Select a node and compare its details with the highlighted map.", "Refresh the data or play the tour to explore other scenes."],
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
        duration: 1,
        summary: "观察数据重组时的扇区过渡，以及连续操作下的动画衔接。",
        boundary: "个人 SVG 动效实验。",
        steps: ["点击“重组数据”，也可以在动画中再次点击。", "降低播放速度，观察扇区连接；双击一块可移除。", "点击重置，从初始状态重新试。"],
      },
      en: {
        duration: 1,
        summary: "Reorder the slices repeatedly and watch them continue from their current positions.",
        boundary: "A personal SVG motion experiment.",
        steps: ["Reorder the data, including while it is moving.", "Slow the motion down; double-click a slice to remove it.", "Reset to restore the initial state."],
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
        duration: 1,
        summary: "拖动控制点，比较同一段运动的不同节奏。",
        boundary: "从早期原型编辑器中拆出的缓动组件。",
        steps: ["选择一条预设曲线，观察右侧运动。", "拖动控制点，或用方向键微调；也可直接输入参数。", "复制 CSS，或重置后继续比较。"],
      },
      en: {
        duration: 1,
        summary: "Drag the control points and compare the pace of the same motion.",
        boundary: "An easing component extracted from an earlier prototype editor.",
        steps: ["Select a preset to inspect its motion.", "Drag or use arrow keys to adjust a control point, or enter its values.", "Copy the CSS or reset to compare again."],
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
        duration: 2,
        summary: "给一组不同轮廓留出间距，观察自动排布的结果。",
        boundary: "使用生成的轮廓重建。算法依据采样点近似计算间距，不保证全局最优。",
        steps: ["调整形状数量、中心形状和间距。", "点击编排，对比排布前后的位置。", "开启动画或调试图层，查看计算过程与采样结果。"],
      },
      en: {
        duration: 2,
        summary: "Arrange different outlines with room between them.",
        boundary: "Rebuilt with generated shapes. Sampled distances are approximate; the search does not guarantee a global optimum.",
        steps: ["Adjust the number of shapes, the center shape, and the gap.", "Arrange and compare the positions before and after.", "Enable playback or the debug overlay to inspect the calculation."],
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
