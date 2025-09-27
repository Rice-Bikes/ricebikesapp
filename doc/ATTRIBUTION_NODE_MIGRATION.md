## Goal

Prototype embedding per-block attribution inside Lexical node JSON so that attribution travels with the node itself (not just in a top-level `__meta`).

This guide documents the prototype `AttributedParagraphNode` and a safe migration path.

## Why

Embedding attribution in nodes provides a local, node-scoped source-of-truth for "who last edited this block" which is useful for in-editor blame overlays and offline/static consumers that re-parse JSON.

## Prototype

- A new node class `AttributedParagraphNode` has been added to `src/components/Notes/nodes/AttributedParagraphNode.tsx`.
- It serializes an `attribution` property:

  {
  "type": "attributed-paragraph",
  "version": 1,
  "children": [...],
  "attribution": { "lastEditedBy": {"id":"u1","name":"Chase"}, "lastEditedAt": "..." }
  }

- `PlaygroundNodes` has been updated to register the node.

## Design considerations

- Node keys can change across imports/parsing. If you want attribution to persist across parsers that do not maintain keys, prefer embedding the attribution in the node JSON (this prototype does that) rather than relying solely on a `__meta` keyed by node keys.
- Updating a node's attribution is a state mutation. To avoid noisy edits, only set that field when appropriate (e.g. on save, or when an actual edit occurs). Setting attribution on every keystroke will create lots of automatic edits.
- Backwards compatibility: older saved documents will not contain `attribution` fields. Keep `AutoSavePlugin` compatibility so it still produces `__meta.attributions` for older clients.

## Migration plan (recommended incremental)

1. Start with loader rehydration (already implemented): on load, read `__meta.attributions` (existing) and populate runtime attribution maps so editor shows blame.
2. Add `AttributedParagraphNode` (prototype done). On save, update `AutoSavePlugin` to prefer node-level `attribution` when present; otherwise still emit `__meta` for older consumers.
3. Decide where to update node-level attribution:
   - Option A (safe): On save, perform a single `editor.update()` pass that scans top-level children and sets their `attribution` fields according to the runtime `__meta` map. Then serialize and send. This means you mutate editor state only at save time.
   - Option B (live): Update node attributions during edit (e.g. when AttributionPlugin marks keys dirty). This is more real-time but creates a lot of edit traffic.
4. Update server persistence to accept `attribution` inside node JSON. Ensure any server validation (schema strictness) is adjusted to allow an `attribution` object where appropriate.
5. Migrate stored documents gradually: add a migration script that reads saved JSON documents and, for each top-level child whose key matches an entry in `__meta.attributions`, write that accreditation into the node JSON and persist back. This will make previously saved documents include embedded attribution.

## Caveats & next work

- Tests: add unit tests that export/import `AttributedParagraphNode` and assert attribution survives a serialize/parse cycle.
- UI: update static renderer and BlameOverlay to prefer node-level `attribution` over `__meta`.
- Server: coordinate with server team to allow `attribution` fields in persisted JSON and to decide whether server should authoritative-set the final lastEditedBy (recommended).
