import { describe, it, expect, vi } from "vitest";
import { handleRowClick } from "./TransactionsTable.helpers";
import type { IRow } from "./TransactionsTable.types";

describe("TransactionsTable navigation helper", () => {
  it("navigates to bike-transaction for retrospec types", () => {
    const nav = vi.fn();
    const data = {
      Transaction: { transaction_id: "abc", transaction_type: "retrospec" },
    } as Partial<IRow> as IRow;
    handleRowClick(nav, data);
    expect(nav).toHaveBeenCalledWith("/bike-transaction/abc?type=retrospec");
  });

  it("navigates to transaction-details for other types", () => {
    const nav = vi.fn();
    const data = {
      Transaction: { transaction_id: "xyz", transaction_type: "inpatient" },
    } as Partial<IRow> as IRow;
    handleRowClick(nav, data);
    expect(nav).toHaveBeenCalledWith("/transaction-details/xyz?type=inpatient");
  });

  it("does nothing when data has no Transaction", () => {
    const nav = vi.fn();
    handleRowClick(nav, undefined);
    expect(nav).not.toHaveBeenCalled();
  });
});
