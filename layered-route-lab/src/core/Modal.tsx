"use client";

import {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ModalRecord {
  id: number;
  index: number;
  lastFullIndex: number;
  lastFullModalId: string | null;
  full: boolean;
  width: number;
  height: number;
}

type ModalStyle = CSSProperties & {
  "--modal-transform": string;
  "--modal-background": string;
  "--modal-width": string;
  "--modal-height": string;
};

export type ModalLifecycleEvent =
  | "willEnter"
  | "willLeave"
  | "didEnter"
  | "didLeave";

export interface ModalLifecycleTelemetry {
  modalId: number;
  modalIndex: number;
  event: ModalLifecycleEvent;
  active: boolean;
  leaving: boolean;
  isOpen: boolean;
  sequence: number;
}

interface ModalProps {
  modal: ModalRecord;
  index: number;
  total: number;
  modalStack: readonly ModalRecord[];
  leaving: boolean;
  leavingIndex: number | undefined;
  showMask: boolean;
  lastSize: Pick<ModalRecord, "width" | "height">;
  isTop: boolean;
  observedModal?: ModalLifecycleTelemetry | null;
  onClose: () => void;
  onDidLeave: (id: number) => void;
  onLifecycleEvent: (telemetry: Omit<ModalLifecycleTelemetry, "sequence">) => void;
}

type PresenterEvent = ModalLifecycleEvent;

interface ModalHandleState {
  active: boolean;
  leaving: boolean;
  isOpen: boolean;
  maxHeight: number | null;
  calledEvents: Record<PresenterEvent, boolean>;
}

/**
 * Direct port of src_v3/components/common/Modal.js#generateContentStyle.
 * Each mounted modal handle runs the calculation for itself.
 */
export function generateModalContentStyle({
  index,
  total,
  leavingIndex,
  lastFullIndex,
}: Pick<ModalProps, "index" | "total" | "leavingIndex"> & {
  lastFullIndex: number;
}) {
  let i = index;
  let length = total;

  if (lastFullIndex !== -1) {
    length -= lastFullIndex;
    i -= lastFullIndex;
  }

  const prevLeaving = leavingIndex === i + 1;
  if (i === length - 1 || prevLeaving) {
    return {
      prevLeaving,
      shiftFactor: 0,
      transform: "translateY(0) scaleX(1)",
      background: "rgb(244, 244, 244)",
    };
  }

  let shiftFactor = length - i - 1;
  shiftFactor = shiftFactor > 1 ? 1 : shiftFactor;
  const scalePercentage = 1 - (24 / 480) * shiftFactor;
  const delta = 244 - 218;
  const background = 244 - shiftFactor * delta;

  return {
    prevLeaving,
    shiftFactor,
    transform: `translateY(${-10 * shiftFactor}px) scaleX(${scalePercentage})`,
    background: `rgb(${background}, ${background}, ${background})`,
  };
}

export default function Modal({
  modal,
  index,
  total,
  modalStack,
  leaving,
  leavingIndex,
  showMask,
  lastSize,
  isTop,
  observedModal,
  onClose,
  onDidLeave,
  onLifecycleEvent,
}: ModalProps) {
  const [handle, setHandle] = useState<ModalHandleState>({
    active: false,
    leaving: false,
    isOpen: false,
    maxHeight: null,
    calledEvents: {
      willEnter: false,
      willLeave: false,
      didEnter: false,
      didLeave: false,
    },
  });
  const calledEventFlags = useRef<Record<PresenterEvent, boolean>>({
    willEnter: false,
    willLeave: false,
    didEnter: false,
    didLeave: false,
  });
  const mountedRef = useRef(false);
  const safeTransitionTimerRef = useRef<number | null>(null);
  const previousLeavingRef = useRef(false);

  if (handle.leaving !== Boolean(leaving)) {
    setHandle((current) => ({
      ...current,
      leaving: Boolean(leaving),
    }));
  }

  const stateChanged = useCallback((event: PresenterEvent) => {
    calledEventFlags.current[event] = true;

    if (!mountedRef.current) return;
    setHandle((current) => ({
      ...current,
      calledEvents: {
        ...current.calledEvents,
        [event]: true,
      },
      isOpen:
        event === "didEnter"
          ? true
          : event === "willLeave"
            ? false
            : current.isOpen,
    }));
    onLifecycleEvent({
      modalId: modal.id,
      modalIndex: index,
      event,
      active: event === "willEnter" || event === "didEnter",
      leaving: event === "willLeave" || event === "didLeave",
      isOpen: event === "didEnter",
    });
  }, [index, modal.id, onLifecycleEvent]);

  const callEvent = useCallback(
    (event: PresenterEvent) => {
      window.setTimeout(() => {
        if (calledEventFlags.current[event]) return;

        stateChanged(event);
        if (event === "didLeave") {
          onDidLeave(modal.id);
        }
      }, 0);
    },
    [modal.id, onDidLeave, stateChanged],
  );

  const presentation = modal.full
    ? {
        prevLeaving: false,
        shiftFactor: 0,
        transform: "translateY(0) scaleX(1)",
        background: "rgb(244, 244, 244)",
      }
    : generateModalContentStyle({
        index,
        total,
        leavingIndex,
        lastFullIndex: modal.lastFullIndex,
      });
  const targetSize = !modal.full && !isTop ? lastSize : modal;
  const targetHeight =
    handle.maxHeight === null
      ? targetSize.height
      : Math.min(handle.maxHeight, targetSize.height);
  const isVisualTop =
    (isTop && !handle.leaving) || presentation.prevLeaving;
  const lastFullModalIndex = modal.full ? index : modal.lastFullIndex;
  const lastFullModal =
    lastFullModalIndex === -1
      ? "body"
      : `modal-${lastFullModalIndex + 1}`;
  const lastFullModalId = modal.full
    ? `modal-${modal.id}`
    : modal.lastFullModalId || "body";
  const currentDepth = index - lastFullModalIndex;
  const label = `modal-${index + 1}`;
  const lifecycleEvents: PresenterEvent[] = [
    "willEnter",
    "didEnter",
    "willLeave",
    "didLeave",
  ];

  useEffect(() => {
    mountedRef.current = true;
    const timer = window.setTimeout(() => {
      stateChanged("willEnter");
      setHandle((current) => ({
        ...current,
        active: true,
        maxHeight: Math.max(0, document.body.clientHeight - 56 * 2),
      }));
    }, 0);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      if (safeTransitionTimerRef.current !== null) {
        window.clearTimeout(safeTransitionTimerRef.current);
      }
      callEvent("willLeave");
      callEvent("didLeave");
    };
  }, [callEvent, stateChanged]);

  useEffect(() => {
    if (previousLeavingRef.current !== handle.leaving) {
      callEvent("willLeave");
      setHandle((current) => ({ ...current, active: false }));
    }
    previousLeavingRef.current = handle.leaving;
  }, [callEvent, handle.leaving]);

  useEffect(() => {
    if (
      !handle.leaving ||
      handle.active ||
      safeTransitionTimerRef.current !== null
    ) {
      return;
    }

    safeTransitionTimerRef.current = window.setTimeout(() => {
      callEvent("didLeave");
      safeTransitionTimerRef.current = null;
    }, 300);
  }, [callEvent, handle.active, handle.leaving]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "transform"
    ) {
      return;
    }

    callEvent(handle.active ? "didEnter" : "didLeave");
  };

  const style: ModalStyle = {
    "--modal-transform": presentation.transform,
    "--modal-background": presentation.background,
    "--modal-width": `${targetSize.width}px`,
    "--modal-height": `${targetHeight}px`,
  };

  return (
    <div
      className={`modal-layer ${handle.active ? "modal-active" : ""} ${
        handle.leaving ? "modal-leaving" : ""
      }`}
      style={{ zIndex: 40 + index }}
      data-active={handle.active}
      data-is-open={handle.isOpen}
      data-leaving={handle.leaving}
      data-shift-factor={presentation.shiftFactor}
      data-role={
        handle.leaving
          ? "leaving"
          : presentation.prevLeaving
            ? "recovering"
            : isTop
              ? "top"
              : "covered"
      }
      aria-hidden={!isVisualTop}
    >
      {showMask && (
        <button
          className="modal-mask"
          aria-label="Close modal"
          onClick={onClose}
        />
      )}
      <section
        className={`modal-card ${modal.full ? "modal-card-full" : ""}`}
        style={style}
        data-active={handle.active}
        data-leaving={handle.leaving}
        data-prev-leaving={presentation.prevLeaving}
        role="dialog"
        aria-modal={isVisualTop}
        aria-label={label}
        onTransitionEnd={handleTransitionEnd}
      >
        <header className="modal-bar">
          <div>
            <span className="surface-dot" />
            <strong>{label}</strong>
          </div>
          <span>
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close current modal"
          >
            Close
          </button>
        </header>
        <div className="modal-body">
          <p className="eyebrow">Modal</p>
          <h2>{label}</h2>
          <dl className="surface-state">
            <div>
              <dt>lastFullModal</dt>
              <dd>{lastFullModal}</dd>
            </div>
            <div>
              <dt>lastFullModalID</dt>
              <dd>{lastFullModalId}</dd>
            </div>
            <div>
              <dt>currentDepth</dt>
              <dd>{currentDepth}</dd>
            </div>
            {index === 0 && observedModal ? (
              <div className="modal-observation">
                <dt>observes modal-2</dt>
                <dd>{`${observedModal.event} · #${observedModal.sequence}`}</dd>
              </div>
            ) : null}
          </dl>
          {modal.full ? (
            <section className="modal-diagnostics" aria-label="Modal parameters and lifecycle">
              <header>
                <p className="eyebrow">FULL MODAL PARAMETERS</p>
                <strong>Stage-filling presentation with retained stack metadata</strong>
              </header>
              <div className="modal-stack-parameters" aria-label="Parameters for every modal in the stack">
                {modalStack.map((stackModal, stackIndex) => (
                  <article key={stackModal.id}>
                    <header>
                      <strong>{`modal-${stackIndex + 1}`}</strong>
                      <span>{stackModal.full ? "full stage" : "dialog"}</span>
                    </header>
                    <dl>
                      <div><dt>preset</dt><dd>{`${stackModal.width} × ${stackModal.height}`}</dd></div>
                      <div><dt>id / index</dt><dd>{`${stackModal.id} / ${stackIndex}`}</dd></div>
                      <div><dt>last full</dt><dd>{stackModal.lastFullModalId || "body"}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
              <dl>
                <div><dt>requested preset</dt><dd>{`${modal.width} × ${modal.height}`}</dd></div>
                <div><dt>effective target</dt><dd>{`${targetSize.width} × ${targetHeight}`}</dd></div>
                <div><dt>render policy</dt><dd>fills stage</dd></div>
                <div><dt>modal id / index</dt><dd>{`${modal.id} / ${index}`}</dd></div>
                <div><dt>stack total</dt><dd>{total}</dd></div>
                <div><dt>last full index</dt><dd>{modal.lastFullIndex}</dd></div>
                <div><dt>leaving index</dt><dd>{leavingIndex ?? "none"}</dd></div>
                <div><dt>top / leaving</dt><dd>{`${isTop} / ${handle.leaving}`}</dd></div>
                <div><dt>prev leaving / shift</dt><dd>{`${presentation.prevLeaving} / ${presentation.shiftFactor}`}</dd></div>
                <div><dt>transform</dt><dd>{presentation.transform}</dd></div>
                <div><dt>background</dt><dd>{presentation.background}</dd></div>
                <div><dt>handle flags</dt><dd>{`${handle.active} / ${handle.isOpen} / ${handle.leaving}`}</dd></div>
              </dl>
              <div className="modal-lifecycle-events">
                <span>lifecycle</span>
                {lifecycleEvents.map((event) => (
                  <span key={event} data-called={handle.calledEvents[event]}>{event}</span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
