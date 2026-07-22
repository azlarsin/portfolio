"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Modal, { ModalRecord } from "./core/Modal";
import Presenter from "./core/Presenter";
import {
  AppContext,
  type AppContextValue,
  type QueryStringCacheMap,
  type QueryStringPayload,
} from "./core/AppContext";
import {
  buildRouteStack,
  DEFAULT_DEMO_ROUTE_PATH,
  normalizePath,
  resolveRoute,
} from "./router/routes";
import "./layered-route-lab.css";

const modalPresets = [
  { width: 520, height: 420, full: false },
  { width: 680, height: 520, full: false },
  { width: 580, height: 610, full: false },
  { width: 900, height: 680, full: true },
];

let modalHandleSequence = 0;

function createModalRecord(stack: ModalRecord[]): ModalRecord {
  const depth = stack.length + 1;
  const preset = modalPresets[(depth - 1) % modalPresets.length];
  let lastFullIndex = [...stack]
    .reverse()
    .findIndex((modal) => modal.full);
  lastFullIndex =
    lastFullIndex === -1 ? -1 : stack.length - 1 - lastFullIndex;

  return {
    id: ++modalHandleSequence,
    index: stack.length,
    lastFullIndex,
    lastFullModalId:
      lastFullIndex === -1 ? null : `modal-${stack[lastFullIndex].id}`,
    ...preset,
  };
}

interface PresenterRecord {
  id: string;
  index: number;
  lastRouteUrl: string;
}

function createPresenterRecord(
  stack: PresenterRecord[],
  lastRouteUrl: string,
): PresenterRecord {
  const depth = stack.length + 1;
  return {
    id: `presenter_${Date.now()}_${depth}`,
    index: stack.length,
    lastRouteUrl,
  };
}

function resolveRouteUrl(path: string, currentUrl: string) {
  try {
    return new URL(path, currentUrl).href;
  } catch {
    return path;
  }
}

function keyboardTargetIsEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

type NavigationMode = "push" | "replace" | "pop";
type InspectionMode = "off" | "stack" | "grid";

interface PendingPresenterNavigation {
  path: string;
  mode: NavigationMode;
}

type PresenterCanvasStyle = CSSProperties & {
  "--overview-canvas-height": string;
  "--overview-mobile-canvas-height": string;
};

function currentPathWithSearch() {
  return `${window.location.pathname}${window.location.search}`;
}

function appendCachedRouteQuery(
  target: string,
  queryStringCacheMap: QueryStringCacheMap,
) {
  const route = resolveRoute(target);
  if (!route) return target;

  const targetUrl = new URL(target, window.location.href);
  const cachedQuery = queryStringCacheMap[route.pattern] || {};
  Object.entries(cachedQuery).forEach(([key, value]) => {
    targetUrl.searchParams.set(key, value);
  });

  return `${route.path}${targetUrl.search}`;
}

