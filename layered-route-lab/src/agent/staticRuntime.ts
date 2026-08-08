import { behaviorManifest } from "./generated/behaviorManifest";
import {
  demoOrders,
  findDemoEmployee,
  queryDemoOrders,
  summarizeDemoOrders,
} from "./demoData";

export type AgentPlanMode = "execute" | "organize" | "clarify";

export interface AgentPlanStep {
  id: string;
  label: string;
  detail: string;
  action?:
    | { type: "navigate"; target: string }
    | { type: "keyboard"; key: "n" | "m" | " " }
    | { type: "inspection"; target: "grid" }
    | { type: "none" };
}

export interface AgentPlan {
  command: string;
  mode: AgentPlanMode;
  intent: string;
  confidence: number;
  model: "skipped" | "not-called";
  entities: Array<{ label: string; value: string }>;
  matchedRoute?: string;
  expectedRouteDepth?: number;
  steps: AgentPlanStep[];
  summary?: ReturnType<typeof summarizeDemoOrders>;
  lookupResult?: {
    sourceCount: number;
    candidateCount: number;
    matchCount: number;
    employeeCode: string;
    employee: string;
    date: string;
    period: string;
    order: string;
    orderId: string;
    status: string;
    itemName: string;
    item: string;
    itemAmount: string;
    orderAmount: string;
  };
  clarification?: string;
}

export const agentSuggestions = [
  {
    label: "跨分支导航",
    command: "打开 Product 1 的已支付订单 1",
  },
  {
    label: "进入深层编辑",
    command: "找到 Product 1 的订单 2，进入编辑",
  },
  {
    label: "本地数据整理",
    command: "把 Product 1 的订单按状态整理成摘要",
  },
  {
    label: "合成数据 · 跨实体查询",
    command: "查看示例员工 A-17 在 2026-08-06 午餐订单中的香草烩饭",
  },
  {
    label: "App Bridge · 动画",
    command: "通过宿主 App 逐步打开 Presenter 和 Modal",
  },
] as const;

const routeAliases: Record<string, string[]> = {
  products: ["产品列表", "products", "全部产品"],
  product: ["产品", "product", "产品概览"],
  "product-settings": ["设置", "settings", "产品设置"],
  "product-orders": ["订单列表", "orders", "全部订单"],
  "product-order": ["订单", "order", "订单详情"],
  "product-order-edit": ["编辑订单", "edit order", "订单编辑"],
  "product-orders-paid": ["已支付订单", "paid orders", "支付订单"],
  "product-paid-order": ["已支付订单详情", "paid order"],
  employees: ["员工目录", "employees", "人员目录"],
  employee: ["员工", "employee", "人员"],
  "employee-orders": ["员工订单", "employee orders"],
  "employee-order": ["员工订单详情", "employee order"],
};

