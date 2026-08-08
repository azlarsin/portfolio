export type DemoOrderStatus = "已支付" | "待处理" | "已退款";

export interface DemoOrder {
  id: string;
  employee: string;
  employeeCode: string;
  date: string;
  period: "早餐" | "午餐" | "晚餐";
  status: DemoOrderStatus;
  amount: number;
  items: Array<{ name: string; quantity: number; amount: number }>;
}

export interface DemoEmployee {
  code: string;
  name: string;
  team: string;
  role: string;
}

export const demoEmployees: DemoEmployee[] = [
  { code: "A-17", name: "示例员工 A-17", team: "示例团队 Alpha", role: "产品协作" },
  { code: "B-04", name: "示例员工 B-04", team: "示例团队 Beta", role: "体验设计" },
  { code: "C-22", name: "示例员工 C-22", team: "示例团队 Gamma", role: "工程研发" },
  { code: "D-09", name: "示例员工 D-09", team: "示例团队 Delta", role: "业务运营" },
  { code: "E-31", name: "示例员工 E-31", team: "示例团队 Epsilon", role: "数据分析" },
];

export const demoOrders: DemoOrder[] = [
  {
    id: "1",
    employee: "示例员工 A-17",
    employeeCode: "A-17",
    date: "2026-08-06",
    period: "午餐",
    status: "已支付",
    amount: 46,
    items: [
      { name: "香草烩饭", quantity: 1, amount: 39 },
      { name: "柠檬水", quantity: 1, amount: 7 },
    ],
  },
  {
    id: "2",
    employee: "示例员工 B-04",
    employeeCode: "B-04",
    date: "2026-08-06",
    period: "午餐",
    status: "已支付",
    amount: 38,
    items: [{ name: "谷物能量碗", quantity: 1, amount: 38 }],
  },
  {
    id: "3",
    employee: "示例员工 C-22",
    employeeCode: "C-22",
    date: "2026-08-06",
    period: "早餐",
    status: "待处理",
    amount: 32,
    items: [{ name: "早餐组合", quantity: 1, amount: 32 }],
  },
  {
    id: "4",
    employee: "示例员工 A-17",
    employeeCode: "A-17",
    date: "2026-08-06",
    period: "午餐",
    status: "已支付",
    amount: 34,
    items: [{ name: "时蔬套餐", quantity: 1, amount: 34 }],
  },
  {
    id: "5",
    employee: "示例员工 D-09",
    employeeCode: "D-09",
    date: "2026-08-06",
    period: "晚餐",
    status: "已退款",
    amount: 38,
    items: [{ name: "晚餐套餐", quantity: 1, amount: 38 }],
  },
  {
    id: "6",
    employee: "示例员工 E-31",
    employeeCode: "E-31",
    date: "2026-08-06",
    period: "午餐",
    status: "已支付",
    amount: 32,
    items: [{ name: "轻食拼盘", quantity: 1, amount: 32 }],
  },
];

const queryRestoreDemoOrder: DemoOrder = {
  id: "123",
  employee: "示例员工 Q-23",
  employeeCode: "Q-23",
  date: "2026-08-06",
  period: "早餐",
  status: "待处理",
  amount: 0,
  items: [{ name: "查询恢复测试记录", quantity: 1, amount: 0 }],
};

export function findDemoOrder(orderId: string) {
  return demoOrders.find((order) => order.id === orderId) ||
    (orderId === queryRestoreDemoOrder.id ? queryRestoreDemoOrder : null);
}

export function findDemoEmployee(employeeCode: string) {
  return demoEmployees.find(
    (employee) => employee.code.toLowerCase() === employeeCode.toLowerCase(),
  ) || null;
}

export interface DemoOrderQuery {
  employeeCode?: string;
  date?: string;
  period?: DemoOrder["period"];
  itemName?: string;
}

export function queryDemoOrders(query: DemoOrderQuery) {
  return demoOrders.filter((order) => {
    if (
      query.employeeCode &&
      order.employeeCode.toLowerCase() !== query.employeeCode.toLowerCase()
    ) return false;
    if (query.date && order.date !== query.date) return false;
    if (query.period && order.period !== query.period) return false;
    if (
      query.itemName &&
      !order.items.some((item) => item.name === query.itemName)
    ) return false;
    return true;
  });
}

export function summarizeDemoOrders(orders = demoOrders) {
  const rows = (["已支付", "待处理", "已退款"] as const).map((status) => {
    const matched = orders.filter((order) => order.status === status);
    return {
      status,
      count: matched.length,
      amount: matched.reduce((total, order) => total + order.amount, 0),
    };
  });
  const totalAmount = orders.reduce((total, order) => total + order.amount, 0);
  const lunchCount = orders.filter((order) => order.period === "午餐").length;
  return {
    rows,
    totalCount: orders.length,
    totalAmount,
    lunchCount,
    lunchRatio: `${lunchCount} / ${orders.length}`,
  };
}
