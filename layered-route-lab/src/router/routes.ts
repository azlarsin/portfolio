export type RouteParams = Record<string, string>;

export type RouteId =
  | "products"
  | "product"
  | "product-settings"
  | "product-orders"
  | "product-order"
  | "product-order-edit"
  | "product-order-edit-review"
  | "product-order-edit-confirm"
  | "product-order-timeline"
  | "product-order-event"
  | "product-order-refund"
  | "product-order-refund-review"
  | "product-order-fulfillment"
  | "product-order-tracking"
  | "product-orders-paid"
  | "product-paid-order"
  | "product-paid-order-receipt"
  | "product-paid-order-receipt-export"
  | "product-settings-permissions"
  | "product-settings-member"
  | "product-settings-integrations"
  | "product-settings-webhook"
  | "employees"
  | "employee"
  | "employee-orders"
  | "employee-order"
  | "employee-order-expense"
  | "employee-order-expense-review"
  | "employee-schedule"
  | "employee-schedule-day"
  | "employee-schedule-shift";

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
  childPaths: string[];
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
                  {
                    path: "/product/1/order/2/edit",
                    children: [
                      {
                        path: "/product/1/order/2/edit/review",
                        children: [
                          { path: "/product/1/order/2/edit/review/confirm" },
                        ],
                      },
                    ],
                  },
                  {
                    path: "/product/1/order/2/timeline",
                    children: [
                      { path: "/product/1/order/2/timeline/event/E-204" },
                    ],
                  },
                ],
              },
              {
                path: "/product/1/order/123",
                children: [
                  {
                    path: "/product/1/order/123/refund",
                    children: [
                      { path: "/product/1/order/123/refund/review" },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: "/product/1/settings",
            children: [
              {
                path: "/product/1/settings/permissions",
                children: [
                  { path: "/product/1/settings/permissions/member/A-17" },
                ],
              },
              {
                path: "/product/1/settings/integrations",
                children: [
                  { path: "/product/1/settings/integrations/webhook/WH-01" },
                ],
              },
            ],
          },
          {
            path: "/product/1/orders/paid",
            children: [
              {
                path: "/product/1/orders/paid/order/1",
                children: [
                  {
                    path: "/product/1/orders/paid/order/1/receipt",
                    children: [
                      { path: "/product/1/orders/paid/order/1/receipt/export" },
                    ],
                  },
                ],
              },
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
              {
                path: "/product/2/order/2",
                children: [
                  {
                    path: "/product/2/order/2/fulfillment",
                    children: [
                      { path: "/product/2/order/2/fulfillment/tracking" },
                    ],
                  },
                ],
              },
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
              {
                path: "/employee/A-17/order/1",
                children: [
                  {
                    path: "/employee/A-17/order/1/expense",
                    children: [
                      { path: "/employee/A-17/order/1/expense/review" },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: "/employee/A-17/schedule",
            children: [
              {
                path: "/employee/A-17/schedule/day/2026-08-06",
                children: [
                  {
                    path: "/employee/A-17/schedule/day/2026-08-06/shift/lunch",
                  },
                ],
              },
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
    next: ({ productId }) => `/product/${productId}/settings/permissions`,
  },
  {
    id: "product-settings-permissions",
    pattern: "/product/:productId/settings/permissions",
    eyebrow: "Access branch",
    title: ({ productId }) => `Product ${productId} / Permissions`,
    parent: ({ productId }) => `/product/${productId}/settings`,
    next: ({ productId }) =>
      `/product/${productId}/settings/permissions/member/A-17`,
  },
  {
    id: "product-settings-member",
    pattern: "/product/:productId/settings/permissions/member/:employeeCode",
    eyebrow: "Access record",
    title: ({ employeeCode }) => `Member ${employeeCode} / Access`,
    parent: ({ productId }) => `/product/${productId}/settings/permissions`,
    next: () => null,
  },
  {
    id: "product-settings-integrations",
    pattern: "/product/:productId/settings/integrations",
    eyebrow: "Integration branch",
    title: ({ productId }) => `Product ${productId} / Integrations`,
    parent: ({ productId }) => `/product/${productId}/settings`,
    next: ({ productId }) =>
      `/product/${productId}/settings/integrations/webhook/WH-01`,
  },
  {
    id: "product-settings-webhook",
    pattern: "/product/:productId/settings/integrations/webhook/:webhookId",
    eyebrow: "Integration record",
    title: ({ webhookId }) => `Webhook ${webhookId}`,
    parent: ({ productId }) => `/product/${productId}/settings/integrations`,
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
    next: ({ productId, orderId }) => {
      if (productId === "2" && orderId === "2") {
        return `/product/${productId}/order/${orderId}/fulfillment`;
      }
      if (orderId === "2") {
        return `/product/${productId}/order/${orderId}/edit`;
      }
      if (orderId === "123") {
        return `/product/${productId}/order/${orderId}/refund`;
      }
      return null;
    },
  },
  {
    id: "product-order-edit",
    pattern: "/product/:productId/order/:orderId/edit",
    eyebrow: "Action",
    title: ({ orderId }) => `Edit order ${orderId}`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}`,
    next: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/edit/review`,
  },
  {
    id: "product-order-edit-review",
    pattern: "/product/:productId/order/:orderId/edit/review",
    eyebrow: "Review state",
    title: ({ orderId }) => `Review order ${orderId}`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/edit`,
    next: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/edit/review/confirm`,
  },
  {
    id: "product-order-edit-confirm",
    pattern: "/product/:productId/order/:orderId/edit/review/confirm",
    eyebrow: "Confirmation state",
    title: ({ orderId }) => `Confirm order ${orderId}`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/edit/review`,
    next: () => null,
  },
  {
    id: "product-order-timeline",
    pattern: "/product/:productId/order/:orderId/timeline",
    eyebrow: "History branch",
    title: ({ orderId }) => `Order ${orderId} / Timeline`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}`,
    next: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/timeline/event/E-204`,
  },
  {
    id: "product-order-event",
    pattern: "/product/:productId/order/:orderId/timeline/event/:eventId",
    eyebrow: "History record",
    title: ({ eventId }) => `Event ${eventId}`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/timeline`,
    next: () => null,
  },
  {
    id: "product-order-refund",
    pattern: "/product/:productId/order/:orderId/refund",
    eyebrow: "Refund branch",
    title: ({ orderId }) => `Order ${orderId} / Refund`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}`,
    next: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/refund/review`,
  },
  {
    id: "product-order-refund-review",
    pattern: "/product/:productId/order/:orderId/refund/review",
    eyebrow: "Refund review",
    title: ({ orderId }) => `Review refund ${orderId}`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/refund`,
    next: () => null,
  },
  {
    id: "product-order-fulfillment",
    pattern: "/product/:productId/order/:orderId/fulfillment",
    eyebrow: "Fulfillment branch",
    title: ({ orderId }) => `Order ${orderId} / Fulfillment`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}`,
    next: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/fulfillment/tracking`,
  },
  {
    id: "product-order-tracking",
    pattern: "/product/:productId/order/:orderId/fulfillment/tracking",
    eyebrow: "Fulfillment state",
    title: ({ orderId }) => `Order ${orderId} / Tracking`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/order/${orderId}/fulfillment`,
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
    next: ({ productId, orderId }) =>
      `/product/${productId}/orders/paid/order/${orderId}/receipt`,
  },
  {
    id: "product-paid-order-receipt",
    pattern: "/product/:productId/orders/paid/order/:orderId/receipt",
    eyebrow: "Receipt branch",
    title: ({ orderId }) => `Order ${orderId} / Receipt`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/orders/paid/order/${orderId}`,
    next: ({ productId, orderId }) =>
      `/product/${productId}/orders/paid/order/${orderId}/receipt/export`,
  },
  {
    id: "product-paid-order-receipt-export",
    pattern: "/product/:productId/orders/paid/order/:orderId/receipt/export",
    eyebrow: "Export state",
    title: ({ orderId }) => `Export receipt ${orderId}`,
    parent: ({ productId, orderId }) =>
      `/product/${productId}/orders/paid/order/${orderId}/receipt`,
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
    next: ({ employeeCode, orderId }) =>
      `/employee/${employeeCode}/order/${orderId}/expense`,
  },
  {
    id: "employee-order-expense",
    pattern: "/employee/:employeeCode/order/:orderId/expense",
    eyebrow: "Expense branch",
    title: ({ orderId }) => `Order ${orderId} / Expense`,
    parent: ({ employeeCode, orderId }) =>
      `/employee/${employeeCode}/order/${orderId}`,
    next: ({ employeeCode, orderId }) =>
      `/employee/${employeeCode}/order/${orderId}/expense/review`,
  },
  {
    id: "employee-order-expense-review",
    pattern: "/employee/:employeeCode/order/:orderId/expense/review",
    eyebrow: "Expense review",
    title: ({ orderId }) => `Review expense ${orderId}`,
    parent: ({ employeeCode, orderId }) =>
      `/employee/${employeeCode}/order/${orderId}/expense`,
    next: () => null,
  },
  {
    id: "employee-schedule",
    pattern: "/employee/:employeeCode/schedule",
    eyebrow: "Schedule branch",
    title: ({ employeeCode }) => `${employeeCode} / Schedule`,
    parent: ({ employeeCode }) => `/employee/${employeeCode}`,
    next: ({ employeeCode }) =>
      `/employee/${employeeCode}/schedule/day/2026-08-06`,
  },
  {
    id: "employee-schedule-day",
    pattern: "/employee/:employeeCode/schedule/day/:date",
    eyebrow: "Schedule day",
    title: ({ date }) => `Schedule / ${date}`,
    parent: ({ employeeCode }) => `/employee/${employeeCode}/schedule`,
    next: ({ employeeCode, date }) =>
      `/employee/${employeeCode}/schedule/day/${date}/shift/lunch`,
  },
  {
    id: "employee-schedule-shift",
    pattern: "/employee/:employeeCode/schedule/day/:date/shift/:shift",
    eyebrow: "Schedule shift",
    title: ({ shift }) => `${shift} shift`,
    parent: ({ employeeCode, date }) =>
      `/employee/${employeeCode}/schedule/day/${date}`,
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

export function getDemoRouteChildPaths(
  pathname: string,
  nodes: readonly DemoRouteNode[] = DEMO_ROUTE_TREE,
): string[] {
  const path = normalizePath(pathname);
  for (const node of nodes) {
    if (normalizePath(node.path) === path) {
      return (node.children || []).map((child) => child.path);
    }
    const childPaths = getDemoRouteChildPaths(path, node.children || []);
    if (childPaths.length) return childPaths;
  }
  return [];
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
    const childPaths = getDemoRouteChildPaths(path);
    return {
      id: route.id,
      path,
      pattern: route.pattern,
      params,
      eyebrow: route.eyebrow,
      title: route.title(params),
      parentPath: route.parent(params),
      nextPath: route.next(params),
      childPaths,
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
