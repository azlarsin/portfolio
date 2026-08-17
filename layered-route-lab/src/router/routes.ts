export type RouteParams = Record<string, string>;

export type RouteId =
  | "products"
  | "product"
  | "product-settings"
  | "product-orders"
  | "product-order"
  | "product-order-edit"
  | "product-orders-paid"
  | "product-paid-order"
  | "employees"
  | "employee"
  | "employee-orders"
  | "employee-order";

export interface RouteDefinition {
  id: RouteId;
  pattern: string;
  eyebrow: string;
  title: (params: RouteParams) => string;
  parent: (params: RouteParams) => string | null;
  next: (params: RouteParams) => string | null;
}

export interface ResolvedRoute {
  id: RouteId;
  path: string;
  pattern: string;
  params: RouteParams;
  eyebrow: string;
  title: string;
  parentPath: string | null;
  nextPath: string | null;
}

export const DEFAULT_DEMO_ROUTE_PATH = "/product/1/order/2/edit";

export interface DemoRouteNode {
  path: string;
  children?: readonly DemoRouteNode[];
}

export const DEMO_ROUTE_TREE: readonly DemoRouteNode[] = [
  {
    path: "/products",
    children: [
      {
        path: "/product/1",
        children: [
          {
            path: "/product/1/orders",
            children: [
              {
                path: "/product/1/order/2",
                children: [
                  { path: "/product/1/order/2/edit" },
                ],
              },
              { path: "/product/1/order/123" },
            ],
          },
          { path: "/product/1/settings" },
          {
            path: "/product/1/orders/paid",
            children: [
              { path: "/product/1/orders/paid/order/1" },
            ],
          },
        ],
      },
      {
        path: "/product/2",
        children: [
          {
            path: "/product/2/orders",
            children: [
              { path: "/product/2/order/2" },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/employees",
    children: [
      {
        path: "/employee/A-17",
        children: [
          {
            path: "/employee/A-17/orders",
            children: [
              { path: "/employee/A-17/order/1" },
            ],
          },
        ],
      },
    ],
  },
];

export interface FlatDemoRouteNode {
  path: string;
  depth: number;
  isLast: boolean;
}

export function flattenDemoRouteTree(
  nodes: readonly DemoRouteNode[] = DEMO_ROUTE_TREE,
  depth = 0,
): FlatDemoRouteNode[] {
  return nodes.flatMap((node, index) => [
    {
      path: node.path,
      depth,
      isLast: index === nodes.length - 1,
    },
    ...flattenDemoRouteTree(node.children || [], depth + 1),
  ]);
}

export const ROUTES: RouteDefinition[] = [
  {
    id: "products",
    pattern: "/products",
    eyebrow: "Collection",
    title: () => "Products",
    parent: () => null,
    next: () => "/product/1",
  },
  {
    id: "product",
    pattern: "/product/:productId",
    eyebrow: "Entity",
    title: ({ productId }) => `Product ${productId}`,
    parent: () => "/products",
    next: ({ productId }) => `/product/${productId}/orders`,
  },
  {
    id: "product-settings",
    pattern: "/product/:productId/settings",
    eyebrow: "Settings branch",
    title: ({ productId }) => `Product ${productId} / Settings`,
    parent: ({ productId }) => `/product/${productId}`,
    next: () => null,
  },
  {
    id: "product-orders",
    pattern: "/product/:productId/orders",
    eyebrow: "Relation",
    title: ({ productId }) => `Product ${productId} / Orders`,
    parent: ({ productId }) => `/product/${productId}`,
    next: ({ productId }) => `/product/${productId}/order/2`,
  },
  {
    id: "product-order",
    pattern: "/product/:productId/order/:orderId",
    eyebrow: "Record",
    title: ({ orderId }) => `Order ${orderId}`,
    parent: ({ productId }) => `/product/${productId}/orders`,
    next: ({ productId, orderId }) =>
      orderId === "2"
        ? `/product/${productId}/order/${orderId}/edit`
        : null,
  },
  {
    id: "product-order-edit",
    pattern: "/product/:productId/order/:orderId/edit",
    eyebrow: "Action",
    title: ({ orderId }) => `Edit order ${orderId}`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}`,
    next: () => null,
  },
  {
    id: "product-orders-paid",
    pattern: "/product/:productId/orders/paid",
    eyebrow: "Filtered branch",
    title: ({ productId }) => `Product ${productId} / Paid orders`,
    parent: ({ productId }) => `/product/${productId}`,
    next: ({ productId }) =>
      `/product/${productId}/orders/paid/order/1`,
  },
  {
    id: "product-paid-order",
    pattern: "/product/:productId/orders/paid/order/:orderId",
    eyebrow: "Filtered record",
    title: ({ orderId }) => `Paid order ${orderId}`,
    parent: ({ productId }) => `/product/${productId}/orders/paid`,
    next: () => null,
  },
  {
    id: "employees",
    pattern: "/employees",
    eyebrow: "Directory",
    title: () => "Employees",
    parent: () => null,
    next: () => "/employee/A-17",
  },
  {
    id: "employee",
    pattern: "/employee/:employeeCode",
    eyebrow: "Entity",
    title: ({ employeeCode }) => `Employee ${employeeCode}`,
    parent: () => "/employees",
    next: ({ employeeCode }) => `/employee/${employeeCode}/orders`,
  },
  {
    id: "employee-orders",
    pattern: "/employee/:employeeCode/orders",
    eyebrow: "Relation",
    title: ({ employeeCode }) => `${employeeCode} / Orders`,
    parent: ({ employeeCode }) => `/employee/${employeeCode}`,
    next: ({ employeeCode }) => `/employee/${employeeCode}/order/1`,
  },
  {
    id: "employee-order",
    pattern: "/employee/:employeeCode/order/:orderId",
    eyebrow: "Cross-entity record",
    title: ({ employeeCode, orderId }) => `${employeeCode} / Order ${orderId}`,
    parent: ({ employeeCode }) => `/employee/${employeeCode}/orders`,
    next: () => null,
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizePath(pathname: string) {
  const clean = pathname.split(/[?#]/)[0].replace(/\/+/g, "/");
  if (!clean || clean === "/") return "/products";
  return clean.length > 1 ? clean.replace(/\/$/, "") : clean;
}

function matchPattern(pattern: string, pathname: string) {
  const paramNames: string[] = [];
  const source = pattern
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }
      return escapeRegExp(segment);
    })
    .join("/");
  const result = normalizePath(pathname).match(new RegExp(`^${source}$`));
  if (!result) return null;

  return paramNames.reduce<RouteParams>((params, name, index) => {
    params[name] = decodeURIComponent(result[index + 1]);
    return params;
  }, {});
}

export function resolveRoute(pathname: string): ResolvedRoute | null {
  const path = normalizePath(pathname);

  for (const route of ROUTES) {
    const params = matchPattern(route.pattern, path);
    if (!params) continue;
    return {
      id: route.id,
      path,
      pattern: route.pattern,
      params,
      eyebrow: route.eyebrow,
      title: route.title(params),
      parentPath: route.parent(params),
      nextPath: route.next(params),
    };
  }

  return null;
}

export function buildRouteStack(pathname: string): ResolvedRoute[] {
  const stack: ResolvedRoute[] = [];
  const visited = new Set<string>();
  let route = resolveRoute(pathname);

  while (route && !visited.has(route.path)) {
    visited.add(route.path);
    stack.unshift(route);
    route = route.parentPath ? resolveRoute(route.parentPath) : null;
  }

  return stack.length ? stack : [resolveRoute("/products")!];
}
