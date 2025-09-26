# Note Attribution Plan

Goal: attribute saved note changes to a person (user object) so saved notes show who made the last edit and optionally a revision history of who changed what.

This document lists practical options, trade-offs, data models, UI considerations, security checks, and rollout steps.

---

## Options (high level)

1. Server-side attribution (recommended)

- When the client sends a "save note" request, the server uses the authenticated user (from session / JWT) to record `lastEditedBy` and `lastEditedAt` and optionally append a revision entry.
- Pros: authoritative, secure (can't be spoofed client-side), works across clients (mobile/web/API), central place for policy checks.
- Cons: requires server changes; needs migration for existing notes if you want historical data.

2. Client-side attribution (fast, but not authoritative)

- The client attaches a `meta.author` or `lastEditedBy` field to the save payload using the currently signed-in user object, and the server trusts and persists it.
- Pros: fast to implement, easier to prototype.
- Cons: can be spoofed unless server validates; not recommended as the only mechanism.

3. Hybrid: client suggests + server validates

- Client sends its `currentUser`, server verifies it against session/JWT and either accepts or replaces it with the server-side user id.
- Pros: good UX without sacrificing trust.
- Cons: more moving parts; must ensure validation logic is always enforced.

4. Revision-based attribution (detailed history)

- Save full revisions (serialized editor state) or diffs; each revision is stored with user and timestamp. This enables an audit log and per-revision attribution.
- Pros: full history, ability to revert, audit trails.
- Cons: storage growth; requires UI for browsing history.

5. Append-only activity log (events)

- Instead of storing full revisions, persist events: `noteSaved` with user, timestamp, diff summary. Useful if space is limited.
- Pros: efficient, easy to aggregate analytics.
- Cons: reconstructing full content requires applying events; may be complex.

---

## Recommended approach (practical)

Start with server-side attribution + lightweight revision snapshots.

- Persist `lastEditedBy` (userId), `lastEditedAt` (timestamp), and optionally `lastEditedByName` (denormalized for quick reads).
- Store revision snapshots (compressed/editorState) for N recent revisions (configurable) with `editedBy` and `editedAt`.
- Validate/save server-side using the authenticated user (session or JWT). If the client sends an author field, ignore it (server authoritative).

This gives a secure baseline while enabling a path to full revision history if you want it later.

---

## Data model suggestions

- Notes table (existing) — add columns:
  - last_edited_by_id: string | null
  - last_edited_by_name: string | null (optional denormalized display name)
  - last_edited_at: timestamp | null
- Revisions table (optional)

  - id
  - note_id (FK)
  - editor_id
  - editor_name
  - created_at
  - editor_state (JSON/BLOB) — compressed or stored in object storage
  - summary (short text) — optional human summary

- Activity log (optional)
  - id, note_id, event_type, data (JSON), user_id, created_at

---

## API changes (server)

- POST /notes/:id/save (existing) — enhance server handler to:

  - Authenticate request and extract user id/name.
  - Validate payload
  - Save editor state to DB (existing flow)
  - Update `last_edited_by_id`, `last_edited_by_name`, `last_edited_at` on note row
  - Optionally: insert revision row
  - Return note with attribution fields populated

- If you use GraphQL, add the same fields to the Note type and update resolver middleware.

---

## Client changes (minimal)

- No need to rely on client-supplied user identity. Continue sending the serialized editor state to save endpoint.
- For better UX, you can optimistically update the UI locally with `lastEditedBy` derived from the current user while the save is in-flight — but still accept server’s authoritative value in the response.

---

## Security considerations

- Server must be authoritative for attribution. Do not fully trust client-provided `author` fields.
- Ensure authentication (sessions, JWTs) are validated on every save endpoint.
- If you allow impersonation or admin-edits, record that in the revision metadata.

---

## UI/UX considerations

- Show `last edited by {name} · {timeAgo}` on the note header.
- Add a small "revisions" or "history" button to view recent editors and optionally diff/revert.
- For privacy, allow users/teams to opt-out of public attribution if required.

---

## Migration strategy

- Backfill `last_edited_by` for existing notes: if revision logs or activity logs exist, use the most recent event; otherwise mark null.
- Add the new DB columns with a migration and deploy server code that writes into them for new saves.

---

## Testing

- Unit tests: ensure save endpoint sets attribution fields correctly for authenticated users and ignores client-supplied author fields.
- Integration tests: simulate multiple users editing the same note; check lastEditedBy/lastEditedAt and revision entries.

## In-editor persistence designs (how to append user name on save)

Goal: ensure every save records who made the change and persist that with the note so the UI can show "last edited by X". Below are three practical options with tradeoffs, concrete Lexical integration ideas, and the minimal server changes required.

High-level contract:

- Input: current serialized Lexical editor state (JSON), current user object { id, name, email }
- Output: persisted note record with fields { content: <lexical-json>, lastEditedBy: { id, name }, lastEditedAt: ISOString, optional: revisions: [...] }
- Error modes: missing user (save as anonymous or reject), concurrent updates (optimistic concurrency or last-write-wins), large revisions (truncate or snapshot strategy)

Option A — Save metadata on the note root (recommended minimal change)

- What: When the client saves, attach top-level metadata fields on the note record (not inside Lexical state): lastEditedBy, lastEditedAt, optionally lastEditorAvatarUrl.
- Why: Simple, requires no changes to Lexical nodes or schema, easy to query and display.
- Client changes:
  - On save, call saveNote API with payload { id, content: lexicalState, lastEditedBy: user, lastEditedAt: new Date().toISOString() }
  - Persist these fields server-side in notes table/document.
- Server changes:
  - Add columns/fields last_edited_by_id, last_edited_by_name, last_edited_at to notes table/document.
  - Optionally create `note_revisions` table/collection for full history if desired.
- Pros: trivial rollback, minimal risk.
- Cons: not a per-block blame, only last-writer info.

Option B — Per-block attribution stored inside Lexical JSON (embedded metadata)

- What: Store attribution metadata per-block node in the Lexical editor state. E.g., each top-level paragraph/list-item/heading node gains an attribute lastEditedBy: { id, name } and lastEditedAt. When rendering, the static renderer or editor reads that attribute and displays a small attribution chip on hover or inline.
- Why: Enables fine-grained blame (which block was last edited by whom).
- Client changes:
  - Implement a small utility that, before saving, walks the Lexical editor state and updates changed nodes with lastEditedBy/current timestamp.
  - Optionally, mark nodes as dirty when the user edits them so attribution only updates for changed nodes.
  - Example pseudocode (Lexical):

```ts
// running inside an editor.update callback
editor.update(() => {
  const selection = $getSelection();
  const nodes = $getRoot().getChildren();
  // naive strategy: update all top-level nodes' lastEditedBy when the doc is dirty
  nodes.forEach((node) => {
    // if node supports metadata (paragraph, heading, listitem)
    node.__lastEditedBy = { id: user.id, name: user.name };
    node.__lastEditedAt = new Date().toISOString();
  });
});
```

- Better strategy: mark nodes dirty via a plugin that sets a `_dirty` flag on nodes when edited; only clear/update attribution on save for dirty nodes.
- Server changes:
  - No schema change required if you keep attribution as part of the Lexical JSON blob. You may want to index by last editor in a derived column for queries.
- Pros: per-block attribution, fine-grained history.
- Cons: increases stored JSON size, requires conservative node attribute naming to avoid breaking Lexical internal invariants (use prefixed keys like \_\_meta_lastEditedBy), and needs node compatibility with import/export.

Option C — Revisions/Change log (blame-like Git approach)

- What: Persist a lightweight revision each time a user saves. A revision holds the serialized editor state plus metadata { author, timestamp, summary } or a diff/patch of the changes. Use these revisions to present a blame-like UI by showing the last revision that touched a given block.
- Why: Best for full history, allows undo, audit, and per-block blame via diff analysis.
- Client changes:
  - On save, compute a delta or store full snapshot. For efficiency, store snapshots rarely and diffs for frequent saves. Optionally use a library like jsondiffpatch to store compact diffs.
  - Push to server: { noteId, author, timestamp, snapshot?: lexicalJson, diff?: delta }
- Server changes:
  - Add `note_revisions` table/collection storing revision records. Include `parentRevisionId` to create a chain.
  - Optionally provide APIs to compute blame for a particular node by replaying revisions or using reverse diffs.
- Pros: robust history, supports audit and blame.
- Cons: storage growth, more complex to implement and query. Computing blame requires diffing or careful node-id tracking.

Minimal implementation path (recommended starter):

1. Implement Option A immediately to get "last edited by" surfaced in the UI with minimal risk.
2. Add Option C's revision table but only store full snapshots initially (cheap to implement). This gives you a simple history and later you can add diff storage to save space.
3. If you need per-block blame, adopt Option B for in-line attribution or implement a blame generator server-side that computes which revision introduced each node.

Lexical integration patterns and safe metadata conventions

- Avoid mutating Lexical internals or reserved property names. Instead of adding public instance fields on nodes, use a stable metadata layer encoded under a single top-level key in the saved JSON, e.g.:

  - Persisted lexical JSON shape { root: { ... }, \_\_meta: { attributions: { nodeKey: { lastEditedBy: { id, name }, lastEditedAt } } } }

- Advantages: keeps attribution out of node classes (no need to change node definitions), and you can attach metadata keyed by stable node.getKey() values.
- Example client flow:

  - When the editor updates, a plugin tracks changed node keys and stores them in a Set dirtyNodeKeys.
  - On save, the client reads the serialized Lexical JSON, attaches or updates `__meta.attributions` entries for each dirtyNodeKey with { user, timestamp }.
  - Send the whole JSON to the server where `content` stores the original lexical JSON and server fields lastEditedBy/lastEditedAt are updated from the request-level metadata.

Example: track dirty keys plugin (conceptual)

```ts
// inside a plugin
const dirty = new Set<string>();

editor.registerUpdateListener(({ editorState, dirtyElements }) => {
  // iterate dirtyElements to collect top-level node keys
  dirtyElements.forEach((node) => dirty.add(node.getKey()));
});

// on save()
const lexicalJson = editor.getEditorState().toJSON();
lexicalJson.__meta = lexicalJson.__meta || { attributions: {} };
dirty.forEach((key) => {
  lexicalJson.__meta.attributions[key] = {
    lastEditedBy: user,
    lastEditedAt: new Date().toISOString(),
  };
});
dirty.clear();

await api.saveNote({
  id: noteId,
  content: lexicalJson,
  lastEditedBy: user,
  lastEditedAt: new Date().toISOString(),
});
```

Server-side considerations and race conditions

- If two users save concurrently, decide your merge strategy: last-write-wins, optimistic concurrency via etag/versioning, or merge strategy that replays patches. For most apps, last-write-wins with a version/timestamp is acceptable; if not, implement optimistic checks with a note.version field.
- Sanitization: ensure `__meta` is namespaced (prefix) and that the server does not trust client-sent lastEditedBy without verifying the authenticated user. The server must override any client-provided lastEditedBy with the server-side auth identity.

UI/Rendering

- Show "Last edited by X at T" using server-side fields for the note header (from Option A). For per-block chips (Option B), render small attribution chips next to block nodes when hovering or in a gutter.
- Static rendering: `LexicalStaticRenderer.tsx` can be extended to read `__meta.attributions` and apply data attributes or small inline chips for blocks with attribution.

Acceptance tests (basic)

- Save as user A, check note.header shows A and server fields updated.
- Edit a paragraph as user B, save, ensure that paragraph's attribution entry in `__meta.attributions` becomes B.
- Create concurrent edits and verify server versioning or last-write-wins behavior clear to users.

Next steps I can implement for you now (pick one):

- A: Add client-side save hook and small utility to attach `__meta.attributions` on save and update `lastEditedBy` at the note root. I will modify the editor save flow (client) and add a small helper in `src/components/Notes`.
- B: Implement the server migration and API enforcement to persist `last_edited_by_id` and `last_edited_at` (I will prepare a sample SQL/NoSQL migration + API handler patch). Tell me which backend stack and DB you're using if you pick this.
- C: Implement the dirty-node tracking plugin for Lexical and integrate it into the save path to append per-block attribution in `__meta` (client-only changes).

If you want, I can implement Option A now (fast) and wire a basic `__meta.attributions` attachment on save (client), plus update `LexicalStaticRenderer.tsx` to render the per-block attribution chip when present. This gives immediate visible attribution while leaving full revision history for later.

- UI tests: show attribution in the note UI and ensure optimistic updates are replaced with server truth.

---

## Rollout and feature flags

- Roll out behind a feature flag so you can enable attribution gradually.
- After a successful canary, migrate and enable for all users.

---

## Edge cases

- Anonymous editing: store `lastEditedBy` as null and show "edited anonymously" in UI.
- Multiple concurrent editors: last write wins; consider lock/merge UX for collaborative editing.
- Large notes/storage: limit number of revision snapshots retained; consider storing only diffs or archiving old revisions to object storage.

---

## Appendix: small implementation checklist

- [ ] Add DB migration for last_edited_by_id/last_edited_at (+ denormalized name)
- [ ] Update save endpoint to set attribution from authenticated user
- [ ] Optionally: implement revisions table and write a revision on each save
- [ ] Update client to show attribution and optimistic UI
- [ ] Add tests
- [ ] Roll out behind flag and monitor

---

If you want, I can create the migration and server handler changes next (pick your server stack: Express/Node/TypeORM, Prisma, Rails, Django, etc.). I can also add a small UI stub showing `last edited by` in the editor header once server APIs are ready.
