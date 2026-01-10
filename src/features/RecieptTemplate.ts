interface Item {
  name: string;
  standard_price: number;
}

interface Repair {
  name: string;
  price: number;
}

interface ReceiptParams {
  transaction_num: number;
  items?: Item[];
  repairs?: Repair[];
}

const SALES_TAX = 1.0825;

/**
 * Generates an HTML-formatted receipt with items, repairs, and totals
 * @param params Receipt parameters including transaction number, items, and repairs
 * @returns HTML-formatted receipt string ready to paste into Gmail
 */
export function generateReceiptHTML(params: ReceiptParams): string {
  const { items = [], repairs = [] } = params;
  // Calculate totals (repairs are stored in cents, convert to dollars)
  const subtotal =
    items.reduce((sum, item) => sum + item.standard_price, 0) +
    repairs.reduce((sum, repair) => sum + repair.price / 100, 0);

  const total = subtotal * SALES_TAX;
  const salesTax = total - subtotal;

  // Build receipt HTML
  let receipt = `<p><strong>ITEMS:</strong><br>`;
  if (items.length > 0) {
    items.forEach((item) => {
      receipt += `&nbsp;&nbsp;• <em>${item.name.trim()}</em> - <strong>$${item.standard_price.toFixed(2)}</strong><br>`;
    });
  } else {
    receipt += `&nbsp;&nbsp;No items<br>`;
  }
  receipt += `</p>`;

  receipt += `<p><strong>REPAIRS:</strong><br>`;
  if (repairs.length > 0) {
    repairs.forEach((repair) => {
      receipt += `&nbsp;&nbsp;• <em>${repair.name.trim()}</em> - <strong>$${(repair.price / 100).toFixed(2)}</strong><br>`;
    });
  } else {
    receipt += `&nbsp;&nbsp;No repairs<br>`;
  }
  receipt += `</p>`;

  receipt += `<p>Sales Tax: <strong>$${salesTax.toFixed(2)}</strong><br>`;
  receipt += `<strong>TOTAL: $${total.toFixed(2)}</strong></p>`;
  receipt += `</div>`;

  return receipt;
}

/**
 * Copies HTML content to the clipboard using the modern async Clipboard API when possible,
 * falling back to the legacy execCommand approach for environments (notably Gmail) that still
 * rely on it. The fallback is retained because Gmail aggressively strips formatting copied with
 * writeText, but execCommand remains functional there despite being deprecated in most browsers.
 */
export async function copyHTMLToClipboard(html: string): Promise<void> {
  const clipboard = navigator.clipboard;

  if (clipboard?.write && typeof ClipboardItem !== "undefined") {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([html], { type: "text/plain" }),
      });
      await clipboard.write([item]);
      return;
    
  }

  if (clipboard?.writeText) {
      await clipboard.writeText(html);
      return;

  }

  if (typeof document.execCommand !== "function") {
    throw new Error("Clipboard API is unavailable");
  }

  await new Promise<void>((resolve, reject) => {
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "fixed";
    tempDiv.style.left = "-9999px";
    tempDiv.contentEditable = "true";
    tempDiv.innerHTML = html;

    document.body.appendChild(tempDiv);

    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    try {
      if (document.execCommand("copy")) {
        resolve();
      } else {
        reject(new Error("Copy command failed"));
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Copy command failed"));
    } finally {
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);
    }
  });
}
