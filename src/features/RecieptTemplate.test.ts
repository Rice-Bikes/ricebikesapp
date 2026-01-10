import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { generateReceiptHTML, copyHTMLToClipboard } from "./RecieptTemplate";

describe("generateReceiptHTML", () => {
  it("formats items, repairs and totals", () => {
    const html = generateReceiptHTML({
      transaction_num: 42,
      items: [
        { name: " Road Bike   ", standard_price: 899.5 },
        { name: "Helmet", standard_price: 75 },
      ],
      repairs: [{ name: "Brake bleed", price: 1250 }],
    });

    expect(html).toContain("<strong>ITEMS:</strong>");
    expect(html).toContain("Road Bike");
    expect(html).toContain("$899.50");
    expect(html).toContain("Brake bleed");
    // Subtotal = 899.50 + 75 + 12.50 = 987.00, tax at 8.25% adds ≈81.43 => total ≈1068.43
    expect(html).toContain("Sales Tax: <strong>$81.43</strong>");
    expect(html).toContain("TOTAL: $1068.43");
  });

  it("renders fallback content when there are no items or repairs", () => {
    const html = generateReceiptHTML({ transaction_num: 7, items: [], repairs: [] });

    expect(html).toContain("No items");
    expect(html).toContain("No repairs");
    expect(html).toContain("Sales Tax: <strong>$0.00</strong>");
    expect(html).toContain("TOTAL: $0.00");
  });
});

describe("copyHTMLToClipboard", () => {
  let originalClipboardDescriptor: PropertyDescriptor | undefined;
  let originalExecCommandDescriptor: PropertyDescriptor | undefined;
  let execCommandStub: ReturnType<typeof vi.fn>;

  const setClipboard = (value: Partial<Clipboard> | undefined) => {
    if (typeof value === "undefined") {
      Reflect.deleteProperty(
        navigator as unknown as Record<string, unknown>,
        "clipboard",
      );
      return;
    }

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value,
    });
  };

  beforeEach(() => {
    originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );

    originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(
      document,
      "execCommand",
    );

    execCommandStub = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommandStub,
    });
  });

  afterEach(() => {
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", originalClipboardDescriptor);
    } else {
      Reflect.deleteProperty(
        navigator as unknown as Record<string, unknown>,
        "clipboard",
      );
    }

    Reflect.deleteProperty(globalThis as Record<string, unknown>, "ClipboardItem");

    if (originalExecCommandDescriptor) {
      Object.defineProperty(document, "execCommand", originalExecCommandDescriptor);
    } else {
      Reflect.deleteProperty(document, "execCommand");
    }
  });

  it("uses the async Clipboard API when available", async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined) as unknown as Clipboard["write"];
    const writeTextMock = vi.fn() as unknown as Clipboard["writeText"];

    setClipboard({ write: writeMock, writeText: writeTextMock });

    const clipboardItemMock = vi
      .fn()
      .mockImplementation((input: Record<string, Blob>) => ({ input }));
    Object.defineProperty(globalThis, "ClipboardItem", {
      configurable: true,
      value: clipboardItemMock,
    });

    await expect(copyHTMLToClipboard("<p>Test</p>")).resolves.toBeUndefined();

    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(clipboardItemMock).toHaveBeenCalledWith({
      "text/html": expect.any(Blob),
      "text/plain": expect.any(Blob),
    });
    expect(writeTextMock).not.toHaveBeenCalled();
    expect(execCommandStub).not.toHaveBeenCalled();
  });

  it("falls back to writeText when ClipboardItem is unavailable", async () => {
    const writeMock = vi.fn() as unknown as Clipboard["write"];
    const writeTextMock = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as Clipboard["writeText"];

    setClipboard({ write: writeMock, writeText: writeTextMock });

    await expect(copyHTMLToClipboard("<p>Fallback</p>")).resolves.toBeUndefined();

    expect(writeMock).not.toHaveBeenCalled();
    expect(writeTextMock).toHaveBeenCalledWith("<p>Fallback</p>");
    expect(execCommandStub).not.toHaveBeenCalled();
  });

  it("falls back to execCommand when Clipboard APIs are unavailable", async () => {
    setClipboard(undefined);

    const initialChildren = document.body.childElementCount;

    await expect(copyHTMLToClipboard("<p>Legacy</p>")).resolves.toBeUndefined();

    expect(execCommandStub).toHaveBeenCalledWith("copy");
    expect(document.body.childElementCount).toBe(initialChildren);
  });

  it("rejects when the copy command fails", async () => {
    setClipboard(undefined);
    execCommandStub.mockReturnValue(false);

    await expect(copyHTMLToClipboard("<p>Fail</p>")).rejects.toThrow(
      "Copy command failed",
    );
  });
});
