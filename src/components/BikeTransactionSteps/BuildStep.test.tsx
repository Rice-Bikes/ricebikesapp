import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../app/queryClient";
import { UserProvider } from "../../contexts/UserContext";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import { BuildStep } from "./BuildStep";
import DBModel, { Transaction, TransactionDetails } from "../../model";
import { mockUser } from "../../test-constants";
import { useSlackNotifications } from "../../hooks/useSlackNotifications";

vi.setConfig({ testTimeout: 15000 });

vi.mock("../../hooks/useSlackNotifications", () => ({
  useSlackNotifications: vi.fn(() => ({
    notifyBuildReady: vi.fn().mockResolvedValue(true),
    notifyInspectionComplete: vi.fn().mockResolvedValue(true),
  })),
}));

/**
 * These tests focus on the initialization behavior inside BuildStep:
 * - duplicate transaction details should be deleted (deleteTransactionDetails)
 * - missing build task entries should be pre-created (postTransactionDetails)
 *
 * We mock DBModel.fetchTransactionDetails to provide a duplicate entry
 * for a known BUILD_TASK repair_id so the component will attempt to delete
 * the duplicate and pre-create missing tasks.
 */

beforeEach(() => {
  // Ensure validators are compiled (some DBModel functions use AJV validators)
  DBModel.initialize();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BuildStep initialize logic", () => {
  it("deletes duplicate transaction details and pre-creates missing tasks", async () => {
    const transaction_id = "tx-123";
    // Use a repair_id that exists in BUILD_TASKS (first BUILD_TASK)
    // This string is taken from the component's BUILD_TASKS constant
    const duplicateRepairId = "00000000-671a-bba2-3810-420b4cca4cd3";

    // Two details for the same repair -> second should be treated as duplicate
    const transactionDetails: Array<TransactionDetails> = [

      {

        transaction_detail_id: "d1",

        transaction_id: transaction_id,

        item_id: null,

        completed: false,

        quantity: 1,

        date_modified: "2023-01-01T00:00:00.000Z",

        repair_id: duplicateRepairId,

        Repair: { repair_id: duplicateRepairId },

      },

      {

        transaction_detail_id: "d2",

        transaction_id: transaction_id,

        item_id: null,

        completed: true,

        quantity: 1,

        date_modified: "2023-01-01T00:00:00.000Z",

        repair_id: duplicateRepairId,

        Repair: { repair_id: duplicateRepairId },

      },

    ];

    // Mock fetch user so that useUser has a valid userId
    const mockUserId = "user-1";
    vi.spyOn(DBModel, "fetchUser").mockResolvedValue(mockUser);

    // Mock the fetchTransactionDetails hook (the query's queryFn)
    vi.spyOn(DBModel, "fetchTransactionDetails").mockResolvedValue(transactionDetails);
    // Spy on delete and post functions to assert they are called
    const deleteSpy = vi.spyOn(DBModel, "deleteTransactionDetails").mockResolvedValue();
    const postSpy = vi.spyOn(DBModel, "postTransactionDetails").mockResolvedValue();

    // Spy on queryClient.invalidateQueries to assert cache invalidation occurs
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    // Render the BuildStep component inside providers and a MemoryRouter that
    // supplies the transaction_id route param.
    render(
      <QueryClientProvider client={queryClient}>
        <UserProvider initialUserId={mockUserId}>
          <MemoryRouter initialEntries={[`/transactions/${transaction_id}`]}>
            <Routes>
              <Route
                path="/transactions/:transaction_id"
                element={<BuildStep onStepComplete={() => { }} />}
              />
            </Routes>
          </MemoryRouter>
        </UserProvider>
      </QueryClientProvider>,
    );

    // Wait for the component to call deleteTransactionDetails for the duplicate (d2)
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalled();
      // assert that it was called with the duplicate transaction_detail_id
      expect(deleteSpy).toHaveBeenCalledWith("d2");
    });

    // Wait for pre-creation of missing tasks to be attempted
    // (the component will call postTransactionDetails at least once)
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalled();
    });

    // Expect the query client to have been invalidated to refresh transaction details
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalled();
    });

    // Confirm that the Build & Inspection Tasks header is rendered to ensure the UI mounted
    expect(screen.getByText(/Build & Inspection Tasks/i)).toBeInTheDocument();
  });
});

