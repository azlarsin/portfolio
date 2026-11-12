"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { behaviorManifest } from "./agent/generated/behaviorManifest";
import { resolveRoute, type ResolvedRoute } from "./router/routes";

interface BehaviorGraphViewerProps {
  currentRoute: ResolvedRoute;
  routeStack: ResolvedRoute[];
  onClose: () => void;
  onNavigateRoute: (path: string) => void;
}

type GraphNodeStyle = CSSProperties & {
  "--behavior-depth": number;
};

const graphNodes = behaviorManifest.routeInstances;

function getNodeDepth(path: string) {
  let node = graphNodes.find((candidate) => candidate.path === path);
  let depth = 0;
  const visited = new Set<string>();
  while (node?.parentPath && !visited.has(node.path)) {
    visited.add(node.path);
    depth += 1;
    const parentPath: string = node.parentPath;
    node = graphNodes.find((candidate) => candidate.path === parentPath);
  }
  return depth;
}

export default function BehaviorGraphViewer({
  currentRoute,
  routeStack,
  onClose,
  onNavigateRoute,
}: BehaviorGraphViewerProps) {
  const [selectedPath, setSelectedPath] = useState(currentRoute.path);
  const activePaths = useMemo(
    () => new Set(routeStack.map((route) => route.path)),
    [routeStack],
  );
  const selectedNode =
    graphNodes.find((node) => node.path === selectedPath) || graphNodes[0];
  const selectedRoute = resolveRoute(selectedNode.path);
  const selectedParams = Object.entries(selectedNode.params);
  const edgeCount = graphNodes.reduce(
    (total, node) => total + node.childPaths.length,
    0,
  );

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [onClose]);

  const openRoute = (path: string) => {
    setSelectedPath(path);
    onNavigateRoute(path);
  };

  return (
    <div className="behavior-graph-overlay">
      <button
        type="button"
        className="behavior-graph-scrim"
        aria-label="关闭行为图"
        onClick={onClose}
      />
      <section
        id="behavior-graph-viewer"
        className="behavior-graph-viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="behavior-graph-title"
      >
        <header className="behavior-graph-header">
          <div>
            <span>GENERATED FROM BEHAVIOR MANIFEST</span>
            <h2 id="behavior-graph-title">Route Behavior Graph</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭行为图"
            autoFocus
          >
            ×
          </button>
        </header>

        <div className="behavior-graph-stats" aria-label="行为图统计">
          <span><strong>{graphNodes.length}</strong> nodes</span>
          <span><strong>{edgeCount}</strong> edges</span>
          <span><strong>{behaviorManifest.actions.length}</strong> actions</span>
          <code>{behaviorManifest.sourceHash}</code>
        </div>

        <div className="behavior-graph-layout">
          <div className="behavior-graph-map" role="tree" aria-label="路由行为节点">
            {graphNodes.map((node, index) => {
              const route = resolveRoute(node.path);
              const selected = node.path === selectedNode.path;
              const current = node.path === currentRoute.path;
              const active = activePaths.has(node.path);
              const style: GraphNodeStyle = {
                "--behavior-depth": getNodeDepth(node.path),
              };
              return (
                <button
                  type="button"
                  role="treeitem"
                  aria-level={getNodeDepth(node.path) + 1}
                  aria-current={current ? "page" : undefined}
                  aria-selected={selected}
                  className={`behavior-graph-node ${selected ? "is-selected" : ""} ${
                    current ? "is-current" : ""
                  } ${active ? "is-active-path" : ""}`}
                  key={node.path}
                  style={style}
                  onClick={() => setSelectedPath(node.path)}
                >
                  <span className="behavior-graph-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="behavior-graph-node-copy">
                    <small>{node.routeId}</small>
                    <strong>{route?.title || node.path}</strong>
                    <code>{node.path}</code>
                  </span>
                  <span
                    className="behavior-graph-outgoing"
                    aria-label={`${node.childPaths.length} 个出口`}
                  >
                    {node.childPaths.length}
                  </span>
                </button>
              );
            })}
          </div>

          <aside className="behavior-graph-inspector" aria-label="所选行为节点详情">
            <div className="behavior-graph-inspector-heading">
              <span>{selectedRoute?.eyebrow || "Route node"}</span>
              <strong>{selectedRoute?.title || selectedNode.path}</strong>
              <code>{selectedNode.path}</code>
            </div>

            <dl className="behavior-graph-metadata">
              <div><dt>Schema</dt><dd>{selectedNode.pattern}</dd></div>
              <div><dt>Parent</dt><dd>{selectedNode.parentPath || "ROOT"}</dd></div>
              <div><dt>Outgoing</dt><dd>{selectedNode.childPaths.length}</dd></div>
              {selectedParams.map(([key, value]) => (
                <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>
              ))}
            </dl>

            <button
              type="button"
              className="behavior-graph-open-route"
              disabled={selectedNode.path === currentRoute.path}
              onClick={() => openRoute(selectedNode.path)}
            >
              {selectedNode.path === currentRoute.path ? "当前路由" : "打开所选路由"}
            </button>

            <section className="behavior-graph-branches">
              <span>OUTGOING BRANCHES</span>
              {selectedNode.childPaths.length ? (
                selectedNode.childPaths.map((path) => (
                  <button type="button" key={path} onClick={() => openRoute(path)}>
                    <strong>{resolveRoute(path)?.title || path}</strong>
                    <code>{path}</code>
                    <span aria-hidden="true">→</span>
                  </button>
                ))
              ) : (
                <p>Terminal node · 可返回父级或从图中选择其他分支。</p>
              )}
            </section>

            <section className="behavior-graph-actions">
              <span>EXECUTABLE CONTRACTS</span>
              <div>
                {behaviorManifest.actions.map((action) => (
                  <span key={action.id} title={action.evidence}>{action.label}</span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
