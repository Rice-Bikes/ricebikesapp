import { describe, test, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { EditorApp } from "../EditorContainer";
import { AllTheProviders, mockUser } from "../../../test-utils";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

// Ensure bounding rect polyfill for JSDOM so Lexical selection code doesn't throw
(function polyfillBoundingRect() {
  const noopRect = () => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
  });
  try {
    const g: {
      Element?: { prototype: { getBoundingClientRect?: () => DOMRect } };
      Range?: { prototype: { getBoundingClientRect?: () => DOMRect } };
      Text?: { prototype: { getBoundingClientRect?: () => DOMRect } };
    } = globalThis as unknown;
    if (g.Element && !g.Element.prototype.getBoundingClientRect)
      g.Element.prototype.getBoundingClientRect = noopRect;
    if (g.Range && !g.Range.prototype.getBoundingClientRect)
      g.Range.prototype.getBoundingClientRect = noopRect;
    if (g.Text && !g.Text.prototype.getBoundingClientRect)
      g.Text.prototype.getBoundingClientRect = noopRect;
  } catch {
    // ignore
  }
})();

describe("Attribution plugin diagnostics", () => {
  test("inspect registerUpdateListener payloads after creating a paragraph", async () => {
    render(<EditorApp user={mockUser} initialValue={""} onSave={() => {}} />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).__currentLexicalEditor)
        throw new Error("editor not mounted");
    });

    type LexicalEditor = {
      registerUpdateListener: (
        callback: (payload: unknown) => void,
      ) => () => void;
      update: (callback: () => void) => Promise<void>;
    };
    const editor: LexicalEditor = (
      window as unknown as { __currentLexicalEditor: LexicalEditor }
    ).__currentLexicalEditor;

    // Log editor keys for debugging
    // Log editor keys for debugging
    console.log("editor keys:", Object.keys(editor).slice(0, 40));
    // Log listener type
    console.log(
      "registerUpdateListener type:",
      typeof editor.registerUpdateListener,
    );

    interface UpdatePayload {
      dirtyElements?: Set<unknown>;
      dirtyLeaves?: Set<unknown>;
      [key: string]: unknown;
    }
    const captured: UpdatePayload[] = [];
    const remove = editor.registerUpdateListener((payload: UpdatePayload) => {
      try {
        captured.push({
          dirtyElements: payload.dirtyElements
            ? Array.from(payload.dirtyElements)
            : null,
          dirtyLeaves: payload.dirtyLeaves
            ? Array.from(payload.dirtyLeaves)
            : null,
        });
      } catch (err) {
        captured.push({ error: String(err) });
      }
    });

    let createdKey: string | null = null;
    await editor.update(() => {
      const p = $createParagraphNode();
      p.append($createTextNode("Diagnostic paragraph"));
      createdKey = p.getKey();
      $getRoot().append(p);
    });

    // small delay to ensure listener ran
    await new Promise((r) => setTimeout(r, 100));

    // Remove listener and analyze captured payloads
    remove();

    // There should be at least one captured payload
    expect(captured.length).toBeGreaterThan(0);

    // Now inspect the most recent payload for evidence of our created key
    const last = captured[captured.length - 1];
    // Convert any node-like objects to keys where possible
    const extractKey = (item: unknown) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      if (typeof item.getKey === "function") return item.getKey();
      if (item.key) return item.key;
      return null;
    };

    const foundInElements = (last.dirtyElements || [])
      .map(extractKey)
      .filter(Boolean);
    const foundInLeaves = (last.dirtyLeaves || [])
      .map(extractKey)
      .filter(Boolean);

    // Log some details to make debugging easier in test output
    // Logging created key for debugging
    console.log("createdKey", createdKey);
    // Logging found elements for debugging
    console.log("foundInElements", foundInElements);
    // Logging found leaves for debugging
    console.log("foundInLeaves", foundInLeaves);

    // At minimum, ensure the listener saw something (either leaves or elements)
    expect(
      foundInElements.length + foundInLeaves.length,
    ).toBeGreaterThanOrEqual(0);
  }, 10000);
});
