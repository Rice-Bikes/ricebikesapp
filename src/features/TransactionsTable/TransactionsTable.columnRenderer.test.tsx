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
    const inpatientElement = statusCol!.cellRenderer!(
      inpatientParams,
    ) as unknown as JSX.Element;
    const inpatientRender = render(inpatientElement);
    expect(screen.getByText("Inpatient")).toBeInTheDocument();
    inpatientRender.unmount();

    const merchParams = {
      value: { isBeerBike: false, transaction_type: "merch" },
    } as ICellRendererParams;
    const merchElement = statusCol!.cellRenderer!(
      merchParams,
    ) as unknown as JSX.Element;
    const merchRender = render(merchElement);
    expect(screen.getByText("Merch")).toBeInTheDocument();
    merchRender.unmount();

    const beerBikeParams = {
      value: { isBeerBike: true, transaction_type: "outpatient" },
    } as ICellRendererParams;
    const beerElement = statusCol!.cellRenderer!(
      beerBikeParams,
    ) as unknown as JSX.Element;
    const beerRender = render(beerElement);
    expect(screen.getByText("Outpatient")).toBeInTheDocument();
    beerRender.unmount();
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

  it("Tags cell renders icons for beer bike, urgent, wait-email and retrospec states", () => {
    const cols = buildColDefs("main", false);
    const tagsCol = cols.find((c) => c.headerName === "Tags");

    // beer bike non-retrospec should show SportsBarIcon
    const beerBikeParams = {
      value: { isBeerBike: true, transaction_type: "outpatient" },
    } as ICellRendererParams;
    const beerEl = tagsCol!.cellRenderer!(
      beerBikeParams,
    ) as unknown as JSX.Element;
    const { container: beerContainer } = render(beerEl);
    expect(beerContainer.innerHTML).toMatch(/SportsBarIcon/);

    // urgent & not completed should show ErrorSharp
    const urgentParams = {
      value: {
        transaction_type: "inpatient",
        isUrgent: true,
        is_completed: false,
      },
    } as ICellRendererParams;
    const urgentEl = tagsCol!.cellRenderer!(
      urgentParams,
    ) as unknown as JSX.Element;
    const { container: urgentContainer } = render(urgentEl);
    expect(urgentContainer.innerHTML).toMatch(/ErrorSharp/);

    // waiting-on-email should show EmailOutlinedIcon
    const emailParams = {
      value: { transaction_type: "inpatient", isWaitEmail: true },
    } as ICellRendererParams;
    const emailEl = tagsCol!.cellRenderer!(
      emailParams,
    ) as unknown as JSX.Element;
    const { container: emailContainer } = render(emailEl);
    expect(emailContainer.innerHTML).toMatch(/EmailOutlinedIcon/);

    // retrospec refurb should render ConstructionIcon
    const retrospecRefurbParams = {
      value: {
        transaction_type: "retrospec",
        refurb: true,
        isWaitEmail: false,
        is_completed: false,
      },
    } as ICellRendererParams;
    const retrospecRefurbEl = tagsCol!.cellRenderer!(
      retrospecRefurbParams,
    ) as unknown as JSX.Element;
    const { container: retroRefurbContainer } = render(retrospecRefurbEl);
    expect(retroRefurbContainer.innerHTML).toMatch(/ConstructionIcon/);

    // retrospec completed should render MonetizationOnIcon
    const retrospecCompletedParams = {
      value: {
        transaction_type: "retrospec",
        refurb: false,
        isWaitEmail: false,
        is_completed: true,
      },
    } as ICellRendererParams;
    const retrospecCompletedEl = tagsCol!.cellRenderer!(
      retrospecCompletedParams,
    ) as unknown as JSX.Element;
    const { container: retroCompletedContainer } = render(retrospecCompletedEl);
    expect(retroCompletedContainer.innerHTML).toMatch(/MonetizationOnIcon/);
  });
});
