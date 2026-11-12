"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  agentSuggestions,
  behaviorManifest,
  planAgentCommand,
  type AgentPlan,
  type AgentPlanStep,
} from "./staticRuntime";
import { buildRouteStack } from "../router/routes";
import {
  createBrowserLocation,
  getRouteLocationFromBrowserUrl,
  getRoutePathFromBrowserUrl,
} from "../router/browserLocation";
import { sendLabAppCommand } from "./appBridge";
import "./agent-demo.css";

type AgentTab = "run" | "knowledge" | "trace";

interface AgentDemoOverlayProps {
  openRequest?: number;
  onOpenGuide?: () => void;
  onRunningChange?: (running: boolean) => void;
}

const AGENT_STEP_DELAY_MS = 500;

function wait(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

async function waitForPacingFloor(
  startedAt: number,
  getStepDelay: () => number,
) {
  while (true) {
    const remaining = getStepDelay() -
      (window.performance.now() - startedAt);
    if (remaining <= 0) return;
    await wait(Math.min(remaining, 32));
  }
}

function readRuntimeSnapshot() {
  const routePresenters = Array.from(
    document.querySelectorAll<HTMLElement>('.presenter[data-reconstructible="true"]'),
  ).filter((presenter) => presenter.dataset.leaving !== "true");
  const topPresenter = routePresenters.find((presenter) =>
    presenter.classList.contains("presenter-top"),
  );
  return {
    location: getRouteLocationFromBrowserUrl(),
    path: getRoutePathFromBrowserUrl(),
    topSurface: topPresenter?.dataset.surfaceId || null,
    topEntered: topPresenter?.dataset.entered === "true",
    routeDepth: routePresenters.length,
    temporaryPresenterDepth: document.querySelectorAll(
      '.presenter[data-reconstructible="false"]',
    ).length,
    modalDepth: document.querySelectorAll(".modal-layer").length,
    inspectionMode:
      document.querySelector<HTMLElement>(".stage")?.dataset.d3Mode || "off",
    hasLeavingSurface: Boolean(document.querySelector('[data-leaving="true"]')),
  };
}

function buildProgressiveNavigationTargets(target: string) {
  const url = new URL(target, window.location.origin);
  const routeStack = buildRouteStack(url.pathname);
  const mountedPaths = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.presenter[data-reconstructible="true"]:not([data-leaving="true"])',
    ),
  ).map((presenter) => presenter.dataset.surfaceId || "");
  let sharedDepth = 0;
  while (
    sharedDepth < routeStack.length &&
    mountedPaths[sharedDepth] === routeStack[sharedDepth].path
  ) {
    sharedDepth += 1;
  }
  const pendingRoutes = routeStack.slice(sharedDepth);
  const routesToReveal = pendingRoutes.length
    ? pendingRoutes
    : [routeStack[routeStack.length - 1]];

  return routesToReveal.map((route, index) =>
    index === routesToReveal.length - 1
      ? `${route.path}${url.search}`
      : route.path,
  );
}

async function dispatchSingleLabNavigation(
  target: string,
  mode: "push" | "replace",
  getStepDelay: () => number,
) {
  const startedAt = window.performance.now();
  const url = new URL(target, window.location.origin);
  const expectedLocation = `${url.pathname}${url.search}`;
  const current = readRuntimeSnapshot();
  if (
    current.location === expectedLocation &&
    current.topSurface === url.pathname &&
    current.temporaryPresenterDepth === 0 &&
    current.modalDepth === 0 &&
    !current.hasLeavingSurface
  ) {
    await waitForPacingFloor(startedAt, getStepDelay);
    return;
  }
  await sendLabAppCommand({
    type: "route.navigate",
    target: expectedLocation,
    mode,
  });
  let snapshot = readRuntimeSnapshot();
  const convergenceDeadline = window.performance.now() + 1_200;
  while (
    (
      snapshot.location !== expectedLocation ||
      snapshot.topSurface !== url.pathname ||
      !snapshot.topEntered ||
      snapshot.temporaryPresenterDepth !== 0 ||
      snapshot.modalDepth !== 0 ||
      snapshot.hasLeavingSurface
    ) &&
    window.performance.now() < convergenceDeadline
  ) {
    await wait(24);
    snapshot = readRuntimeSnapshot();
  }
  await waitForPacingFloor(startedAt, getStepDelay);

  if (
    snapshot.location !== expectedLocation ||
    snapshot.topSurface !== url.pathname ||
    !snapshot.topEntered ||
    snapshot.temporaryPresenterDepth !== 0 ||
    snapshot.modalDepth !== 0 ||
    snapshot.hasLeavingSurface
  ) {
    throw new Error("宿主 App 未收敛到目标 Presenter 状态");
  }
}

