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

import { downloadFile } from "./dataExportUtils";

describe("downloadFile (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an anchor, calls createObjectURL and triggers click for excel", async () => {
    const fakeBlob = new Blob(["excel content"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const headersMock = {
      get: vi
        .fn()
        .mockReturnValue(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ),
    } as unknown as Headers;
    const fakeRes = {
      ok: true,
      headers: headersMock,
      blob: async () => fakeBlob,
      text: async () => JSON.stringify({ message: "" }),
      json: async () => ({ message: "" }),
    } as unknown as Response;

    const fetchMock = vi
      .fn()
      .mockResolvedValue(fakeRes) as unknown as typeof global.fetch;
    global.fetch = fetchMock;

    // spy on createElement but use real DOM nodes
    const originalCreateElement = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = originalCreateElement(tag) as HTMLElement;
        if (tag === "a") {
          const anchor = el as HTMLAnchorElement & { click: unknown };
          // assign a mocked click to the anchor to detect the click invocation
          anchor.click = vi.fn();
        }
        return el;
      });

    const createObjectURLSpy = mockCreateObjectURL("blob:unit-test-url");
    const append = spyOnAppendChild();

    // call the function directly
    await downloadFile("/data-export/excel/test", "unit-test.xlsx", "excel", {
      startDate: "2025-12-12",
      endDate: "2025-12-12",
    });

    // asserts
    expect(fetchMock).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(append.spy).toHaveBeenCalled();
    const anchors = findAppendedAnchors(append.getAppendedNodes());
    expect(anchors.length).toBeGreaterThan(0);
    const anchor = anchors[0] as HTMLAnchorElement & {
      click: ReturnType<typeof vi.fn>;
    };
    expect(anchor.href).toContain("blob:unit-test-url");
    expect(anchor.download).toBe("unit-test.xlsx");
    expect(anchor.click).toHaveBeenCalled();

    // cleanup
    createObjectURLSpy.mockRestore();
    append.restore();
    createSpy.mockRestore();
  });
});
