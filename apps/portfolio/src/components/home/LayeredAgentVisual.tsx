import { layeredAgentManifestStats } from '../../data'

const pipeline = [
  'Candidate Retrieval',
  'Planner / Clarification',
  'Typed App Bridge',
  'Host State Update',
  'Result Verification',
]

export function LayeredAgentVisual({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={`agent-pipeline-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>PUBLIC RESEARCH ARCHITECTURE</span>
        <small>行为知识来自源码分析或运行态探索，执行结果由宿主状态验证</small>
      </figcaption>
      <div className="agent-inputs" aria-label="Behavior Manifest 输入来源">
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
      <ol aria-label="Agent 执行与验证流程">
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
