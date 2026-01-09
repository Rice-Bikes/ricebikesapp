import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TransactionActions } from "./TransactionActions";
import type { Transaction, RepairDetails } from "../../../model";
import { AllTheProviders } from "../../../test-utils";
import { queryClient } from "../../../app/queryClient";

const baseTransaction = {
  transaction_num: 123,
  Customer: {
    first_name: "John",
    last_name: "Smith",
    email: "a@b.com",
    phone: "555",
  },
} as unknown as Transaction;

const sampleRepair = {
  transaction_detail_id: "1",
  completed: false,
  Repair: { name: "r", price: 10, description: "desc" },
} as unknown as RepairDetails;

describe("TransactionActions", () => {
  let spies: {
    setShowCheckout: ReturnType<typeof vi.fn>;
    setShowWaitingParts: ReturnType<typeof vi.fn>;
    setWaitPart: ReturnType<typeof vi.fn>;
    setWaitEmail: ReturnType<typeof vi.fn>;
    setPriority: ReturnType<typeof vi.fn>;
    setNuclear: ReturnType<typeof vi.fn>;
    setIsRefurb: ReturnType<typeof vi.fn>;
    setBeerBike: ReturnType<typeof vi.fn>;
    setIsCompleted: ReturnType<typeof vi.fn>;
    setPaid: ReturnType<typeof vi.fn>;
    handlePaid: ReturnType<typeof vi.fn>;
    handleMarkDone: ReturnType<typeof vi.fn>;
    handleAddOrderedPart: ReturnType<typeof vi.fn>;
    blockCompletion: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    spies = {
      setShowCheckout: vi.fn(),
      setShowWaitingParts: vi.fn(),
      setWaitPart: vi.fn(),
      setWaitEmail: vi.fn(),
      setPriority: vi.fn(),
      setNuclear: vi.fn(),
      setIsRefurb: vi.fn(),
      setBeerBike: vi.fn(),
      setIsCompleted: vi.fn(),
      setPaid: vi.fn(),
      handlePaid: vi.fn(),
      handleMarkDone: vi.fn(),
      handleAddOrderedPart: vi.fn(),
      blockCompletion: vi.fn().mockReturnValue(false),
    };
  });

  it("toggles wait email and invalidates queries", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    render(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={false}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={false}
        priority={false}
        nuclear={false}
        refurb={false}
        showCheckout={false}
        showWaitingParts={false}
        repairDetails={[] as RepairDetails[]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
      />,
      { wrapper: AllTheProviders },
    );

    fireEvent.click(screen.getByText("Wait on Email"));

    expect(spies.setWaitEmail).toHaveBeenCalledWith(true);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
  });

  it("handles priority and nuclear toggles", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    render(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={false}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={false}
        priority={false}
        nuclear={false}
        refurb={false}
        showCheckout={false}
        showWaitingParts={false}
        repairDetails={[]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
      />,
      { wrapper: AllTheProviders },
    );

    // Icon button with ErrorSharp doesn't have accessible name; find icon by test id and click its parent button
    const icon = screen.getByTestId("ErrorSharpIcon");
    const iconBtn = icon.closest("button");
    expect(iconBtn).toBeTruthy();
    fireEvent.click(iconBtn!);
    expect(spies.setPriority).toHaveBeenCalledWith(true);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

    // nuclear button
    fireEvent.click(screen.getByText("Mark as Nuclear"));
    expect(spies.setNuclear).toHaveBeenCalledWith(true);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
  });

  it("opens and closes checkout modal via props and reopen button calls appropriate handlers", () => {
    const { rerender } = render(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={true}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={false}
        priority={false}
        nuclear={false}
        refurb={false}
        showCheckout={false}
        showWaitingParts={false}
        repairDetails={[sampleRepair]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
      />,
      { wrapper: AllTheProviders },
    );

    // Checkout button should be enabled when isCompleted is true
    const checkoutBtn = screen.getByText("Checkout");
    expect(checkoutBtn).not.toBeDisabled();

    // clicking checkout should call setShowCheckout(true)
    fireEvent.click(checkoutBtn);
    expect(spies.setShowCheckout).toHaveBeenCalledWith(true);

    // When showCheckout prop is true, CheckoutModal should render
    rerender(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={true}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={false}
        priority={false}
        nuclear={false}
        refurb={false}
        showCheckout={true}
        showWaitingParts={false}
        repairDetails={[sampleRepair]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
      />,
    );

    expect(document.querySelector(".checkout")).toBeInTheDocument();

    // Reopen Transaction behavior
    const reopenBtn = screen.getByText("Reopen Transaction");
    fireEvent.click(reopenBtn);
    expect(spies.setIsCompleted).toHaveBeenCalledWith(false);
    expect(spies.setPaid).toHaveBeenCalledWith(false);
  });

  it("toggles waiting on parts and project type flags", () => {
    render(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={false}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={false}
        priority={false}
        nuclear={false}
        refurb={false}
        showCheckout={false}
        showWaitingParts={false}
        repairDetails={[]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
      />,
      { wrapper: AllTheProviders },
    );

    fireEvent.click(screen.getByText("Wait on Part"));
    expect(spies.setShowWaitingParts).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByText("Project Type"));
    fireEvent.click(screen.getByText("Refurb"));
    expect(spies.setIsRefurb).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByText("Project Type"));
    fireEvent.click(screen.getByText("Beer Bike"));
    expect(spies.setBeerBike).toHaveBeenCalledWith(true);
  });

  it("triggers completion dropdown actions when transaction is incomplete", async () => {
    const blockCompletionSpy = vi.fn().mockReturnValue(false);
    const handleMarkDone = vi.fn();

    render(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={false}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={false}
        priority={false}
        nuclear={false}
        refurb={false}
        showCheckout={false}
        showWaitingParts={false}
        repairDetails={[]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
        handleMarkDone={handleMarkDone}
        blockCompletion={blockCompletionSpy}
      />,
      { wrapper: AllTheProviders },
    );

    const dropdownButtons = screen.getAllByLabelText("select merge strategy");
    const completeButton = dropdownButtons.find((btn) =>
      btn.textContent?.includes("Complete Transaction"),
    );
    expect(completeButton).toBeDefined();
    fireEvent.click(completeButton!);
    fireEvent.click(await screen.findByText("Send Email"));
    expect(handleMarkDone).toHaveBeenCalledWith(true);

    fireEvent.click(completeButton!);
    fireEvent.click(await screen.findByText("Complete w/out Email"));
    expect(handleMarkDone).toHaveBeenCalledWith(false);
    expect(blockCompletionSpy).toHaveBeenCalled();
  });

  it("toggles wait email off and nuclear off when already set", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { rerender } = render(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={false}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={true}
        priority={false}
        nuclear={false}
        refurb={false}
        showCheckout={false}
        showWaitingParts={false}
        repairDetails={[]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
      />,
      { wrapper: AllTheProviders },
    );

    fireEvent.click(screen.getByText("Wait on Email"));
    expect(spies.setWaitEmail).toHaveBeenCalledWith(false);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

    rerender(
      <TransactionActions
        transactionData={baseTransaction}
        transaction_id={"123"}
        user={null}
        totalPrice={10}
        isCompleted={false}
        isEmployee={false}
        beerBike={false}
        waitPart={false}
        waitEmail={false}
        priority={false}
        nuclear={true}
        refurb={false}
        showCheckout={false}
        showWaitingParts={false}
        repairDetails={[]}
        itemDetails={[]}
        parts={[]}
        totalRef={React.createRef<HTMLDivElement>()}
        {...spies}
      />,
    );

    // nuclear true renders only the icon, so target the button by role and index
    const buttons = screen.getAllByRole("button");
    const nuclearButton = buttons.find((btn) => btn.querySelector(".fa-radiation"));
    expect(nuclearButton).toBeDefined();
    fireEvent.click(nuclearButton!);
    expect(spies.setNuclear).toHaveBeenCalledWith(false);
  });
});