async function dispatchLabNavigation(
  target: string,
  getStepDelay: () => number,
) {
  const routeTargets = buildProgressiveNavigationTargets(target);
  for (let index = 0; index < routeTargets.length; index += 1) {
    await dispatchSingleLabNavigation(
      routeTargets[index],
      index === 0 ? "push" : "replace",
      getStepDelay,
    );
  }
}

async function dispatchLabKeyboard(key: "n" | "m" | " ") {
  await sendLabAppCommand(
    key === "n"
      ? { type: "presenter.advance" }
      : key === "m"
        ? { type: "modal.open" }
        : { type: "inspection.cycle" },
  );
}

async function dispatchInspection(target: "grid") {
  if (readRuntimeSnapshot().inspectionMode === target) return;
  await sendLabAppCommand({ type: "inspection.set", target });
  if (readRuntimeSnapshot().inspectionMode !== target) {
    throw new Error("检查视图未切换到 Grid");
  }
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

function getShareUrl(command: string) {
  const params = new URLSearchParams({ agent_cmd: command.slice(0, 240) });
  return new URL(
    createBrowserLocation(`/products?${params}`),
    window.location.origin,
  ).href;
}

function getExpectedRouteDepth(targetPath: string) {
  let current = behaviorManifest.routeInstances.find((route) => route.path === targetPath);
  let depth = 0;
  const visited = new Set<string>();
  while (current && !visited.has(current.path)) {
    visited.add(current.path);
    depth += 1;
    current = current.parentPath
      ? behaviorManifest.routeInstances.find((route) => route.path === current?.parentPath)
      : undefined;
  }
  return depth || null;
}

function verifyPlanResult(plan: AgentPlan) {
  const snapshot = readRuntimeSnapshot();
  const failures: string[] = [];
  if (plan.matchedRoute) {
    const expected = new URL(plan.matchedRoute, window.location.origin);
    const expectedLocation = `${expected.pathname}${expected.search}`;
    if (snapshot.location !== expectedLocation) failures.push("完整 URL 不一致");
    if (snapshot.topSurface !== expected.pathname) failures.push("顶层 Presenter 不一致");
    const expectedDepth = plan.expectedRouteDepth ?? getExpectedRouteDepth(expected.pathname);
    if (expectedDepth !== null && snapshot.routeDepth !== expectedDepth) {
      failures.push(`Presenter 深度应为 ${expectedDepth}`);
    }
  }

  if (plan.intent === "aggregate-order-data") {
    const summary = plan.summary;
    const rowCount = summary?.rows.reduce((total, row) => total + row.count, 0);
    const rowAmount = summary?.rows.reduce((total, row) => total + row.amount, 0);
    if (!document.body.textContent?.includes("Agent 整理结果")) {
      failures.push("整理结果标记缺失");
    }
    if (!summary || rowCount !== 6 || rowAmount !== 220 || summary.lunchCount !== 4) {
      failures.push("聚合不变量不一致");
    }
  }

  if (plan.intent === "inspect-presenters" && snapshot.inspectionMode !== "grid") {
    failures.push("检查模式不是 Grid");
  }

  if (plan.intent === "demonstrate-app-bridge") {
    if (snapshot.path !== "/product/1") failures.push("Presenter 目标页面不一致");
    if (snapshot.routeDepth !== 2) failures.push("Presenter 数据深度不是 2");
    if (snapshot.modalDepth !== 1) failures.push("Modal 数据深度不是 1");
  }

  if (plan.intent === "find-employee-order-item") {
    const result = plan.lookupResult;
    const surface = document.querySelector<HTMLElement>(
      '[data-demo-route="employee-order"]',
    );
    const focusedItem = Array.from(
      document.querySelectorAll<HTMLElement>("[data-item-name]"),
    ).find((item) => item.dataset.itemName === result?.itemName);
    const params = new URLSearchParams(window.location.search);
    if (!result || result.sourceCount !== 6 || result.candidateCount !== 2 || result.matchCount !== 1) {
      failures.push("查询漏斗不变量不一致");
    }
    if (
      !surface ||
      surface.dataset.employeeCode !== result?.employeeCode ||
      surface.dataset.orderId !== result?.orderId
    ) {
      failures.push("员工与订单关系不一致");
    }
    if (!focusedItem || focusedItem.dataset.focused !== "true") {
      failures.push("目标菜品未高亮");
    }
    if (
      params.get("date") !== result?.date ||
      params.get("period") !== result?.period ||
      params.get("focus_item") !== result?.itemName
    ) {
      failures.push("跨实体筛选条件不一致");
    }
  }

  if (failures.length) return `FAILED · ${failures.join("；")}`;
  if (plan.intent === "find-employee-order-item") {
    return "VERIFIED · 1 MATCH · 路由、订单与条目一致";
  }
  if (plan.intent === "demonstrate-app-bridge") {
    return "VERIFIED · APP BRIDGE · 2 PRESENTERS + 1 MODAL";
  }
  return `VERIFIED · ${plan.steps.length}/${plan.steps.length} · URL、顶层界面与结果一致`;
}

function StepStatus({
  index,
  activeStep,
  completedCount,
}: {
  index: number;
  activeStep: number;
  completedCount: number;
}) {
  if (index < completedCount) return <span className="agent-step-status is-done">✓</span>;
  if (index === activeStep) return <span className="agent-step-status is-running">••</span>;
  return <span className="agent-step-status">{String(index + 1).padStart(2, "0")}</span>;
}

export default function AgentDemoOverlay({
  openRequest = 0,
  onOpenGuide,
  onRunningChange,
}: AgentDemoOverlayProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AgentTab>("run");
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedCount, setCompletedCount] = useState(0);
  const [verification, setVerification] = useState<string | null>(null);
  const [sharedTask, setSharedTask] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [pacedPlayback, setPacedPlayback] = useState(true);
  const runSequence = useRef(0);
  const pacedPlaybackRef = useRef(true);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onRunningChange?.(running);
  }, [onRunningChange, running]);

  useEffect(
    () => () => onRunningChange?.(false),
    [onRunningChange],
  );

  const knowledgeStats = useMemo(
    () => [
      ["ROUTE SCHEMAS", behaviorManifest.routeSchemas.length],
      ["ROUTE NODES", behaviorManifest.routeInstances.length],
      ["SURFACES", behaviorManifest.surfaces.length],
      ["ACTIONS", behaviorManifest.actions.length],
      ["PAGE CRAWLS", 0],
    ],
    [],
  );

  const preparePlan = useCallback((nextCommand: string) => {
    const nextPlan = planAgentCommand(nextCommand);
    setCommand(nextCommand);
    setPlan(nextPlan);
    setVerification(null);
    setCompletedCount(0);
    setActiveStep(-1);
    setShareUrl(null);
    setShareCopied(false);
    return nextPlan;
  }, []);

  const getStepDelay = useCallback(
    () => pacedPlaybackRef.current ? AGENT_STEP_DELAY_MS : 0,
    [],
  );

  const setPlaybackPacing = useCallback(async (paced: boolean) => {
    pacedPlaybackRef.current = paced;
    setPacedPlayback(paced);
    await sendLabAppCommand({ type: "playback.set", paced });
  }, []);

  const executeAction = useCallback(async (step: AgentPlanStep) => {
    const startedAt = window.performance.now();
    try {
      if (step.action?.type === "navigate") {
        await dispatchLabNavigation(step.action.target, getStepDelay);
      } else if (step.action?.type === "inspection") {
        await dispatchInspection(step.action.target);
      } else if (step.action?.type === "keyboard") {
        await dispatchLabKeyboard(step.action.key);
      }
    } finally {
      await waitForPacingFloor(startedAt, getStepDelay);
    }
  }, [getStepDelay]);

  const runPlan = useCallback(
    async (nextPlan: AgentPlan) => {
      if (running || nextPlan.mode === "clarify") return;
      const sequence = runSequence.current + 1;
      runSequence.current = sequence;
      setRunning(true);
      setCompletedCount(0);
      setVerification(null);
      setTab("trace");

      try {
        for (let index = 0; index < nextPlan.steps.length; index += 1) {
          if (runSequence.current !== sequence) return;
          setActiveStep(index);
          await executeAction(nextPlan.steps[index]);
          if (runSequence.current !== sequence) return;
          setCompletedCount(index + 1);
        }
      } catch (error) {
        setActiveStep(-1);
        setRunning(false);
        setVerification(
          `FAILED · ${error instanceof Error ? error.message : "动作执行失败"}`,
        );
        return;
      }

      setActiveStep(-1);
      setRunning(false);
      setVerification(verifyPlanResult(nextPlan));
    },
    [executeAction, running],
  );

  const runCommand = useCallback(
    (nextCommand: string) => {
      const nextPlan = preparePlan(nextCommand);
      setSharedTask(false);
      setOpen(true);
      setTab("run");
      return nextPlan;
    },
    [preparePlan],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedCommand = params.get("agent_cmd")?.slice(0, 240);
    const timer = window.setTimeout(() => {
      if (params.get("guide") === "1") return;
      if (sharedCommand) {
        setSharedTask(true);
        setOpen(true);
        setTab("run");
        preparePlan(sharedCommand);
        return;
      }
      if (params.get("agent_demo") === "1") {
        setOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [preparePlan]);

  useEffect(() => {
    if (openRequest < 1) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      setTab("run");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [openRequest]);

  useEffect(() => {
    if (!open || tab !== "run" || running) return;
    if (new URLSearchParams(window.location.search).get("agent_demo") === "1") return;
    const timer = window.setTimeout(
      () => commandInputRef.current?.focus({ preventScroll: true }),
      60,
    );
    return () => window.clearTimeout(timer);
  }, [open, running, tab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(true);
        setTab("run");
        return;
      }
      if (open && !running && event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, running]);

  const submitCommand = (event: React.FormEvent) => {
    event.preventDefault();
    runCommand(command);
  };

  const createShare = async () => {
    if (!command.trim()) return;
    const nextShareUrl = getShareUrl(command.trim());
    setShareUrl(nextShareUrl);
    setShareCopied(await copyText(nextShareUrl));
  };

  const resetRunView = () => {
    setCommand("");
    setPlan(null);
    setVerification(null);
    setCompletedCount(0);
    setActiveStep(-1);
    setSharedTask(false);
    setShareUrl(null);
    setShareCopied(false);
    setTab("run");
  };

  return (
    <>
      <button
        className="agent-dock"
        type="button"
        aria-label="打开 Agent Demo"
        title="打开 Agent Demo"
        onClick={() => setOpen(true)}
      >
        <span className="agent-logo" aria-hidden="true">A</span>
        <span>
          <strong>Agent Demo</strong>
          <small>自然语言 → 受约束动作 → 结果校验</small>
        </span>
        <kbd>⌘ K</kbd>
      </button>

      {open ? (
        <div
          className="agent-overlay"
          data-running={running}
          data-active-step={activeStep}
          data-completed-count={completedCount}
          data-step-delay-ms={AGENT_STEP_DELAY_MS}
          data-app-bridge="ready"
          data-playback-mode={pacedPlayback ? "paced" : "normal"}
        >
          <button
            className="agent-scrim"
            type="button"
            aria-label="关闭 Agent"
            onClick={() => {
              if (!running) setOpen(false);
            }}
            disabled={running}
          />
          <aside className="agent-panel" aria-label="Layered Route Lab Agent Demo">
            <header className="agent-panel-header">
              <div className="agent-panel-title">
                <span className="agent-logo" aria-hidden="true">A</span>
                <div>
                  <strong>LAB AGENT</strong>
                  <span>UNDERSTAND · EXECUTE · VERIFY</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭 Agent"
                disabled={running}
                title={running ? "任务运行中" : "关闭 Agent"}
              >×</button>
            </header>

            {running && plan ? (
              <div className="agent-running-compact" role="status" aria-live="polite">
                <span className="agent-step-status is-running">••</span>
                <div>
                  <small>
                    正在执行 {Math.max(activeStep + 1, 1)} / {plan.steps.length}
                  </small>
                  <strong>{plan.steps[activeStep]?.label || "准备执行计划"}</strong>
                </div>
                <code>{completedCount}/{plan.steps.length}</code>
              </div>
            ) : null}

            <div className="agent-status-strip">
              <span><i /> ROUTE INDEX READY</span>
              <span>APP BRIDGE READY</span>
              <span>MODEL: {plan?.model === "skipped" ? "SKIPPED" : "NOT CALLED"}</span>
              <span>CRAWLS: 0</span>
              <span>STEP DELAY: {pacedPlayback ? `${(AGENT_STEP_DELAY_MS / 1000).toFixed(1)}S` : "OFF"}</span>
              <span>REVIEW PLAN → EXECUTE</span>
            </div>

            <button
              type="button"
              className="agent-pace-switch"
              aria-pressed={pacedPlayback}
              onClick={() => void setPlaybackPacing(!pacedPlayback)}
            >
              <span><i /> 逐步动画</span>
              <strong>{pacedPlayback ? "ON · 0.5S" : "OFF · 正常速度"}</strong>
            </button>

            <nav className="agent-tabs" aria-label="Agent Demo 视图">
              {([
                ["run", "操作"],
                ["knowledge", "知识"],
                ["trace", "轨迹"],
              ] as const).map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  className={tab === id ? "is-active" : ""}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="agent-panel-body">
              {tab === "run" ? (
                <div className="agent-run-view">
                  <section className="agent-role-guide" aria-labelledby="agent-role-title">
                    <header>
                      <span>AGENT ROLE</span>
                      {onOpenGuide ? (
                        <button
                          type="button"
                          disabled={running}
                          onClick={() => {
                            setOpen(false);
                            onOpenGuide();
                          }}
                        >
                          页面层指南 ↗
                        </button>
                      ) : null}
                    </header>
                    <h2 id="agent-role-title">把任务变成可验证的宿主动作</h2>
                    <div className="agent-role-flow">
                      <div><span>01 · 理解</span><strong>从任务提取路由与实体</strong></div>
                      <div><span>02 · 执行</span><strong>只调用 Manifest 允许的动作</strong></div>
                      <div><span>03 · 校验</span><strong>检查 URL、界面层与数据结果</strong></div>
                    </div>
                    <p>
                      它不依赖坐标点击，也不在信息缺失时猜测。公开版使用本地 planner
                      与合成数据，不调用线上模型或业务 API。
                    </p>
                  </section>

                  {sharedTask ? (
                    <div className="agent-shared-banner">
                      <strong>来自 agent_cmd 的分享任务</strong>
                      <span>已按当前行为清单重新规划，执行前仍需确认。</span>
                    </div>
                  ) : null}

                  <form className="agent-command-form" onSubmit={submitCommand}>
                    <label htmlFor="agent-command">你想完成什么？</label>
                    <div>
                      <input
                        id="agent-command"
                        ref={commandInputRef}
                        value={command}
                        onChange={(event) => {
                          setCommand(event.target.value);
                          setPlan(null);
                          setVerification(null);
                          setSharedTask(false);
                          setShareUrl(null);
                        }}
                        placeholder="例如：打开 Product 1 的已支付订单 1"
                        autoComplete="off"
                        maxLength={240}
                      />
                      <button type="submit" disabled={running}>生成计划</button>
                    </div>
                  </form>

                  {!plan || plan.mode === "clarify" ? (
                    <div className="agent-suggestions">
                      <span>可运行示例</span>
                      <p>点击示例生成计划，确认后才会执行。</p>
                      {agentSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.command}
                          type="button"
                          onClick={() => runCommand(suggestion.command)}
                          disabled={running}
                        >
                          <small>{suggestion.label}</small>
                          {suggestion.command}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => runCommand("打开订单")}
                        disabled={running}
                      >
                        <small>澄清示例</small>
                        打开订单
                      </button>
                    </div>
                  ) : null}

                  {plan ? (
                    <PlanOverview plan={plan} />
                  ) : (
                    <div className="agent-empty-state">
                      <span>01</span>
                      <p>选择示例生成计划；确认执行后，依次观察页面动作与状态验证。</p>
                    </div>
                  )}

                  {plan?.mode === "clarify" ? (
                    <div className="agent-clarification">
                      <strong>需要补充信息</strong>
                      <p>{plan.clarification}</p>
                    </div>
                  ) : null}

                  {plan && plan.mode !== "clarify" && !running ? (
                    <div className="agent-plan-actions">
                      <button type="button" className="agent-primary" onClick={() => void runPlan(plan)}>
                        {sharedTask
                          ? "确认并运行分享任务"
                          : `执行 ${plan.steps.length} 步`}
                      </button>
                      <button type="button" onClick={() => void createShare()}>复制 agent_cmd 链接</button>
                    </div>
                  ) : null}

                  {shareUrl ? (
                    <div className="agent-share-result">
                      <span>{shareCopied ? "已复制" : "链接已生成"}</span>
                      <code>{shareUrl}</code>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {tab === "knowledge" ? (
                <div className="agent-knowledge-view">
                  <div className="agent-knowledge-hero">
                    <span>BEHAVIOR MANIFEST</span>
                    <h2>路由 AST + 源码特征扫描</h2>
                    <p>构建脚本用 AST 读取路由实例树，并从 Presenter、Modal 源码扫描动作签名；全程不爬页面。</p>
                  </div>
                  <div className="agent-knowledge-stats">
                    {knowledgeStats.map(([label, value]) => (
                      <div key={label}><span>{label}</span><strong>{value}</strong></div>
                    ))}
                  </div>
                  <div className="agent-code-flow">
                    <div><span>01</span><strong>TypeScript Source</strong><small>routes · handlers · surfaces</small></div>
                    <i>→</i>
                    <div><span>02</span><strong>Static Analyzer</strong><small>route AST · signature scan</small></div>
                    <i>→</i>
                    <div><span>03</span><strong>Behavior Manifest</strong><small>routes · actions · evidence</small></div>
                  </div>
                  <div className="agent-source-list">
                    <span>生成来源</span>
                    {behaviorManifest.generatedFrom.map((source) => <code key={source}>{source}</code>)}
                  </div>
                  <div className="agent-action-list">
                    <span>静态识别到的动作候选</span>
                    {behaviorManifest.actions.map((action) => (
                      <div key={action.id}>
                        <code>{action.id}</code>
                        <span>{action.label}</span>
                        <small>{action.evidence}</small>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "trace" ? (
                <div className="agent-trace-view">
                  {plan ? (
                    <>
                      <PlanOverview plan={plan} compact />
                      <ol className="agent-trace-list">
                        {plan.steps.map((step, index) => (
                          <li
                            key={step.id}
                            data-step-id={step.id}
                            data-step-state={
                              index < completedCount
                                ? "done"
                                : index === activeStep
                                  ? "running"
                                  : "pending"
                            }
                            className={index < completedCount ? "is-done" : index === activeStep ? "is-running" : ""}
                          >
                            <StepStatus index={index} activeStep={activeStep} completedCount={completedCount} />
                            <div><strong>{step.label}</strong><code>{step.detail}</code></div>
                          </li>
                        ))}
                      </ol>
                      {verification ? (
                        <div className={`agent-verification ${verification.startsWith("FAILED") ? "is-failed" : ""}`}>
                          {verification}
                        </div>
                      ) : null}
                      {plan.summary ? <SummaryResult plan={plan} /> : null}
                      {plan.lookupResult ? <LookupResult plan={plan} /> : null}
                      <div className="agent-current-state">
                        <span>CURRENT PAGE</span>
                        <code>{typeof window === "undefined" ? "" : `${window.location.pathname}${window.location.search}`}</code>
                      </div>
                      {!running ? (
                        <div className="agent-plan-actions">
                          <button type="button" onClick={resetRunView}>运行其他指令</button>
                          <button type="button" onClick={() => void createShare()}>复制 agent_cmd 链接</button>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="agent-empty-state"><span>00</span><p>尚无执行轨迹。先运行一条指令。</p></div>
                  )}
                </div>
              ) : null}
            </div>

            <footer className="agent-panel-footer">
              <span>SYNTHETIC DATA</span>
              <span>LOCAL PLANNER</span>
              <span>NO BUSINESS API</span>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function PlanOverview({ plan, compact = false }: { plan: AgentPlan; compact?: boolean }) {
  return (
    <section className={`agent-plan-overview ${compact ? "is-compact" : ""}`}>
      <div className="agent-plan-heading">
        <div><span>STRUCTURED INTENT</span><strong>{plan.intent}</strong></div>
        <span>{Math.round(plan.confidence * 100)}% CONF.</span>
      </div>
      <div className="agent-entity-row">
        {plan.entities.map((entity) => (
          <span key={entity.label}><small>{entity.label}</small>{entity.value}</span>
        ))}
      </div>
      {plan.matchedRoute ? <code className="agent-matched-route">{plan.matchedRoute}</code> : null}
    </section>
  );
}

function SummaryResult({ plan }: { plan: AgentPlan }) {
  if (!plan.summary) return null;
  return (
    <section className="agent-summary-result">
      <header><div><span>LOCAL AGGREGATION</span><strong>订单状态摘要</strong></div><span>MODEL SKIPPED</span></header>
      <div className="agent-summary-metrics">
        <div><span>记录</span><strong>{plan.summary.totalCount}</strong></div>
        <div><span>金额</span><strong>¥{plan.summary.totalAmount}</strong></div>
        <div><span>午餐占比</span><strong>{plan.summary.lunchRatio}</strong></div>
      </div>
      <div className="agent-summary-table">
        {plan.summary.rows.map((row) => (
          <div key={row.status}><span>{row.status}</span><strong>{row.count} 笔</strong><code>¥{row.amount}</code></div>
        ))}
      </div>
    </section>
  );
}

function LookupResult({ plan }: { plan: AgentPlan }) {
  if (!plan.lookupResult) return null;
  const result = plan.lookupResult;
  return (
    <section className="agent-lookup-result">
      <header>
        <div><span>LOCAL QUERY · VERIFIED</span><strong>已定位 1 条合成订单</strong></div>
        <span>MODEL SKIPPED</span>
      </header>
      <div className="agent-lookup-funnel" aria-label="查询漏斗">
        <span><strong>{result.sourceCount}</strong> 条合成记录</span>
        <i>员工 / 日期 / 时段</i>
        <span><strong>{result.candidateCount}</strong> 条候选订单</span>
        <i>菜品匹配</i>
        <span><strong>{result.matchCount}</strong> 条命中</span>
      </div>
      <dl>
        <div><dt>员工</dt><dd>{result.employee}</dd></div>
        <div><dt>日期 / 时段</dt><dd>{result.date} · {result.period}</dd></div>
        <div><dt>订单 / 状态</dt><dd>{result.order} · {result.status}</dd></div>
        <div><dt>订单金额</dt><dd>{result.orderAmount}</dd></div>
        <div><dt>命中条目</dt><dd>{result.item}</dd></div>
        <div><dt>条目金额</dt><dd>{result.itemAmount}</dd></div>
      </dl>
      <p>已在本地合成数据中完成过滤、唯一匹配、页面导航与结果验证；未连接真实员工与订单数据。</p>
    </section>
  );
}