export default function App() {
  const [pathname, setPathname] = useState(DEFAULT_DEMO_ROUTE_PATH);
  const [currentUrl, setCurrentUrl] = useState(
    DEFAULT_DEMO_ROUTE_PATH,
  );
  const [presenters, setPresenters] = useState<PresenterRecord[]>([]);
  const [modals, setModals] = useState<ModalRecord[]>([]);
  const [inspectionMode, setInspectionMode] =
    useState<InspectionMode>("off");
  const [leavingPresenterPath, setLeavingPresenterPath] = useState<
    string | null
  >(null);
  const [leavingPushedPresenterId, setLeavingPushedPresenterId] = useState<
    string | null
  >(null);
  const [leavingModalId, setLeavingModalId] = useState<number | null>(null);

  const routeStack = useMemo(() => buildRouteStack(pathname), [pathname]);
  const currentRoute = routeStack[routeStack.length - 1];
  const presenterCount = routeStack.length + presenters.length;
  const d3 = inspectionMode !== "off";
  const pathnameRef = useRef(pathname);
  const stageRef = useRef<HTMLDivElement>(null);
  const presentersRef = useRef(presenters);
  const modalsRef = useRef(modals);
  const queryStringCacheMapRef = useRef<QueryStringCacheMap>({});
  const leavingPresenterPathRef = useRef<string | null>(null);
  const leavingPushedPresenterIdRef = useRef<string | null>(null);
  const leavingModalIdRef = useRef<number | null>(null);
  const pendingPresenterNavigationRef =
    useRef<PendingPresenterNavigation | null>(null);
  const pendingPresenterDepthRef = useRef<number | null>(null);
  const pendingFocusedRouteRef = useRef<string | null>(null);
  const presenterCloseCameFromPopRef = useRef(false);
  const pendingModalDepthRef = useRef<number | null>(null);
  const modalCloseCameFromPopRef = useRef(false);
  const previousPresenterCountRef = useRef(presenterCount);
  const previousInspectionModeRef =
    useRef<InspectionMode>(inspectionMode);
  const appContext = useMemo<AppContextValue>(
    () => ({
      get queryStringCacheMap() {
        return queryStringCacheMapRef.current;
      },
      getQueryString(absolutePath: string) {
        const routeQuery =
          typeof window === "undefined"
            ? {}
            : Object.fromEntries(
                new URLSearchParams(window.location.search),
              );
        return {
          ...routeQuery,
          ...(queryStringCacheMapRef.current[absolutePath] || {}),
        };
      },
      setQueryStringCache(
        absolutePath: string,
        query: QueryStringPayload = {},
      ) {
        queryStringCacheMapRef.current[absolutePath] = { ...query };
      },
    }),
    [],
  );

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    presentersRef.current = presenters;
  }, [presenters]);

  useEffect(() => {
    modalsRef.current = modals;
  }, [modals]);

  const commitNavigation = useCallback(
    (target: string, mode: NavigationMode = "push") => {
      const route = resolveRoute(target);
      if (!route) return;
      const targetUrl = new URL(target, window.location.href);
      const targetLocation = `${route.path}${targetUrl.search}`;
      const nextHistoryState = {
        ...window.history.state,
        layeredPresenterDepth: 0,
        layeredModalDepth: 0,
      };

      if (mode === "push") {
        window.history.pushState(
          nextHistoryState,
          "",
          targetLocation,
        );
      } else {
        window.history.replaceState(
          nextHistoryState,
          "",
          targetLocation,
        );
      }

      presentersRef.current = [];
      modalsRef.current = [];
      pendingFocusedRouteRef.current = null;
      pathnameRef.current = route.path;
      setPresenters([]);
      setModals([]);
      setPathname(route.path);
      setCurrentUrl(window.location.href);
    },
    [],
  );

  const startPresenterLeave = useCallback(
    (target: string, mode: NavigationMode = "replace") => {
      const route = resolveRoute(target);
      const currentPath = pathnameRef.current;
      if (
        !route ||
        route.path === currentPath ||
        leavingPresenterPathRef.current
      ) {
        return;
      }

      pendingPresenterNavigationRef.current = {
        path: target,
        mode,
      };
      leavingPresenterPathRef.current = currentPath;
      setLeavingPresenterPath(currentPath);
    },
    [],
  );

  const finishPresenterLeave = useCallback(
    (path: string) => {
      if (leavingPresenterPathRef.current !== path) return;
      const pending = pendingPresenterNavigationRef.current;

      leavingPresenterPathRef.current = null;
      pendingPresenterNavigationRef.current = null;
      setLeavingPresenterPath(null);

      if (pending) {
        const target = appendCachedRouteQuery(
          pending.path,
          queryStringCacheMapRef.current,
        );
        commitNavigation(target, pending.mode);
      }
    },
    [commitNavigation],
  );

  const navigate = useCallback((target: string) => {
    const route = resolveRoute(target);
    const currentPath = pathnameRef.current;
    if (!route || route.path === currentPath) return;

    const mountedParent = buildRouteStack(currentPath).some(
      (item) => item.path === route.path,
    );
    if (mountedParent) {
      startPresenterLeave(route.path, "replace");
      return;
    }
    commitNavigation(route.path, "push");
  }, [commitNavigation, startPresenterLeave]);

  const pushPresenter = useCallback(() => {
    if (
      leavingPresenterPathRef.current ||
      leavingPushedPresenterIdRef.current ||
      leavingModalIdRef.current
    ) {
      return;
    }

    const currentPresenters = presentersRef.current;
    const nextPresenters = [
      ...currentPresenters,
      createPresenterRecord(currentPresenters, window.location.href),
    ];

    // Matches context.presenter.push: reserve history without changing the URL.
    window.history.pushState(
      {
        ...window.history.state,
        layeredPresenterDepth: nextPresenters.length,
      },
      "",
      currentPathWithSearch(),
    );
    presentersRef.current = nextPresenters;
    setPresenters(nextPresenters);
  }, []);

  const startPushedPresenterLeave = useCallback(
    (targetDepth?: number, cameFromPop = false) => {
      const currentPresenters = presentersRef.current;
      if (
        !currentPresenters.length ||
        leavingPushedPresenterIdRef.current
      ) {
        return;
      }

      const depth = Math.max(
        0,
        targetDepth ?? currentPresenters.length - 1,
      );
      const topPresenter =
        currentPresenters[currentPresenters.length - 1];

      pendingPresenterDepthRef.current = depth;
      presenterCloseCameFromPopRef.current = cameFromPop;
      leavingPushedPresenterIdRef.current = topPresenter.id;
      setLeavingPushedPresenterId(topPresenter.id);
    },
    [],
  );

  const finishPushedPresenterLeave = useCallback((id: string) => {
    if (leavingPushedPresenterIdRef.current !== id) return;

    const remaining = presentersRef.current.filter(
      (item) => item.id !== id,
    );
    const targetDepth =
      pendingPresenterDepthRef.current ?? Math.max(0, remaining.length);
    const cameFromPop = presenterCloseCameFromPopRef.current;

    presentersRef.current = remaining;
    leavingPushedPresenterIdRef.current = null;
    setPresenters(remaining);
    setLeavingPushedPresenterId(null);

    if (remaining.length > targetDepth) {
      const nextPresenter = remaining[remaining.length - 1];
      leavingPushedPresenterIdRef.current = nextPresenter.id;
      setLeavingPushedPresenterId(nextPresenter.id);
      return;
    }

    pendingPresenterDepthRef.current = null;
    presenterCloseCameFromPopRef.current = false;

    const historyDepth = Number(
      window.history.state?.layeredPresenterDepth || 0,
    );
    if (!cameFromPop && historyDepth > remaining.length) {
      window.history.go(remaining.length - historyDepth);
    }
  }, []);

  const focusRoutePresenter = useCallback(
    (target: string) => {
      if (
        leavingPresenterPathRef.current ||
        leavingPushedPresenterIdRef.current ||
        leavingModalIdRef.current
      ) {
        return;
      }

      if (presentersRef.current.length) {
        pendingFocusedRouteRef.current = target;
        startPushedPresenterLeave(0, false);
        return;
      }

      navigate(target);
    },
    [navigate, startPushedPresenterLeave],
  );

  const focusPushedPresenter = useCallback(
    (index: number) => {
      const targetDepth = index + 1;
      if (targetDepth >= presentersRef.current.length) return;
      startPushedPresenterLeave(targetDepth, false);
    },
    [startPushedPresenterLeave],
  );

  const openModal = useCallback(() => {
    if (
      leavingModalIdRef.current ||
      leavingPresenterPathRef.current ||
      leavingPushedPresenterIdRef.current
    ) {
      return;
    }

    const currentModals = modalsRef.current;
    const nextDepth = currentModals.length + 1;
    const nextModals = [
      ...currentModals,
      createModalRecord(currentModals),
    ];
    window.history.pushState(
      { ...window.history.state, layeredModalDepth: nextDepth },
      "",
      currentPathWithSearch(),
    );
    modalsRef.current = nextModals;
    setModals(nextModals);
  }, []);

  const startModalLeave = useCallback(
    (targetDepth?: number, cameFromPop = false) => {
      const currentModals = modalsRef.current;
      if (!currentModals.length || leavingModalIdRef.current) return;

      const depth = Math.max(
        0,
        targetDepth ?? currentModals.length - 1,
      );
      const topModal = currentModals[currentModals.length - 1];

      pendingModalDepthRef.current = depth;
      modalCloseCameFromPopRef.current = cameFromPop;
      leavingModalIdRef.current = topModal.id;
      setLeavingModalId(topModal.id);
    },
    [],
  );

  const closeTopModal = useCallback(() => {
    startModalLeave(undefined, false);
  }, [startModalLeave]);

  const finishModalLeave = useCallback((id: number) => {
    if (leavingModalIdRef.current !== id) return;

    const remaining = modalsRef.current.filter((item) => item.id !== id);
    const targetDepth =
      pendingModalDepthRef.current ?? Math.max(0, remaining.length);
    const cameFromPop = modalCloseCameFromPopRef.current;

    modalsRef.current = remaining;
    leavingModalIdRef.current = null;
    setModals(remaining);
    setLeavingModalId(null);

    if (remaining.length > targetDepth) {
      const nextModal = remaining[remaining.length - 1];
      leavingModalIdRef.current = nextModal.id;
      setLeavingModalId(nextModal.id);
      return;
    }

    pendingModalDepthRef.current = null;
    modalCloseCameFromPopRef.current = false;

    if (
      !cameFromPop &&
      Number(window.history.state?.layeredModalDepth || 0) > remaining.length
    ) {
      window.history.back();
    }
  }, []);

  const navigateToParent = useCallback(() => {
    if (modalsRef.current.length) {
      closeTopModal();
      return;
    }
    if (presentersRef.current.length) {
      startPushedPresenterLeave();
      return;
    }
    const route = resolveRoute(pathnameRef.current);
    if (route?.parentPath) {
      startPresenterLeave(route.parentPath, "replace");
    }
  }, [closeTopModal, startPresenterLeave, startPushedPresenterLeave]);

  const pushNext = useCallback(() => {
    const route = resolveRoute(pathnameRef.current);
    if (route?.nextPath) {
      navigate(route.nextPath);
      return;
    }
    pushPresenter();
  }, [navigate, pushPresenter]);

  const cycleInspectionMode = useCallback(() => {
    setInspectionMode((current) =>
      current === "off"
        ? "stack"
        : current === "stack"
          ? "grid"
          : "off",
    );
  }, []);

  useEffect(() => {
    const requestedPath =
      window.location.pathname === "/"
        ? DEFAULT_DEMO_ROUTE_PATH
        : window.location.pathname;
    const initialRoute = resolveRoute(requestedPath);
    const initialPath = initialRoute
      ? initialRoute.path
      : normalizePath(DEFAULT_DEMO_ROUTE_PATH);
    const initialLocation = `${initialPath}${window.location.search}`;

    window.history.replaceState(
      {
        ...window.history.state,
        layeredPresenterDepth: 0,
        layeredModalDepth: 0,
      },
      "",
      initialLocation,
    );
    const timer = window.setTimeout(() => {
      pathnameRef.current = initialPath;
      setPathname(initialPath);
      setCurrentUrl(window.location.href);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const nextPath =
        resolveRoute(window.location.pathname)?.path || "/products";
      const presenterDepth = Number(
        event.state?.layeredPresenterDepth || 0,
      );
      const modalDepth = Number(event.state?.layeredModalDepth || 0);
      setCurrentUrl(window.location.href);

      if (modalsRef.current.length > modalDepth) {
        startModalLeave(modalDepth, true);
        return;
      }

      if (presentersRef.current.length > presenterDepth) {
        startPushedPresenterLeave(presenterDepth, true);
        return;
      }

      if (presentersRef.current.length < presenterDepth) {
        const restored = [...presentersRef.current];
        while (restored.length < presenterDepth) {
          restored.push(
            createPresenterRecord(restored, window.location.href),
          );
        }
        presentersRef.current = restored;
        setPresenters(restored);
      }

      if (modalsRef.current.length < modalDepth) {
        const restored = [...modalsRef.current];
        while (restored.length < modalDepth) {
          restored.push(createModalRecord(restored));
        }
        modalsRef.current = restored;
        setModals(restored);
      }

      const currentPath = pathnameRef.current;
      if (nextPath === currentPath) {
        const focusedRoute = pendingFocusedRouteRef.current;
        if (
          focusedRoute &&
          presentersRef.current.length === presenterDepth
        ) {
          pendingFocusedRouteRef.current = null;
          navigate(focusedRoute);
        }
        return;
      }

      const isMountedParent = buildRouteStack(currentPath).some(
        (item) => item.path === nextPath,
      );
      if (isMountedParent) {
        startPresenterLeave(nextPath, "pop");
      } else {
        commitNavigation(nextPath, "pop");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    commitNavigation,
    navigate,
    startModalLeave,
    startPresenterLeave,
    startPushedPresenterLeave,
  ]);

  useEffect(() => {
    document.title = `presenter-${routeStack.length + presenters.length} · Layered Route Lab`;
  }, [presenters.length, routeStack.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        navigateToParent();
        return;
      }
      if (keyboardTargetIsEditable(event.target)) return;

      if (event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        openModal();
      }
      if (event.shiftKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        pushNext();
      }
      if (event.shiftKey && event.code === "Space") {
        event.preventDefault();
        cycleInspectionMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cycleInspectionMode,
    navigateToParent,
    openModal,
    pushNext,
  ]);

  useEffect(() => {
    const previousCount = previousPresenterCountRef.current;
    const previousMode = previousInspectionModeRef.current;
    const stage = stageRef.current;
    let frame: number | null = null;

    if (
      stage &&
      inspectionMode === "grid" &&
      presenterCount > 9 &&
      (presenterCount > previousCount || previousMode !== "grid")
    ) {
      frame = requestAnimationFrame(() => {
        stage.scrollTo({
          top: stage.scrollHeight,
          // Keep viewport placement separate from the tile transition. A
          // simultaneous smooth scroll makes the whole 3D scene appear to
          // shudder while each presenter is moving into its grid slot.
          behavior: "auto",
        });
      });
    } else if (stage && inspectionMode !== "grid") {
      stage.scrollTop = 0;
    }

    previousPresenterCountRef.current = presenterCount;
    previousInspectionModeRef.current = inspectionMode;
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [inspectionMode, presenterCount]);

  const activeSurfaceCount = presenterCount + modals.length;
  const leavingModalIndex =
    leavingModalId === null
      ? undefined
      : modals.findIndex((modal) => modal.id === leavingModalId);
  const lastModal = modals[modals.length - 1];
  const overviewRows = Math.ceil(Math.max(1, presenterCount) / 3);
  const mobileOverviewRows = Math.ceil(
    Math.max(1, presenterCount) / 2,
  );
  const presenterCanvasStyle: PresenterCanvasStyle = {
    "--overview-canvas-height": `${Math.max(1, overviewRows / 3) * 100}%`,
    "--overview-mobile-canvas-height": `${
      Math.max(1, mobileOverviewRows / 5) * 100
    }%`,
  };
  const inspectionLabel =
    inspectionMode === "off"
      ? "Inspect 3D"
      : inspectionMode === "stack"
        ? "3D · Stack"
        : "3D · Grid";

  return (
    <AppContext.Provider value={appContext}>
      <main className="workbench">
        <section className="content-shell">
          <header className="workbench-bar">
            <div className="crumb">
              <span>route</span>
              <code>{currentRoute.path}</code>
            </div>
            <div className="bar-actions" aria-label="Layer controls">
              <button type="button" onClick={pushNext}>
                <span>Push page</span>
                <kbd>⇧ N</kbd>
              </button>
              <button type="button" onClick={openModal}>
                <span>Derive modal</span>
                <kbd>⇧ M</kbd>
              </button>
              <button
                type="button"
                className={d3 ? "active" : ""}
                aria-pressed={d3}
                onClick={cycleInspectionMode}
              >
                <span>{inspectionLabel}</span>
                <kbd>⇧ Space</kbd>
              </button>
              <button
                type="button"
                disabled={
                  !currentRoute.parentPath &&
                  !presenters.length &&
                  !modals.length
                }
                onClick={navigateToParent}
              >
                <span>Back</span>
                <kbd>Esc</kbd>
              </button>
            </div>
          </header>

          <div
            className="stage"
            data-d3={d3}
            data-d3-mode={inspectionMode}
            ref={stageRef}
          >
            <div className="stage-grid" aria-hidden="true" />
            <div
              className="presenter-canvas"
              style={presenterCanvasStyle}
            >
              {routeStack.map((route, index) => (
                <Presenter
                  key={route.path}
                  surfaceId={route.path}
                  index={index}
                  total={presenterCount}
                  currentUrl={currentUrl}
                  lastRouteUrl={resolveRouteUrl(
                    route.path,
                    currentUrl,
                  )}
                  currentDepth={index + 1}
                  route={route}
                  reconstructible
                  isTop={
                    index === routeStack.length - 1 &&
                    !presenters.length &&
                    !modals.length
                  }
                  inspectionMode={inspectionMode}
                  leaving={leavingPresenterPath === route.path}
                  onDidLeave={finishPresenterLeave}
                  onSelect={() => focusRoutePresenter(route.path)}
                  onPush={pushNext}
                />
              ))}

              {presenters.map((presenter) => {
                const presenterIndex =
                  routeStack.length + presenter.index;
                return (
                  <Presenter
                    key={presenter.id}
                    surfaceId={presenter.id}
                    index={presenterIndex}
                    total={presenterCount}
                    currentUrl={currentUrl}
                    lastRouteUrl={presenter.lastRouteUrl}
                    currentDepth={presenterIndex + 1}
                    reconstructible={false}
                    isTop={
                      presenter.index === presenters.length - 1 &&
                      !modals.length
                    }
                    inspectionMode={inspectionMode}
                    leaving={
                      presenter.id === leavingPushedPresenterId
                    }
                    onDidLeave={finishPushedPresenterLeave}
                    onSelect={() =>
                      focusPushedPresenter(presenter.index)
                    }
                    onPush={pushNext}
                  />
                );
              })}
            </div>

            {modals.map((modal, index) => (
              <Modal
                key={modal.id}
                modal={modal}
                index={modal.index}
                total={modals.length}
                leaving={modal.id === leavingModalId}
                leavingIndex={leavingModalIndex}
                showMask={index === 0 || Boolean(modals[index - 1]?.full)}
                lastSize={
                  lastModal
                    ? { width: lastModal.width, height: lastModal.height }
                    : { width: modal.width, height: modal.height }
                }
                isTop={index === modals.length - 1}
                onClose={closeTopModal}
                onDidLeave={finishModalLeave}
              />
            ))}

            <div className="stack-readout" aria-live="polite">
              <span className={d3 ? "live" : ""} />
              {activeSurfaceCount} surface
              {activeSurfaceCount === 1 ? "" : "s"}
              {d3 ? ` / 3D ${inspectionMode}` : ""}
            </div>
          </div>
        </section>
      </main>
    </AppContext.Provider>
  );
}
