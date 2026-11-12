import { layeredAgentManifestStats } from '../../data'
import { useLanguage } from '../../i18n/LanguageContext'

const pipeline = [
  'Candidate Retrieval',
  'Planner / Clarification',
  'Typed App Bridge',
  'Host State Update',
  'Result Verification',
]

export function LayeredAgentVisual({ compact = false }: { compact?: boolean }) {
  const { copy } = useLanguage()

  return (
    <figure className={`agent-pipeline-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>PUBLIC RESEARCH ARCHITECTURE</span>
        <small>{copy.visuals.agent.note}</small>
      </figcaption>
      <div className="agent-inputs" aria-label={copy.visuals.agent.inputsLabel}>
        <span>Static Source Analysis</span>
        <span>Runtime Exploration</span>
      </div>
      <div className="manifest-node">
        <small>UNIFIED KNOWLEDGE</small>
        <strong>Behavior Manifest</strong>
        <span>
          {layeredAgentManifestStats.routeSchemas} schemas ·{' '}
          {layeredAgentManifestStats.routeNodes} nodes ·{' '}
          {layeredAgentManifestStats.actions} actions
        </span>
      </div>
      <ol aria-label={copy.visuals.agent.pipelineLabel}>
        {pipeline.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
          </li>
        ))}
      </ol>
    </figure>
  )
}