function routeInstanceExists(target: string) {
  const path = target.split(/[?#]/)[0];
  return behaviorManifest.routeInstances.some((route) => route.path === path);
}

function navigationSteps(target: string): AgentPlanStep[] {
  const path = target.split(/[?#]/)[0];
  const exactNode = behaviorManifest.routeInstances.find((route) => route.path === path);
  const segments = [];
  let currentNode = exactNode;
  while (currentNode) {
    segments.unshift(currentNode);
    currentNode = currentNode.parentPath
      ? behaviorManifest.routeInstances.find((route) => route.path === currentNode?.parentPath)
      : undefined;
  }
  const routeTrail = segments.length ? segments : [{ path }];

  return [
    {
      id: "read-manifest",
      label: "读取静态行为清单",
      detail: `${behaviorManifest.routeSchemas.length} 个路由模板 · source ${behaviorManifest.sourceHash}`,
      action: { type: "none" },
    },
    {
      id: "match-intent",
      label: "本地索引匹配",
      detail: "别名、实体和参数均已完整，跳过模型调用",
      action: { type: "none" },
    },
    ...routeTrail.map((route, index) => ({
      id: `route-${index}`,
      label:
        index === routeTrail.length - 1
          ? "提交深链并重建目标界面"
          : "计算父级 Presenter",
      detail: route.path,
      action:
        index === routeTrail.length - 1
          ? ({ type: "navigate", target } as const)
          : ({ type: "none" } as const),
    })),
    {
      id: "verify",
      label: "验证运行状态",
      detail: `完整 URL、顶层界面与层级应匹配 ${target}`,
      action: { type: "none" },
    },
  ];
}

function buildNavigationPlan(
  command: string,
  target: string,
  intent: string,
  entities: AgentPlan["entities"],
): AgentPlan {
  return {
    command,
    mode: routeInstanceExists(target) ? "execute" : "clarify",
    intent,
    confidence: routeInstanceExists(target) ? 0.99 : 0.4,
    model: "skipped",
    entities,
    matchedRoute: target,
    steps: routeInstanceExists(target) ? navigationSteps(target) : [],
    clarification: routeInstanceExists(target)
      ? undefined
      : "公开行为清单中没有这条可验证的演示记录。请使用已索引的 Product 1 / Order 1 或 Order 2。",
  };
}

function extractProductId(command: string) {
  return command.match(/(?:Product|产品)\s*(\d+)/i)?.[1] || "1";
}

function extractOrderId(command: string) {
  return command.match(/(?:订单|order)\s*(\d+)/i)?.[1] || null;
}

function extractEmployeeCode(command: string) {
  return command.match(/\b([A-Z]-\d{2})\b/i)?.[1].toUpperCase() || null;
}

function extractDate(command: string) {
  return command.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1] || null;
}

function extractPeriod(command: string) {
  return (["早餐", "午餐", "晚餐"] as const).find((period) =>
    command.includes(period),
  ) || null;
}

function extractItemName(command: string) {
  const itemNames = Array.from(
    new Set(demoOrders.flatMap((order) => order.items.map((item) => item.name))),
  ).sort((left, right) => right.length - left.length);
  return itemNames.find((itemName) => command.includes(itemName)) || null;
}

function scoreRoutes(command: string) {
  const normalized = command.toLowerCase();
  return behaviorManifest.routeSchemas
    .map((route) => ({
      route,
      score: (routeAliases[route.id] || []).reduce(
        (score, alias) => score + (normalized.includes(alias.toLowerCase()) ? alias.length : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score);
}

export function planAgentCommand(rawCommand: string): AgentPlan {
  const command = rawCommand.trim();
  const normalized = command.toLowerCase();
  const productId = extractProductId(command);
  const orderId = extractOrderId(command);

  if (!command) {
    return {
      command,
      mode: "clarify",
      intent: "missing-command",
      confidence: 0,
      model: "skipped",
      entities: [],
      steps: [],
      clarification: "请先输入希望完成的页面任务。",
    };
  }

  if (
    normalized.includes("presenter") &&
    (normalized.includes("modal") || normalized.includes("弹层"))
  ) {
    return {
      command,
      mode: "execute",
      intent: "demonstrate-app-bridge",
      confidence: 0.99,
      model: "skipped",
      entities: [
        { label: "宿主协议", value: "Typed App Bridge" },
        { label: "页面动作", value: "presenter.advance" },
        { label: "弹层动作", value: "modal.open" },
      ],
      steps: [
        {
          id: "bridge-root",
          label: "同步宿主根页面",
          detail: "route.navigate → /products",
          action: { type: "navigate", target: "/products" },
        },
        {
          id: "bridge-presenter",
          label: "请求宿主推进 Presenter",
          detail: "presenter.advance → /product/1",
          action: { type: "keyboard", key: "n" },
        },
        {
          id: "bridge-modal",
          label: "请求宿主派生 Modal",
          detail: "modal.open → modal-1",
          action: { type: "keyboard", key: "m" },
        },
        {
          id: "bridge-verify",
          label: "验证宿主数据与动画结果",
          detail: "2 route presenters · 1 modal · App acknowledged",
          action: { type: "none" },
        },
      ],
    };
  }

  const employeeCode = extractEmployeeCode(command);
  if (normalized.includes("员工") || employeeCode) {
    const employee = employeeCode ? findDemoEmployee(employeeCode) : null;
    const date = extractDate(command);
    const period = extractPeriod(command);
    const itemName = extractItemName(command);

    if (!employeeCode || !employee || !date || !period || !itemName) {
      const missing = [
        !employeeCode || !employee ? "员工编码" : null,
        !date ? "日期" : null,
        !period ? "时段" : null,
        !itemName ? "订单条目" : null,
      ].filter(Boolean).join("、");
      return {
        command,
        mode: "clarify",
        intent: "incomplete-employee-order-query",
        confidence: 0.52,
        model: "not-called",
        entities: employeeCode ? [{ label: "员工", value: employeeCode }] : [],
        steps: [],
        clarification: `跨实体查询仍缺少可验证的${missing}。请使用公开合成员工编码、ISO 日期、早餐/午餐/晚餐和明确菜品。`,
      };
    }

    const candidates = queryDemoOrders({ employeeCode, date, period });
    const matches = queryDemoOrders({ employeeCode, date, period, itemName });
    if (matches.length !== 1) {
      return {
        command,
        mode: "clarify",
        intent: matches.length ? "ambiguous-employee-order" : "employee-order-not-found",
        confidence: matches.length ? 0.61 : 0.2,
        model: "not-called",
        entities: [
          { label: "员工", value: employee.name },
          { label: "日期", value: date },
          { label: "时段", value: period },
          { label: "菜品", value: itemName },
        ],
        steps: [],
        clarification: matches.length
          ? `找到 ${matches.length} 条包含该菜品的合成订单，请继续补充订单编号。`
          : "没有找到同时满足员工、日期、时段和菜品条件的合成订单。",
      };
    }

    const order = matches[0];
    const item = order.items.find((candidate) => candidate.name === itemName)!;
    const query = new URLSearchParams({
      date,
      period,
      focus_item: itemName,
    });
    const target = `/employee/${employeeCode}/order/${order.id}?${query}`;
    return {
      command,
      mode: "execute",
      intent: "find-employee-order-item",
      confidence: 0.99,
      model: "skipped",
      entities: [
        { label: "员工", value: employee.name },
        { label: "日期", value: date },
        { label: "时段", value: period },
        { label: "菜品", value: itemName },
        { label: "订单", value: `Order ${order.id}` },
      ],
      matchedRoute: target,
      expectedRouteDepth: 4,
      steps: [
        {
          id: "lookup-source",
          label: "读取合成订单索引",
          detail: `${demoOrders.length} 条本地 fixture 记录`,
          action: { type: "none" },
        },
        {
          id: "lookup-employee",
          label: "解析员工实体",
          detail: `${employeeCode} → ${employee.name}`,
          action: { type: "none" },
        },
        {
          id: "lookup-scope",
          label: "限定日期与时段",
          detail: `${demoOrders.length} → ${candidates.length} 条 · ${date} · ${period}`,
          action: { type: "none" },
        },
        {
          id: "lookup-item",
          label: "匹配订单条目",
          detail: `${candidates.length} → ${matches.length} 条 · ${itemName}`,
          action: { type: "none" },
        },
        {
          id: "lookup-route",
          label: "编译员工订单路由",
          detail: `/employees → /employee/${employeeCode} → orders → Order ${order.id}`,
          action: { type: "none" },
        },
        {
          id: "lookup-open",
          label: "打开命中的订单详情",
          detail: target,
          action: { type: "navigate", target },
        },
        {
          id: "lookup-verify",
          label: "验证订单与高亮条目",
          detail: `Order ${order.id} · ${itemName} × ${item.quantity} · ¥${item.amount}`,
          action: { type: "none" },
        },
      ],
      lookupResult: {
        sourceCount: demoOrders.length,
        candidateCount: candidates.length,
        matchCount: matches.length,
        employeeCode,
        employee: order.employee,
        date: order.date,
        period: order.period,
        order: `Order ${order.id}`,
        orderId: order.id,
        status: order.status,
        itemName: item.name,
        item: `${item.name} × ${item.quantity}`,
        itemAmount: `¥${item.amount}`,
        orderAmount: `¥${order.amount}`,
      },
    };
  }

  if (normalized.includes("整理") || normalized.includes("摘要") || normalized.includes("汇总")) {
    const target = `/product/${productId}/orders?demo_data=1`;
    if (!routeInstanceExists(target)) {
      return {
        command,
        mode: "clarify",
        intent: "missing-demo-entity",
        confidence: 0.4,
        model: "not-called",
        entities: [{ label: "产品", value: `Product ${productId}` }],
        steps: [],
        clarification: "公开合成数据只为 Product 1 建立了可验证索引，请改为整理 Product 1 的订单。",
      };
    }
    return {
      command,
      mode: "organize",
      intent: "aggregate-order-data",
      confidence: 0.98,
      model: "skipped",
      entities: [
        { label: "产品", value: `Product ${productId}` },
        { label: "分组字段", value: "status" },
        { label: "数据范围", value: "6 条合成订单" },
      ],
      matchedRoute: target,
      summary: summarizeDemoOrders(),
      steps: [
        {
          id: "organize-manifest",
          label: "定位订单数据界面",
          detail: "/product/:productId/orders",
          action: { type: "none" },
        },
        {
          id: "organize-read",
          label: "读取合成记录",
          detail: "6 条记录 · 本地 fixture",
          action: { type: "none" },
        },
        {
          id: "organize-group",
          label: "确定性分组与聚合",
          detail: "status → count + amount",
          action: { type: "none" },
        },
        {
          id: "organize-open",
          label: "打开结构化结果",
          detail: target,
          action: { type: "navigate", target },
        },
        {
          id: "organize-verify",
          label: "验证记录与合计",
          detail: "6 笔 · ¥220 · 午餐 4 / 6",
          action: { type: "none" },
        },
      ],
    };
  }

  if (normalized.includes("已支付") || normalized.includes("paid")) {
    const target = orderId
      ? `/product/${productId}/orders/paid/order/${orderId}`
      : `/product/${productId}/orders/paid`;
    return buildNavigationPlan(command, target, "open-paid-order", [
      { label: "产品", value: `Product ${productId}` },
      { label: "订单", value: orderId ? `Order ${orderId}` : "已支付订单列表" },
      { label: "分支", value: "Paid orders" },
    ]);
  }

  if ((normalized.includes("编辑") || normalized.includes("edit")) && orderId) {
    const target = `/product/${productId}/order/${orderId}/edit`;
    return buildNavigationPlan(command, target, "edit-order", [
      { label: "产品", value: `Product ${productId}` },
      { label: "订单", value: `Order ${orderId}` },
      { label: "动作", value: "Edit" },
    ]);
  }

  if (orderId) {
    const target = `/product/${productId}/order/${orderId}`;
    return buildNavigationPlan(command, target, "open-order", [
      { label: "产品", value: `Product ${productId}` },
      { label: "订单", value: `Order ${orderId}` },
    ]);
  }

  if (normalized.includes("设置") || normalized.includes("settings")) {
    return buildNavigationPlan(
      command,
      `/product/${productId}/settings`,
      "open-settings",
      [{ label: "产品", value: `Product ${productId}` }],
    );
  }

  if (normalized.includes("网格") || normalized.includes("grid")) {
    return {
      command,
      mode: "execute",
      intent: "inspect-presenters",
      confidence: 0.96,
      model: "skipped",
      entities: [{ label: "视图", value: "3D Grid" }],
      steps: [
        {
          id: "inspect-read",
          label: "读取当前 Presenter 堆栈",
          detail: "使用已有键盘动作合同",
          action: { type: "none" },
        },
        {
          id: "inspect-grid",
          label: "幂等切换到 Grid",
          detail: "读取当前模式后仅执行所需次数",
          action: { type: "inspection", target: "grid" },
        },
      ],
    };
  }

  const candidates = scoreRoutes(command);
  if (candidates[0]?.score > 0 && candidates[0].route.id === "products") {
    return buildNavigationPlan(command, "/products", "open-products", []);
  }

  return {
    command,
    mode: "clarify",
    intent: "ambiguous-route",
    confidence: 0.36,
    model: "not-called",
    entities: [],
    steps: [],
    clarification:
      "“打开订单”仍缺少 Product 与 Order 参数。Agent 不会猜测，请补充目标，例如：打开 Product 1 的订单 2。",
  };
}

export { behaviorManifest };
