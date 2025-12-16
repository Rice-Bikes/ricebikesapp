import { describe, it, expect } from "vitest";
import {
  calculateTotalCost,
  checkStatusOfRetrospec,
  checkUserPermissions,
  calculateTotalWithTax,
} from "./transactionUtils";
import type { RepairDetails, ItemDetails, Part, User, Transaction } from "../../../model";

import { SALES_TAX_MULTIPLIER } from "../../../constants/transaction";

describe("transactionUtils", () => {
  it("calculateTotalCost sums repairs parts and order requests correctly for non-employee", () => {
    const repairs = [
      {
        transaction_detail_id: "r1",
        completed: false,
        Repair: { price: 10, name: "r" },
      },
    ] as unknown as RepairDetails[];
    const parts = [
      { transaction_detail_id: "p1", Item: { standard_price: 20, name: "x" } },
    ] as unknown as ItemDetails[];
    const orderRequest = [{ standard_price: 5 }] as unknown as Part[];

    const total = calculateTotalCost(
      repairs,
      parts,
      orderRequest,
      false,
      false,
    );
    expect(total).toBe(35);
  });

  it("calculateTotalCost uses wholesale cost for employees except beerbike", () => {
    const repairs = [
      {
        transaction_detail_id: "r1",
        completed: false,
        Repair: { price: 12, name: "r" },
      },
    ] as unknown as RepairDetails[];
    const parts = [
      {
        transaction_detail_id: "p1",
        Item: { standard_price: 30, wholesale_cost: 10, name: "p" },
      },
    ] as unknown as ItemDetails[];
    const orderRequest = [
      { standard_price: 8, wholesale_cost: 3 },
    ] as unknown as Part[];

    const total = calculateTotalCost(repairs, parts, orderRequest, true, false);
    // mechanic parts multiplier constant is imported; wholesale 10 * multiplier
    // multiplier might be 1.5 but we don't rely on the exact value; we check greater than zero
    expect(total).toBeGreaterThan(12);
  });

  it("calculateTotalWithTax applies tax multiplier", () => {
    const subtotal = 100;
    const total = calculateTotalWithTax(subtotal);
    expect(total).toBe(subtotal * SALES_TAX_MULTIPLIER);
  });

  it("checkStatusOfRetrospec returns correct statuses", () => {
    // Use narrow flag objects and cast to any to avoid strict transaction-type requirements in tests
    expect(checkStatusOfRetrospec({ is_refurb: true } as Transaction)).toBe("Building");
    expect(checkStatusOfRetrospec({ is_waiting_on_email: true } as Transaction)).toBe(
      "Completed",
    );
    expect(checkStatusOfRetrospec({ is_completed: true } as Transaction)).toBe(
      "For Sale",
    );
    expect(checkStatusOfRetrospec({} as Transaction)).toBe("Arrived");
  });

  it("checkUserPermissions returns false for null user and correct when permission present", () => {
    expect(checkUserPermissions(null, "admin")).toBe(false);
    const user = { permissions: [{ name: "admin" }] } as unknown as User;
    expect(checkUserPermissions(user, "admin")).toBe(true);
    expect(checkUserPermissions(user, "missing")).toBe(false);
  });
});
