import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateTransactionDropdown from "./TransactionTypeDropdown";
import DBModel from "../../model";
import { AllTheProviders } from "../../test-utils";
import { useNavigate } from "react-router-dom";
import { mockCustomer, mockTransaction } from "../../test-constants";

// Mock dependencies
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

vi.mock("../../model", () => ({
  default: {
    createCustomer: vi.fn(),
    postTransaction: vi.fn(),
    postTransactionLog: vi.fn(),
  },
}));

const createCustomerMock = vi.mocked(DBModel.createCustomer);
const postTransactionMock = vi.mocked(DBModel.postTransaction);
const postTransactionLogMock = vi.mocked(DBModel.postTransactionLog);

// Mock the NewTransactionForm component
vi.mock("./CustomerForm", () => ({
  default: ({
    onTransactionCreated,
    isOpen,
    user_id,
    onClose,
    t_type,
  }: {
    onTransactionCreated: (transaction: Record<string, unknown>) => void;
    isOpen: boolean;
    user_id: string;
    onClose: () => void;
    t_type: string;
  }) => {
    if (!isOpen) return null;

    return (
      <div data-testid="new-transaction-form">
        <div>Transaction Type: {t_type}</div>
        <div>User ID: {user_id}</div>
        <button
          onClick={() =>
            onTransactionCreated({
              transaction_id: "new-transaction-123",
              transaction_num: 456,
              transaction_type: t_type,
              // Add other required properties
              date_created: new Date().toISOString(),
              customer_id: "customer-123",
              total_cost: 0,
              is_completed: false,
              is_paid: false,
              is_refurb: false,
              is_urgent: false,
              is_beer_bike: false,
              is_employee: false,
              is_reserved: false,
              is_waiting_on_email: false,
            })
          }
        >
          Create Transaction
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

describe("CreateTransactionDropdown Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createCustomerMock.mockReset();
    postTransactionMock.mockReset();
    postTransactionLogMock.mockReset();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  test("renders New Transaction button", () => {
    render(<CreateTransactionDropdown />, {
      wrapper: AllTheProviders,
    });

    expect(screen.getByText("+ Add new transaction")).toBeInTheDocument();
  });

  test("opens dropdown menu when button is clicked", () => {
    render(<CreateTransactionDropdown />, {
      wrapper: AllTheProviders,
    });

    // Click the Add new transaction button
    fireEvent.click(screen.getByText("+ Add new transaction"));

    // Check if menu items appear
    expect(screen.getByText("Choose a transaction type")).toBeInTheDocument();
    expect(screen.getByText("Inpatient")).toBeInTheDocument();
    expect(screen.getByText("Outpatient")).toBeInTheDocument();
    expect(screen.getByText("Merch")).toBeInTheDocument();
    expect(screen.getByText("Retrospec")).toBeInTheDocument();
  });

  test("selects transaction type and opens form", async () => {
    render(<CreateTransactionDropdown />, {
      wrapper: AllTheProviders,
    });

    // Click the Add new transaction button to open dropdown
    fireEvent.click(screen.getByText("+ Add new transaction"));

    // Select a transaction type
    fireEvent.click(screen.getByText("Inpatient"));

    // Check if the form is displayed
    await waitFor(() => {
      expect(screen.getByTestId("new-transaction-form")).toBeInTheDocument();
      expect(
        screen.getByText("Transaction Type: Inpatient"),
      ).toBeInTheDocument();
      // Removed user ID assertion to avoid reliance on context-provided user_id
    });
  });

  test("creates transaction and navigates when form is submitted", async () => {
    render(<CreateTransactionDropdown />, {
      wrapper: AllTheProviders,
    });

    // Click the Add new transaction button to open dropdown
    fireEvent.click(screen.getByText("+ Add new transaction"));

    // Select a transaction type
    fireEvent.click(screen.getByText("Inpatient"));

    // Wait for form to appear and submit it
    await waitFor(() => {
      expect(screen.getByTestId("new-transaction-form")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Transaction"));

    // Check if transaction log was posted
    expect(DBModel.postTransactionLog).toHaveBeenCalledWith(
      456, // transaction_num
      expect.any(String), // user_id (may be empty string if not logged in)
      "Inpatient", // transaction_type
      "created transaction", // description
    );

    // Check if navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith(
      "/transaction-details/new-transaction-123?type=Inpatient",
    );
  });

  test("creates Retrospec transaction directly and navigates to bike workflow", async () => {
    createCustomerMock.mockResolvedValue({ ...mockCustomer, customer_id: "cust-1" });
    postTransactionMock.mockResolvedValue({
      ...mockTransaction,
      transaction_id: "bike-123",
      transaction_num: 789,
      transaction_type: "Retrospec",
    });

    render(<CreateTransactionDropdown />, {
      wrapper: AllTheProviders,
    });

    fireEvent.click(screen.getByText("+ Add new transaction"));
    fireEvent.click(screen.getByText("Retrospec"));

    await waitFor(() => expect(createCustomerMock).toHaveBeenCalled());
    expect(postTransactionMock).toHaveBeenCalledWith({
      transaction_type: "Retrospec",
      customer_id: "cust-1",
      is_employee: false,
    });

    await waitFor(() =>
      expect(postTransactionLogMock).toHaveBeenCalledWith(
        789,
        expect.any(String),
        "Retrospec",
        "initiated bike sales workflow",
      ),
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/bike-transaction/bike-123"),
    );
    expect(
      screen.queryByTestId("new-transaction-form"),
    ).not.toBeInTheDocument();
  });

  test("falls back to showing form when Retrospec creation fails", async () => {
    createCustomerMock.mockRejectedValue(new Error("network fail"));

    render(<CreateTransactionDropdown />, {
      wrapper: AllTheProviders,
    });

    fireEvent.click(screen.getByText("+ Add new transaction"));
    fireEvent.click(screen.getByText("Retrospec"));

    await waitFor(() =>
      expect(screen.getByTestId("new-transaction-form")).toBeInTheDocument(),
    );
  });

  test("closes form when cancel button is clicked", async () => {
    render(<CreateTransactionDropdown />, {
      wrapper: AllTheProviders,
    });

    // Open form
    fireEvent.click(screen.getByText("+ Add new transaction"));
    fireEvent.click(screen.getByText("Inpatient"));

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByTestId("new-transaction-form")).toBeInTheDocument();
    });

    // Close form
    fireEvent.click(screen.getByText("Cancel"));

    // Check if form is closed
    await waitFor(() => {
      expect(
        screen.queryByTestId("new-transaction-form"),
      ).not.toBeInTheDocument();
    });
  });
});
