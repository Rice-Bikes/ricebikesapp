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

import { buildQueryString, downloadFile, EXPORT_ENDPOINTS } from "./dataExportUtils";

describe("dataExportUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildQueryString", () => {
    it("skips undefined and empty-string values", () => {
      expect(buildQueryString({ startDate: "2025-12-12", endDate: undefined, q: "" })).toBe(
        "?startDate=2025-12-12",
      );
      expect(buildQueryString({})).toBe("");
    });

    it("handles multiple values", () => {
      const result = buildQueryString({ startDate: "2025-01-01", endDate: "2025-12-31" });
      expect(result).toContain("startDate=2025-01-01");
      expect(result).toContain("endDate=2025-12-31");
    });

    it("handles special characters in values", () => {
      const result = buildQueryString({ search: "test value" });
      expect(result).toContain("search=test");
    });
  });

  describe("downloadFile", () => {
    it("alerts on invalid excel content-type and includes server message", async () => {
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

    it("downloads JSON and triggers click on anchor", async () => {
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

    it("handles fetch failure gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      } as Response);

      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      await downloadFile("/data-export/excel/fail", "fail.xlsx", "excel");

      expect(alertSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it("downloads JSON with filters applied", async () => {
      const fakeRes = {
        ok: true,
        headers: {
          get: vi.fn(),
        },
        json: async () => ({ data: [] }),
      } as unknown as Response;

      global.fetch = vi.fn().mockResolvedValue(fakeRes);
      mockCreateObjectURL("blob:json-url");
      spyOnAppendChild();

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = originalCreateElement(tag) as HTMLElement;
        if (tag === "a") {
          const anchor = el as HTMLAnchorElement & { click: unknown };
          anchor.click = vi.fn();
        }
        return el;
      });

      await downloadFile(
        "/data-export/json/test",
        "test.json",
        "json",
        { startDate: "2025-01-01", endDate: "2025-12-31" },
      );

      const fetchCall = (global.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0];
      expect(String(fetchCall)).toContain("startDate=2025-01-01");
      expect(String(fetchCall)).toContain("endDate=2025-12-31");
    });

    it("handles excel download with valid content-type", async () => {
      const fakeBlob = new Blob(["test"]);
      const fakeRes = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ),
        },
        blob: async () => fakeBlob,
      } as unknown as Response;

      global.fetch = vi.fn().mockResolvedValue(fakeRes);
      mockCreateObjectURL("blob:excel-url");
      const append = spyOnAppendChild();

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = originalCreateElement(tag) as HTMLElement;
        if (tag === "a") {
          const anchor = el as HTMLAnchorElement & { click: unknown };
          anchor.click = vi.fn();
        }
        return el;
      });

      await downloadFile("/data-export/excel/test", "test.xlsx", "excel");

      expect(append.spy).toHaveBeenCalled();
      append.restore();
    });
  });

  describe("EXPORT_ENDPOINTS", () => {
    it("contains required endpoints with proper structure", () => {
      expect(EXPORT_ENDPOINTS.length).toBeGreaterThan(0);
      EXPORT_ENDPOINTS.forEach((endpoint) => {
        expect(endpoint.label).toBeDefined();
        expect(endpoint.path).toBeDefined();
        expect(endpoint.type).toBeDefined();
        expect(endpoint.filename).toBeDefined();
        expect(["excel", "json"]).toContain(endpoint.type);
      });
    });

    it("has some endpoints that accept filters", () => {
      const filterableEndpoints = EXPORT_ENDPOINTS.filter((e) => e.acceptsFilters);
      expect(filterableEndpoints.length).toBeGreaterThan(0);
    });
  });
});
