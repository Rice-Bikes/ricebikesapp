/**
 * Helper to extract the TransactionsTable external filter logic so it can be
 * unit tested independently of the React component and AG Grid environment.
 */

import type { IRowNode } from "ag-grid-community";
import type { Transaction } from "../../model";
import { isDaysLess } from "./TransactionsTable.utils";

/**
 * Returns true when the provided row node should be included in the grid
 * for the given `viewType` and `searchText` (the same logic used by the component).
 */
export function passesExternalFilter(
  node: IRowNode,
  viewType: string,
  searchText: string,
): boolean {
  const transaction = node?.data?.Transaction as Transaction | undefined;
  if (!transaction) return false;

  const isRetrospec =
    transaction.transaction_type != null &&
    transaction.transaction_type.toLowerCase() === "retrospec";

  const matchesView =
    (viewType === "retrospec" &&
      isRetrospec &&
      transaction?.is_paid === false) ||
    (viewType === "pickup" &&
      transaction?.is_paid === false &&
      transaction?.is_completed === true &&
      transaction?.is_refurb === false &&
      transaction.transaction_type != null &&
      !isRetrospec &&
      !isDaysLess(183, new Date(transaction.date_created ?? ""), new Date())) ||
    (viewType === "paid" && transaction?.is_paid === true) ||
    (viewType === "completed" && transaction?.is_completed === true) ||
    (viewType === "main" &&
      // Include regular non-retrospec transactions that are incomplete
      ((transaction?.is_completed === false &&
        transaction.transaction_type != null &&
        !isRetrospec &&
        (transaction?.is_employee === false ||
          (transaction?.is_employee === true &&
            transaction?.is_beer_bike === true)) &&
        transaction?.is_refurb === false) ||
        // Include retrospec transactions that are actively being built (is_refurb = true)
        (isRetrospec &&
          transaction?.is_refurb === true &&
          !transaction?.is_completed &&
          !transaction?.is_waiting_on_email))) ||
    (viewType === "employee" &&
      transaction?.is_employee === true &&
      transaction?.is_completed === false &&
      transaction?.is_beer_bike === false &&
      transaction.transaction_type != null &&
      !isRetrospec &&
      transaction?.is_refurb === false) ||
    (viewType === "refurb" &&
      transaction?.is_refurb === true &&
      transaction?.is_paid === false &&
      transaction?.is_completed === false &&
      transaction.transaction_type != null &&
      !isRetrospec) ||
    (viewType === "beer bike" &&
      transaction?.is_beer_bike === true &&
      isDaysLess(364, new Date(transaction?.date_created ?? ""), new Date()));

  if (!matchesView) return false;

  // Apply search filter only for "completed" view
  if (viewType === "completed" && searchText.trim() !== "") {
    const searchLower = searchText.toLowerCase();
    const transactionNum = transaction?.transaction_id?.toString() || "";
    const customerName = (node.data?.Customer?.name || "").toLowerCase();
    const email = (node.data?.Customer?.email || "").toLowerCase();
    const phone = (node.data?.Customer?.phone || "").toLowerCase();

    return (
      transactionNum.includes(searchLower) ||
      customerName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
    );
  }

  return true;
}

/**
 * Mirrors the original component's simple function for whether an external
 * filter is present. Exported so it can be asserted in tests if needed.
 */
export function isExternalFilterPresent(): boolean {
  return true;
}
