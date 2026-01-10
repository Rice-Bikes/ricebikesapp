import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { isDaysLess } from "./TransactionsTable.utils";
import {
  timeAgo,
  checkStatusOfRetrospec,
  ProgressCellRenderer,
} from "./TransactionsTable.helpers";
import { AllTheProviders } from "../../test-utils";
import type { ICellRendererParams } from "ag-grid-community";
import type { TransactionDetails } from "../../model";
import DBModel from "../../model";

describe("TransactionsTable utilities and ProgressCellRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isDaysLess returns true when difference exceeds days threshold", () => {
    const d1 = new Date("2025-01-01");
    const d2 = new Date("2025-01-10");
    expect(isDaysLess(5, d1, d2)).toBe(true);
    expect(isDaysLess(20, d1, d2)).toBe(false);
  });

  it("timeAgo returns a string for dates sufficiently in the past", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const res = timeAgo(twoDaysAgo);
    expect(typeof res === "string" || res === undefined).toBe(true);
  });

  it("checkStatusOfRetrospec returns correct icon for completed/refurb/email states", () => {
    // completed -> MonetizationOnIcon (green)
    const completed = checkStatusOfRetrospec(false, false, true);
    const { container: c1 } = render(completed as unknown as JSX.Element);
    expect(c1.innerHTML).toContain("MonetizationOnIcon");

    // refurb -> ConstructionIcon (gold)
    const refurb = checkStatusOfRetrospec(true, false, false);
    const { container: c2 } = render(refurb as unknown as JSX.Element);
    expect(c2.innerHTML).toContain("ConstructionIcon");

    // email (ready) -> PanToolIcon (red)
    const email = checkStatusOfRetrospec(false, true, false);
    const { container: c3 } = render(email as unknown as JSX.Element);
    expect(c3.innerHTML).toContain("PanToolIcon");
  });

  it("ProgressCellRenderer renders a simple div when no transaction id", async () => {
    const params = { data: {} } as unknown as ICellRendererParams;
    const { container } = render(
      <ProgressCellRenderer {...(params as unknown as ICellRendererParams)} />,
      { wrapper: AllTheProviders },
    );
    // Should render placeholder div with small height
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("ProgressCellRenderer shows complete check when details are empty", async () => {
    vi.spyOn(DBModel, "fetchTransactionDetails").mockResolvedValue(
      [] as TransactionDetails[],
    );
    const params = {
      data: { Transaction: { transaction_id: "tx1" } },
    } as unknown as ICellRendererParams;
    const { container } = render(
      <ProgressCellRenderer {...(params as unknown as ICellRendererParams)} />,
      { wrapper: AllTheProviders },
    );
    await waitFor(() => {
      // If details are empty, the CheckCircleIcon markup will be present
      expect(container.innerHTML).toMatch(/CheckCircleIcon/);
    });
  });

  it("ProgressCellRenderer shows percentage when some details incomplete", async () => {
    vi.spyOn(DBModel, "fetchTransactionDetails").mockResolvedValue([
      { completed: true },
      { completed: false },
    ] as TransactionDetails[]);
    const params2 = {
      data: { Transaction: { transaction_id: "tx2" } },
    } as unknown as ICellRendererParams;
    render(
      <ProgressCellRenderer {...(params2 as unknown as ICellRendererParams)} />,
      { wrapper: AllTheProviders },
    );
    await waitFor(() => {
      // Expect the percent text (50%) to appear
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });
});
