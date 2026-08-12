import type { PortfolioProject } from '../types'

export const elpisProject = {
  slug: 'elpis',
  order: 9,
  tier: 'archive',
  provenance: 'personal-product',
  title: 'Elpis：儿童作品记录与成长时间线',
  shortTitle: 'Elpis',
  eyebrow: 'PERSONAL PRODUCT',
  thesis:
    'Elpis 是我独立设计与开发的 iOS 儿童作品相册，用于记录儿童作品、相关故事与成长时间线。产品支持拍摄或导入、语音与文字记录、分类整理、AI 美化、原图对比、私有同步及内容导出。',
  period: '独立产品 · 持续迭代',
  role: '产品 · 设计 · iOS 开发 · AI 接入 · 发布',
  status: '个人 iOS 产品 · 持续迭代',
  technologies: ['iOS', 'iCloud', 'Widget', 'AI 能力接入', '海报与视频导出'],
  impact: [
    '将作品拍摄或导入、故事记录、分类整理与成长时间线组织为连续流程。',
    'AI 美化结果与原图分开保存，确保原始作品不被覆盖。',
    '支持本地或私有同步、iCloud 多设备同步与 Widget，用于长期保存和回看。',
    '本人负责产品定义、交互设计、客户端开发、AI 接入、App Store 上架及内容导出。',
  ],
  scope: [
    '拍照或从系统相册导入儿童作品',
    '按日期、孩子、收藏和书籍整理',
    '语音或文字故事记录',
    '原图与 AI 美化结果对比',
    '本地或私有同步与 iCloud 多设备同步',
    'Widget、海报和视频导出',
    'App Store 上架与持续内容验证',
  ],
  facts: [
    { label: '类型', value: '个人 iOS 产品 / 儿童作品相册' },
    { label: '职责', value: '产品定义 · 设计 · 开发 · 发布运营' },
    { label: '流程', value: '记录 · 讲述 · 整理 · 增强 · 同步 / 导出' },
    { label: '视觉', value: '产品功能流程示意 · 非真实 App 截图' },
  ],
  visuals: [
    {
      id: 'elpis-product-flow',
      kind: 'elpis-product-flow',
      title: '产品功能流程示意',
      description:
        '用抽象界面与流程节点解释 Capture → Tell the story → Organize → Enhance → Compare → Sync / Export。该视觉由作品集页面绘制，不是 App Store 截图。',
      provenanceLabel: 'PRODUCT FLOW ILLUSTRATION · NOT A SCREENSHOT',
    },
  ],
  chapters: [
    {
      id: 'context',
      title: '产品背景',
      paragraphs: [
        '儿童纸质作品往往分散在系统相册、聊天记录与实体收纳中。若仅保留照片而缺少日期、故事和创作背景，长期回看时难以还原作品产生时的上下文。',
        'Elpis 的定位不是通用相册，而是同时满足快速记录与长期回看，并将作品、故事和成长变化保存在同一时间线中。',
      ],
      phase: '个人产品',
    },
    {
      id: 'product-flow',
      title: '核心流程',
      summary: 'Capture → Tell the story → Organize → Enhance → Compare → Sync / Export',
      paragraphs: [
        '用户可拍摄或导入作品，补充语音或文字故事，再按日期、孩子、收藏和书籍进行整理。生成 AI 美化版本时，原图始终保留。',
        '作品可通过时间线长期浏览，也可通过 Widget、海报和视频在应用之外查看或分享。',
      ],
    },
    {
      id: 'capture',
      title: '记录作品',
      paragraphs: [
        '记录入口支持直接拍照或从系统相册导入，随后补充日期、孩子和归档信息。流程尽量保持轻量，避免整理成本反过来阻止持续记录。',
      ],
      phase: '已完成',
    },
    {
      id: 'storytelling',
      title: '语音与文字故事',
      paragraphs: [
        '作品可关联语音或文字故事，使儿童表达、创作背景和家长记录与作品一并保存。',
      ],
      phase: '已完成',
    },
    {
      id: 'organization',
      title: '时间线、收藏与书籍',
      paragraphs: [
        '作品按日期进入成长时间线，也可按孩子、收藏和书籍进一步整理，从而同时支持连续浏览与主题回看。',
      ],
      phase: '已完成',
    },
    {
      id: 'enhancement',
      title: 'AI 美化与原图对比',
      paragraphs: [
        'AI 美化为可选功能，生成结果与原图分开保存并支持直接对比。增强结果不会替换原图；公开案例亦不展示真实儿童内容或未经核实的模型指标。',
      ],
      phase: '已完成',
    },
    {
      id: 'sync-export',
      title: '私有同步与内容导出',
      paragraphs: [
        '作品支持本地保存、私有同步及 iCloud 多设备同步。Widget、海报和视频用于回看与导出；产品设计优先保障家庭内容隐私。',
      ],
      phase: '持续验证',
    },
    {
      id: 'delivery',
      title: '职责范围',
      paragraphs: [
        '本人负责产品定义、交互设计、客户端开发与 AI 接入，并参与服务端协作、App Store 上架和后续内容测试。',
        '本案例不使用未经核实的用户数、收入、评分、留存率、下载量或增长率。',
      ],
      phase: '产品与开发',
    },
    {
      id: 'boundaries',
      title: '公开内容说明',
      paragraphs: [
        '页面中的手机界面为功能流程示意，不属于 App Store 截图；公开内容不包含真实儿童素材或未经核实的运营数据。',
      ],
    },
  ],
  provenanceNote:
    '本项目为个人产品。页面仅陈述已确认的功能，不展示真实儿童内容；功能示意不作为实际 App 截图。',
} satisfies PortfolioProject
