"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";

const GUIDE_MOBILE_BREAKPOINT = 720;
const GUIDE_VIEWPORT_INSET = 8;

interface GuideDrag {
  pointerId: number;
  handle: HTMLDivElement;
  startX: number;
  startY: number;
  startTop: number;
  startLeft: number;
}

type GuidePosition = { top: number; left: number };

interface ExperienceGuideProps {
  open: boolean;
  routePath: string;
  routeDepth: number;
  temporaryPresenterDepth: number;
  modalDepth: number;
  inspectionMode: "off" | "stack" | "grid";
  canAdvanceRoute: boolean;
  onClose: () => void;
  onAdvanceRoute: () => void;
  onPushTemporaryPresenter: () => void;
  onOpenModal: () => void;
  onCycleInspection: () => void;
  onOpenAgent: () => void;
}

export default function ExperienceGuide({
  open,
  routePath,
  routeDepth,
  temporaryPresenterDepth,
  modalDepth,
  inspectionMode,
  canAdvanceRoute,
  onClose,
  onAdvanceRoute,
  onPushTemporaryPresenter,
  onOpenModal,
  onCycleInspection,
  onOpenAgent,
}: ExperienceGuideProps) {
  const [position, setPosition] = useState<GuidePosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const guideRef = useRef<HTMLElement>(null);
  const dragRef = useRef<GuideDrag | null>(null);

  const clampPosition = useCallback((candidate: GuidePosition) => {
    const guide = guideRef.current;
    if (!guide || window.innerWidth <= GUIDE_MOBILE_BREAKPOINT) return null;

    const rect = guide.getBoundingClientRect();
    const maxTop = Math.max(
      GUIDE_VIEWPORT_INSET,
      window.innerHeight - rect.height - GUIDE_VIEWPORT_INSET,
    );
    const maxLeft = Math.max(
      GUIDE_VIEWPORT_INSET,
      window.innerWidth - rect.width - GUIDE_VIEWPORT_INSET,
    );
    return {
      top: Math.min(maxTop, Math.max(GUIDE_VIEWPORT_INSET, candidate.top)),
      left: Math.min(maxLeft, Math.max(GUIDE_VIEWPORT_INSET, candidate.left)),
    };
  }, []);

  const releaseDrag = useCallback((pointerId?: number) => {
    const drag = dragRef.current;
    if (!drag || (pointerId !== undefined && drag.pointerId !== pointerId)) {
      return;
    }

    dragRef.current = null;
    if (drag.handle.hasPointerCapture(drag.pointerId)) {
      drag.handle.releasePointerCapture(drag.pointerId);
    }
    setDragging(false);
  }, []);

  useEffect(() => {
    const reclampPosition = () => {
      if (window.innerWidth <= GUIDE_MOBILE_BREAKPOINT) {
        releaseDrag();
        setPosition(null);
        return;
      }
      setPosition((current) => current && clampPosition(current));
    };

    window.addEventListener("resize", reclampPosition);
    return () => window.removeEventListener("resize", reclampPosition);
  }, [clampPosition, releaseDrag]);

  useEffect(() => {
    const guide = guideRef.current;
    if (!guide || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (window.innerWidth > GUIDE_MOBILE_BREAKPOINT) {
        setPosition((current) => current && clampPosition(current));
      }
    });
    observer.observe(guide);
    return () => observer.disconnect();
  }, [clampPosition, open]);

  useEffect(() => {
    if (!open) {
      releaseDrag();
      const timer = window.setTimeout(() => setPosition(null), 0);
      return () => window.clearTimeout(timer);
    }
  }, [open, releaseDrag]);

  useEffect(() => () => releaseDrag(), [releaseDrag]);

  const handleClose = () => {
    releaseDrag();
    setPosition(null);
    onClose();
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || dragRef.current?.pointerId !== event.pointerId) {
      return;
    }
    releaseDrag(event.pointerId);
  };

  const handleDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) return;
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      window.innerWidth <= GUIDE_MOBILE_BREAKPOINT
    ) {
      return;
    }

    const guide = guideRef.current;
    if (!guide) return;

    const rect = guide.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      handle: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      startTop: rect.top,
      startLeft: rect.left,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handleDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!event.isPrimary || !drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const nextPosition = clampPosition({
      top: drag.startTop + event.clientY - drag.startY,
      left: drag.startLeft + event.clientX - drag.startX,
    });
    if (nextPosition) setPosition(nextPosition);
  };

  if (!open) return null;

  const guideStyle = position
    ? ({
        "--guide-top": `${position.top}px`,
        "--guide-left": `${position.left}px`,
      } as CSSProperties)
    : undefined;

  return (
    <section
      className="experience-guide"
      id="experience-guide"
      ref={guideRef}
      aria-labelledby="experience-guide-title"
      data-dragging={dragging}
      style={guideStyle}
    >
      <header className="guide-header">
        <div
          className="guide-drag-handle"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onLostPointerCapture={finishDrag}
        >
          <span className="guide-kicker">START HERE · 2 MIN</span>
          <h2 id="experience-guide-title">操作指南</h2>
          <p>按下方步骤操作，观察 URL、History 与界面层如何协作。</p>
        </div>
        <button type="button" aria-label="关闭操作指南" onClick={handleClose}>
          ×
        </button>
      </header>

      <div className="guide-live-state" aria-live="polite">
        <span><i /> LIVE</span>
        <code>{routePath}</code>
        <div>
          <strong>{routeDepth}</strong> Route
          <strong>{temporaryPresenterDepth}</strong> Temp
          <strong>{modalDepth}</strong> Modal
        </div>
      </div>

      <div className="guide-section">
        <div className="guide-section-heading">
          <span>01</span>
          <div>
            <strong>Route × Presenter</strong>
            <p>用四个动作观察“可重建页面”与“临时界面层”的差别。</p>
          </div>
        </div>

        <div className="guide-layer-map" aria-label="路由和界面层关系">
          <div>
            <span>URL</span>
            <strong>Route Presenter</strong>
            <small>刷新后按父链重建</small>
          </div>
          <i>+</i>
          <div>
            <span>History state</span>
            <strong>Temp Presenter · Modal</strong>
            <small>同 URL 的临时层</small>
          </div>
          <i>→</i>
          <div>
            <span>Back / Esc</span>
            <strong>Top layer first</strong>
            <small>从最上层依次退出</small>
          </div>
        </div>

        <div className="guide-actions">
          <button
            type="button"
            onClick={onAdvanceRoute}
            disabled={!canAdvanceRoute}
          >
            <span>1 · 推进路由</span>
            <small>{canAdvanceRoute ? "URL 与 Route 层同时变化" : "当前已是最深路由"}</small>
          </button>
          <button type="button" onClick={onPushTemporaryPresenter}>
            <span>2 · 临时 Presenter</span>
            <small>增加界面层，URL 保持不变</small>
          </button>
          <button type="button" onClick={onOpenModal}>
            <span>3 · 叠加 Modal</span>
            <small>Back / Esc 优先关闭顶层</small>
          </button>
          <button type="button" onClick={onCycleInspection}>
            <span>4 · 切换 3D</span>
            <small>当前：{inspectionMode === "off" ? "关闭" : inspectionMode}</small>
          </button>
        </div>
      </div>

      <div className="guide-section guide-agent-section">
        <div className="guide-section-heading">
          <span>02</span>
          <div>
            <strong>Agent 的作用</strong>
            <p>把自然语言任务转换为应用明确允许、可以验证的动作。</p>
          </div>
        </div>
        <div className="guide-agent-flow" aria-label="Agent 工作流程">
          <span>理解任务</span><i>→</i>
          <span>匹配 Manifest</span><i>→</i>
          <span>调用宿主动作</span><i>→</i>
          <span>校验结果</span>
        </div>
        <p className="guide-boundary">
          公开 Demo 使用本地 planner 与合成数据，不调用线上模型或业务 API；
          条件不完整时会先请求补充，不自行猜测。
        </p>
        <button type="button" className="guide-agent-cta" onClick={onOpenAgent}>
          打开 Agent，试一条任务
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
