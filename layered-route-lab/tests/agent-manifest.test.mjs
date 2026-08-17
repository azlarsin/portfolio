import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const manifestSource = await readFile(
  new URL("../src/agent/generated/behaviorManifest.ts", import.meta.url),
  "utf8",
);
const manifestJson = manifestSource.match(
  /export const behaviorManifest = ([\s\S]+) as const;/,
)?.[1];
assert.ok(manifestJson, "generated manifest must contain serializable JSON");
const manifest = JSON.parse(manifestJson);

function transpile(source, fileName) {
  return ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
}

function toDataUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}

async function loadPlanner() {
  const demoSource = await readFile(
    new URL("../src/agent/demoData.ts", import.meta.url),
    "utf8",
  );
  const manifestUrl = toDataUrl(transpile(manifestSource, "behaviorManifest.ts"));
  const demoUrl = toDataUrl(transpile(demoSource, "demoData.ts"));
  const runtimeSource = (
    await readFile(new URL("../src/agent/staticRuntime.ts", import.meta.url), "utf8")
  )
    .replace('"./generated/behaviorManifest"', JSON.stringify(manifestUrl))
    .replace('"./demoData"', JSON.stringify(demoUrl));
  return import(toDataUrl(transpile(runtimeSource, "staticRuntime.ts")));
}

test("static manifest is connected, unique, and parent-complete", () => {
  assert.equal(manifest.analysisMode, "route-ast+source-feature-scan");
  assert.equal(manifest.routeSchemas.length, 12);
  assert.equal(manifest.routeInstances.length, 16);
  assert.equal(manifest.surfaces.length, 3);
  assert.equal(manifest.actions.length, 7);
  assert.match(manifest.sourceHash, /^[a-f0-9]{12}$/);

  const paths = manifest.routeInstances.map((route) => route.path);
  assert.equal(new Set(paths).size, paths.length);
  const pathSet = new Set(paths);
  for (const route of manifest.routeInstances) {
    if (route.parentPath) assert.ok(pathSet.has(route.parentPath));
    for (const childPath of route.childPaths) assert.ok(pathSet.has(childPath));
  }
});

test("product 2 demo branch is parent-complete", () => {
  const productPaths = [
    "/products",
    "/product/2",
    "/product/2/orders",
    "/product/2/order/2",
  ];
  const instances = new Map(
    manifest.routeInstances.map((route) => [route.path, route]),
  );

  for (const path of productPaths) assert.ok(instances.has(path));
  assert.equal(instances.get(productPaths[1]).parentPath, productPaths[0]);
  assert.equal(instances.get(productPaths[2]).parentPath, productPaths[1]);
  assert.equal(instances.get(productPaths[3]).parentPath, productPaths[2]);
});

test("employee lookup branch is a complete four-level route chain", () => {
  const employeePaths = [
    "/employees",
    "/employee/A-17",
    "/employee/A-17/orders",
    "/employee/A-17/order/1",
  ];
  const instances = new Map(
    manifest.routeInstances.map((route) => [route.path, route]),
  );

  for (const path of employeePaths) assert.ok(instances.has(path));
  assert.equal(instances.get(employeePaths[0]).parentPath, null);
  assert.equal(instances.get(employeePaths[1]).parentPath, employeePaths[0]);
  assert.equal(instances.get(employeePaths[2]).parentPath, employeePaths[1]);
  assert.equal(instances.get(employeePaths[3]).parentPath, employeePaths[2]);
});

test("local planner validates public entities and keeps model optional", async () => {
  const { planAgentCommand } = await loadPlanner();

  const paid = planAgentCommand("打开 Product 1 的已支付订单 1");
  assert.equal(paid.mode, "execute");
  assert.equal(paid.matchedRoute, "/product/1/orders/paid/order/1");
  assert.equal(paid.model, "skipped");

  const edit = planAgentCommand("找到 Product 1 的订单 2，进入编辑");
  assert.equal(edit.mode, "execute");
  assert.equal(edit.matchedRoute, "/product/1/order/2/edit");

  const ambiguous = planAgentCommand("打开订单");
  assert.equal(ambiguous.mode, "clarify");
  assert.equal(ambiguous.model, "not-called");

  const missing = planAgentCommand("打开 Product 999 的订单 999");
  assert.equal(missing.mode, "clarify");
  assert.match(missing.clarification, /没有这条可验证的演示记录/);
});

