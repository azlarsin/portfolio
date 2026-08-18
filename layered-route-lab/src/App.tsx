"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Modal, { type ModalRecord } from "./core/Modal";
import Presenter from "./core/Presenter";
import ExperienceGuide from "./ExperienceGuide";
import RouteRail from "./RouteRail";
import AgentDemoOverlay from "./agent/AgentDemoOverlay";
import {
  APP_INSPECTION_SETTLE_MS,
  APP_NORMAL_SETTLE_MS,
  APP_SURFACE_SETTLE_MS,
  LAB_AGENT_COMMAND_EVENT,
  respondToLabAgent,
  type LabAgentCommandRequest,
} from "./agent/appBridge";
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
import {
  createBrowserLocation,
  getRouteLocationFromBrowserUrl,
  getRoutePathFromBrowserUrl,
} from "./router/browserLocation";
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
type AgentPlaybackMode = "normal" | "paced";
const LOCATION_CHANGE_EVENT = "layered-route-lab:location-change";
const GUIDE_SESSION_KEY = "layered-route-lab:guide-seen:v1";

interface PendingPresenterNavigation {
  path: string;
  mode: NavigationMode;
}

type PresenterCanvasStyle = CSSProperties & {
  "--overview-canvas-height": string;
  "--overview-mobile-canvas-height": string;
};

interface AppProps {
  initialPathname?: string;
  initialLocation?: string;
}

function resolveInitialPathname(pathname: string) {
  const requestedPath = pathname === "/"
    ? DEFAULT_DEMO_ROUTE_PATH
    : pathname;
  return resolveRoute(requestedPath)?.path ||
    normalizePath(DEFAULT_DEMO_ROUTE_PATH);
}

function currentBrowserLocation() {
  return `${window.location.pathname}${window.location.search}`;
}

function subscribeToLocationChange(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(LOCATION_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(LOCATION_CHANGE_EVENT, onStoreChange);
  };
}

function getBrowserLocation() {
  return window.location.href;
}

