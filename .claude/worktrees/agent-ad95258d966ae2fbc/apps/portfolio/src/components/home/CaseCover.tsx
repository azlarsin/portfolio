import {
  ArrowRight,
  Blocks,
  CheckCheck,
  Database,
  FileText,
  GitBranch,
  Layers,
  Route,
} from 'lucide-react'
import type { PortfolioProject } from '../../data'
import { useLanguage } from '../../i18n/LanguageContext'

const studies = {
  'meican-platform': {
    name: 'MEICAN',
    icon: Blocks,
    center: ['统一宿主', 'Shared host'],
    nodes: ['App', 'Page', 'SDK'],
    detail: 'Navigation / Auth / Lifecycle',
  },
  'baidu-map-workbench': {
    name: 'BAIDU MAPS',
    icon: Layers,
    center: ['地图数据作业', 'Map operations'],
    nodes: ['Map', 'Layer', 'Feature'],
    detail: 'SVG / Spatial data / Workflow',
  },
  'baijiahao-editor': {
    name: 'BAIJIAHAO',
    icon: FileText,
    center: ['编辑器内核', 'Editor core'],
    nodes: ['React', 'Script', 'Plugin'],
    detail: 'UEditor / Content / Package',
  },
  'layered-agent': {
    name: 'LAYERED ROUTE × AGENT',
    icon: Route,
    center: ['行为清单', 'Behavior manifest'],
    nodes: ['Plan', 'Execute', 'Verify'],
    detail: 'Route AST / Typed actions / State',
  },
} as const

export function CaseCover({
  project,
  index,
}: {
  project: PortfolioProject
  index: number
}) {
  const { copy, language } = useLanguage()
  const study = studies[project.slug as keyof typeof studies]
  if (!study) return null
  const Icon = study.icon
  const isFlow =
    project.slug === 'layered-agent' || project.slug === 'baidu-map-workbench'
  const NodeIcon =
    project.slug === 'layered-agent'
      ? CheckCheck
      : project.slug === 'baidu-map-workbench'
        ? Database
        : GitBranch

  return (
    <div className="case-cover" aria-hidden="true">
      <div className="case-cover-label">
        <span>{study.name}</span>
        <span>{String(index).padStart(2, '0')}</span>
      </div>
      <div
        className={`case-cover-diagram ${isFlow ? 'case-cover-diagram--flow' : ''}`}
      >
        <div className="cover-hub">
          <Icon size={20} />
          <strong>{study.center[language === 'zh' ? 0 : 1]}</strong>
        </div>
        {!isFlow ? <div className="cover-connectors" /> : null}
        <div className="cover-nodes">
          {study.nodes.map((node, nodeIndex) => (
            <span key={node}>
              <NodeIcon size={15} />
              {node}
              {isFlow && nodeIndex < study.nodes.length - 1 ? (
                <ArrowRight className="cover-node-arrow" size={13} />
              ) : null}
            </span>
          ))}
        </div>
      </div>
      <div className="case-cover-caption">
        <span>{study.detail}</span>
        <span>
          {copy.home.diagramLabel}
          <ArrowRight size={13} />
        </span>
      </div>
    </div>
  )
}