test("data organization and inspection plans expose deterministic invariants", async () => {
  const { planAgentCommand } = await loadPlanner();
  const organize = planAgentCommand("把 Product 1 的订单按状态整理成摘要");
  assert.equal(organize.mode, "organize");
  assert.equal(organize.matchedRoute, "/product/1/orders?demo_data=1");
  assert.equal(organize.summary.totalCount, 6);
  assert.equal(organize.summary.totalAmount, 220);
  assert.equal(organize.summary.lunchCount, 4);
  assert.equal(
    organize.summary.rows.reduce((total, row) => total + row.amount, 0),
    220,
  );

  const inspect = planAgentCommand("切换到网格");
  assert.deepEqual(inspect.steps.at(-1).action, {
    type: "inspection",
    target: "grid",
  });
});

test("host bridge demo plans Presenter and Modal data commands", async () => {
  const { planAgentCommand } = await loadPlanner();
  const bridge = planAgentCommand(
    "通过宿主 App 逐步打开 Presenter 和 Modal",
  );

  assert.equal(bridge.mode, "execute");
  assert.equal(bridge.intent, "demonstrate-app-bridge");
  assert.equal(bridge.model, "skipped");
  assert.deepEqual(
    bridge.steps.map((step) => step.action),
    [
      { type: "navigate", target: "/products" },
      { type: "keyboard", key: "n" },
      { type: "keyboard", key: "m" },
      { type: "none" },
    ],
  );
});

test("cross-entity lookup deterministically narrows synthetic data and opens the match", async () => {
  const { planAgentCommand } = await loadPlanner();
  const lookup = planAgentCommand(
    "查看示例员工 A-17 在 2026-08-06 午餐订单中的香草烩饭",
  );

  assert.equal(lookup.mode, "execute");
  assert.equal(lookup.intent, "find-employee-order-item");
  assert.equal(lookup.model, "skipped");
  assert.equal(lookup.expectedRouteDepth, 4);
  assert.equal(lookup.steps.length, 7);

  const target = new URL(lookup.matchedRoute, "http://localhost");
  assert.equal(target.pathname, "/employee/A-17/order/1");
  assert.equal(target.searchParams.get("date"), "2026-08-06");
  assert.equal(target.searchParams.get("period"), "午餐");
  assert.equal(target.searchParams.get("focus_item"), "香草烩饭");
  assert.deepEqual(lookup.steps.find((step) => step.action?.type === "navigate")?.action, {
    type: "navigate",
    target: lookup.matchedRoute,
  });

  assert.deepEqual(
    {
      sourceCount: lookup.lookupResult.sourceCount,
      candidateCount: lookup.lookupResult.candidateCount,
      matchCount: lookup.lookupResult.matchCount,
      employeeCode: lookup.lookupResult.employeeCode,
      orderId: lookup.lookupResult.orderId,
      itemName: lookup.lookupResult.itemName,
      itemAmount: lookup.lookupResult.itemAmount,
      orderAmount: lookup.lookupResult.orderAmount,
    },
    {
      sourceCount: 6,
      candidateCount: 2,
      matchCount: 1,
      employeeCode: "A-17",
      orderId: "1",
      itemName: "香草烩饭",
      itemAmount: "¥39",
      orderAmount: "¥46",
    },
  );

  const incomplete = planAgentCommand("查看示例员工 A-17 的午餐订单");
  assert.equal(incomplete.mode, "clarify");
  assert.match(incomplete.clarification, /日期、订单条目/);
});
