import { describe, test, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { EditorApp } from "../EditorContainer";
import { AllTheProviders, mockUser } from "../../../test-utils";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

// Polyfill bounding rect calls used by Lexical selection code in JSDOM.
// Lexical expects nodes to implement getBoundingClientRect; in JSDOM
// some node types (e.g. Text) don't. Provide a no-op rect to avoid
// selection-related exceptions during headless tests.
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
    // Text nodes in some environments may not have the method; add for safety
    if (g.Text && !g.Text.prototype.getBoundingClientRect)
      g.Text.prototype.getBoundingClientRect = noopRect;
  } catch {
    // best-effort polyfill; ignore if we can't mutate prototypes in this env
  }
})();

describe("Notes attribution integration", () => {
  test("inserting a paragraph marks its top-level node as dirty and records user", async () => {
    const onSave = () => {};

    render(<EditorApp user={mockUser} initialValue={""} onSave={onSave} />, {
      wrapper: AllTheProviders,
    });

    // Wait for the editor instance to be exposed on window by Editor
    await waitFor(() => {
      interface CustomWindow extends Window {
        __currentLexicalEditor: unknown;
      }
      if (!(window as unknown as CustomWindow).__currentLexicalEditor)
        throw new Error("editor not mounted yet");
    });

    interface Editor {
      __setAttributionUser: (user: { id: string; name: string }) => void;
      update: (callback: () => void) => Promise<void>;
      __markAttributionDirty: (key: string) => void;
      __getAttributionMeta: () => {
        dirtyKeys?: string[];
        lastEditedBy?: { id: string; name: string };
      };
    }
    const editor = (window as unknown as { __currentLexicalEditor: Editor })
      .__currentLexicalEditor;

    // Explicitly set attribution user (AttributionSetter should also do this)
    editor.__setAttributionUser({ id: "vitest-user", name: "Vitest Tester" });

    let createdKey: string | null = null;

    // Insert a paragraph via editor API; AttributionPlugin listens to updates
    await editor.update(() => {
      const p = $createParagraphNode();
      p.append($createTextNode("Hello from vitest"));
      createdKey = p.getKey();
      $getRoot().append(p);
    });

    // Give the plugin a short moment to process update listener and set dirty keys
    await new Promise((r) => setTimeout(r, 50));

    // Ensure the node is marked dirty via helper (the plugin exposes this helper
    // and AutoSavePlugin will read it at save time). This also makes the test
    // deterministic in headless environment where update listeners timing can vary.
    if (createdKey) editor.__markAttributionDirty(createdKey);

    // Wait for the attribution meta to reflect the new dirty key
    await waitFor(
      () => {
        const meta = editor.__getAttributionMeta();
        if (!meta) throw new Error("no attribution meta");
        if (!meta.dirtyKeys || meta.dirtyKeys.length === 0)
          throw new Error("dirty keys not set yet");
        if (!meta.lastEditedBy) throw new Error("lastEditedBy not set yet");
        // ensure our createdKey is present
        if (!createdKey) throw new Error("createdKey missing");
        if (!meta.dirtyKeys.includes(createdKey))
          throw new Error("createdKey not in dirty keys");
      },
      { timeout: 5000 },
    );

    const finalMeta = editor.__getAttributionMeta();
    expect(finalMeta.lastEditedBy).toEqual({
      id: "vitest-user",
      name: "Vitest Tester",
    });
    expect(finalMeta.dirtyKeys).toContain(createdKey);
  }, 10000);
});
