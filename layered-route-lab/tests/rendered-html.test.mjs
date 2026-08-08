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
  assert.doesNotMatch(html, /Route reconstruction|Stack debugger/);
  assert.doesNotMatch(html, /react-loading-skeleton|codex-preview/i);
});

test("deep links are served by the frontend catch-all", async () => {
  const response = await render("/product/1/order/2/edit");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Layered Route Lab/);
  assert.equal(html.match(/data-reconstructible="true"/g)?.length, 5);
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
  const overlay = await readFile(
    new URL("../src/agent/AgentDemoOverlay.tsx", import.meta.url),
    "utf8",
  );

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
});

test("agent commands are acknowledged by the host App bridge and Alt+S starts execution", async () => {
  const [app, overlay, bridge] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/AgentDemoOverlay.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/agent/appBridge.ts", import.meta.url), "utf8"),
  ]);

  assert.match(bridge, /layered-route-lab:agent-command/);
  assert.match(bridge, /layered-route-lab:agent-result/);
  assert.match(bridge, /type: "route\.navigate"/);
  assert.match(bridge, /type: "presenter\.advance"/);
  assert.match(bridge, /type: "modal\.open"/);
  assert.match(bridge, /type: "inspection\.set"/);
  assert.match(bridge, /type: "playback\.set"/);
  assert.match(overlay, /sendLabAppCommand/);
  assert.match(overlay, /event\.altKey && event\.code === "KeyS"/);
  assert.match(overlay, /window\.addEventListener\("keyup", handleKeyUp, true\)/);
  assert.match(overlay, /setPlaybackPacing\(false\)/);
  assert.match(overlay, /void runPlan\(plan\)/);
  assert.match(overlay, /data-app-bridge="ready"/);
  assert.match(overlay, /data-playback-mode=/);
  assert.doesNotMatch(overlay, /new PopStateEvent|new KeyboardEvent/);
  assert.match(app, /window\.addEventListener\(LAB_AGENT_COMMAND_EVENT/);
  assert.match(app, /commitNavigation\(request\.command\.target, request\.command\.mode\)/);
  assert.match(app, /data-agent-playback=\{agentPlaybackMode\}/);
  assert.match(app, /releasePendingResponses\(\)/);
  assert.match(app, /respondAfter\(request\.requestId, settleDuration\)/);
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

test("deepest route pushes route-less presenters on the same URL", async () => {
  const app = await readFile(
    new URL("../src/App.tsx", import.meta.url),
    "utf8",
  );

  assert.match(app, /interface PresenterRecord/);
  assert.match(app, /const pushPresenter = useCallback/);
  assert.match(app, /layeredPresenterDepth: nextPresenters\.length/);
  assert.match(
    app,
    /window\.history\.pushState\([\s\S]*?window\.location\.pathname/,
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

  assert.match(app, /const focusRoutePresenter = useCallback/);
  assert.match(app, /const focusPushedPresenter = useCallback/);
  assert.match(
    app,
    /window\.history\.go\(remaining\.length - historyDepth\)/,
  );
  assert.match(presenter, /onSelect\(\)/);
  assert.match(presenter, />\s*presenter\.push\(\)\s*</);
  assert.match(presenter, /event\.stopPropagation\(\)/);
  assert.match(app, /onPush=\{pushNext\}/);
});

test("project controls live in the header without a project sider", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/layered-route-lab.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(app, /<aside|side-panel|demoRouteNodes/);
  assert.match(app, /<header className="workbench-bar">/);
  assert.match(app, /<div className="bar-actions" aria-label="Layer controls">/);
  assert.match(app, /<span>Push page<\/span>[\s\S]*?<kbd>⇧ N<\/kbd>/);
  assert.match(app, /<span>Derive modal<\/span>[\s\S]*?<kbd>⇧ M<\/kbd>/);
  assert.doesNotMatch(css, /\.side-panel|--sidebar-width/);
});

test("each modal handle owns lifecycle state and ports source stack math", async () => {
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
  assert.match(modal, /<dt>lastFullModal<\/dt>/);
  assert.match(modal, /<dt>lastFullModalID<\/dt>/);
  assert.match(modal, /<dt>currentDepth<\/dt>/);
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
  assert.match(
    css,
    /\.modal-card\.modal-card-full \{[\s\S]*?inset: 0;[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?border-radius: 0;/,
  );
  assert.doesNotMatch(
    css,
    /\.modal-card-full \{[\s\S]*?calc\(100% - 32px\)/,
  );
});
