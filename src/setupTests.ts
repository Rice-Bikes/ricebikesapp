import "@testing-library/jest-dom";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Create root element for testing
beforeEach(() => {
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
});

// Clean up after each test
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

// Minimal window.matchMedia polyfill for JSDOM environments used in tests.
// Some components and libraries expect this API to exist.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
}

// Minimal ResizeObserver mock for JSDOM environments. Some components rely
// on ResizeObserver being present. The mock implements observe/unobserve
// and disconnect but does not perform real observations.
if (typeof window !== "undefined" && !window.ResizeObserver) {
  class MockResizeObserver {
    callback: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.callback = cb;
    }
    observe() {
      // no-op
    }
    unobserve() {
      // no-op
    }
    disconnect() {
      // no-op
    }
  }
  (
    window as Window & { ResizeObserver: typeof MockResizeObserver }
  ).ResizeObserver = MockResizeObserver;
}
