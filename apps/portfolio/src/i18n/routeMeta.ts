import type { ResolvedRoute, RouteId, RouteMeta } from '../app/router'
import type { Language } from './LanguageContext'

const englishRouteMeta: Record<RouteId, RouteMeta> = {
  home: {
    title: 'Chen Cheng | Frontend Tech Lead · Full-Stack & Complex Systems',
    description:
      'Chen Cheng is a frontend and full-stack engineer with 10+ years of experience across complex frontend systems, Baidu Maps data operations, backend services, business SDKs, cross-platform applications, and team leadership.',
  },
  'meican-platform': {
    title: 'Enterprise Console Architecture | Chen Cheng Portfolio',
    description:
      'A production architecture case covering a common console host, independent business apps, embedded pages, and business SDKs.',
  },
  'baidu-map-workbench': {
    title: 'Baidu Maps Data Workbench | Chen Cheng Portfolio',
    description:
      'Complex SVG map operations, Python and PHP data services, and delivery leadership for a five-person frontend team.',
  },
  'baijiahao-editor': {
    title: 'Baijiahao Editor Evolution | Chen Cheng Portfolio',
    description:
      'Evolving a deeply customized UEditor codebase into an internal reusable editor package.',
  },
  'layered-agent': {
    title: 'Layered Route × Verified Agent | Chen Cheng Portfolio',
    description:
      'A public research prototype that generates a behavior manifest from source for constrained, verifiable Agent operations.',
  },
  elpis: {
    title: 'Elpis Personal Product | Personal Projects',
    description:
      'An independently designed and developed product for preserving children’s artwork, stories, and growth timelines.',
  },
  experience: {
    title: 'Experience | Chen Cheng Portfolio',
    description:
      'Chen Cheng’s career progression from end-to-end full-stack delivery to complex frontend architecture and team leadership.',
  },
  archive: {
    title: 'Personal Projects | Chen Cheng Portfolio',
    description:
      'Independent products, editors, data visualization, motion experiments, and reusable interaction components.',
  },
  'archive-coco-wallet': {
    title: 'Coco Wallet Cross-Platform Wallet | Project Archive',
    description:
      'A team-delivered React Native multi-chain wallet, authorization flow, and DApp WebView container.',
  },
  'archive-poke-prototype-editor': {
    title: 'Poke High-Fidelity Prototype Editor | Project Archive',
    description:
      'A high-fidelity mobile prototyping editor with a shared desktop and browser core.',
  },
  'archive-dataview-observatory': {
    title: 'Ultra-Wide Real-Time Data Observatory | Project Archive',
    description:
      'A frontend-only 32:9 monitoring wall, graphic system, and linked interaction experiment.',
  },
  'archive-turntable-motion-lab': {
    title: 'Turntable Motion Lab | Project Archive',
    description:
      'A data-driven radial-motion experiment built with SVG geometry and spring interpolation.',
  },
  'archive-bezier-easing-picker': {
    title: 'Bezier Easing Picker | Project Archive',
    description:
      'A reusable visual editor and live preview for cubic-bezier easing parameters.',
  },
  'archive-merchant-commerce': {
    title: 'Mobile Commerce System | Independent Full-Stack Project Archive',
    description:
      'A redacted independent full-stack project archive covering a Flutter Android client, React operations console, and Go services.',
  },
  'archive-irregular-shape-layout': {
    title: 'Irregular Shape Layout Lab | Project Archive',
    description:
      'A clean-room public reconstruction of sampled SVG-boundary geometry, bounded radial search, and neighboring-angle refinement.',
  },
  demo: {
    title: 'Interactive Experience Player | Chen Cheng Portfolio',
    description: 'A full-window player for registered public interactive experiences.',
  },
  'poke-render': {
    title: 'Poke Mobile Preview',
    description:
      'Open a Poke prototype from a QR code and run its page transitions and interactions on a phone.',
  },
  resume: {
    title: 'Résumé | Chen Cheng',
    description:
      'Chen Cheng’s frontend leadership, full-stack delivery experience, core strengths, and public résumé.',
  },
  'not-found': {
    title: 'Page Not Found | Chen Cheng Portfolio',
    description: 'Return to the portfolio home page or continue through the navigation.',
  },
}

export function getLocalizedRouteMeta(
  route: ResolvedRoute,
  language: Language,
): RouteMeta {
  return language === 'en' ? englishRouteMeta[route.id] : route.meta
}
