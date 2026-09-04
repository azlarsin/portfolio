import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the route lab shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );

  const html = await response.text();
  assert.match(html, /<title>Layered Route Lab/);
  assert.match(html, /Layered Route Lab/);
  assert.match(html, /presenter-1/);
  assert.match(html, /\/products/);
  assert.match(html, /Push page/);
  assert.match(html, /Derive modal/);
  assert.match(html, /Guide/);
  assert.match(html, /Current stack/);
  assert.match(html, /Route and Presenter stack/);
  assert.doesNotMatch(html, /Route reconstruction|Stack debugger/);
  assert.doesNotMatch(html, /react-loading-skeleton|codex-preview/i);
});

test("the onboarding guide connects route layers to the constrained Agent loop", async () => {
  const [app, guide, overlay, rootPage, catchAllPage] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/ExperienceGuide.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/AgentDemoOverlay.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[...path]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /GUIDE_SESSION_KEY/);
  assert.match(app, /params\.get\("agent_demo"\) !== "1"/);
  assert.match(app, /!params\.has\("agent_cmd"\)/);
  assert.match(app, /!embedded && \(/);
  assert.match(app, /interface AppProps[\s\S]*initialLocation\?: string/);
  assert.match(app, /resetModalClosePlan/);
  assert.match(app, /pendingModalHistoryStepsRef\.current = 0/);
  assert.match(app, /pendingModalFocusIdRef\.current = null/);
  assert.match(app, /if \(leavingModalIdRef\.current\)[\s\S]*?if \(!cameFromPop\) return/);
  assert.match(app, /onOpenGuide=\{embedded \? undefined : \(\) => setGuideOpen\(true\)\}/);
  assert.match(`${rootPage}\n${catchAllPage}`, /initialLocation=\{createInitialLocation/);
  assert.match(app, /<ExperienceGuide/);
  assert.match(app, /onPushTemporaryPresenter=\{pushPresenter\}/);
  assert.match(app, /onOpenAgent=\{openAgentFromGuide\}/);

  assert.match(guide, />操作指南</);
  assert.match(guide, /按下方步骤操作，观察 URL、History 与界面层如何协作/);
  assert.doesNotMatch(guide, /先看页面层，再看 Agent/);
  assert.match(guide, /Route Presenter/);
  assert.match(guide, /Temp Presenter · Modal/);
  assert.match(guide, /URL 保持不变/);
  assert.match(guide, /匹配 Manifest/);
  assert.match(guide, /本地 planner 与合成数据/);
  assert.match(guide, /不调用线上模型或业务 API/);
  assert.match(guide, /className="guide-drag-handle"/);
  assert.match(guide, /useCallback/);
  assert.match(guide, /ResizeObserver/);
  assert.match(guide, /releasePointerCapture\(drag\.pointerId\)/);
  assert.match(guide, /dragRef\.current = null;[\s\S]*?releasePointerCapture\(drag\.pointerId\)/);
  assert.match(guide, /setPosition\(null\)/);
  assert.match(guide, /event\.button !== 0/);
  assert.match(guide, /!event\.isPrimary/);
  assert.match(guide, /GUIDE_MOBILE_BREAKPOINT/);
  assert.match(guide, /setPointerCapture\(event\.pointerId\)/);
  assert.match(guide, /drag\.pointerId !== event\.pointerId/);
  assert.match(guide, /onPointerUp=\{finishDrag\}/);
  assert.match(guide, /onPointerCancel=\{finishDrag\}/);
  assert.match(guide, /onLostPointerCapture=\{finishDrag\}/);
  assert.match(guide, /aria-label="关闭操作指南" onClick=\{handleClose\}/);

  const guideCss = await readFile(
    new URL("../src/layered-route-lab.css", import.meta.url),
    "utf8",
  );
  assert.match(guideCss, /top: var\(--guide-top, 72px\)/);
  assert.match(guideCss, /left: var\(--guide-left, 16px\)/);
  assert.match(guideCss, /\.guide-drag-handle \{[\s\S]*?cursor: grab[\s\S]*?touch-action: none/);
  assert.match(guideCss, /\.experience-guide \{[\s\S]*?overflow-y: auto/);
  assert.match(guideCss, /@media \(max-width: 720px\) \{[\s\S]*?\.experience-guide \{[\s\S]*?top: 66px[\s\S]*?right: 8px[\s\S]*?bottom: 8px[\s\S]*?left: 8px/);

  assert.match(overlay, /把任务变成可验证的宿主动作/);
  assert.match(overlay, /只调用 Manifest 允许的动作/);
  assert.match(overlay, /检查 URL、界面层与数据结果/);
  assert.match(overlay, /openRequest/);
  assert.match(overlay, /页面层指南/);
});

test("deep links are served by the frontend catch-all", async () => {
  const response = await render("/product/1/order/2/edit");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Layered Route Lab/);
  assert.equal(html.match(/data-reconstructible="true"/g)?.length, 5);
});

test("deep behavior routes rebuild a seven-presenter route stack", async () => {
  const response = await render("/product/1/order/2/edit/review/confirm");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.match(/data-reconstructible="true"/g)?.length, 7);
  assert.match(html, /Confirm order 2/);
});

test("server rendering starts from the requested route instead of the default deep stack", async () => {
  const response = await render("/products");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.equal(html.match(/data-reconstructible="true"/g)?.length, 1);
  assert.match(html, /data-surface-id="\/products"/);
  assert.doesNotMatch(html, /data-surface-id="\/product\/1\/order\/2\/edit"/);
});

test("metadata stays static and resolves social images from the configured site URL", async () => {
  const layout = await readFile(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(layout, /next\/headers|headers\(\)/);
  assert.match(layout, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(layout, /process\.env\.ALLOW_LOCAL_DEMO_URL === "1"/);
  assert.match(layout, /process\.env\.NODE_ENV === "production"/);
  assert.match(layout, /cannot use localhost for a production build/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /url: "\/og\.png"/);
});

test("portable static entry includes the shared global styles", async () => {
  const [staticEntry, globals] = await Promise.all([
    readFile(new URL("../static/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(staticEntry, /import "\.\.\/app\/globals\.css"/);
  assert.match(globals, /\* \{[\s\S]*?box-sizing: border-box/);
  assert.match(globals, /html,[\s\S]*?body \{[\s\S]*?margin: 0/);
  assert.match(globals, /button,[\s\S]*?input,[\s\S]*?textarea \{[\s\S]*?font: inherit/);
});

test("programmatic history updates notify the current URL store", async () => {
  const app = await readFile(
    new URL("../src/App.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    app,
    /window\.addEventListener\(LOCATION_CHANGE_EVENT, onStoreChange\)/,
  );
  assert.equal(app.match(/notifyLocationChange\(\);/g)?.length, 2);
});

test("employee order deep links preserve the synthetic query for client reconstruction", async () => {
  const response = await render(
    "/employee/A-17/order/1?date=2026-08-06&period=%E5%8D%88%E9%A4%90&focus_item=%E9%A6%99%E8%8D%89%E7%83%A9%E9%A5%AD",
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Layered Route Lab/);
  assert.match(html, /__VINEXT_RSC_PARAMS__=\{"path":\["employee","A-17","order","1"\]\}/);
  assert.match(html, /"pathname":"\/employee\/A-17\/order\/1"/);
  assert.match(html, /\["period","午餐"\]/);
  assert.match(html, /\["focus_item","香草烩饭"\]/);
});

test("agent execution keeps every step visible and reveals deep routes progressively", async () => {
  const [app, overlay, routeRail, css] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/AgentDemoOverlay.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/RouteRail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
  ]);

  assert.match(overlay, /const AGENT_STEP_DELAY_MS = 500/);
  assert.match(overlay, /function buildProgressiveNavigationTargets/);
  assert.match(overlay, /buildRouteStack\(url\.pathname\)/);
  assert.match(
    overlay,
    /const routeTargets = buildProgressiveNavigationTargets\(target\)/,
  );
  assert.match(overlay, /index === 0 \? "push" : "replace"/);
  assert.match(overlay, /snapshot\.topEntered/);
  assert.match(overlay, /function waitForPacingFloor/);
  assert.match(overlay, /Math\.min\(remaining, 32\)/);
  assert.match(overlay, /const convergenceDeadline = window\.performance\.now\(\) \+ 1_200/);
  assert.match(overlay, /data-step-delay-ms=\{AGENT_STEP_DELAY_MS\}/);
  assert.match(overlay, /data-step-state=/);
  assert.match(overlay, /STEP DELAY:/);
  assert.doesNotMatch(overlay, /await wait\(260\)/);
  assert.match(overlay, /onRunningChange\?\.\(running\)/);
  assert.match(app, /updatesPaused=\{agentRunning\}/);
  assert.match(app, /onRunningChange=\{setAgentRunning\}/);
  assert.match(routeRail, /if \(updatesPaused\) return;/);
  assert.match(routeRail, /aria-busy=\{updatesPaused\}/);
  assert.match(
    css,
    /\.route-rail\[aria-busy="true"\] \.lab-route-link\.active/,
  );
});

test("agent commands are acknowledged by the host App bridge without conflicting Alt+S capture", async () => {
  const [app, overlay, bridge, agentCss] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/AgentDemoOverlay.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/appBridge.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/agent-demo.css", import.meta.url), "utf8"),
  ]);

  assert.match(bridge, /layered-route-lab:agent-command/);
  assert.match(bridge, /layered-route-lab:agent-result/);
  assert.match(bridge, /type: "route\.navigate"/);
  assert.match(bridge, /type: "presenter\.advance"/);
  assert.match(bridge, /type: "modal\.open"/);
  assert.match(bridge, /type: "inspection\.set"/);
  assert.match(bridge, /type: "playback\.set"/);
  assert.match(overlay, /sendLabAppCommand/);
  assert.match(overlay, /event\.key\.toLowerCase\(\) === "k"/);
  assert.match(overlay, /REVIEW PLAN → EXECUTE/);
  assert.doesNotMatch(overlay, /event\.altKey && event\.code === "KeyS"/);
  assert.doesNotMatch(overlay, /HOLD: ALT\+S|shortcutPacingRef|handleKeyUp/);
  assert.match(overlay, /点击示例生成计划，确认后才会执行。/);
  assert.match(overlay, /onClick=\{\(\) => runCommand\(suggestion\.command\)\}/);
  assert.match(overlay, /onClick=\{\(\) => void runPlan\(plan\)\}/);
  assert.match(agentCss, /\.agent-panel \{[\s\S]*?display: flex[\s\S]*?flex-direction: column/);
  assert.match(agentCss, /\.agent-panel-body \{[\s\S]*?flex: 1 1 auto[\s\S]*?min-height: 0[\s\S]*?overflow-y: auto/);
  assert.match(agentCss, /\.agent-suggestions button::after/);
  assert.match(overlay, /data-app-bridge="ready"/);
  assert.match(overlay, /data-playback-mode=/);
  assert.doesNotMatch(overlay, /new PopStateEvent|new KeyboardEvent/);
  assert.match(app, /window\.addEventListener\(LAB_AGENT_COMMAND_EVENT/);
  assert.match(app, /commitNavigation\(request\.command\.target, request\.command\.mode\)/);
  assert.match(app, /data-agent-playback=\{agentPlaybackMode\}/);
  assert.match(app, /releasePendingResponses\(\)/);
  assert.match(app, /respondAfter\(request\.requestId, settleDuration\)/);
});

test("route navigation preserves only explicit shell query parameters", async () => {
  const browserLocation = await readFile(
    new URL("../src/router/browserLocation.ts", import.meta.url),
    "utf8",
  );

  assert.match(browserLocation, /PRESERVED_SHELL_QUERY_PARAMS = \["embed", "agent_demo"\]/);
  assert.match(
    browserLocation,
    /PRESERVED_SHELL_QUERY_PARAMS\.forEach\(\(key\) => params\.delete\(key\)\)/,
  );
  assert.match(browserLocation, /if \(!targetParams\.has\(key\) && browserParams\.has\(key\)\)/);
  assert.match(browserLocation, /targetParams\.delete\(STATIC_ROUTE_QUERY_PARAM\)/);
  assert.doesNotMatch(browserLocation, /agent_cmd/);
});

test("modal leave fallback remains later than the CSS transform transition", async () => {
  const modal = await readFile(
    new URL("../src/core/Modal.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../src/layered-route-lab.css", import.meta.url),
    "utf8",
  );

  assert.match(modal, /callEvent\("didLeave"\);[\s\S]*?\}, 360\)/);
  assert.match(css, /transform 300ms ease-in-out/);
  assert.match(modal, /event\.propertyName !== "transform"/);
});

test("route reconstruction uses a branched behavior tree", async () => {
  const routes = await readFile(
    new URL("../src/router/routes.ts", import.meta.url),
    "utf8",
  );
  const presenter = await readFile(
    new URL("../src/core/Presenter.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../src/layered-route-lab.css", import.meta.url),
    "utf8",
  );

  assert.match(
    routes,
    /DEFAULT_DEMO_ROUTE_PATH = "\/product\/1\/order\/2\/edit"/,
  );
  assert.match(routes, /path: "\/product\/1\/settings"/);
  assert.match(routes, /path: "\/product\/1\/orders\/paid"/);
  assert.match(
    routes,
    /path: "\/product\/1\/orders\/paid\/order\/1"/,
  );
  assert.match(routes, /path: "\/employees"/);
  assert.match(routes, /path: "\/product\/2\/order\/2"/);
  assert.match(routes, /path: "\/employee\/A-17\/order\/1"/);
  assert.match(routes, /function flattenDemoRouteTree/);
  assert.match(presenter, /data-reconstructible=\{reconstructible\}/);
  assert.match(presenter, /页面刷新后会被重建/);
  assert.match(
    css,
    /\.presenter\[data-reconstructible="true"\][\s\S]*?background: #eaf7ff/,
  );
});

test("order detail restores cached manualPay query on route leave", async () => {
  const [app, presenter, context] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/core/Presenter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/core/AppContext.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(context, /queryStringCacheMap/);
  assert.match(context, /setQueryStringCache/);
  assert.match(presenter, /route\.params\.orderId !== "123"/);
  assert.match(
    presenter,
    /context\.setQueryStringCache\(backRoute\.pattern, \{[\s\S]*?manualPay: "1"/,
  );
  assert.match(presenter, /自动追加 manualPay query 参数/);
  assert.match(presenter, /已追加 query：\?manualPay=1/);
  assert.match(app, /function appendCachedRouteQuery/);
  assert.match(
    app,
    /const target = appendCachedRouteQuery\([\s\S]*?commitNavigation\(target, pending\.mode\)/,
  );
});

test("presenter leave keeps the surface mounted until transition completion", async () => {
  const [app, presenter, css] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/core/Presenter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /startPresenterLeave/);
  assert.match(app, /finishPresenterLeave/);
  assert.match(app, /leaving=\{leavingPresenterPath === route\.path\}/);
  assert.match(app, /onDidLeave=\{finishPresenterLeave\}/);
  assert.match(presenter, /data-leaving=\{leaving\}/);
  assert.match(presenter, /onTransitionEnd=\{handleTransitionEnd\}/);
  assert.match(css, /\.presenter\[data-leaving="true"\]/);
  assert.match(css, /translate3d\(102%, 0, 0\)/);
  const leaveFunction = app.match(
    /const startPresenterLeave[\s\S]*?\n  \);\n\n  const finishPresenterLeave/,
  )?.[0];
  assert.ok(leaveFunction);
  assert.doesNotMatch(leaveFunction, /setD3\(false\)/);
  assert.match(presenter, /"--presenter-lifecycle-scale"/);
  assert.match(presenter, /entered && !leaving \? 1 : 0/);
  assert.match(
    css,
    /scale\(var\(--presenter-lifecycle-scale\)\)/,
  );
  assert.match(
    css,
    /\.stage\[data-d3-mode="grid"\] \.presenter\[data-leaving="true"\][\s\S]*?transform-origin: center center[\s\S]*?scale\(var\(--presenter-lifecycle-scale\)\)/,
  );
  assert.match(presenter, /const label = `presenter-\$\{index \+ 1\}`/);
  assert.match(presenter, /<dt>currentUrl<\/dt>/);
  assert.match(presenter, /<dt>lastRouteUrl<\/dt>/);
  assert.match(presenter, /<dt>currentDepth<\/dt>/);
  assert.doesNotMatch(
    presenter,
    /architectureNotes|RouteSpecificBody|sample-list|edit-form|surface-footer/,
  );
});

test("large list pages reload in 3D without compressing their content", async () => {
  const [productsResponse, ordersResponse, presenter, lifecycle, business, css, data] =
    await Promise.all([
      render("/products"),
      render("/product/1/orders"),
      readFile(new URL("../src/core/Presenter.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/core/PresenterLifecycle.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/agent/DemoBusinessSurface.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/agent/demo-business.css", import.meta.url), "utf8"),
      readFile(new URL("../src/agent/demoData.ts", import.meta.url), "utf8"),
    ]);

  const [productsHtml, ordersHtml] = await Promise.all([
    productsResponse.text(),
    ordersResponse.text(),
  ]);

  assert.match(productsHtml, /data-large-list="products"/);
  assert.match(productsHtml, /data-row-count="72"/);
  assert.match(ordersHtml, /data-large-list="orders"/);
  assert.match(ordersHtml, /data-row-count="96"/);
  assert.match(productsHtml, /data-loading="true"/);
  assert.match(ordersHtml, /data-loading="true"/);
  assert.match(productsHtml, /class="demo-list-spinner"/);
  assert.match(ordersHtml, /class="demo-list-spinner"/);
  assert.doesNotMatch(productsHtml, /P-001/);
  assert.doesNotMatch(ordersHtml, /Order 1006/);
  assert.match(lifecycle, /"willAppear"/);
  assert.match(lifecycle, /"didAppear"/);
  assert.match(lifecycle, /"willDisappear"/);
  assert.match(lifecycle, /"didDisappear"/);
  assert.match(presenter, /lifecycle\.emit\("willAppear"\)/);
  assert.match(presenter, /lifecycle\.emit\("willDisappear"\)/);
  assert.match(business, /lifecycle\.on\("willAppear"/);
  assert.match(business, /lifecycle\.on\("didAppear"/);
  assert.match(business, /lifecycle\.on\("willDisappear"/);
  assert.match(business, /lifecycle\.on\("didDisappear"/);
  assert.match(business, /const LIST_LOADING_PAINT_MS = 160/);
  assert.match(business, /loadingSinceRef/);
  assert.match(business, /LIST_LOADING_PAINT_MS - elapsed/);
  assert.match(business, /state\.loading \? \(/);
  assert.match(business, /demo-list-spinner/);
  assert.match(presenter, /const pageActive = \(isTop \|\| d3\) && !leaving/);
  assert.match(presenter, /previousInspectionModeRef/);
  assert.match(presenter, /previousPageActive !== pageActive \|\| inspectionModeChanged/);
  assert.match(
    presenter,
    /\[d3, inspectionMode, lifecycle, pageActive\]/,
  );
  assert.match(css, /\.demo-lifecycle-list\[data-loading="true"\][\s\S]*?min-height/);
  assert.match(
    css,
    /\.demo-lifecycle-list\[data-loading="true"\] \{[\s\S]*?position: fixed[\s\S]*?inset: 52px 0 0[\s\S]*?background: var\(--presenter-background/,
  );
  assert.match(
    css,
    /\.demo-table-shell \{[\s\S]*?min-width: 0[\s\S]*?max-width: 100%/,
  );
  assert.match(
    css,
    /\.demo-business-surface \{[\s\S]*?min-width: 0/,
  );
  assert.doesNotMatch(
    css,
    /\.stage\[data-d3="true"\] \.demo-business-surface/,
  );
  assert.doesNotMatch(
    css,
    /\.stage\[data-d3-mode="grid"\] \.demo-business-surface/,
  );
  assert.doesNotMatch(
    css,
    /\.stage\[data-d3-mode="grid"\] \.demo-table(?:\s|\{)/,
  );
  assert.match(data, /\{ length: 72 \}/);
  assert.match(data, /\{ length: 96 \}/);
});

test("temporary surfaces reserve empty history slots on the same URL", async () => {
  const app = await readFile(
    new URL("../src/App.tsx", import.meta.url),
    "utf8",
  );

  assert.match(app, /interface PresenterRecord/);
  assert.match(app, /const pushPresenter = useCallback/);
  assert.equal(
    (app.match(
      /window\.history\.pushState\(null, "", currentBrowserLocation\(\)\)/g,
    ) || []).length,
    2,
  );
  assert.match(app, /const ignoreNextOverlayPopRef = useRef\(false\)/);
  assert.match(app, /if \(ignoreNextOverlayPopRef\.current\)/);
  assert.match(app, /const hasLayeredDepth =/);
  assert.match(app, /window\.history\.go\(-historySteps\)/);
  assert.match(
    app,
    /function currentBrowserLocation\(\) \{[\s\S]*?window\.location\.pathname[\s\S]*?window\.location\.search/,
  );
  assert.match(
    app,
    /window\.history\.pushState\(null, "", currentBrowserLocation\(\)\)/,
  );
  assert.match(
    app,
    /if \(route\?\.nextPath\) \{[\s\S]*?navigate\(route\.nextPath\);[\s\S]*?pushPresenter\(\);/,
  );
  assert.doesNotMatch(
    app,
    /navigate\(route\?\.nextPath \|\| "\/products"\)/,
  );
  assert.match(app, /\{presenters\.map\(\(presenter\) =>/);
  assert.match(app, /currentUrl=\{currentUrl\}/);
  assert.match(app, /lastRouteUrl=\{presenter\.lastRouteUrl\}/);
  assert.match(
    app,
    /createPresenterRecord\(currentPresenters, window\.location\.href\)/,
  );
  assert.match(app, /currentDepth=\{presenterIndex \+ 1\}/);
});

test("3D mode tiles every presenter by its index target", async () => {
  const [app, presenter, css] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/core/Presenter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /type InspectionMode = "off" \| "stack" \| "grid"/);
  assert.match(
    app,
    /current === "off"[\s\S]*?\? "stack"[\s\S]*?current === "stack"[\s\S]*?\? "grid"[\s\S]*?: "off"/,
  );
  assert.match(app, /event\.shiftKey && event\.code === "Space"/);
  assert.match(app, /cycleInspectionMode\(\)/);
  assert.match(css, /\.stage\[data-d3-mode="stack"\] \.presenter/);
  assert.match(css, /rotateY\(var\(--d3-rotation\)\)/);
  assert.match(presenter, /function getPresenterOverviewInsets/);
  assert.match(presenter, /const column = index % columns/);
  assert.match(presenter, /const row = Math\.floor\(index \/ columns\)/);
  assert.match(presenter, /"--overview-top": overview\.top/);
  assert.match(presenter, /"--overview-mobile-top": mobileOverview\.top/);
  assert.match(
    css,
    /inset: var\(--overview-top\) var\(--overview-right\)[\s\S]*?var\(--overview-bottom\) var\(--overview-left\)/,
  );
  assert.match(
    css,
    /transition-delay: calc\(var\(--stack-index\) \* 14ms\), 0ms/,
  );
  assert.match(
    css,
    /transition: transform 420ms[\s\S]*?opacity 220ms ease, inset 460ms/,
  );
  assert.match(
    css,
    /transition: inset 580ms[\s\S]*?transform 420ms[\s\S]*?opacity 220ms ease/,
  );
  assert.match(
    presenter,
    /inspectionMode === "grid" \? 560 : 520/,
  );
  assert.match(css, /inset: var\(--overview-mobile-top\)/);
  assert.match(css, /scale\(1\.008\)/);
  assert.match(
    css,
    /\.presenter\[data-entered="false"\][\s\S]*?will-change: transform, opacity/,
  );
  assert.doesNotMatch(
    css,
    /^\.presenter \{[^}]*will-change/m,
  );

  assert.match(app, /className="presenter-canvas"/);
  assert.match(app, /Math\.max\(1, overviewRows \/ 3\) \* 100/);
  assert.match(app, /presenterCount > 9/);
  assert.match(app, /top: stage\.scrollHeight/);
  assert.match(app, /behavior: "auto"/);

  assert.match(app, /const closeUntilUid = useCallback/);
  assert.match(app, /presenter\.id === uid/);
  assert.match(app, /route\.path === uid/);
  assert.match(app, /pendingFocusedRouteRef\.current = targetRoute\.path/);
  assert.match(
    app,
    /window\.history\.go\(-historySteps\)/,
  );
  assert.match(presenter, /onSelect\(\)/);
  assert.match(presenter, /className="presenter-grid-target"/);
  assert.match(
    css,
    /\.stage\[data-d3-mode="grid"\] \.presenter-grid-target[\s\S]*?position: absolute/,
  );
  assert.match(presenter, />\s*presenter\.push\(\)\s*</);
  assert.match(presenter, /event\.stopPropagation\(\)/);
  assert.match(
    css,
    /\.surface-content-minimal \{[\s\S]*?position: relative/,
  );
  assert.match(
    css,
    /\.presenter-title-row \{[\s\S]*?padding-right: 160px/,
  );
  assert.match(
    css,
    /\.presenter-push-button \{[\s\S]*?position: absolute[\s\S]*?top: clamp\(28px, 5vw, 72px\)[\s\S]*?right: clamp\(28px, 5vw, 72px\)/,
  );
  assert.match(app, /onPush=\{pushNext\}/);
});

test("route rail combines route navigation with route-less presenters", async () => {
  const [app, routeRail, css] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/RouteRail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /<RouteRail/);
  assert.match(app, /temporaryPresenters=\{temporaryPresenterLayers\}/);
  assert.match(app, /data-route-rail-collapsed=\{routeRailCollapsed\}/);
  assert.match(app, /onToggleCollapsed=\{\(\) => setRouteRailCollapsed/);
  assert.match(app, /onCloseUntilUid=\{closeUntilUid\}/);
  assert.match(routeRail, /className=\{`route-rail /);
  assert.match(routeRail, /className="route-composition-path"/);
  assert.match(routeRail, /className="route-rail-collapse-toggle"/);
  assert.match(routeRail, /aria-label=\{collapsed \? "展开 Routes" : "折叠 Routes"\}/);
  assert.match(routeRail, /className="route-presenter-array"/);
  assert.match(routeRail, /flattenDemoRouteTree\(\)/);
  assert.match(routeRail, /ref=\{routeListRef\}/);
  assert.match(
    routeRail,
    /scrollIntoView\(\{ block: "nearest", inline: "center" \}\)/,
  );
  assert.match(app, /<header className="workbench-bar">/);
  assert.match(app, /<div className="bar-actions" aria-label="Layer controls">/);
  assert.match(app, /<span>Push page<\/span>[\s\S]*?<kbd>⇧ N<\/kbd>/);
  assert.match(app, /<span>Derive modal<\/span>[\s\S]*?<kbd>⇧ M<\/kbd>/);
  assert.match(css, /--route-rail-width: 300px/);
  assert.match(css, /\.route-rail \{/);
  assert.match(css, /\.workbench\[data-route-rail-collapsed="true"\]/);
  assert.match(css, /\.route-rail\.is-collapsed nav/);
  assert.match(css, /\.lab-route-list \{/);
  assert.match(
    css,
    /\.route-presenter-array \{[\s\S]*?flex-wrap: wrap/,
  );
});

test("manifest-backed behavior viewer and page branch controls share route edges", async () => {
  const [app, graph, presenter, routes, css] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/BehaviorGraphViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/core/Presenter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/router/routes.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /<span>Behavior graph<\/span>/);
  assert.match(app, /<BehaviorGraphViewer/);
  assert.match(graph, /const graphNodes = behaviorManifest\.routeInstances/);
  assert.match(graph, /selectedNode\.childPaths\.map/);
  assert.match(graph, /onNavigateRoute\(path\)/);
  assert.match(presenter, /className="route-branch-actions"/);
  assert.match(presenter, /route\.childPaths\.map/);
  assert.match(routes, /export function getDemoRouteChildPaths/);
  assert.match(css, /\.behavior-graph-viewer \{/);
  assert.match(css, /\.route-branch-action-list \{/);
});

test("mobile layout keeps controls, content, and the Agent launcher in bounds", async () => {
  const [app, css, businessCss, agentCss, overlay] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/demo-business.css", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/agent-demo.css", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/AgentDemoOverlay.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--presenter-background: var\(--surface\)/);
  assert.match(
    css,
    /@media \(max-width: 720px\)[\s\S]*?\.bar-actions \{[\s\S]*?gap: 4px[\s\S]*?\.bar-actions button \{[\s\S]*?padding: 8px 6px/,
  );
  assert.match(app, /className="escape-action"/);
  assert.match(
    css,
    /\.bar-actions \.escape-action > span \{[\s\S]*?display: none[\s\S]*?\.bar-actions \.escape-action > kbd \{[\s\S]*?display: inline/,
  );
  assert.match(
    css,
    /\.presenter-title-row \{[\s\S]*?padding-right: 0[\s\S]*?\.eyebrow \{[\s\S]*?min-height: 42px[\s\S]*?padding-right: 150px/,
  );
  assert.match(
    businessCss,
    /@media \(max-width: 720px\)[\s\S]*?\.demo-lifecycle-list\[data-loading="true"\][\s\S]*?inset: 48px 0 0/,
  );
  assert.match(
    agentCss,
    /@media \(max-width: 720px\)[\s\S]*?\.agent-dock \{[\s\S]*?width: 52px[\s\S]*?height: 52px/,
  );
  assert.match(overlay, /aria-label="打开 Agent Demo"/);
});

test("mobile route selection expands as an overlay and running Agent collapses to one line", async () => {
  const [routeRail, css, overlay, agentCss] = await Promise.all([
    readFile(new URL("../src/RouteRail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/AgentDemoOverlay.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/agent-demo.css", import.meta.url), "utf8"),
  ]);

  assert.match(routeRail, /className="route-rail-menu-toggle"/);
  assert.match(routeRail, /aria-controls="route-rail-routes"/);
  assert.match(routeRail, /className="route-rail-menu-scrim"/);
  assert.match(
    css,
    /@media \(max-width: 720px\)[\s\S]*?\.route-rail \{[\s\S]*?height: 64px[\s\S]*?\.route-rail nav \{[\s\S]*?position: fixed/,
  );
  assert.match(css, /\.lab-route-list \{[\s\S]*?grid-template-columns: repeat\(2/);

  assert.match(overlay, /className="agent-running-compact"/);
  assert.match(overlay, /正在执行 \{Math\.max\(activeStep \+ 1, 1\)\}/);
  assert.match(
    agentCss,
    /\.agent-overlay\[data-running="true"\] \.agent-panel \{[\s\S]*?top: auto[\s\S]*?height: 72px/,
  );
  assert.match(
    agentCss,
    /\.agent-panel > :not\(\.agent-running-compact\) \{[\s\S]*?display: none/,
  );
});

test("each modal handle owns diagnostics, relative navigation, and focus recovery", async () => {
  const [app, modal, css] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/core/Modal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(
    app,
    /visualTopModalIndex|depthFromTop=|stack=\{modals\}/,
  );
  assert.match(app, /lastFullIndex/);
  assert.match(app, /leaving=\{modal\.id === leavingModalId\}/);
  assert.match(app, /leavingIndex=\{leavingModalIndex\}/);
  assert.match(
    app,
    /showMask=\{index === 0 \|\| Boolean\(modals\[index - 1\]\?\.full\)\}/,
  );
  assert.match(app, /lastSize=/);
  assert.match(app, /const selectModal = useCallback/);
  assert.match(app, /currentModals\.findIndex\(\(modal\) => modal\.id === id\)/);
  assert.match(app, /startModalLeave\(targetIndex \+ 1, false\)/);
  assert.match(app, /pendingModalFocusIdRef\.current = null;[\s\S]*?setModalFocusSequence\(\+\+modalFocusSequenceRef\.current\)/);
  assert.match(app, /!remaining\.some\(\(modal\) => modal\.id === focusedModalId\)/);
  assert.match(app, /modalPrefix=\{modals\.slice\(0, index \+ 1\)\}/);
  assert.match(app, /focusSequence=\{modalFocusSequence\}/);
  assert.doesNotMatch(app, /modalTelemetry|recordModalLifecycle|observedModal/);

  assert.match(modal, /interface ModalHandleState/);
  assert.match(modal, /active: false/);
  assert.match(modal, /leaving: false/);
  assert.match(modal, /isOpen: false/);
  assert.match(modal, /calledEventFlags/);
  assert.match(modal, /generateModalContentStyle/);
  assert.match(modal, /const prevLeaving = leavingIndex === i \+ 1/);
  assert.match(modal, /shiftFactor = shiftFactor > 1 \? 1 : shiftFactor/);
  assert.match(modal, /1 - \(24 \/ 480\) \* shiftFactor/);
  assert.match(modal, /244 - shiftFactor \* delta/);
  assert.match(modal, /const presentation = modal\.full/);
  assert.match(modal, /!modal\.full && !isTop \? lastSize : modal/);
  assert.match(modal, /"--modal-background"/);
  assert.match(modal, /const label = `modal-\$\{index \+ 1\}`/);
  assert.match(modal, /<dt>requested preset<\/dt>[\s\S]*?<dd>/);
  assert.match(modal, /<dt>effective target<\/dt>[\s\S]*?<dd>/);
  assert.match(modal, /<dt>mode<\/dt>[\s\S]*?<dd>/);
  assert.match(modal, /<dt>stable UID \/ index<\/dt>[\s\S]*?<dd>/);
  assert.match(modal, /<dt>lastFullModal<\/dt>[\s\S]*?<dd>/);
  assert.match(modal, /<dt>lastFullModalID<\/dt>[\s\S]*?<dd>/);
  assert.match(modal, /<dt>currentDepth<\/dt>[\s\S]*?<dd>/);
  assert.match(modal, /modalPrefix\.map\(\(prefixModal, prefixIndex\)/);
  assert.match(modal, /onSelectModal\(prefixModal\.id\)/);
  assert.match(modal, /modal-card-focus/);
  assert.match(modal, /prefixModal\.full \? " \(full\)" : ""/);
  assert.match(modal, /isCurrent \? " \(current\)" : ""/);
  assert.match(modal, /event\.target === event\.currentTarget/);
  assert.match(modal, /event\.animationName === "modal-focus-pulse"/);
  assert.match(modal, /focusSequence === previousFocusSequenceRef\.current/);
  assert.doesNotMatch(modal, /ModalLifecycleTelemetry|observes modal-2|modalStack|FULL MODAL PARAMETERS/);
  assert.match(modal, /stateChanged\(event\);[\s\S]*?if \(event === "didLeave"\) \{[\s\S]*?onDidLeave\(modal\.id\);/);
  assert.match(app, /id: \+\+modalHandleSequence/);
  assert.match(app, /lastFullModalId:/);
  assert.match(
    modal,
    /const lastFullModalId = modal\.full[\s\S]*?`modal-\$\{modal\.id\}`/,
  );
  assert.match(
    modal,
    /const lastFullModalIndex = modal\.full \? index : modal\.lastFullIndex/,
  );
  assert.match(modal, /const currentDepth = index - lastFullModalIndex/);
  assert.doesNotMatch(modal, /presenterIndex|modal-derived/);
  assert.doesNotMatch(modal, /calculateModalPresentation|isPrevModal/);
  assert.doesNotMatch(css, /translateZ|data-prev-modal/);
  assert.match(css, /transform: var\(--modal-transform\)/);
  assert.match(css, /background: var\(--modal-background\)/);
  assert.match(css, /transform: translateY\(100%\)/);
  assert.match(css, /\.modal-card-focus-pulse \{[\s\S]*?animation: modal-focus-pulse/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.modal-card-focus-pulse \{[\s\S]*?animation: none/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.modal-card-focus-pulse \{[\s\S]*?outline: 2px solid var\(--signal\)/,
  );
  assert.match(
    css,
    /\.modal-card\.modal-card-full \{[\s\S]*?inset: 0;[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?border-radius: 0;/,
  );
  assert.doesNotMatch(
    css,
    /\.modal-card-full \{[\s\S]*?calc\(100% - 32px\)/,
  );
});

test("modal content fills the card and scrolls from its first row", async () => {
  const css = await readFile(
    new URL("../src/layered-route-lab.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /\.modal-card-focus \{[^}]*width: 100%;[^}]*height: 100%;[^}]*grid-template-rows: 52px minmax\(0, 1fr\)/,
  );
  assert.match(
    css,
    /\.modal-body \{[^}]*min-height: 0;[^}]*justify-content: flex-start;[^}]*overflow: auto;[^}]*overscroll-behavior: contain;[^}]*-webkit-overflow-scrolling: touch;/,
  );
  assert.doesNotMatch(
    css,
    /\.modal-card \{[^}]*grid-template-rows: 52px minmax\(0, 1fr\)/,
  );
});
