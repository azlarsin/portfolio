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

## Project structure

- `src/App.tsx`: owns the raw route-less presenter/modal records and History
  API behavior
- `src/router/routes.ts`: route definitions, matching, and parent reconstruction
- `src/core/Presenter.tsx`: page lifecycle plus normal and 3D enter/leave projection
- `src/core/Modal.tsx`: ports the original per-instance modal state and
  `generateContentStyle` calculation, including previous-leaving, full-group,
  inherited-size, mask, and lifecycle behavior

## Run

```bash
pnpm install
pnpm dev
```
