import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { buildColDefs } from "./TransactionsTable.helpers";
import type { ICellRendererParams } from "ag-grid-community";

describe("TransactionsTable default Status cell renderer", () => {
  it("renders chips for inpatient/outpatient/merch and beer bike", () => {
    const cols = buildColDefs("main", false);
    const statusCol = cols.find((c) => c.headerName === "Status");
    const inpatientParams = {
      value: { isBeerBike: false, transaction_type: "inpatient" },
    } as ICellRendererParams;
    const el1 = statusCol!.cellRenderer!(
      inpatientParams,
    ) as unknown as JSX.Element;
    render(el1);
    expect(screen.getByText("Inpatient")).toBeInTheDocument();

    const merchParams = {
      value: { isBeerBike: false, transaction_type: "merch" },
    } as ICellRendererParams;
    const el2 = statusCol!.cellRenderer!(merchParams) as unknown as JSX.Element;
    const { rerender, container } = render(el2);
    expect(screen.getByText("Merch")).toBeInTheDocument();

    const beerBikeParams = {
      value: { isBeerBike: true, transaction_type: "outpatient" },
    } as ICellRendererParams;
    const el3 = statusCol!.cellRenderer!(
      beerBikeParams,
    ) as unknown as JSX.Element;
    rerender(el3);
    expect(container.innerHTML).toMatch(/SportsBarIcon/);
  });

  it("returns null for retrospec type", () => {
    const cols = buildColDefs("main", false);
    const statusCol = cols.find((c) => c.headerName === "Status");
    const params = {
      value: { isBeerBike: false, transaction_type: "retrospec" },
    } as ICellRendererParams;
    const res = statusCol!.cellRenderer!(params);
    expect(res).toBeNull();
  });
});
