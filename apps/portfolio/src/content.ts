import resumePdf from '../../../陈成的个人简历.pdf?url'

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
      intro: string
      facts: Array<{ label: string; value: string }>
      sections: Array<{ title: string; body: string }>
    }

const layeredRouteLabUrl =
  import.meta.env.VITE_LAYERED_ROUTE_LAB_URL || 'http://localhost:3000'

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'resume',
    section: '简历',
    title: '个人简历',
    eyebrow: 'CURRICULUM VITAE',
    description: '工作经历、技能与个人背景',
    kind: 'pdf',
    source: resumePdf,
    fileName: '陈成的个人简历.pdf',
  },
  {
    id: 'layered-route-lab',
    section: '作品',
    title: 'Layered Route Lab',
    eyebrow: 'INTERACTIVE WORK',
    description: '面向复杂界面路由与呈现层的交互实验',
    kind: 'iframe',
    source: layeredRouteLabUrl,
    status: '本地开发服务 · 端口 3000',
  },
  {
    id: 'layered-route-lab-notes',
    section: '项目描述',
    title: 'Layered Route Lab',
    eyebrow: 'PROJECT NOTES',
    description: '设计目标、技术方案与实现重点',
    kind: 'article',
    intro:
      '一个用于探索分层路由、页面状态重建与多呈现器协同的实验性项目。它把复杂导航关系转化为可以观察、操作和验证的界面。',
    facts: [
      { label: '类型', value: '交互实验 / Web 应用' },
      { label: '技术', value: 'React · TypeScript · vinext' },
      { label: '职责', value: '产品设计 · 前端实现' },
      { label: '状态', value: '持续迭代' },
    ],
    sections: [
      {
        title: '问题',
        body: '传统单层路由很难直接表达模态窗口、分支导航和可恢复的界面层级。项目尝试为这些关系提供一个清晰、可调试的模型。',
      },
      {
        title: '方法',
        body: '将路由、上下文与呈现器拆分，通过可视化的页面层级观察状态如何创建、切换与恢复，并用实际交互验证模型。',
      },
      {
        title: '结果',
        body: '形成了可运行的路由实验环境，支持分支路径重建、多呈现器切换与带空间感的过渡效果。',
      },
    ],
  },
]

export const sections = ['简历', '作品', '项目描述'] as const
