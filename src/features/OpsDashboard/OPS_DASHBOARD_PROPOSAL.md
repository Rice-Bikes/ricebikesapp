# Ops Dashboard — Proposal

Location
- Proposed feature directory: `ricebikesapp/src/features/OpsDashboard/`
- Key existing components to integrate:
  - `ricebikesapp/src/components/OrderModal.tsx`
  - `ricebikesapp/src/components/ItemPage.tsx`
  - `ricebikesapp/src/components/WhiteboardEntryModal.tsx` (and its tests)

Goal
- Provide an operations dashboard for the ordering manager to plan, batch, submit, and track orders.
- Surface order requests ("whiteboard" entries), low-stock items, upcoming/previous orders, and per-supplier batching suggestions.
- Let managers view and edit order meta (order date, supplier, ordered_by, ETA) via `OrderModal`.
- Let managers see item details and reorder suggestions leveraging logic from `ItemPage`.
- Allow toggling of "waiting on parts" and quick conversion of order-requests into orders / order lines.

High-level UX / Layout (desktop-first)
- Top bar / Controls
  - Date range selector (week / two weeks / month)
  - Supplier filter (drop-down)
  - Status filter: Planned, Ordered, Shipped, Received
  - Quick action buttons:
    - Create Order (opens `OrderModal`)
    - Export (CSV / print)
    - Sync/Refresh
- Left column (width 30–35%)
  - Upcoming Orders list (cards)
    - Each card shows: supplier, order_date, estimated_delivery, ordered_by, status badge
    - Actions: Edit (open `OrderModal`), Mark as Ordered, Mark Received
  - "Next Order" quick button (wired to `getClosestFutureOrderQuery`) — reuse `OrderModal` call pattern
- Main column (width 65–70%)
  - Whiteboard / Order Requests panel (ag-grid)
    - Shows live order requests returned by `getOrderRequests(transaction_id?)` or global `orderRequests`
    - Columns: requested_by, item (click-through to `ItemPage`), notes, qty, transaction_id, created_at, status
    - Bulk actions: select rows -> Add to order / Export / Mark ordered / Assign supplier
    - Row-level action: "Add to Order" (opens a modal to select target order or create new)
  - Reorder Suggestions panel (below or a second tab)
    - Uses `ItemPage`-like calculations: stock, minimum_stock, managed flag
    - Shows recommended qty to order, supplier, price estimates, last order date
    - Bulk-add items to a target order (creates order lines in the backend)
- Right column (optional details pane / narrow)
  - Selected order detail (lines, status)
  - Item quick view (reuses `ItemPage` inline view / link)
  - Audit timeline / logs for selected order

Data & API expectations
- Use the existing DBModel methods where possible:
  - `DBModel.getOrders`, `DBModel.getClosestFutureOrderQuery()` (already referenced by `OrderModal.tsx`)
  - `DBModel.createOrder`, `DBModel.updateOrder` (used by `OrderModal.tsx`)
  - `DBModel.getOrderRequests` for whiteboard list
  - `DBModel.getItems` / item details (used in `ItemPage.tsx`)
- Recommended new/extended API endpoints (server side):
  - GET `/orders?from=&to=&supplier=&status=` — list orders in range
  - POST `/orders/:order_id/lines` — add item lines to an order (bulk)
  - PATCH `/orders/:order_id/status` — update order lifecycle (ordered/shipped/received)
  - GET `/orderRequests?status=&supplier=` — filterable whiteboard queries
  - GET `/items/reorder-suggestions` or calculate client-side from `/items`
- Response shape expectations:
  - Successful responses should use the current envelope: `{ success: boolean, message: string | null, responseObject: any, statusCode?: number }`
  - For error handling, ensure 4xx/5xx return consistent JSON so client can parse and show readable errors (see recommendations below)

