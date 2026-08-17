"use client";

import {
  CSSProperties,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppContext } from "./AppContext";
import { createPresenterLifecycle } from "./PresenterLifecycle";
import {
  type ResolvedRoute,
  resolveRoute,
} from "../router/routes";
import DemoBusinessSurface from "../agent/DemoBusinessSurface";

const PRESENTER_LIFECYCLE_SETTLE_MS = 420;

type PresenterStyle = CSSProperties & {
  "--stack-index": number;
  "--stack-count": number;
  "--presenter-lifecycle-scale": number;
  "--overview-top": string;
  "--overview-right": string;
  "--overview-bottom": string;
  "--overview-left": string;
  "--overview-mobile-top": string;
  "--overview-mobile-right": string;
  "--overview-mobile-bottom": string;
  "--overview-mobile-left": string;
};

interface PresenterProps {
  surfaceId: string;
  index: number;
  total: number;
  currentUrl: string;
  lastRouteUrl: string;
  currentDepth: number;
  route?: ResolvedRoute;
  reconstructible: boolean;
  isTop: boolean;
  inspectionMode: "off" | "stack" | "grid";
  leaving: boolean;
  onDidLeave: (surfaceId: string) => void;
  onSelect: () => void;
  onPush: () => void;
}

export function getPresenterOverviewInsets(
  index: number,
  total: number,
  maxColumns: number,
  horizontalGutter: number,
  topGutter: number,
  bottomGutter: number,
  gap: number,
) {
  const safeTotal = Math.max(1, total);
  const columns = Math.min(maxColumns, safeTotal);
  const rows = Math.ceil(safeTotal / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const halfGap = gap / 2;
  const percentage = (value: number) =>
    Number(value.toFixed(4));

  return {
    top: `calc(${percentage((row / rows) * 100)}% + ${
      row === 0 ? topGutter : halfGap
    }px)`,
    right: `calc(${percentage(
      ((columns - column - 1) / columns) * 100,
    )}% + ${column === columns - 1 ? horizontalGutter : halfGap}px)`,
    bottom: `calc(${percentage(
      ((rows - row - 1) / rows) * 100,
    )}% + ${row === rows - 1 ? bottomGutter : halfGap}px)`,
    left: `calc(${percentage((column / columns) * 100)}% + ${
      column === 0 ? horizontalGutter : halfGap
    }px)`,
  };
}

export default function Presenter({
  surfaceId,
  index,
  total,
  currentUrl,
  lastRouteUrl,
  currentDepth,
  route,
  reconstructible,
  isTop,
  inspectionMode,
  leaving,
  onDidLeave,
  onSelect,
  onPush,
}: PresenterProps) {
  const [entered, setEntered] = useState(index === 0);
  const didLeaveRef = useRef(false);
  const pageActive = isTop && !leaving;
  const previousPageActiveRef = useRef<boolean | null>(null);
  const lifecycleTimerRef = useRef<number | null>(null);
  const [lifecycle] = useState(() =>
    createPresenterLifecycle(
      pageActive ? "willAppear" : "didDisappear",
    ),
  );
  const context = useContext(AppContext);
  const d3 = inspectionMode !== "off";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const previousPageActive = previousPageActiveRef.current;
    previousPageActiveRef.current = pageActive;

    if (lifecycleTimerRef.current !== null) {
      window.clearTimeout(lifecycleTimerRef.current);
      lifecycleTimerRef.current = null;
    }

    if (pageActive) {
      lifecycle.emit("willAppear");
      lifecycleTimerRef.current = window.setTimeout(() => {
        lifecycle.emit("didAppear");
        lifecycleTimerRef.current = null;
      }, PRESENTER_LIFECYCLE_SETTLE_MS);
    } else if (previousPageActive) {
      lifecycle.emit("willDisappear");
      lifecycleTimerRef.current = window.setTimeout(() => {
        lifecycle.emit("didDisappear");
        lifecycleTimerRef.current = null;
      }, PRESENTER_LIFECYCLE_SETTLE_MS);
    }

    return () => {
      if (lifecycleTimerRef.current !== null) {
        window.clearTimeout(lifecycleTimerRef.current);
        lifecycleTimerRef.current = null;
      }
    };
  }, [lifecycle, pageActive]);

  useEffect(() => {
    if (
      route?.id !== "product-order" ||
      route.params.orderId !== "123" ||
      !route.parentPath
    ) {
      return;
    }

    const backRoute = resolveRoute(route.parentPath);
    if (backRoute) {
      // Matches order.js: server-derived detail marks the list's
      // absolutePath in App.context.queryStringCacheMap.
      context.setQueryStringCache(backRoute.pattern, {
        manualPay: "1",
      });
    }
  }, [context, route]);

  useEffect(() => {
    if (!leaving) {
      didLeaveRef.current = false;
      return;
    }

    const fallback = window.setTimeout(() => {
      if (didLeaveRef.current) return;
      didLeaveRef.current = true;
      onDidLeave(surfaceId);
    }, inspectionMode === "grid" ? 560 : 520);
    return () => window.clearTimeout(fallback);
  }, [inspectionMode, leaving, onDidLeave, surfaceId]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "transform" ||
      !leaving ||
      didLeaveRef.current
    ) {
      return;
    }
    didLeaveRef.current = true;
    onDidLeave(surfaceId);
  };

  const label = `presenter-${index + 1}`;
  const displayTitle = route?.title || label;
  const currentSearch = new URL(currentUrl, "http://localhost")
    .searchParams;
  const isManualPayDetail =
    route?.id === "product-order" && route.params.orderId === "123";
  const hasRestoredManualPay =
    route?.id === "product-orders" &&
    currentSearch.get("manualPay") === "1";
  const overview = getPresenterOverviewInsets(
    index,
    total,
    3,
    26,
    22,
    44,
    16,
  );
  const mobileOverview = getPresenterOverviewInsets(
    index,
    total,
    1,
    12,
    12,
    38,
    12,
  );
  const style: PresenterStyle = {
    "--stack-index": index,
    "--stack-count": total,
    "--presenter-lifecycle-scale": entered && !leaving ? 1 : 0,
    "--overview-top": overview.top,
    "--overview-right": overview.right,
    "--overview-bottom": overview.bottom,
    "--overview-left": overview.left,
    "--overview-mobile-top": mobileOverview.top,
    "--overview-mobile-right": mobileOverview.right,
    "--overview-mobile-bottom": mobileOverview.bottom,
    "--overview-mobile-left": mobileOverview.left,
  };

  return (
    <section
      className={`presenter ${index === 0 ? "presenter-root" : ""} ${
        isTop ? "presenter-top" : ""
      }`}
      data-entered={entered}
      data-d3={d3}
      data-d3-mode={inspectionMode}
      data-leaving={leaving}
      data-page-active={pageActive}
      data-reconstructible={reconstructible}
      data-surface-id={surfaceId}
      data-selectable="true"
      style={style}
      aria-hidden={!d3 && !isTop}
      onTransitionEnd={handleTransitionEnd}
      onClick={() => {
        if (
          inspectionMode === "grid" ||
          (inspectionMode === "stack" && !isTop)
        ) {
          onSelect();
        }
      }}
    >
      <button
        type="button"
        className="presenter-grid-target"
        aria-label={`定向到 ${label}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      />
      <header className="surface-bar">
        <div>
          <span className="surface-dot" />
          <strong>{label}</strong>
        </div>
        <code>{currentUrl}</code>
        <span>
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
      </header>

      <div className="surface-content surface-content-minimal">
        <p className="eyebrow">Presenter</p>
        <div className="presenter-title-row">
          <h1>{displayTitle}</h1>
          <button
            type="button"
            className="presenter-push-button"
            onClick={(event) => {
              event.stopPropagation();
              onPush();
            }}
          >
            presenter.push()
          </button>
        </div>
        {route ? (
          <DemoBusinessSurface
            route={route}
            currentUrl={currentUrl}
            lifecycle={lifecycle}
          />
        ) : null}
        {(reconstructible ||
          isManualPayDetail ||
          hasRestoredManualPay) && (
          <div className="page-flags">
            {reconstructible && (
              <div className="page-flag page-flag-rebuild">
                <strong>页面刷新后会被重建</strong>
                <span>由当前 URL 对应的路由父链恢复</span>
              </div>
            )}
            {isManualPayDetail && (
              <div className="page-flag page-flag-query">
                <strong>自动追加 manualPay query 参数</strong>
                <span>
                  伪 server 返回 orderDetail 后，已向
                  App.context.queryStringCacheMap 写入 manualPay=1；返回
                  orders 时才追加到 URL。
                </span>
              </div>
            )}
            {hasRestoredManualPay && (
              <div className="page-flag page-flag-query">
                <strong>已追加 query：?manualPay=1</strong>
                <span>请查看 currentUrl，观察返回后的路由变化。</span>
              </div>
            )}
          </div>
        )}
        <dl className="surface-state">
          <div>
            <dt>currentUrl</dt>
            <dd>
              <code>{currentUrl}</code>
            </dd>
          </div>
          <div>
            <dt>lastRouteUrl</dt>
            <dd>
              <code>{lastRouteUrl}</code>
            </dd>
          </div>
          <div>
            <dt>currentDepth</dt>
            <dd>{currentDepth}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
