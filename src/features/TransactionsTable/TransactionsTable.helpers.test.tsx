import { describe, it, expect, vi, afterEach } from "vitest";
import * as BikeSales from "./BikeSalesColumns";
import {
  buildColDefs,
  getTransactionRowUrl,
  timeAgo,
  checkStatusOfRetrospec,
  handleRowClick,
} from "./TransactionsTable.helpers";
import type { ColDef } from "ag-grid-community";
import type { Transaction } from "../../model";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PanToolIcon from "@mui/icons-material/PanTool";
import ConstructionIcon from "@mui/icons-material/Construction";
import { mockCustomer, mockTransaction } from "../../test-constants";

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

  it("timeAgo handles sub-minute durations", () => {
    const now = new Date();
    const justNow = new Date(now.getTime() - 15 * 1000);
    const label = timeAgo(justNow);
    expect(label).toContain("seconds");
  });

  it("checkStatusOfRetrospec renders correct icon per state", () => {
    const completed = checkStatusOfRetrospec(false, false, true);
    const waitingEmail = checkStatusOfRetrospec(false, true, false);
    const refurb = checkStatusOfRetrospec(true, false, false);

    expect(completed?.type).toBe(MonetizationOnIcon);
    expect(waitingEmail?.type).toBe(PanToolIcon);
    expect(refurb?.type).toBe(ConstructionIcon);
  });

  it("handleRowClick navigates only when transaction exists", () => {
    const navigate = vi.fn();
    handleRowClick(navigate, undefined);
    expect(navigate).not.toHaveBeenCalled();

    const data = {
      Transaction: {
        ...mockTransaction,
        transaction_id: "t-1",
        transaction_type: "inpatient",
      },
      Customer: mockCustomer,
      OrderRequests: []
    };
    handleRowClick(navigate, data);
    expect(navigate).toHaveBeenCalledWith("/transaction-details/t-1?type=inpatient");
  });
});
