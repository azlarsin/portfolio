"use client";

import type { ResolvedRoute } from "../router/routes";
import {
  demoEmployees,
  demoOrders,
  findDemoEmployee,
  findDemoOrder,
  queryDemoOrders,
  type DemoOrder,
} from "./demoData";
import { behaviorManifest } from "./generated/behaviorManifest";
import "./demo-business.css";

interface DemoBusinessSurfaceProps {
  route: ResolvedRoute;
  currentUrl: string;
}

function formatAmount(amount: number) {
  return `¥${amount.toFixed(0)}`;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`demo-status demo-status-${status}`}>{status}</span>;
}

function OrderTable({
  paidOnly = false,
  orders = demoOrders,
}: {
  paidOnly?: boolean;
  orders?: DemoOrder[];
}) {
  const visibleOrders = paidOnly
    ? orders.filter((order) => order.status === "已支付")
    : orders;
  return (
    <div className="demo-table-shell">
      <table className="demo-table">
        <thead>
          <tr>
            <th>订单</th>
            <th>员工</th>
            <th>时段</th>
            <th>状态</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>Order {order.id}</strong>
                <span>{order.date}</span>
              </td>
              <td>{order.employeeCode}</td>
              <td>{order.period}</td>
              <td>
                <StatusBadge status={order.status} />
              </td>
              <td>{formatAmount(order.amount)}</td>
            </tr>
          ))}
          {!visibleOrders.length ? (
            <tr><td colSpan={5}>没有符合当前合成条件的订单</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function DemoBusinessSurface({
  route,
  currentUrl,
}: DemoBusinessSurfaceProps) {
  const search = new URL(currentUrl, "http://localhost").searchParams;
  const showAgentData = search.get("demo_data") === "1";
  const date = search.get("date") || undefined;
  const periodValue = search.get("period");
  const period = periodValue === "早餐" || periodValue === "午餐" || periodValue === "晚餐"
    ? periodValue
    : undefined;
  const focusItem = search.get("focus_item") || undefined;

  if (route.id === "products") {
    return (
      <div className="demo-business-surface">
        <div className="demo-kpi-grid">
          <article>
            <span>ACTIVE PRODUCTS</span>
            <strong>03</strong>
            <p>公开演示工作区</p>
          </article>
          <article>
            <span>ROUTE NODES</span>
            <strong>{String(behaviorManifest.routeInstances.length).padStart(2, "0")}</strong>
            <p>由 TypeScript AST 生成</p>
          </article>
          <article>
            <span>PAGE CRAWLS</span>
            <strong>00</strong>
            <p>本项目直接静态分析</p>
          </article>
        </div>
        <div className="demo-product-list">
          {[
            ["Product 1", "订单、设置与已支付分支", "READY"],
            ["Product 2", "用于展示可迁移的代码索引", "INDEXED"],
            ["Product 3", "保留给新的行为适配器", "PLANNED"],
          ].map(([name, description, status]) => (
            <article key={name}>
              <div>
                <span>{status}</span>
                <h3>{name}</h3>
                <p>{description}</p>
              </div>
              <span aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (route.id === "employees") {
    return (
      <div className="demo-business-surface">
        <div className="demo-section-heading">
          <div>
            <span>SYNTHETIC DIRECTORY</span>
            <h3>示例员工目录</h3>
          </div>
          <span className="demo-safe-badge">{demoEmployees.length} RECORDS</span>
        </div>
        <div className="demo-product-list">
          {demoEmployees.map((employee) => {
            const orderCount = queryDemoOrders({ employeeCode: employee.code }).length;
            return (
              <article key={employee.code}>
                <div>
                  <span>{employee.team}</span>
                  <h3>{employee.name}</h3>
                  <p>{employee.role} · {orderCount} 条合成订单</p>
                </div>
                <span aria-hidden="true">{employee.code}</span>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  if (route.id === "employee") {
    const employee = findDemoEmployee(route.params.employeeCode);
    const orders = queryDemoOrders({ employeeCode: route.params.employeeCode });
    const totalAmount = orders.reduce((total, order) => total + order.amount, 0);
    return (
      <div className="demo-business-surface">
        <div className="demo-section-heading">
          <div>
            <span>EMPLOYEE ENTITY · SYNTHETIC</span>
            <h3>{employee?.name || `示例员工 ${route.params.employeeCode}`}</h3>
          </div>
          <span className="demo-safe-badge">{employee ? employee.team : "NOT FOUND"}</span>
        </div>
        <div className="demo-kpi-grid">
          <article><span>订单</span><strong>{String(orders.length).padStart(2, "0")}</strong><p>本地合成记录</p></article>
          <article><span>午餐</span><strong>{String(orders.filter((order) => order.period === "午餐").length).padStart(2, "0")}</strong><p>按时段关联</p></article>
          <article><span>金额</span><strong>¥{totalAmount}</strong><p>确定性汇总</p></article>
        </div>
      </div>
    );
  }

  if (route.id === "employee-orders") {
    const employee = findDemoEmployee(route.params.employeeCode);
    const orders = queryDemoOrders({
      employeeCode: route.params.employeeCode,
      date,
      period,
      itemName: focusItem,
    });
    return (
      <div className="demo-business-surface">
        <div className="demo-section-heading">
          <div>
            <span>CROSS-ENTITY FILTER</span>
            <h3>{employee?.name || route.params.employeeCode} · 订单</h3>
          </div>
          <div className="demo-filter-row">
            {date ? <span>{date}</span> : null}
            {period ? <span>{period}</span> : null}
            {focusItem ? <span>{focusItem}</span> : null}
            <span>{orders.length} MATCH</span>
          </div>
        </div>
        <OrderTable orders={orders} />
      </div>
    );
  }

  if (route.id === "employee-order") {
    const employee = findDemoEmployee(route.params.employeeCode);
    const order = findDemoOrder(route.params.orderId);
    const matchesEntity = Boolean(
      employee && order && order.employeeCode === employee.code,
    );
    if (!order || !matchesEntity) {
      return (
        <div className="demo-business-surface">
          <div className="demo-section-heading">
            <div><span>NO SYNTHETIC RECORD</span><h3>Order {route.params.orderId}</h3></div>
            <span className="demo-safe-badge">NOT FOUND</span>
          </div>
          <p>员工与订单关系未通过本地合成数据校验。</p>
        </div>
      );
    }
    return (
      <div
        className="demo-business-surface"
        data-demo-route="employee-order"
        data-employee-code={order.employeeCode}
        data-order-id={order.id}
      >
        <div className="demo-section-heading">
          <div>
            <span>CROSS-ENTITY RESULT · SYNTHETIC</span>
            <h3>跨实体定位结果 · Order {order.id}</h3>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="demo-filter-row demo-filter-row-left">
          <span>{order.employee}</span>
          <span>{date || order.date}</span>
          <span>{period || order.period}</span>
          {focusItem ? <span>命中：{focusItem}</span> : null}
        </div>
        <div className="demo-detail-grid">
          <dl>
            <div><dt>员工</dt><dd>{order.employee}</dd></div>
            <div><dt>日期 / 时段</dt><dd>{order.date} · {order.period}</dd></div>
            <div><dt>订单金额</dt><dd>{formatAmount(order.amount)}</dd></div>
          </dl>
          <div className="demo-order-items">
            {order.items.map((item) => (
              <div
                key={item.name}
                className={item.name === focusItem ? "is-focus" : ""}
                data-item-name={item.name}
                data-focused={item.name === focusItem}
              >
                <span>{item.name} × {item.quantity}</span>
                <strong>{formatAmount(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (route.id === "product") {
    return (
      <div className="demo-business-surface">
        <div className="demo-section-heading">
          <div>
            <span>PRODUCT OVERVIEW</span>
            <h3>Product {route.params.productId} 运行概览</h3>
          </div>
          <span className="demo-safe-badge">SYNTHETIC</span>
        </div>
        <div className="demo-kpi-grid">
          <article>
            <span>今日订单</span>
            <strong>06</strong>
            <p>合成记录</p>
          </article>
          <article>
            <span>已支付</span>
            <strong>04</strong>
            <p>金额 ¥150</p>
          </article>
          <article>
            <span>需处理</span>
            <strong>02</strong>
            <p>待处理与退款</p>
          </article>
        </div>
      </div>
    );
  }

  if (route.id === "product-orders" || route.id === "product-orders-paid") {
    return (
      <div className="demo-business-surface">
        <div className="demo-section-heading">
          <div>
            <span>{route.id === "product-orders-paid" ? "FILTERED DATA" : "ORDER DATA"}</span>
            <h3>{route.id === "product-orders-paid" ? "已支付订单" : "订单记录"}</h3>
          </div>
          <div className="demo-filter-row">
            {showAgentData ? <span>Agent 整理结果</span> : null}
            <span>2026-08-06</span>
          </div>
        </div>
        <OrderTable paidOnly={route.id === "product-orders-paid"} />
      </div>
    );
  }

  if (route.id === "product-order" || route.id === "product-paid-order") {
    const order = findDemoOrder(route.params.orderId);
    if (!order) {
      return (
        <div className="demo-business-surface">
          <div className="demo-section-heading">
            <div>
              <span>NO SYNTHETIC RECORD</span>
              <h3>Order {route.params.orderId}</h3>
            </div>
            <span className="demo-safe-badge">NOT FOUND</span>
          </div>
          <p>该编号不在公开合成数据中，Agent 不会借用其他订单内容。</p>
        </div>
      );
    }
    return (
      <div className="demo-business-surface">
        <div className="demo-section-heading">
          <div>
            <span>ORDER DETAIL · SYNTHETIC</span>
            <h3>Order {route.params.orderId}</h3>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="demo-detail-grid">
          <dl>
            <div>
              <dt>员工</dt>
              <dd>{order.employee}</dd>
            </div>
            <div>
              <dt>日期 / 时段</dt>
              <dd>{order.date} · {order.period}</dd>
            </div>
            <div>
              <dt>订单金额</dt>
              <dd>{formatAmount(order.amount)}</dd>
            </div>
          </dl>
          <div className="demo-order-items">
            {order.items.map((item) => (
              <div key={item.name}>
                <span>{item.name} × {item.quantity}</span>
                <strong>{formatAmount(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (route.id === "product-order-edit") {
    return (
      <div className="demo-business-surface">
        <div className="demo-section-heading">
          <div>
            <span>EDIT FORM · DEMO ONLY</span>
            <h3>编辑 Order {route.params.orderId}</h3>
          </div>
          <span className="demo-safe-badge">NO WRITE</span>
        </div>
        <div className="demo-form-grid">
          <label>
            <span>订单状态</span>
            <input value="已支付" readOnly />
          </label>
          <label>
            <span>处理备注</span>
            <input value="公开 Demo 不提交真实数据" readOnly />
          </label>
          <button type="button" disabled>需要确认后提交</button>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-business-surface">
      <div className="demo-section-heading">
        <div>
          <span>SETTINGS</span>
          <h3>Product {route.params.productId} 设置</h3>
        </div>
        <span className="demo-safe-badge">READ ONLY</span>
      </div>
      <div className="demo-settings-list">
        {[
          ["路由行为", "由静态分析生成可执行清单"],
          ["查询缓存", "返回页面时恢复筛选上下文"],
          ["操作确认", "写操作必须由用户再次确认"],
        ].map(([title, description]) => (
          <div key={title}>
            <span><strong>{title}</strong><small>{description}</small></span>
            <span>ON</span>
          </div>
        ))}
      </div>
    </div>
  );
}