function notifyLocationChange() {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
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

export default function App({
  initialPathname = DEFAULT_DEMO_ROUTE_PATH,
  initialLocation: initialLocationProp,
}: AppProps) {
  const initialPath = typeof window === "undefined"
    ? resolveInitialPathname(initialPathname)
    : getRoutePathFromBrowserUrl();
  const initialLocation = initialLocationProp || initialPath;
  const [pathname, setPathname] = useState(initialPath);
  const currentUrl = useSyncExternalStore(
    subscribeToLocationChange,
    getBrowserLocation,
    () => initialLocation,
  );
  const [presenters, setPresenters] = useState<PresenterRecord[]>([]);
  const [modals, setModals] = useState<ModalRecord[]>([]);
  const [inspectionMode, setInspectionMode] =
    useState<InspectionMode>("off");
  const [agentPlaybackMode, setAgentPlaybackMode] =
    useState<AgentPlaybackMode>("paced");
  const [guideOpen, setGuideOpen] = useState(false);
  const [agentOpenRequest, setAgentOpenRequest] = useState(0);
  const embedded = new URL(currentUrl, "http://localhost").searchParams.get(
    "embed",
  ) === "1";
  const [leavingPresenterPath, setLeavingPresenterPath] = useState<
    string | null
  >(null);
  const [leavingPushedPresenterId, setLeavingPushedPresenterId] = useState<
    string | null
  >(null);
  const [leavingModalId, setLeavingModalId] = useState<number | null>(null);
  const [modalFocusSequence, setModalFocusSequence] = useState(0);

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
  const pendingPresenterHistoryStepsRef = useRef(0);
  const pendingFocusedRouteRef = useRef<string | null>(null);
  const presenterCloseCameFromPopRef = useRef(false);
  const pendingModalDepthRef = useRef<number | null>(null);
  const pendingModalHistoryStepsRef = useRef(0);
  const modalCloseCameFromPopRef = useRef(false);
  const pendingModalFocusIdRef = useRef<number | null>(null);
  const modalFocusSequenceRef = useRef(0);
  const ignoreNextOverlayPopRef = useRef(false);
  const previousPresenterCountRef = useRef(presenterCount);
  const previousInspectionModeRef =
    useRef<InspectionMode>(inspectionMode);
  const agentPlaybackModeRef = useRef<AgentPlaybackMode>("paced");
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
    if (embedded) {
      const timer = window.setTimeout(() => setGuideOpen(false), 0);
      return () => window.clearTimeout(timer);
    }

    const params = new URLSearchParams(window.location.search);
    const shouldOpen = params.get("guide") === "1" || (
      params.get("agent_demo") !== "1" &&
      !params.has("agent_cmd") &&
      window.sessionStorage.getItem(GUIDE_SESSION_KEY) !== "seen"
    );
    if (!shouldOpen) return;
    const timer = window.setTimeout(() => setGuideOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [embedded]);

  useEffect(() => {
    presentersRef.current = presenters;
  }, [presenters]);

  useEffect(() => {
    modalsRef.current = modals;
    if (!modals.length) {
      pendingModalFocusIdRef.current = null;
    }
  }, [modals]);

  const resetModalClosePlan = useCallback(() => {
    leavingModalIdRef.current = null;
    pendingModalDepthRef.current = null;
    pendingModalHistoryStepsRef.current = 0;
    modalCloseCameFromPopRef.current = false;
    pendingModalFocusIdRef.current = null;
    setLeavingModalId(null);
  }, []);

  const commitNavigation = useCallback(
    (target: string, mode: NavigationMode = "push") => {
      const route = resolveRoute(target);
      if (!route) return;
      resetModalClosePlan();
      const targetUrl = new URL(target, window.location.href);
      const targetLocation = createBrowserLocation(
        `${route.path}${targetUrl.search}`,
      );
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
      notifyLocationChange();

      presentersRef.current = [];
      modalsRef.current = [];
      pendingModalFocusIdRef.current = null;
      pendingFocusedRouteRef.current = null;
      pathnameRef.current = route.path;
      setPresenters([]);
      setModals([]);
      setPathname(route.path);
    },
    [resetModalClosePlan],
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

    // Matches src_v3 App: reserve an empty history slot at the same URL.
    window.history.pushState(null, "", currentBrowserLocation());
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
      pendingPresenterHistoryStepsRef.current = cameFromPop
        ? 0
        : currentPresenters.length - depth;
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

    const historySteps = pendingPresenterHistoryStepsRef.current;
    pendingPresenterHistoryStepsRef.current = 0;
    if (!cameFromPop && historySteps > 0) {
      ignoreNextOverlayPopRef.current = true;
      window.history.go(-historySteps);
    }
  }, []);

  const closeUntilUid = useCallback(
    (uid: string) => {
      if (
        leavingPresenterPathRef.current ||
        leavingPushedPresenterIdRef.current ||
        leavingModalIdRef.current
      ) {
        return;
      }

      const pushedPresenterIndex = presentersRef.current.findIndex(
        (presenter) => presenter.id === uid,
      );
      if (pushedPresenterIndex >= 0) {
        const targetDepth = pushedPresenterIndex + 1;
        if (targetDepth < presentersRef.current.length) {
          startPushedPresenterLeave(targetDepth, false);
        }
        return;
      }

      const targetRoute = buildRouteStack(pathnameRef.current).find(
        (route) => route.path === uid,
      );
      if (!targetRoute) return;

      if (presentersRef.current.length) {
        pendingFocusedRouteRef.current = targetRoute.path;
        startPushedPresenterLeave(0, false);
        return;
      }

      navigate(targetRoute.path);
    },
    [navigate, startPushedPresenterLeave],
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
    const nextModals = [
      ...currentModals,
      createModalRecord(currentModals),
    ];
    window.history.pushState(null, "", currentBrowserLocation());
    modalsRef.current = nextModals;
    setModals(nextModals);
  }, []);

  const startModalLeave = useCallback(
    (targetDepth?: number, cameFromPop = false) => {
      const currentModals = modalsRef.current;
      if (!currentModals.length) return;

      if (leavingModalIdRef.current) {
        if (!cameFromPop) return;
        pendingModalDepthRef.current = Math.max(
          0,
          targetDepth ?? currentModals.length - 1,
        );
        pendingModalHistoryStepsRef.current = 0;
        modalCloseCameFromPopRef.current = true;
        pendingModalFocusIdRef.current = null;
        return;
      }

      const depth = Math.max(
        0,
        targetDepth ?? currentModals.length - 1,
      );
      const topModal = currentModals[currentModals.length - 1];

      pendingModalDepthRef.current = depth;
      pendingModalHistoryStepsRef.current = cameFromPop
        ? 0
        : currentModals.length - depth;
      modalCloseCameFromPopRef.current = cameFromPop;
      leavingModalIdRef.current = topModal.id;
      setLeavingModalId(topModal.id);
    },
    [],
  );

  const closeTopModal = useCallback(() => {
    startModalLeave(undefined, false);
  }, [startModalLeave]);

  const selectModal = useCallback(
    (id: number) => {
      if (leavingModalIdRef.current) return;

      const currentModals = modalsRef.current;
      const targetIndex = currentModals.findIndex((modal) => modal.id === id);
      if (targetIndex === -1) return;

      if (targetIndex === currentModals.length - 1) {
        pendingModalFocusIdRef.current = null;
        setModalFocusSequence(++modalFocusSequenceRef.current);
        return;
      }

      pendingModalFocusIdRef.current = id;
      startModalLeave(targetIndex + 1, false);
    },
    [startModalLeave],
  );

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

    const focusedModalId = pendingModalFocusIdRef.current;
    const topModal = remaining[remaining.length - 1];
    if (focusedModalId !== null && topModal?.id === focusedModalId) {
      pendingModalFocusIdRef.current = null;
      setModalFocusSequence(++modalFocusSequenceRef.current);
    } else if (
      focusedModalId !== null &&
      !remaining.some((modal) => modal.id === focusedModalId)
    ) {
      pendingModalFocusIdRef.current = null;
    }

    const historySteps = pendingModalHistoryStepsRef.current;
    pendingModalHistoryStepsRef.current = 0;
    if (!cameFromPop && historySteps > 0) {
      ignoreNextOverlayPopRef.current = true;
      window.history.go(-historySteps);
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

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    window.sessionStorage.setItem(GUIDE_SESSION_KEY, "seen");
  }, []);

  const openAgentFromGuide = useCallback(() => {
    closeGuide();
    setAgentOpenRequest((request) => request + 1);
  }, [closeGuide]);

  useEffect(() => {
    const pendingResponses = new Map<number, string>();

    const respondAfter = (requestId: string, duration: number) => {
      const responseTimer = window.setTimeout(() => {
        pendingResponses.delete(responseTimer);
        respondToLabAgent({ requestId, ok: true });
      }, duration);
      pendingResponses.set(responseTimer, requestId);
    };

    const releasePendingResponses = () => {
      pendingResponses.forEach((requestId, timer) => {
        window.clearTimeout(timer);
        respondToLabAgent({ requestId, ok: true });
      });
      pendingResponses.clear();
    };

    const handleAgentCommand = (event: Event) => {
      const request = (event as CustomEvent<LabAgentCommandRequest>).detail;
      if (!request?.requestId || !request.command) return;

      let settleDuration = agentPlaybackModeRef.current === "paced"
        ? APP_SURFACE_SETTLE_MS
        : APP_NORMAL_SETTLE_MS;
      try {
        switch (request.command.type) {
          case "route.navigate": {
            if (!resolveRoute(request.command.target)) {
              throw new Error("宿主 App 无法解析目标路由");
            }
            commitNavigation(request.command.target, request.command.mode);
            break;
          }
          case "presenter.advance":
            pushNext();
            break;
          case "modal.open":
            openModal();
            break;
          case "inspection.set":
            settleDuration = agentPlaybackModeRef.current === "paced"
              ? APP_INSPECTION_SETTLE_MS
              : APP_NORMAL_SETTLE_MS;
            setInspectionMode(request.command.target);
            break;
          case "inspection.cycle":
            settleDuration = agentPlaybackModeRef.current === "paced"
              ? APP_INSPECTION_SETTLE_MS
              : APP_NORMAL_SETTLE_MS;
            cycleInspectionMode();
            break;
          case "playback.set":
            agentPlaybackModeRef.current = request.command.paced
              ? "paced"
              : "normal";
            setAgentPlaybackMode(agentPlaybackModeRef.current);
            if (!request.command.paced) releasePendingResponses();
            settleDuration = 0;
            break;
        }
      } catch (error) {
        respondToLabAgent({
          requestId: request.requestId,
          ok: false,
          error: error instanceof Error ? error.message : "宿主命令执行失败",
        });
        return;
      }

      respondAfter(request.requestId, settleDuration);
    };

    window.addEventListener(LAB_AGENT_COMMAND_EVENT, handleAgentCommand);
    return () => {
      window.removeEventListener(LAB_AGENT_COMMAND_EVENT, handleAgentCommand);
      pendingResponses.forEach((_, timer) => window.clearTimeout(timer));
    };
  }, [commitNavigation, cycleInspectionMode, openModal, pushNext]);

  useEffect(() => {
    const initialPath = getRoutePathFromBrowserUrl();
    const initialLocation = createBrowserLocation(
      getRouteLocationFromBrowserUrl(),
    );

    window.history.replaceState(
      {
        ...window.history.state,
        layeredPresenterDepth: 0,
        layeredModalDepth: 0,
      },
      "",
      initialLocation,
    );
    notifyLocationChange();
    pathnameRef.current = initialPath;
  }, [initialPath]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const nextPath = getRoutePathFromBrowserUrl();
      const nextLocation = getRouteLocationFromBrowserUrl();
      const currentPath = pathnameRef.current;

      if (ignoreNextOverlayPopRef.current) {
        ignoreNextOverlayPopRef.current = false;
        if (nextPath === currentPath) {
          const focusedRoute = pendingFocusedRouteRef.current;
          if (focusedRoute) {
            pendingFocusedRouteRef.current = null;
            navigate(focusedRoute);
          }
          return;
        }
      }

      const hasLayeredDepth =
        Number.isFinite(event.state?.layeredPresenterDepth) &&
        Number.isFinite(event.state?.layeredModalDepth);
      const presenterDepth = hasLayeredDepth
        ? Number(event.state.layeredPresenterDepth)
        : Math.max(
            0,
            presentersRef.current.length -
              (modalsRef.current.length ? 0 : 1),
          );
      const modalDepth = hasLayeredDepth
        ? Number(event.state.layeredModalDepth)
        : Math.max(0, modalsRef.current.length - 1);

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
        startPresenterLeave(nextLocation, "pop");
      } else {
        commitNavigation(nextLocation, "pop");
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
  const temporaryPresenterLayers = presenters.map((presenter) => ({
    uid: presenter.id,
    label: `presenter-${routeStack.length + presenter.index + 1}`,
  }));
  const leavingModalIndex =
    leavingModalId === null
      ? undefined
      : modals.findIndex((modal) => modal.id === leavingModalId);
  const lastModal = modals[modals.length - 1];
  const overviewRows = Math.ceil(Math.max(1, presenterCount) / 3);
  const mobileOverviewRows = Math.max(1, presenterCount);
  const presenterCanvasStyle: PresenterCanvasStyle = {
    "--overview-canvas-height": `${Math.max(1, overviewRows / 3) * 100}%`,
    "--overview-mobile-canvas-height": `${
      Math.max(1, mobileOverviewRows / 2) * 100
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
      <main className="workbench" data-agent-playback={agentPlaybackMode}>
        <RouteRail
          routeStack={routeStack}
          temporaryPresenters={temporaryPresenterLayers}
          activeSurfaceCount={activeSurfaceCount}
          onNavigateRoute={navigate}
          onCloseUntilUid={closeUntilUid}
        />
        <section className="content-shell">
          <header className="workbench-bar">
            <div className="crumb">
              <span>route</span>
              <code>{currentRoute.path}</code>
            </div>
            <div className="bar-actions" aria-label="Layer controls">
              {!embedded && (
                <button
                  type="button"
                  className={`guide-trigger ${guideOpen ? "active" : ""}`}
                  aria-expanded={guideOpen}
                  aria-controls="experience-guide"
                  onClick={() => {
                    if (guideOpen) closeGuide();
                    else setGuideOpen(true);
                  }}
                >
                  <span>Guide</span>
                  <kbd>2 min</kbd>
                </button>
              )}
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
                className="escape-action"
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

          {!embedded && (
            <ExperienceGuide
              open={guideOpen}
              routePath={currentRoute.path}
              routeDepth={routeStack.length}
              temporaryPresenterDepth={presenters.length}
              modalDepth={modals.length}
              inspectionMode={inspectionMode}
              canAdvanceRoute={Boolean(currentRoute.nextPath)}
              onClose={closeGuide}
              onAdvanceRoute={() => {
                if (currentRoute.nextPath) navigate(currentRoute.nextPath);
              }}
              onPushTemporaryPresenter={pushPresenter}
              onOpenModal={openModal}
              onCycleInspection={cycleInspectionMode}
              onOpenAgent={openAgentFromGuide}
            />
          )}

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
                  onSelect={() => closeUntilUid(route.path)}
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
                    onSelect={() => closeUntilUid(presenter.id)}
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
                modalPrefix={modals.slice(0, index + 1)}
                leaving={modal.id === leavingModalId}
                leavingIndex={leavingModalIndex}
                showMask={index === 0 || Boolean(modals[index - 1]?.full)}
                lastSize={
                  lastModal
                    ? { width: lastModal.width, height: lastModal.height }
                    : { width: modal.width, height: modal.height }
                }
                isTop={index === modals.length - 1}
                focusSequence={modalFocusSequence}
                onClose={closeTopModal}
                onSelectModal={selectModal}
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
        <AgentDemoOverlay
          openRequest={agentOpenRequest}
          onOpenGuide={embedded ? undefined : () => setGuideOpen(true)}
        />
      </main>
    </AppContext.Provider>
  );
}
