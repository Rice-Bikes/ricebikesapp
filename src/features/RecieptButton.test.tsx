import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CopyReceiptButton from "./RecieptButton";
import { generateReceiptHTML, copyHTMLToClipboard } from "./RecieptTemplate";
import { toast } from "react-toastify";
import type { Transaction } from "../model";

vi.mock("./RecieptTemplate", () => ({
  generateReceiptHTML: vi.fn(() => "<strong>receipt</strong>"),
  copyHTMLToClipboard: vi.fn(() => Promise.resolve()),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedGenerateHTML = vi.mocked(generateReceiptHTML);
const mockedCopyHTML = vi.mocked(copyHTMLToClipboard);
const mockedToast = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

const baseTransaction: Transaction = {
  transaction_id: "tx-1",
  transaction_num: 101,
  date_created: new Date().toISOString(),
  customer_id: "customer-1",
  transaction_type: "retail",
  total_cost: 0,
  description: "",
  is_completed: false,
  is_paid: false,
  is_refurb: false,
  is_urgent: false,
  is_nuclear: null,
  is_beer_bike: false,
  is_employee: false,
  is_reserved: false,
  is_waiting_on_email: false,
  date_completed: null,
} as Transaction;

describe("CopyReceiptButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGenerateHTML.mockClear();
    mockedCopyHTML.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("copies the generated receipt and shows success state", async () => {
    render(
      <CopyReceiptButton
        transactionData={baseTransaction}
        items={[]}
        repairs={[]}
      />,
    );

    const button = screen.getByRole("button", { name: /Generate Receipt/i });
    fireEvent.click(button);

    await waitFor(() =>
      expect(mockedCopyHTML).toHaveBeenCalledWith("<strong>receipt</strong>"),
    );
    expect(mockedGenerateHTML).toHaveBeenCalledWith({
      transaction_num: baseTransaction.transaction_num,
      items: [],
      repairs: [],
    });

    await waitFor(() => expect(button.textContent).toContain("✓ Copied"));
    expect(mockedToast.success).toHaveBeenCalledWith(
      "Receipt copied! Now paste (Ctrl+V or Cmd+V) into Gmail.",
    );

    await waitFor(
      () => expect(button.textContent).toContain("Generate Receipt"),
      { timeout: 4000 },
    );
  });

  it("shows an error toast when copy fails", async () => {
    mockedCopyHTML.mockRejectedValueOnce(new Error("fail"));

    render(
      <CopyReceiptButton
        transactionData={baseTransaction}
        items={[]}
        repairs={[]}
      />,
    );

    const button = screen.getByRole("button", { name: /Generate Receipt/i });
    fireEvent.click(button);

    await waitFor(() =>
      expect(mockedToast.error).toHaveBeenCalledWith("Failed to copy receipt"),
    );
    expect(button.textContent).toContain("Generate Receipt");
  });
});
