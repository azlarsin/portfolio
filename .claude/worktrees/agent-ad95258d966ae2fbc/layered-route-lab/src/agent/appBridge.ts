export const LAB_AGENT_COMMAND_EVENT = "layered-route-lab:agent-command";
export const LAB_AGENT_RESULT_EVENT = "layered-route-lab:agent-result";

export const APP_SURFACE_SETTLE_MS = 460;
export const APP_INSPECTION_SETTLE_MS = 620;
export const APP_NORMAL_SETTLE_MS = 80;

export type LabAppCommand =
  | {
      type: "route.navigate";
      target: string;
      mode: "push" | "replace";
    }
  | { type: "presenter.advance" }
  | { type: "modal.open" }
  | { type: "inspection.set"; target: "off" | "stack" | "grid" }
  | { type: "inspection.cycle" }
  | { type: "playback.set"; paced: boolean };

export interface LabAgentCommandRequest {
  requestId: string;
  command: LabAppCommand;
}

export interface LabAgentCommandResult {
  requestId: string;
  ok: boolean;
  error?: string;
}

let requestSequence = 0;

export function sendLabAppCommand(command: LabAppCommand) {
  return new Promise<LabAgentCommandResult>((resolve, reject) => {
    const requestId = `lab-agent-${Date.now()}-${++requestSequence}`;
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`宿主 App 未确认命令：${command.type}`));
    }, 4_000);

    const handleResult = (event: Event) => {
      const result = (event as CustomEvent<LabAgentCommandResult>).detail;
      if (!result || result.requestId !== requestId) return;
      cleanup();
      if (result.ok) resolve(result);
      else reject(new Error(result.error || `宿主 App 拒绝命令：${command.type}`));
    };

    function cleanup() {
      window.clearTimeout(timeout);
      window.removeEventListener(LAB_AGENT_RESULT_EVENT, handleResult);
    }

    window.addEventListener(LAB_AGENT_RESULT_EVENT, handleResult);
    window.dispatchEvent(
      new CustomEvent<LabAgentCommandRequest>(LAB_AGENT_COMMAND_EVENT, {
        detail: { requestId, command },
      }),
    );
  });
}

export function respondToLabAgent(result: LabAgentCommandResult) {
  window.dispatchEvent(
    new CustomEvent<LabAgentCommandResult>(LAB_AGENT_RESULT_EVENT, {
      detail: result,
    }),
  );
}
