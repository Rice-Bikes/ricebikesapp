import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ItemPageModal from "./ItemPage";
import { AllTheProviders } from "../test-utils";
import { queryClient } from "../app/queryClient";
import { toast } from "react-toastify";
import type { Part } from "../model";

vi.setConfig({ testTimeout: 15000 });

const modelMocks = vi.hoisted(() => ({
    fetchItemCategory: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
}));

vi.mock("../model", () => ({
    __esModule: true,
    default: {
        fetchItemCategory: modelMocks.fetchItemCategory,
        createItem: modelMocks.createItem,
        updateItem: modelMocks.updateItem,
    },
}));

vi.mock("react-toastify", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const toastSuccessMock = toast.success as unknown as vi.Mock;
const toastErrorMock = toast.error as unknown as vi.Mock;
const { fetchItemCategory, createItem, updateItem } = modelMocks;

const baseItem = {
    item_id: "item-1",
    upc: "123456789012",
    name: "Road Bike",
    brand: "Acme",
    description: "Fast road bike",
    standard_price: 1200,
    wholesale_cost: 600,
    category_1: "Bikes",
    category_2: "Road",
    category_3: "",
    stock: 2,
    minimum_stock: 1,
    managed: true,
    condition: "new",
    disabled: false,
    specifications: {},
    features: [],
} as unknown as Part;

describe("ItemPageModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchItemCategory.mockResolvedValue([]);
        createItem.mockResolvedValue(baseItem);
        updateItem.mockResolvedValue(baseItem);
    });

    afterEach(() => {
        queryClient.clear();
    });

    it("shows item details in view mode and toggles to edit", async () => {
        const onClose = vi.fn();

        render(
            <AllTheProviders>
                <ItemPageModal open onClose={onClose} item={baseItem} />
            </AllTheProviders>,
        );

        expect(
            await screen.findByText(/UPC: 123456789012/),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Edit/i }));

        expect(await screen.findByRole("button", { name: /Save/i })).toBeInTheDocument();
    });

    it("reports validation errors when required fields missing", async () => {
        render(
            <AllTheProviders>
                <ItemPageModal open onClose={vi.fn()} />
            </AllTheProviders>,
        );

        fireEvent.click(await screen.findByRole("button", { name: /Save/i }));

        await waitFor(() =>
            expect(toastErrorMock).toHaveBeenCalledWith(
                "Please fill out all required fields correctly.",
            ),
        );
        expect(createItem).not.toHaveBeenCalled();
    });

    it("submits new item data and notifies success", async () => {
        const onClose = vi.fn();
        const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

        render(
            <AllTheProviders>
                <ItemPageModal open onClose={onClose} />
            </AllTheProviders>,
        );

        const user = userEvent.setup();

        const nameInput = await screen.findByRole("textbox", { name: /Item Name/i });
        const brandInput = screen.getByRole("textbox", { name: /Brand/i });
        const upcInput = screen.getByRole("textbox", { name: /^UPC$/i });
        const descriptionInput = screen.getByRole("textbox", { name: /Description/i });
        const priceInput = screen.getByRole("spinbutton", { name: /Standard Price/i });
        const wholesaleInput = screen.getByRole("spinbutton", { name: /Wholesale Cost/i });
        const stockInput = screen.getByRole("spinbutton", { name: /^Stock$/i });
        const minStockInput = screen.getByRole("spinbutton", { name: /Minimum Stock/i });

        await user.clear(nameInput);
        await user.type(nameInput, "Helmet");
        await user.type(brandInput, "ProtectCo");
        await user.clear(upcInput);
        await user.type(upcInput, "999999999999");
        await user.type(descriptionInput, "Lightweight helmet");
        await user.clear(priceInput);
        await user.type(priceInput, "120");
        await user.clear(wholesaleInput);
        await user.type(wholesaleInput, "60");
        await user.clear(stockInput);
        await user.type(stockInput, "5");
        await user.clear(minStockInput);
        await user.type(minStockInput, "1");

        fireEvent.click(screen.getByRole("button", { name: /Save/i }));

        await waitFor(() => expect(createItem).toHaveBeenCalled());
        await waitFor(() =>
            expect(toastSuccessMock).toHaveBeenCalledWith("Item saved successfully"),
        );
        expect(onClose).toHaveBeenCalled();
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["items"] });
    }, 15000);
});