Client-side data flow & patterns
- Query & mutation strategy (react-query)
  - Queries:
    - `useQuery(["orders", params], fetchOrders)` — list, auto-refetch on focus
    - `useQuery(DBModel.getClosestFutureOrderQuery())` — for quick Next Order button (already present)
    - `useQuery(["orderRequests", params], DBModel.getOrderRequests)` — for whiteboard grid
    - `useQuery(["items", filters], DBModel.getItems)` — item-level data for reorder suggestions
  - Mutations:
    - `createOrder`, `updateOrder` — use the same optimistic UX as `OrderModal`
    - `createOrderLines` — bulk add order request rows -> order lines (invalidate `orders` and `orderRequests`)
    - `updateOrderStatus` — state transitions (ordered -> shipped -> received)
  - Cache invalidation:
    - After modifying orders: invalidate `["orders"]`, `["orders", order_id]`
    - After converting order requests: invalidate `["orderRequests"]`, `["orders"]`, `["items"]` (if stock changes)
- Error handling
  - Use `response.ok` checks and show clear messages in UI (follow-up to earlier errors observed).
  - Use toast notifications (same pattern as `OrderModal.tsx`) for success/failure.

Permissions & Roles
- Use `useUser()` to gate features:
  - `canSetOrderDate` (already used by `OrderModal.tsx`) — controls editing order meta
  - Additional roles/permissions:
    - `canCreateOrders`, `canMarkReceived`, `canManageSuppliers`
  - UI should disable/grey actions when permission is missing and show tooltip/why disabled.

Integrations with existing components
- `OrderModal.tsx`
  - Reuse as the create/edit order dialog.
  - `OrderModal` already queries `getClosestFutureOrder` and uses `createOrder` / `updateOrder` mutations.
  - Keep `canModify` behavior; OPS UI will surface this modal for the selected order.
- `ItemPage.tsx`
  - Use `ItemPage` or extract the item-details subcomponent to show quick view for selected item from whiteboard or reorder suggestions.
  - Reuse stock/minimum_stock logic to compute reorder quantity suggestions.
- `WhiteboardEntryModal.test.tsx`
  - Use the test patterns (mock `useQuery` and `useMutation`) as templates for unit tests for the dashboard's whiteboard panel.
  - Provide a mock AgGrid render similar to the test to keep tests deterministic.

UX Behavior: Converting order requests -> orders
- A user selects rows in the whiteboard grid and clicks "Add to Order".
- A dialog appears:
  - Select existing order (drop-down) or Create New (opens `OrderModal` inline)
  - Review line items & suggested quantities (pre-filled from `Item.minimum_stock` logic)
  - Option to merge by supplier (recommended)
- On submit:
  - Call `createOrderLines(order_id, lines[])`
  - On success: invalidate `orderRequests` and `orders` queries; optionally mark original order requests as `ordered=true`

Reorder suggestion algorithm (client-side)
- For each item:
  - If `!managed` or `disabled`, skip
  - If `stock <= minimum_stock`, suggested_qty = max(minimum_stock * 2 - stock, 1) or use vendor's MOQs
  - Prefer supplier with best recent price or configured default supplier
- Allow manual override for suggested qty before adding to order.

Batching rules
- Group selected items by `supplier` to create single order per supplier
- Option: group by `supplier` and shipping window (e.g., items needed within next 7 days)

Wireframes (textual)
- Top: toolbar with date range + filters + "Create Order" button
- Left: vertical list of upcoming orders (click order to load detail)
- Main:
  - Tab 1: Whiteboard (table)
    - Each row: checkbox | item name (click to open `ItemPage`) | qty | requester | notes | actions
  - Tab 2: Reorder suggestions (list)
    - For each item: name | stock | min | suggested qty | last ordered | add-to-order button
- Right: Selected order detail (order lines, status, actions)

Testing
- Unit tests:
  - Mock `useQuery` & `useMutation` similar to `WhiteboardEntryModal.test.tsx`
  - Test: Whiteboard loads rows, bulk select behavior, conversion to order triggers `createOrderLines`
  - Test: Reorder suggestions computed correctly for edge cases (zero stock, null minimum_stock)
- Integration tests:
  - Simulate creating an order from suggested lines; verify invalidations and success message
- E2E tests:
  - Flow: Whiteboard -> select rows -> create order -> mark ordered -> mark received

