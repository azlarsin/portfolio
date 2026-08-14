import type { PortfolioProject } from '../types'

export const baiduMapWorkbenchProject = {
  slug: 'baidu-map-workbench',
  order: 2,
  tier: 'featured',
  provenance: 'production',
  title: '百度地图数据作业：复杂地图渲染与数据服务',
  shortTitle: '百度地图数据作业',
  eyebrow: 'MAP DATA WORKBENCH · PRODUCTION SYSTEM',
  thesis:
    '在百度带领 5 名前端工程师期间，我参与并负责地图数据作业方向的核心交付：前端侧在既有内部 SVG 地图体系上组织道路、轨迹、GPS 与业务标记等多类空间要素，处理图层装载、空间检索和复杂编辑交互；服务端侧主导众源空间统计服务，并持续扩展 Python / PostgreSQL 作业与批量质检流程。',
  period: '2017.11—2019.11 · 百度生产项目',
  role: '地图渲染与作业交互 · 数据服务设计 · 前端带队',
  status: '内部生产系统 · 公开内容已脱敏',
  technologies: [
    'Vue 2',
    'JavaScript',
    'SVG',
    'RBush',
    'Python / Tornado',
    'PostgreSQL / JSONB',
    'PHP / Yii2',
    'MySQL',
    'Elasticsearch',
  ],
  impact: [
    '参与复杂地图作业前端的核心开发，在内部 SVG 地图体系中以 Map、Layer、Feature、Element 分层组织道路、轨迹、GPS 与业务标记。',
    '围绕视口变化处理瓦片差量装载、空间索引与几何筛选，并支持空间要素的选择、编辑、关联、高亮、测距和动态标签；个人提交还覆盖道路属性在后端规格与前端视觉模型间的双向转换。',
    '主导 PHP / Yii2 空间统计服务与 Python 批处理；同时在 Python / PostgreSQL 作业端扩展异步质检、回调防重、返工 / 验收状态流与 JSONB 例外分析。',
    '在统计链路中使用 Elasticsearch count / search / scroll 检索并关联 MySQL 业务记录，形成采集、匹配、指令、回收与质检的阶段耗时指标。',
    '带领 5 名前端工程师完成地图作业、统计运营页面与相关工具交付，承担任务拆分、技术方案、关键问题处理和代码评审。',
  ],
  scope: [
    'SVG 地图分层与多图层装载',
    '瓦片差量加载、视口裁剪、空间索引与几何计算',
    '道路、轨迹、GPS、车道与交通设施等空间要素',
    '选择、编辑、关联、高亮、测距与动态标签',
    'Python / Tornado、PostgreSQL / JSONB 作业流程',
    'PHP / Yii2 指标 API、Python 批处理与 Elasticsearch / MySQL 查询',
    '5 人前端团队的任务拆分、方案与代码评审',
  ],
  facts: [
    { label: '系统', value: '百度地图内部数据采集与作业平台' },
    { label: '两条主线', value: '复杂 SVG 地图渲染 · 后端与团队交付' },
    { label: '职责', value: '核心开发 · 数据服务设计 · 5 人前端团队负责人' },
    { label: '时期', value: '2017.11—2019.11 · 百度' },
  ],
  chapters: [
    {
      id: 'context',
      title: '案例范围：内部地图数据作业，而非消费端地图',
      paragraphs: [
        '这段经历面向百度地图内部的数据采集、标注、质检与空间统计，不是消费端地图页面。系统需要把道路、轨迹、GPS、照片和多类业务标记放进同一作业上下文，同时把任务状态和统计结果连接到后端流程。',
        '我的工作分为两条清晰主线：参与复杂地图作业前端的核心开发并带领前端团队交付；主导空间统计服务，并在既有 Python / PostgreSQL 作业平台中持续扩展批量质检与数据流程。',
      ],
      phase: '百度生产项目',
    },
    {
      id: 'rendering-architecture',
      title: '复杂地图渲染：分层组织空间要素',
      summary: '在既有内部 SVG 地图体系上，以 Map、Layer、Feature、Element 分离地图状态、图层、业务语义与图形元素。',
      paragraphs: [
        '作业前端不是在普通底图上叠加几个 Marker。保留源码显示，地图能力按 Map、Layer、Feature、Element 分层：Map 处理视口与坐标，Layer 负责装载和可见性，Feature 表达道路、轨迹、车道与交通设施等业务语义，Element 负责折线、多边形、文字和图标等 SVG 图形。',
        '我在这一既有体系中参与核心作业能力开发，把参考路网、公共轨迹、GPS、网格、标注和质检信息组织为可组合图层；这里强调的是复杂地图应用的工程能力，不把内部地图底层整体描述为个人从零实现。',
      ],
      bullets: [
        '渲染结构：Map → Layer → Feature → Element',
        '空间要素：道路 · 轨迹 · GPS · 车道 · 限速 · 交通设施 · 质检标记',
        '图形表达：Polyline · Polygon · Text · Icon 等 SVG 元素',
      ],
      phase: '前端核心开发 / 团队协作',
    },
    {
      id: 'viewport-and-space',
      title: '视口装载、空间索引与几何计算',
      paragraphs: [
        '地图平移和缩放会持续改变可见数据。图层按瓦片计算差量，只请求新进入视口的范围并取消已失效请求；网格和轨迹根据缩放级别调整呈现，避免每次视口变化都重建全部内容。',
        '空间查询使用 R-tree 索引先按包围盒缩小候选范围，再通过点线关系、相交、距离和矩形范围等几何计算过滤。该链路支撑命中测试、附近道路查找、轨迹关联、测距和高亮等交互。',
      ],
      bullets: [
        '瓦片差量：新增范围请求 · 离开范围清理 · 过期请求取消',
        '空间检索：RBush 包围盒索引 · 几何二次过滤',
        '缩放策略：按 zoom 调整图层、标记密度与视觉参数',
      ],
      phase: '复杂渲染与性能边界',
    },
    {
      id: 'workbench-interactions',
      title: '作业交互：让地图、影像与任务状态协同',
      paragraphs: [
        '作业人员需要在平面图、照片、全景或俯视影像之间核对信息，并对道路名称、车道、限速、转向、交通设施等对象进行选择、编辑和关联。地图层还需同步显示参考数据、当前标注、差异结果与质检问题。',
        '可直接核对到我个人提交的实现还包括道路属性规格适配：在后端 TTFA 规则与前端视觉模型间双向转换时间条件、车辆类型位图和车道组成，并兼容新旧数据规格。',
        '前端由图层可见性、选中对象、历史记录、快捷工具和任务状态共同驱动。高亮、测距、动态标签与参考轨迹不是独立效果，而是帮助作业人员在复杂空间上下文中完成判断和修改。',
      ],
      phase: '地图数据作业工作台',
    },
    {
      id: 'backend-workflow',
      title: '后端设计：作业状态与异步批量质检',
      paragraphs: [
        '在 Python / Tornado 与 PostgreSQL 作业平台中，我扩展任务提交、批量质检、返工和验收流程。外部质检任务通过创建请求与成功 / 失败回调衔接，业务侧校验回调数据、防止重复处理，并对错误项去重后写回任务状态。',
        '例外记录使用 PostgreSQL JSONB 完成筛选、分页、统计与原因更新；状态变更结合行锁与批检日志，避免异步回调和人工操作造成任务状态冲突。我的职责聚焦业务流程与查询，不把既有数据库连接层归为个人从零建设。',
      ],
      bullets: [
        '状态流：作业提交 · 批量质检 · 返工 · 修复 · 验收',
        '异步安全：回调校验 · 重复回调防护 · 错误项去重',
        '数据处理：PostgreSQL 行锁 · JSONB 例外记录与分析',
      ],
      phase: 'Python / PostgreSQL 生产流程',
    },
    {
      id: 'statistics-pipeline',
      title: '统计服务：连接业务记录与检索日志',
      paragraphs: [
        '我主导众源空间数据统计服务建设。PHP / Yii2 API 覆盖批次、任务、设备、轨迹、路段、时间和里程等维度；Python 脚本按批次、日、小时与 15 分钟等周期编排统计任务，并完成地理数据抽取、分类和落盘。',
        '链路耗时统计通过 Elasticsearch count / search / scroll 查询状态日志，再与 MySQL 业务记录关联，计算采集、匹配、指令、回收与质检阶段的耗时。这里的 Elasticsearch 能力是查询接入和数据关联，不代表集群搭建、运维或底层优化。',
      ],
      phase: 'PHP / Yii2 · Python · Elasticsearch / MySQL',
    },
    {
      id: 'team-delivery',
      title: '带队交付：5 人前端团队与跨栈协作',
      paragraphs: [
        '百度期间我带领 5 名前端工程师，项目范围覆盖地图数据作业、统计运营页面和百家号编辑器。我的工作既包含任务拆分、技术方案和代码评审，也包含关键地图交互及疑难问题的直接实现。',
        '后端部分由我直接承担统计服务的主导开发，并在既有作业平台上持续提交 Python / PostgreSQL 业务能力。案例将个人代码、团队协作和已有基础设施分开描述，不以负责人身份代替具体贡献证据。',
      ],
      phase: '前端负责人 · 跨栈交付',
    },
    {
      id: 'boundaries',
      title: '证据与技术边界',
      paragraphs: [
        '公开案例依据本人履历、保留工程源码及可核对的提交历史整理，不展示内部页面、真实地图数据或未授权截图。地图渲染源码能够说明系统分层与交互复杂度，但缺少完整的原始提交历史，因此不宣称我独立从零实现整套地图底层。',
        '后端提交可核对到 PHP / Yii2、Python / Tornado、PostgreSQL / JSONB、MySQL 与 Elasticsearch 查询接入。Kafka 仅属于项目使用经验，不列为本案例的设计或建设成果；也不把 Elasticsearch 的使用表述为集群建设。',
      ],
      phase: '公开说明',
    },
  ],
  provenanceNote:
    '本案例依据本人百度工作经历、保留工程源码与可核对的提交历史整理。地图渲染部分仅陈述本人参与和负责的作业前端范围，不把缺少完整历史归属的内部地图底层整体视为个人独立成果；后端与团队职责分别按个人提交和履历口径表述。',
} satisfies PortfolioProject
