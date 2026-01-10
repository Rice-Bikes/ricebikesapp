import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomerReservation } from "./CustomerReservation";
import { toast } from "react-toastify";
import type { Customer, Transaction, Bike } from "../model";

vi.setConfig({ testTimeout: 15000 });

const modelMocks = vi.hoisted(() => ({
    fetchCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    updateTransaction: vi.fn(),
    updateBike: vi.fn(),
}));

vi.mock("../model", () => ({
    __esModule: true,
    default: {
        fetchCustomers: modelMocks.fetchCustomers,
        updateCustomer: modelMocks.updateCustomer,
        updateTransaction: modelMocks.updateTransaction,
        updateBike: modelMocks.updateBike,
    },
}));

vi.mock("react-toastify", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockedToast = vi.mocked(toast);
const {
    fetchCustomers: fetchCustomersMock,
    updateCustomer: updateCustomerMock,
    updateTransaction: updateTransactionMock,
    updateBike: updateBikeMock,
} = modelMocks;

const baseTransaction = {
    transaction_id: "tx-1",
    transaction_type: "retail",
    bike_id: "bike-1",
    total_cost: 150,
    description: "",
    is_completed: false,
    is_paid: false,
    is_refurb: false,
    is_urgent: false,
    is_nuclear: false,
    is_beer_bike: false,
    is_reserved: false,
    is_waiting_on_email: false,
    date_completed: null,
    Customer: null,
    Bike: null,
    OrderRequests: [],
} as unknown as Transaction;

const createTestClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

describe("CustomerReservation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders reserved state and unreserves the bike", async () => {
        const mockCustomer = {
            customer_id: "cust-1",
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
            phone: "555-1234",
        } as unknown as Customer;

        fetchCustomersMock.mockResolvedValue([mockCustomer]);
        updateTransactionMock.mockResolvedValue({} as Transaction);
        updateBikeMock.mockResolvedValue({} as Bike);

        const client = createTestClient();

        render(
            <QueryClientProvider client={client}>
                <CustomerReservation
                    transaction_id="tx-1"
                    transaction={{
                        ...baseTransaction,
                        is_reserved: true,
                        Customer: mockCustomer,
                    } as unknown as Transaction}
                />
            </QueryClientProvider>,
        );

        expect(await screen.findByText(/Reserved for Jane Smith/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Remove Reservation/i }));

        await waitFor(() =>
            expect(updateTransactionMock).toHaveBeenCalledWith(
                "tx-1",
                expect.objectContaining({ is_reserved: false }),
            ),
        );

        await waitFor(() =>
            expect(updateBikeMock).toHaveBeenCalledWith(
                "bike-1",
                expect.objectContaining({ is_available: true }),
            ),
        );

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /Reserve for Customer/i })).toBeInTheDocument(),
        );
    });

    it("confirms deposit for existing customer and reserves the bike", async () => {
        const existingCustomer = {
            customer_id: "cust-2",
            first_name: "Alex",
            last_name: "Rider",
            email: "alex@sample.com",
            phone: "555-9876",
        } as unknown as Customer;

        fetchCustomersMock.mockResolvedValue([existingCustomer]);
        updateTransactionMock.mockResolvedValue({} as Transaction);
        updateBikeMock.mockResolvedValue({} as Bike);
        updateCustomerMock.mockResolvedValue(existingCustomer);

        const client = createTestClient();

        render(
            <QueryClientProvider client={client}>
                <CustomerReservation
                    transaction_id="tx-1"
                    transaction={baseTransaction}
                />
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole("button", { name: /Reserve for Customer/i }));

        const emailInput = await screen.findByLabelText(/Email Address/i);
        fireEvent.change(emailInput, { target: { value: existingCustomer.email } });
        fireEvent.keyDown(emailInput, { key: "ArrowDown" });
        fireEvent.keyDown(emailInput, { key: "Enter" });

        await waitFor(() =>
            expect(screen.getByDisplayValue(existingCustomer.first_name)).toBeInTheDocument(),
        );

        const reserveButton = screen.getByRole("button", { name: /Reserve Bike for Customer/i });
        fireEvent.click(reserveButton);

        expect(await screen.findByText(/Confirm Deposit Charge/)).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: /Confirm \$50 Deposit & Reserve/i }),
        );

        await waitFor(() => expect(updateCustomerMock).toHaveBeenCalled());
        await waitFor(() => expect(updateTransactionMock).toHaveBeenCalled());
        await waitFor(() =>
            expect(mockedToast.success).toHaveBeenCalledWith(
                "Bike reserved for Alex Rider",
            ),
        );

        expect(await screen.findByText(/Reserved for Alex Rider/)).toBeInTheDocument();
    });
});
