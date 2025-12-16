import { describe, it, expect, vi, afterEach } from "vitest";
import * as BikeSales from "./BikeSalesColumns";
import {
  buildColDefs,
  getTransactionRowUrl,
} from "./TransactionsTable.helpers";
import type { ColDef } from "ag-grid-community";
import type { Transaction } from "../../model";

describe("TransactionsTable helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildColDefs returns modified bikeSales columns with hide on mobile", () => {
    vi.spyOn(BikeSales, "getBikeSalesColumnDefs").mockReturnValue([
      { colId: "Bike", headerName: "Bike" } as ColDef,
      { colId: "submitted", headerName: "Submitted" } as ColDef,
      { colId: "other", headerName: "Other" } as ColDef,
    ] as ColDef[]);

    const colsMobile = buildColDefs("retrospec", true);
    expect(colsMobile.find((c: ColDef) => c.colId === "Bike")?.hide).toBe(true);
    expect(colsMobile.find((c: ColDef) => c.colId === "submitted")?.hide).toBe(
      true,
    );
    expect(colsMobile.find((c: ColDef) => c.colId === "other")?.hide).not.toBe(
      true,
    );

    const colsDesktop = buildColDefs("retrospec", false);
    expect(colsDesktop.some((c: ColDef) => c.hide)).toBe(false);
  });

  it("buildColDefs falls back to default columns when bike sales invalid", () => {
    vi.spyOn(BikeSales, "getBikeSalesColumnDefs").mockReturnValue(
      null as unknown as ColDef[],
    );

    const defs = buildColDefs("retrospec", false);
    expect(defs.some((d: ColDef) => d.colId === "transaction_num")).toBe(true);
  });

  it("getTransactionRowUrl returns correct url based on type", () => {
    const t1 = {
      transaction_id: "123",
      transaction_type: "retrospec",
    } as Partial<Transaction> as Transaction;
    expect(getTransactionRowUrl(t1)).toContain("/bike-transaction/123");

    const t2 = {
      transaction_id: "234",
      transaction_type: "inpatient",
    } as Partial<Transaction> as Transaction;
    expect(getTransactionRowUrl(t2)).toContain("/transaction-details/234");
  });
});
