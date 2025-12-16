import { vi } from "vitest";

export function mockCreateObjectURL(returnValue = "blob:fake-url") {
  // Ensure createObjectURL exists on window.URL
  // In some JSDOM environments URL.createObjectURL may be missing; assign a mock if so.
  if (typeof window.URL.createObjectURL !== "function") {
    window.URL.createObjectURL = vi.fn(() => returnValue);
  }
  const spy = vi
    .spyOn(window.URL, "createObjectURL")
    .mockImplementation(() => returnValue);
  return spy;
}

export function spyOnAppendChild() {
  const originalAppend = document.body.appendChild.bind(document.body);
  const calls: Node[] = [];
  const spy = vi
    .spyOn(document.body, "appendChild")
    .mockImplementation((node: Node) => {
      calls.push(node);
      return originalAppend(node);
    });
  return {
    spy,
    getAppendedNodes: () => calls,
    restore: () => spy.mockRestore(),
  };
}

export function findAppendedAnchors(nodes: Node[]) {
  return nodes.filter(
    (n) => !!n && (n as HTMLElement).tagName === "A",
  ) as HTMLAnchorElement[];
}