describe("BuildStep completion flow", () => {
  it("advances step and sends inspection notification when all tasks complete", async () => {
    const transaction_id = "tx-complete";
    const repairIds = [
      "00000000-671a-bba2-3810-420b4cca4cd3",
      "00000000-5a8c-cd91-4459-8272c1ec05a4",
      "00000000-6349-c2c0-da5c-a7275bb9932f",
      "00000000-5a8c-cd91-4459-8272c1ec0597",
      "00000000-5a8c-cd91-4459-8272c1ec058d",
      "00000000-5a8c-cd91-4459-8272c1ec05b5",
      "00000000-5a8c-cd91-4459-8272c1ec0592",
      "00000000-5a8c-cd91-4459-8272c1ec0589",
      "00000000-6025-9c41-654c-0a0dbd6d3847",
      "00000000-5a8c-cd91-4459-8272c1ec058b",
      "00000000-5a8c-cd91-4459-8272c1ec0588",
      "00000000-5bbd-448f-9093-87ce5113d172",
      "00000000-671a-bad6-3810-420b4cca4c8f",
      "00000000-5a8c-cd91-4459-8272c1ec05b9",
      "00000000-5a8c-cd91-4459-8272c1ec0598",
      "00000000-5a8c-cd91-4459-8272c1ec05a3",
      "00000000-5a8c-cd91-4459-8272c1ec0594",
      "00000000-5bbd-407f-9093-87ce5113d16e",
      "00000000-5a8c-cd91-4459-8272c1ec059e",
    ];

    const transactionDetails: Array<TransactionDetails> = repairIds.map(
      (repair_id, idx) => ({
        transaction_detail_id: `d-${idx}`,
        transaction_id,
        item_id: null,
        completed: true,
        quantity: 1,
        date_modified: "2023-01-01T00:00:00.000Z",
        repair_id,
        Repair: { repair_id },
      }),
    );

    const transaction = {
      transaction_id,
      transaction_type: "retrospec",
      is_refurb: true,
      is_completed: false,
      is_paid: false,
      is_urgent: false,
      is_nuclear: false,
      is_beer_bike: false,
      is_reserved: false,
      is_waiting_on_email: false,
      total_cost: 0,
      description: "All good",
      Bike: { bike_id: "bike-1", make: "Make", model: "Model" },
      transaction_num: 99,
    } as Transaction;

    vi.spyOn(DBModel, "fetchTransactionDetails").mockResolvedValue(transactionDetails);
    vi.spyOn(DBModel, "fetchTransaction").mockResolvedValue(transaction);
    vi.spyOn(DBModel, "fetchUser").mockResolvedValue(mockUser);
    vi.spyOn(DBModel, "updateTransaction").mockResolvedValue(transaction);
    const notifyInspectionComplete = vi.fn().mockResolvedValue(true);
    (useSlackNotifications as unknown as vi.Mock).mockReturnValue({
      notifyBuildReady: vi.fn().mockResolvedValue(true),
      notifyInspectionComplete,
    });

    const onStepComplete = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <UserProvider initialUserId={mockUser.user_id}>
          <MemoryRouter initialEntries={[`/transactions/${transaction_id}`]}>
            <Routes>
              <Route
                path="/transactions/:transaction_id"
                element={<BuildStep onStepComplete={onStepComplete} />}
              />
            </Routes>
          </MemoryRouter>
        </UserProvider>
      </QueryClientProvider>,
    );

    const advanceButton = await screen.findByRole("button", { name: /Proceed to Customer Creation/i });

    await waitFor(() => expect(advanceButton).toBeEnabled());
    fireEvent.click(advanceButton);

    await waitFor(() => {
      expect(notifyInspectionComplete).toHaveBeenCalledWith(
        "bike-1",
        transaction_id,
        `${mockUser.firstname} ${mockUser.lastname}`,
        "Make Model",
        "All good",
      );
      expect(onStepComplete).toHaveBeenCalled();
    });
  }, 12000);
});

