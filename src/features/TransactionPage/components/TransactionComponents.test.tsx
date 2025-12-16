import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  type RenderOptions,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import { BikeInformation } from "./BikeInformation";
import { RepairsList } from "./RepairsList";
import { PartsList } from "./PartsList";
import { OrderRequestsList } from "./OrderRequestsList";
import type {
  RepairDetails,
  ItemDetails,
  Part,
  Bike,
  Transaction,
} from "../../../model";
import { MECHANIC_PART_MULTIPLIER } from "../../../constants/transaction";
import { AllTheProviders } from "../../../test-utils";

describe("Transaction Page components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BikeInformation", () => {
    it("shows Add Bike when no bike and clicking sets show form", () => {
      const setShowBikeForm = vi.fn();
      render(
        <BikeInformation
          transactionData={{} as Transaction}
          bike={null as Bike | null}
          setBike={vi.fn()}
          showBikeForm={false}
          setShowBikeForm={setShowBikeForm}
          onBikeCreated={vi.fn()}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );

      const btn = screen.getByRole("button", { name: /Add Bike/i });
      fireEvent.click(btn);
      expect(setShowBikeForm).toHaveBeenCalledWith(true);
    });

    it("renders bike info and clicking edit populates bike and opens form", () => {
      const bike = {
        make: "Giant",
        model: "Defy",
        description: "Fast",
      } as Bike;
      const transactionData = { Bike: bike } as Transaction;
      const setBike = vi.fn();
      const setShowBikeForm = vi.fn();

      render(
        <BikeInformation
          transactionData={transactionData}
          bike={null as Bike | null}
          setBike={setBike}
          showBikeForm={false}
          setShowBikeForm={setShowBikeForm}
          onBikeCreated={vi.fn()}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );

      expect(screen.getByText("Giant Defy")).toBeInTheDocument();
      expect(screen.getByText("Fast")).toBeInTheDocument();

      // Edit button is the first contained button in the component
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);

      expect(setBike).toHaveBeenCalled();
      const passedBike = setBike.mock.calls[0][0];
      expect(passedBike.make).toBe("Giant");
      expect(passedBike.model).toBe("Defy");
      expect(setShowBikeForm).toHaveBeenCalledWith(true);
    });
  });

  describe("RepairsList", () => {
    it("renders skeletons when loading", () => {
      const { container } = render(
        <RepairsList
          repairDetails={[]}
          isLoading={true}
          onToggleDone={vi.fn()}
          onRemove={vi.fn()}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );

      // MUI Skeleton has class .MuiSkeleton-root; count them
      const skeletons = container.querySelectorAll(".MuiSkeleton-root");
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it("shows message when empty", () => {
      render(
        <RepairsList
          repairDetails={[]}
          isLoading={false}
          onToggleDone={vi.fn()}
          onRemove={vi.fn()}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );

      expect(screen.getByText("No repairs added yet")).toBeInTheDocument();
    });

    it("renders items and triggers actions", () => {
      const onToggleDone = vi.fn();
      const onRemove = vi.fn();
      // include required fields on nested Repair object to satisfy types
      const repairs: RepairDetails[] = [
        {
          transaction_detail_id: "r1",
          transaction_id: "tx1",
          item_id: "i1",
          quantity: 1,
          date_modified: "2025-01-01T00:00:00.000Z",
          completed: false,
          Repair: {
            name: "Fix Brake",
            price: 15,
            description: "desc",
            disabled: false,
            repair_id: "fix-brake",
          },
        },
      ];

      render(
        <RepairsList
          repairDetails={repairs}
          isLoading={false}
          onToggleDone={onToggleDone}
          onRemove={onRemove}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );

      expect(screen.getByText("Fix Brake")).toBeInTheDocument();
      expect(screen.getByText("$15.00")).toBeInTheDocument();

      // find the toggle and remove buttons within the list item
      const list = screen.getByRole("list");
      const item = within(list).getByText("Fix Brake").closest("li")!;
      const buttons = within(item).getAllByRole("button");

      // first button is toggle, second is remove
      fireEvent.click(buttons[0]);
      expect(onToggleDone).toHaveBeenCalledWith("r1", true, "Fix Brake");

      fireEvent.click(buttons[1]);
      expect(onRemove).toHaveBeenCalledWith("r1");
    });
  });

  describe("PartsList", () => {
    it("renders skeletons when loading and shows empty message", () => {
      const { rerender, container } = render(
        <PartsList
          itemDetails={[]}
          isLoading={true}
          isEmployee={false}
          isBeerBike={false}
          onRemove={vi.fn()}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );
      expect(
        container.querySelectorAll(".MuiSkeleton-root").length,
      ).toBeGreaterThanOrEqual(3);

      rerender(
        <PartsList
          itemDetails={[]}
          isLoading={false}
          isEmployee={false}
          isBeerBike={false}
          onRemove={vi.fn()}
        />,
      );
      expect(screen.getByText("No parts added yet")).toBeInTheDocument();
    });

    it("displays price correctly for employee and non-employee and handles remove", () => {
      const onRemove = vi.fn();
      const parts = [
        {
          transaction_detail_id: "p1",
          Item: {
            name: "Tube",
            description: "inner",
            standard_price: 10,
            wholesale_cost: 4,
          },
        },
      ] as unknown as ItemDetails[];

      // non-employee uses standard_price
      const { rerender } = render(
        <PartsList
          itemDetails={parts}
          isLoading={false}
          isEmployee={false}
          isBeerBike={false}
          onRemove={onRemove}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );

      expect(screen.getByText("$10.00")).toBeInTheDocument();

      // employee uses wholesale * 1.25
      rerender(
        <PartsList
          itemDetails={parts}
          isLoading={false}
          isEmployee={true}
          isBeerBike={false}
          onRemove={onRemove}
        />,
      );

      expect(screen.getByText("$5.00")).toBeInTheDocument();

      const item = screen.getByText("Tube").closest("li")!;
      const delBtn = within(item).getByRole("button");
      fireEvent.click(delBtn);
      expect(onRemove).toHaveBeenCalledWith("p1");
    });
  });

  describe("OrderRequestsList", () => {
    it("renders skeletons and empty message and shows ordered parts", () => {
      const { container, rerender } = render(
        <OrderRequestsList
          orderRequestData={[]}
          isLoading={true}
          isEmployee={false}
          isBeerBike={false}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );
      expect(
        container.querySelectorAll(".MuiSkeleton-root").length,
      ).toBeGreaterThanOrEqual(3);

      rerender(
        <OrderRequestsList
          orderRequestData={[]}
          isLoading={false}
          isEmployee={false}
          isBeerBike={false}
        />,
      );
      expect(screen.getByText("No parts ordered yet")).toBeInTheDocument();

      const parts = [
        {
          item_id: "o1",
          name: "Cog",
          description: "cogs",
          standard_price: 12,
          wholesale_cost: 6,
        },
      ] as unknown as Part[];

      render(
        <OrderRequestsList
          orderRequestData={parts}
          isLoading={false}
          isEmployee={true}
          isBeerBike={false}
        />,
        { wrapper: AllTheProviders } as unknown as RenderOptions,
      );

      // price uses wholesale * multiplier
      const expected = (6 * MECHANIC_PART_MULTIPLIER).toFixed(2);
      expect(screen.getByText(`$${expected}`)).toBeInTheDocument();
      expect(screen.getByText("Ordered")).toBeInTheDocument();
      const delBtn = screen.getByLabelText("delete-ordered-part");
      expect(delBtn).toBeDisabled();
    });
  });
});
