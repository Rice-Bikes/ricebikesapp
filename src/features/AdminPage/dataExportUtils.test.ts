import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockCreateObjectURL,
  spyOnAppendChild,
  findAppendedAnchors,
} from "../../test-utils/downloadTestUtils";

// Mock the date pickers to avoid heavy ESM imports when importing the module under test
vi.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }: { children: unknown }) => children,
  DatePicker: () => null,
}));
vi.mock("@mui/x-date-pickers/AdapterDateFns", () => ({
  AdapterDateFns: function Adapter() {},
}));

import { buildQueryString, downloadFile } from "./dataExportUtils";

describe("dataExportUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildQueryString skips undefined and empty-string values", () => {
    expect(buildQueryString({ startDate: "2025-12-12", endDate: undefined, q: "" })).toBe(
      "?startDate=2025-12-12",
    );
    expect(buildQueryString({})).toBe("");
  });

  it("downloadFile alerts on invalid excel content-type and includes server message", async () => {
    const fakeRes = {
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue("text/html"),
      },
      text: async () => JSON.stringify({ message: "Something went wrong" }),
      blob: async () => new Blob([]),
      json: async () => ({ message: "Something went wrong" }),
    } as unknown as Response;

    global.fetch = vi.fn().mockResolvedValue(fakeRes);

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    await downloadFile("/data-export/excel/bad", "bad.xlsx", "excel");

    expect(alertSpy).toHaveBeenCalled();
    const firstCall = alertSpy.mock.calls[0][0] as string;
    expect(firstCall).toContain("Server did not return a valid Excel file");

    alertSpy.mockRestore();
  });

  it("downloadFile downloads JSON and triggers click on anchor", async () => {
    const fakeRes = {
      ok: true,
      headers: {
        get: vi.fn(),
      },
      json: async () => ({ hello: "world" }),
    } as unknown as Response;

    global.fetch = vi.fn().mockResolvedValue(fakeRes);

    const createObjectURLSpy = mockCreateObjectURL("blob:json-url");
    const append = spyOnAppendChild();

    // Spy on createElement to attach a mocked click to anchors
    const originalCreateElement = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = originalCreateElement(tag) as HTMLElement;
        if (tag === "a") {
          const anchor = el as HTMLAnchorElement & { click: unknown };
          anchor.click = vi.fn();
        }
        return el;
      });

    await downloadFile("/data-export/json/test", "test.json", "json");

    expect(global.fetch).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(append.spy).toHaveBeenCalled();

    const anchors = findAppendedAnchors(append.getAppendedNodes());
    expect(anchors.length).toBeGreaterThan(0);
    const anchor = anchors[0] as HTMLAnchorElement & { click: ReturnType<typeof vi.fn> };
    expect(anchor.download).toBe("test.json");
    expect(anchor.href).toContain("blob:json-url");
    expect(anchor.click).toHaveBeenCalled();

    // Cleanup
    append.restore();
    createSpy.mockRestore();
    createObjectURLSpy.mockRestore();
  });
});