Accessibility & Performance
- Use `aria` labels for grid actions and row selections.
- For very large whiteboard datasets, implement server-side pagination / virtualization (ag-grid supports this).
- Debounce filters and avoid refetching on every keystroke.

Error-handling and Observability
- Use clearer errors in `DBModel` (see earlier recommendations) so the dashboard surfaces readable messages like `User not found`, `Order not found`, `Invalid JSON` rather than opaque validation errors.
- Add client logs (console.info/debug) on major actions. Add telemetry hooks if available (Sentry/LogRocket).

Implementation plan & timeline (suggested MVP phases)
- Phase 1 (2 weeks)
  - Create OpsDashboard container component & route at `src/features/OpsDashboard/index.tsx`
  - Implement toolbar and upcoming orders list (read-only)
  - Integrate `OrderModal.tsx` for create/edit
  - Whiteboard panel: basic table using `DBModel.getOrderRequests`
  - Tests: unit tests for whiteboard rendering (mocks like `WhiteboardEntryModal.test.tsx`)
- Phase 2 (2 weeks)
  - Reorder suggestions panel using `DBModel.getItems`
  - Implement "Add to order" bulk flow (create order lines)
  - Permissions gating
  - Robust error handling and toast messages
- Phase 3 (1–2 weeks)
  - Batching by supplier & scheduling
  - Order lifecycle transitions & timeline
  - E2E and integration tests
  - Performance refinements and accessibility audit

Acceptance criteria (MVP)
- Ordering manager can see upcoming orders and their dates and open the `OrderModal` to edit them.
- Ordering manager can view current order-requests in a grid and select rows.
- Ordering manager can convert selected order-requests into an order (new or existing) in a single action and see the resulting order lines appear in the order.
- Reorder suggestions show items needing replenishment with suggested quantities.
- Role-based permissions enforced for order modifications.

Developer notes and recommended file structure
- New feature files:
  - `ricebikesapp/src/features/OpsDashboard/index.tsx` — main container + route
  - `ricebikesapp/src/features/OpsDashboard/WhiteboardPanel.tsx` — whiteboard grid wrapper (ag-grid)
  - `ricebikesapp/src/features/OpsDashboard/ReorderSuggestions.tsx`
  - `ricebikesapp/src/features/OpsDashboard/OrderDetailPane.tsx`
  - `ricebikesapp/src/features/OpsDashboard/hooks/useOpsOrders.ts` — react-query hooks wrapping DBModel calls
  - `ricebikesapp/src/features/OpsDashboard/opsDashboard.css` (if needed)
- Reuse:
  - `ricebikesapp/src/components/OrderModal.tsx`
  - UI atoms: `Button`, `Card`, `List`, `Grid2`, `Avatar`, `Chip`, `Typography` from MUI

Potential pitfalls & mitigation
- Backend endpoints inconsistent error shapes -> tighten server responses and add `response.ok` checks client-side before validation.
- Large whiteboard data -> add server-side filters + pagination or use ag-grid server-side row model.
- Supplier matching logic complexity -> start with simple supplier grouping; allow manual overrides.

Open questions to resolve
- Should 404 for `/orderRequests/:id` be treated as "no order requests" or "error"? (Implementation above recommends returning `[]` if status 404/400 per semantics)
- Do you want automatic suggested order creation (auto-batching) on a schedule, or manual-only?
- Are there multiple suppliers per item? If yes, how to pick the supplier (default vs price vs MOQ)?

Next steps (immediate)
1. Agree on MVP acceptance criteria and API endpoints.
2. Add the OpsDashboard route and minimal whiteboard + order list components.
3. Wire up `OrderModal` for create/edit flows.
4. Add tests following `WhiteboardEntryModal.test.tsx` patterns.

If you'd like, I can:
- Generate starter component files for the skeleton dashboard (`index.tsx`, `WhiteboardPanel.tsx`, `ReorderSuggestions.tsx`) using the project's existing patterns (React + MUI + react-query).
- Draft the API contract for the backend endpoints proposed above (request/response schemas).