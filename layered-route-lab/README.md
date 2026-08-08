# Layered Route Lab

A sanitized, backend-free extraction of a layered navigation architecture for
complex web applications.

The demo turns a URL into a deterministic parent-route chain, mounts that chain
as stacked presenters, and gives route pages and modal-derived surfaces one
shared back-stack model.

## Demo route

```text
/products
└─ /product/1
   ├─ /product/1/orders
   │  ├─ /product/1/order/2
   │  │  └─ /product/1/order/2/edit
   │  └─ /product/1/order/123
   ├─ /product/1/settings
   └─ /product/1/orders/paid
      └─ /product/1/orders/paid/order/1

/employees
└─ /employee/A-17
   └─ /employee/A-17/orders
      └─ /employee/A-17/order/1
```

Opening the deepest URL directly rebuilds every parent presenter. There are no
API requests, permissions, company identifiers, production components, or
backend dependencies.

`/product/1/order/123` simulates an order-detail response that writes
`manualPay=1` into the App context query cache. Returning to
`/product/1/orders` appends `?manualPay=1` only after the detail presenter
finishes leaving.

## Keyboard controls

- `Shift + N`: push the next route; at the deepest route, push a route-less
  presenter on the current URL
- `Shift + M`: derive a modal presenter
- `Shift + Space`: cycle normal → original stacked 3D → tiled 3D
- `Escape`: close the top overlay; 3D inspection stays enabled while pages remain

Every presenter also exposes `presenter.push()`, which runs the same operation
as `Shift + N`.

## Agent demo

Open `/products?agent_demo=1` for the public Agent sidecar. The demo uses only
synthetic records and keeps planning local:

- `打开 Product 1 的已支付订单 1`: preview and execute a verified deep-link plan
- `找到 Product 1 的订单 2，进入编辑`: rebuild a five-presenter route stack
- `把 Product 1 的订单按状态整理成摘要`: aggregate six local records and
  verify the `demo_data=1` result
- `查看示例员工 A-17 ... 香草烩饭`: filter six synthetic records to one
  verified employee-order match, open its four-presenter route, and highlight
  the matching item
- `通过宿主 App 逐步打开 Presenter 和 Modal`: send typed bridge commands and
  verify that the host owns two route presenters plus one derived modal
- `打开订单`: stop and ask for missing entity parameters

`scripts/generate-agent-manifest.mjs` parses the declared route and instance
tree with the TypeScript AST, then scans source signatures for the Presenter,
Modal, and action candidates. It writes a versioned manifest to
`src/agent/generated/behaviorManifest.ts`; it does not crawl the page. The
runtime verifies the complete URL, top Presenter, reconstructed depth,
inspection mode, aggregation invariants, employee-order relationship, and
focused item before reporting success.

During execution, every plan step remains active for at least 500 ms. Deep-link
actions traverse the computed parent route chain one level at a time, so each
Presenter completes its entrance before the next Presenter is mounted.

The sidecar never mutates the host's route or surface arrays directly. It sends
typed route, Presenter, Modal, and inspection commands over a narrow in-page
bridge; the host App owns every data update and animation, then acknowledges
settlement. With a plan ready, hold `Alt + S` to start paced execution; releasing
either key restores normal speed through the same bridge. The public V1 also
exposes this as an explicit on/off switch. A future host can replace the boolean
mode with a continuous spring/progress signal for motion that follows the key.

Successful commands can be shared as `?agent_cmd=<encoded intent>`. A receiving
page replans against its current manifest and waits for user confirmation; the
URL never contains selectors or executable code.

## Project structure

- `src/App.tsx`: owns the raw route-less presenter/modal records and History
  API behavior
- `src/router/routes.ts`: route definitions, matching, and parent reconstruction
- `src/core/Presenter.tsx`: page lifecycle plus normal and 3D enter/leave projection
- `src/core/Modal.tsx`: ports the original per-instance modal state and
  `generateContentStyle` calculation, including previous-leaving, full-group,
  inherited-size, mask, and lifecycle behavior
- `src/agent/staticRuntime.ts`: synthetic domain adapter and local planner
- `src/agent/AgentDemoOverlay.tsx`: plan preview, deterministic executor,
  runtime verification, trace, and `agent_cmd` sharing
- `scripts/generate-agent-manifest.mjs`: route AST and source-feature compiler

## Run

```bash
pnpm install
pnpm dev
```

Run the generated-manifest, planner, SSR, and interaction-contract tests with:

```bash
pnpm test
```