describe("BuildStep interactions", () => {
  it("starts build and marks transaction as refurb when not started", async () => {
    const transaction_id = "tx-start";
    const transaction = {
      transaction_id,
      transaction_type: "retrospec",
      is_refurb: false,
      is_completed: false,
      is_paid: false,
      is_urgent: false,
      is_nuclear: false,
      is_beer_bike: false,
      is_reserved: false,
      is_waiting_on_email: false,
      total_cost: 0,
      description: "",
      Bike: { bike_id: "bike-1", make: "Make", model: "Model" },
      transaction_num: 1,
    } as Transaction;

    vi.spyOn(DBModel, "fetchTransactionDetails").mockResolvedValue([]);
    vi.spyOn(DBModel, "fetchTransaction").mockResolvedValue(transaction);
    vi.spyOn(DBModel, "fetchUser").mockResolvedValue(mockUser);
    const updateSpy = vi.spyOn(DBModel, "updateTransaction").mockResolvedValue(transaction);
    const postSpy = vi.spyOn(DBModel, "postTransactionDetails").mockResolvedValue();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <UserProvider initialUserId={mockUser.user_id}>
          <MemoryRouter initialEntries={[`/transactions/${transaction_id}`]}>
            <Routes>
              <Route
                path="/transactions/:transaction_id"
                element={<BuildStep onStepComplete={() => { }} />}
              />
            </Routes>
          </MemoryRouter>
        </UserProvider>
      </QueryClientProvider>,
    );

    const startBtn = await screen.findByRole("button", { name: /Start Build Process/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        transaction_id,
        expect.objectContaining({ is_refurb: true }),
      );
      expect(invalidateSpy).toHaveBeenCalled();
    });

    const [firstCheckbox] = await screen.findAllByRole("checkbox");
    expect(firstCheckbox).not.toBeDisabled();
    expect(postSpy).toHaveBeenCalled();
  }, 12000);

  it("creates a transaction detail when toggling a missing task", async () => {
    const transaction_id = "tx-toggle";
    const transaction = {
      transaction_id,
      transaction_type: "retrospec",
      is_refurb: true,
      is_completed: false,
      is_paid: false,
      is_urgent: false,
      is_nuclear: false,
      is_beer_bike: false,
      is_reserved: false,
      is_waiting_on_email: false,
      total_cost: 0,
      description: "",
      Bike: { bike_id: "bike-1" },
      transaction_num: 2,
    } as Transaction;

    vi.spyOn(DBModel, "fetchTransactionDetails").mockResolvedValue([]);
    vi.spyOn(DBModel, "fetchTransaction").mockResolvedValue(transaction);
    vi.spyOn(DBModel, "fetchUser").mockResolvedValue(mockUser);
    const postSpy = vi.spyOn(DBModel, "postTransactionDetails").mockResolvedValue();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <UserProvider initialUserId={mockUser.user_id}>
          <MemoryRouter initialEntries={[`/transactions/${transaction_id}`]}>
            <Routes>
              <Route
                path="/transactions/:transaction_id"
                element={<BuildStep onStepComplete={() => { }} />}
              />
            </Routes>
          </MemoryRouter>
        </UserProvider>
      </QueryClientProvider>,
    );

    const [firstCheckbox] = await screen.findAllByRole("checkbox");
    fireEvent.click(firstCheckbox);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        transaction_id,
        "00000000-671a-bba2-3810-420b4cca4cd3",
        mockUser.user_id,
        1,
        "repair",
      );
      expect(invalidateSpy).toHaveBeenCalled();
    });
  }, 12000);
});
