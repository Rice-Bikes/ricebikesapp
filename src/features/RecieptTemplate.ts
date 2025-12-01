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
 * Copies HTML content to clipboard in a way that works with Gmail
 * Uses the old-school execCommand method which Gmail recognizes
 */
export function copyHTMLToClipboard(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a temporary element
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "fixed";
    tempDiv.style.left = "-9999px";
    tempDiv.contentEditable = "true";
    tempDiv.innerHTML = html;

    document.body.appendChild(tempDiv);

    // Select the content
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    try {
      // Copy using execCommand (works better with Gmail)
      const successful = document.execCommand("copy");
      if (successful) {
        resolve();
      } else {
        reject(new Error("Copy command failed"));
      }
    } catch (err) {
      reject(err);
    } finally {
      // Clean up
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);
    }
  });
}
