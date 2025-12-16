/**
 * Utilities for data export UI
 *
 * This module centralizes:
 *  - the list of export endpoints shown in the Admin UI
 *  - helper for building query strings from filter objects
 *  - the `downloadFile` helper that performs the fetch and triggers
 *    a download for both JSON and Excel responses.
 */

import { hostname } from "../../model";

export type ExportType = "excel" | "json";

export interface ExportEndpoint {
  label: string;
  path: string;
  type: ExportType;
  filename: string;
  acceptsFilters?: boolean;
}

export const EXPORT_ENDPOINTS: ExportEndpoint[] = [
  {
    label: "Download Repair Summary Report",
    path: "/data-export/excel/full-report",
    type: "excel",
    filename: "full-report.xlsx",
    acceptsFilters: true,
  },
  {
    label: "Download Bike Inventory (Excel)",
    path: "/data-export/excel/bike-inventory",
    type: "excel",
    filename: "bike-inventory.xlsx",
  },
  {
    label: "Download Item Inventory (Excel)",
    path: "/data-export/excel/item-inventory",
    type: "excel",
    filename: "item-inventory.xlsx",
  },
  {
    label: "Download Repair History (Excel)",
    path: "/data-export/excel/repair-history",
    type: "excel",
    filename: "repair-history.xlsx",
    acceptsFilters: true,
  },
];

/**
 * Build a query string from an object whose values may be strings or undefined.
 * Skips keys with undefined or empty string values.
 */
export function buildQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Downloads a file from the given path and triggers a browser download.
 *
 * - For 'excel' type, verifies the Content-Type header contains the expected
 *   Excel MIME type and attempts to parse an error message if not.
 * - For 'json' type, it serializes the response to a JSON blob.
 *
 * Alerts on failure with a helpful message.
 */
export async function downloadFile(
  path: string,
  filename: string,
  type: ExportType,
  filters?: Record<string, string | undefined>,
): Promise<void> {
  try {
    const url = `${hostname}${path}${filters ? buildQueryString(filters) : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: type === "json" ? { Accept: "application/json" } : {},
    });

    if (!res.ok) throw new Error("Failed to download");

    if (type === "excel") {
      const contentType = res.headers.get("Content-Type");
      if (
        !contentType ||
        !contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      ) {
        // Try to read an error message from the body if possible
        let text = await res.text();
        try {
          const parsed = JSON.parse(text);
          text = parsed?.message ?? text;
        } catch {
          // ignore parse errors and use raw text
        }
        throw new Error("Server did not return a valid Excel file. " + text);
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      // JSON export
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (err: unknown) {
    alert("Download failed: " + (err instanceof Error ? err.message : String(err)));
  }
}
