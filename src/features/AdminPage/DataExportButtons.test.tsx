import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
// Mock the date pickers to avoid MUI ESM import issues in the test environment
vi.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  DatePicker: (props: {
    label?: string;
    value?: Date | string | null;
    onChange?: (v: Date | null) => void;
  }) => (
    <input
      aria-label={props.label}
      value={props.value ? props.value.toString() : ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        props.onChange?.(new Date(e.target.value))
      }
    />
  ),
}));
vi.mock("@mui/x-date-pickers/AdapterDateFns", () => ({
  AdapterDateFns: function Adapter() {},
}));

import DataExportButtons from "./DataExportButtons";
import { AllTheProviders } from "../../test-utils";
import {
  mockCreateObjectURL,
  spyOnAppendChild,
} from "../../test-utils/downloadTestUtils";

describe("DataExportButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds query string by clicking Today and triggers download for endpoints with filters", async () => {
    const fakeBlob = new Blob(["fake"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const headersMock = new Headers({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
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

    // spy on createElement to capture link clicks; return a real DOM node for safety
    const originalCreateElement = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = originalCreateElement(tag) as HTMLElement;
        // Only override anchor clicks so appendChild/remove still receive real Nodes
        if (tag === "a") {
          // replace the click handler with a spy so we can assert it was invoked
          const anchor = el as HTMLAnchorElement & { click: unknown };
          anchor.click = vi.fn();
          // ensure remove exists (it does on Element.prototype) but make it a spy if needed
          if (!("remove" in anchor)) {
            (anchor as unknown as { remove?: () => void }).remove = vi.fn();
          }
        }
        return el;
      });

    // spy on URL.createObjectURL to avoid dealing with real blobs and capture the created URL
    // also mock window.alert so a thrown error in downloadFile doesn't crash the test
    // (JSDOM doesn't implement alert by default)
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    // use helper utilities for download testing
    const createObjectURLSpy = mockCreateObjectURL("blob:fake-url");
    const append = spyOnAppendChild();

    render(<DataExportButtons />, { wrapper: AllTheProviders });

    // click Today to set the date range
    fireEvent.click(screen.getByText("Today"));

    // click the first endpoint which accepts filters
    fireEvent.click(screen.getByText("Download Repair Summary Report"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // (verified via fetchMock calls below)

    // validate that the first fetch included the filters in the query string
    const firstFetchUrl = (fetchMock as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0][0] as string;
    expect(firstFetchUrl).toContain("/data-export/excel/full-report");
    expect(firstFetchUrl).toContain("startDate=");
    expect(firstFetchUrl).toContain("endDate=");
    expect(firstFetchUrl).toContain("includeEmployee=true");

    // second endpoint that does not accept filters shouldn't include query string
    fireEvent.click(screen.getByText("Download Bike Inventory (Excel)"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    // Ensure we made the second fetch call for the second endpoint as well
    // (previous waitFor already asserted the second call above)
    const secondFetchUrl = (fetchMock as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[1][0] as string;
    expect(secondFetchUrl).toContain("/data-export/excel/bike-inventory");

    // ensure alert wasn't called (download should have succeeded)
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    append.restore();
    createSpy.mockRestore();
  });

  it("alerts when download fails", async () => {
    const fakeRes = {
      ok: false,
      status: 500,
      json: async () => ({ message: "server error" }),
      text: async () => JSON.stringify({ message: "server error" }),
    } as unknown as Response;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(fakeRes) as unknown as typeof global.fetch;
    global.fetch = fetchMock;
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<DataExportButtons />, { wrapper: AllTheProviders });

    fireEvent.click(screen.getByText("Download Bike Inventory (Excel)"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    alertSpy.mockRestore();
  });
});
