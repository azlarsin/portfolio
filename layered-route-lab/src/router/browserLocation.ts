import {
  DEFAULT_DEMO_ROUTE_PATH,
  normalizePath,
  resolveRoute,
} from "./routes";

/**
 * The static build intentionally keeps every navigation on its one HTML entry.
 * The reconstructible route lives in the address bar as `?route=/…`, so a
 * refresh or a copied URL has all the state needed to restore the route stack.
 */
export const STATIC_ROUTE_QUERY_PARAM = "route";

export function isStaticDemoBuild() {
  return import.meta.env.VITE_STATIC_DEMO === "1";
}

function currentUrl() {
  return new URL(window.location.href);
}

function normalizeRoutePath(pathname: string) {
  return resolveRoute(pathname)?.path || normalizePath(DEFAULT_DEMO_ROUTE_PATH);
}

function encodeReadableRoutePath(routePath: string) {
  return encodeURIComponent(routePath).replace(/%2F/gi, "/");
}

export function getRoutePathFromBrowserUrl(url = currentUrl()) {
  const requestedPath = isStaticDemoBuild()
    ? url.searchParams.get(STATIC_ROUTE_QUERY_PARAM) || DEFAULT_DEMO_ROUTE_PATH
    : url.pathname;

  return normalizeRoutePath(requestedPath);
}

/** The logical route and its route-specific query, excluding static transport. */
export function getRouteLocationFromBrowserUrl(url = currentUrl()) {
  const routePath = getRoutePathFromBrowserUrl(url);
  const params = new URLSearchParams(url.searchParams);
  params.delete(STATIC_ROUTE_QUERY_PARAM);
  const search = params.toString();
  return `${routePath}${search ? `?${search}` : ""}`;
}

const PRESERVED_SHELL_QUERY_PARAMS = ["embed", "agent_demo"] as const;

function mergeShellQueryParams(
  targetParams: URLSearchParams,
  browserParams: URLSearchParams,
) {
  PRESERVED_SHELL_QUERY_PARAMS.forEach((key) => {
    if (!targetParams.has(key) && browserParams.has(key)) {
      targetParams.set(key, browserParams.get(key) || "");
    }
  });
}

/**
 * Converts an in-app route such as `/products?agent_demo=1` to the address
 * that can be pushed into browser history. In a static build this remains the
 * current `index.html` path and stores the route in a query parameter.
 */
export function createBrowserLocation(target: string) {
  const targetUrl = new URL(target, window.location.origin);
  const routePath = normalizeRoutePath(targetUrl.pathname);
  const targetParams = new URLSearchParams(targetUrl.searchParams);
  mergeShellQueryParams(targetParams, currentUrl().searchParams);

  if (!isStaticDemoBuild()) {
    const search = targetParams.toString();
    return `${routePath}${search ? `?${search}` : ""}`;
  }

  const browserUrl = currentUrl();
  browserUrl.hash = "";
  browserUrl.search = "";
  targetParams.delete(STATIC_ROUTE_QUERY_PARAM);
  const search = targetParams.toString();
  browserUrl.search = `?${STATIC_ROUTE_QUERY_PARAM}=${encodeReadableRoutePath(routePath)}${
    search ? `&${search}` : ""
  }`;
  return `${browserUrl.pathname}${browserUrl.search}`;
}
