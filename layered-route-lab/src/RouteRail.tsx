"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  flattenDemoRouteTree,
  type ResolvedRoute,
  resolveRoute,
} from "./router/routes";

type RouteLinkStyle = CSSProperties & {
  "--route-indent": string;
};

export interface TemporaryPresenterLayer {
  uid: string;
  label: string;
}

interface RouteRailProps {
  routeStack: ResolvedRoute[];
  temporaryPresenters: TemporaryPresenterLayer[];
  activeSurfaceCount: number;
  updatesPaused: boolean;
  onNavigateRoute: (path: string) => void;
  onCloseUntilUid: (uid: string) => void;
}

const routeNodes = flattenDemoRouteTree();

export default function RouteRail({
  routeStack,
  temporaryPresenters,
  activeSurfaceCount,
  updatesPaused,
  onNavigateRoute,
  onCloseUntilUid,
}: RouteRailProps) {
  const currentRoute = routeStack[routeStack.length - 1];
  const mountedPaths = new Set(routeStack.map((route) => route.path));
  const routeListRef = useRef<HTMLDivElement>(null);
  const [menuOpenForPath, setMenuOpenForPath] = useState<string | null>(null);
  const routeMenuOpen = menuOpenForPath === currentRoute.path;

  useEffect(() => {
    if (updatesPaused) return;
    routeListRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [currentRoute.path, updatesPaused]);

  useEffect(() => {
    if (!routeMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpenForPath(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [routeMenuOpen]);

  return (
    <aside
      className={`route-rail ${routeMenuOpen ? "is-menu-open" : ""}`}
      aria-label="Layered Route Lab navigation"
      aria-busy={updatesPaused}
    >
      <header className="route-rail-brand">
        <span className="route-rail-mark" aria-hidden="true">LR</span>
        <div>
          <strong>Layered Route Lab</strong>
          <span>Route and Presenter stack</span>
        </div>
      </header>

      <section className="route-rail-current" aria-label="Current surface stack">
        <span className="route-rail-section-label">Current stack</span>
        <div className="route-composition">
          <button
            type="button"
            className="route-composition-path"
            onClick={() => onCloseUntilUid(currentRoute.path)}
          >
            <span>route</span>
            <code>{currentRoute.path}</code>
          </button>
          {temporaryPresenters.length ? (
            <>
              <span className="route-composition-plus" aria-hidden="true">+</span>
              <div className="route-presenter-array" aria-label="Temporary presenters">
                <span aria-hidden="true">[</span>
                {temporaryPresenters.map((presenter) => (
                  <button
                    type="button"
                    key={presenter.uid}
                    onClick={() => onCloseUntilUid(presenter.uid)}
                  >
                    {presenter.label}
                  </button>
                ))}
                <span aria-hidden="true">]</span>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <button
        type="button"
        className="route-rail-menu-toggle"
        aria-expanded={routeMenuOpen}
        aria-controls="route-rail-routes"
        onClick={() =>
          setMenuOpenForPath((value) =>
            value === currentRoute.path ? null : currentRoute.path,
          )
        }
      >
        <span>页面栈</span>
        <strong>{String(activeSurfaceCount).padStart(2, "0")}</strong>
        <i aria-hidden="true" />
      </button>

      <button
        type="button"
        className="route-rail-menu-scrim"
        aria-label="关闭页面栈"
        tabIndex={routeMenuOpen ? 0 : -1}
        onClick={() => setMenuOpenForPath(null)}
      />

      <nav id="route-rail-routes" aria-label="Demo routes">
        <span className="route-rail-section-label">Routes</span>
        <div className="lab-route-list" ref={routeListRef}>
          {routeNodes.map((node, index) => {
            const route = resolveRoute(node.path)!;
            const isActive = currentRoute.path === route.path;
            const isMounted = mountedPaths.has(route.path);
            const style: RouteLinkStyle = {
              "--route-indent": `${node.depth * 10}px`,
            };

            return (
              <button
                type="button"
                className={`lab-route-link ${isActive ? "active" : ""} ${
                  isMounted ? "mounted" : ""
                }`}
                key={route.path}
                style={style}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setMenuOpenForPath(null);
                  if (isMounted) onCloseUntilUid(route.path);
                  else onNavigateRoute(route.path);
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{route.title}</strong>
                  <code>{route.path}</code>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <footer className="route-rail-stats">
        <span>Backend</span>
        <strong>None</strong>
        <span>Active surfaces</span>
        <strong>{String(activeSurfaceCount).padStart(2, "0")}</strong>
      </footer>
    </aside>
  );
}
