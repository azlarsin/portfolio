import type { PortfolioProject } from './types'

export const cocoWalletProject = {
  slug: 'coco-wallet',
  order: 10,
  tier: 'archive',
  provenance: 'production',
  title: 'Coco Wallet：多链移动钱包与 DApp 容器',
  shortTitle: 'Coco Wallet',
  eyebrow: 'CROSS-PLATFORM WALLET DELIVERY',
  summary: '覆盖助记词账户、资产收发、交易授权与 DApp 容器的 React Native 团队项目',
  thesis:
    'Coco Wallet 是 2018 年完成的团队兼职项目，覆盖 ETH、BCH 与 WHC 相关资产流程，以及运行链上应用的 DApp 容器。我是移动端核心贡献者之一，主要负责 React Native 钱包关键业务体验、交易授权状态流、WebView 联调和部分 iOS / Android 原生能力。',
  period: '2018 · 团队兼职项目',
  role: '移动端核心贡献 · 业务流程 · DApp 联调 · 原生桥接',
  status: '历史团队交付 · 无在线 Demo · 代码仅作本地核验',
  technologies: ['React Native 0.55', 'Redux', 'WebView', 'BIP39', 'Ethereum', 'BCH'],
  impact: [
    '交付助记词钱包创建与导入、ETH / BCH 资产页、转账收款、扫码和交易记录等核心流程。',
    '将转账、消息签名和 DApp 交易接入统一授权状态流，并支持 PIN 或指纹确认体验。',
    '参与 WebView Provider 注入和 Native / Web 消息桥接，处理双端导航、回传和加载差异。',
    '扩展相册二维码识别、DApp 截图与社交分享等原生能力，并参与 Ghost 链上应用前端。',
  ],
  scope: [
    '助记词账户创建、导入与确认流程',
    'ETH / BCH 资产、转账、收款和二维码',
    '交易授权弹层、PIN 与指纹确认体验',
    'DApp WebView、Provider 注入与消息桥接',
    'WHC 燃烧、Token 与众筹相关界面',
    'Ghost 市场、资产、繁育与交易前端',
  ],
  facts: [
    { label: '类型', value: 'iOS / Android 钱包与 DApp 容器' },
    { label: '技术', value: 'React Native · Redux · WebView' },
    { label: '职责', value: '移动端核心贡献者之一' },
    { label: '时期', value: '2018 · 团队兼职项目' },
  ],
  chapters: [
    {
      id: 'project-shape',
      title: '钱包、DApp 与链上应用组成的工程组',
      paragraphs: [
        '项目并非单一资产列表，而是由 React Native 钱包客户端、DApp Provider 与消息桥接、Ghost Web 前端，以及团队维护的合约和同步服务共同组成。',
        '我的提交主要集中在钱包客户端和 Ghost Web 前端；合约与链上数据同步服务用于理解端到端流程，但不归入我的个人交付范围。',
      ],
      phase: '团队项目边界',
    },
    {
      id: 'wallet-flows',
      title: '钱包创建与资产操作流程',
      paragraphs: [
        '我负责助记词钱包创建、导入与二次确认，以及 ETH / BCH 资产页、转账、收款二维码、扫码和交易状态等关键体验。不同币种保留各自的数据与交易差异，页面层复用输入、确认、进度、弹层和分页组件。',
        '同时参与 WHC 燃烧、Token 创建与众筹等业务界面，把较长的链上操作拆成可返回、可确认并能表达进行中状态的移动流程。',
      ],
      phase: 'React Native 核心交付',
    },
    {
      id: 'authorization-flow',
      title: '统一交易授权体验',
      paragraphs: [
        '转账、DApp 合约调用和消息签名都会进入统一的交易授权弹层，先展示操作内容，再由 PIN 或指纹完成用户确认，并把成功、拒绝或失败结果返回发起方。',
        '我的工作重点是授权状态与交互链路，并不等同于独立设计钱包密码学、底层签名算法或完成安全审计。',
      ],
      phase: '交互与状态流',
    },
    {
      id: 'dapp-bridge',
      title: 'DApp WebView 与消息桥接',
      paragraphs: [
        'DApp 容器向 WebView 注入账户和交易 Provider；当页面请求账户、消息签名或交易签名时，消息经 Bridge 交给 Native 钱包确认，再把结果回传 Web 页面。',
        '我参与端到端联调，处理 iOS WKWebView 与 Android WebView 在脚本注入、返回导航、加载状态和消息回传上的差异。',
      ],
      phase: '跨端联调',
    },
    {
      id: 'native-capabilities',
      title: '原生能力补齐',
      paragraphs: [
        '移动端还需要浏览器 JavaScript 之外的能力。我扩展了相册二维码识别、DApp 截图和微信、朋友圈、QQ 等分享能力，并持续处理 Android 状态栏、WebView 卡顿与 iOS 回调等双端问题。',
      ],
      phase: 'iOS / Android',
    },
    {
      id: 'ghost-dapp',
      title: 'Ghost 链上应用前端',
      paragraphs: [
        '同期参与 Ghost ERC-721 应用的 Web 前端，覆盖市场筛选、个人资产、详情、赠送、繁育和交易等页面，并与钱包签名登录、Provider 和合约调用链路联调。',
        'Solidity 合约、拍卖机制和后端事件同步由其他成员负责，本案例仅将其作为钱包 DApp 运行环境的上下文。',
      ],
      phase: 'Web DApp 协作',
    },
    {
      id: 'public-boundary',
      title: '公开与安全表述边界',
      paragraphs: [
        '历史仓库包含真实链交互、旧依赖和已经失效的环境配置，因此不提供可签名的在线 Demo，也不公开接口、地址或交易数据。',
        '代码可以证明本地密钥存储、授权交互和业务交付，但不能据此宣称经过安全审计、具备特定安全等级，或把整个多链协议实现归为个人成果。',
      ],
      phase: '公开说明',
    },
  ],
  provenanceNote:
    '本案例依据 2018 年团队项目源码与本人提交历史整理。公开页面只描述可核验的职责和工程范围，不连接旧服务、不展示真实地址或交易数据，也不将合约、后端和底层协议的团队成果归为个人独立完成。',
} satisfies PortfolioProject
