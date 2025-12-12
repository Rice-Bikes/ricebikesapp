import {
  SALES_TAX_MULTIPLIER,
  MECHANIC_PART_MULTIPLIER,
} from "../../../constants/transaction";
import { Transaction, RepairDetails, ItemDetails, Part, User } from "../../../model";

const debug: boolean = import.meta.env.VITE_DEBUG;

/**
 * Calculate the total cost of a transaction including repairs, parts, and order requests
 */
export const calculateTotalCost = (
  repairs: RepairDetails[],
  parts: ItemDetails[],
  orderRequest: Part[],
  isEmployee: boolean,
  isBeerBike: boolean,
): number => {
  let total = 0;

  if (repairs) {
    repairs.forEach((repair) => {
      total += repair.Repair.price;
    });
  }

  if (parts) {
    parts.forEach((part) => {
      total +=
        !isEmployee || isBeerBike
          ? part.Item.standard_price
          : part.Item.wholesale_cost * MECHANIC_PART_MULTIPLIER;
    });
  }

  if (orderRequest) {
    if (debug) {
      console.log("calculating order request cost: ", orderRequest, total);
    }
    (orderRequest ?? []).forEach((part) => {
      total +=
        !isEmployee || isBeerBike
          ? part.standard_price
          : part.wholesale_cost * MECHANIC_PART_MULTIPLIER;
    });
  }

  if (debug) console.log("total cost: ", total);
  return total;
};

/**
 * Check the current status of a Retrospec transaction
 */
export const checkStatusOfRetrospec = (transaction: Transaction): string => {
  if (transaction.is_refurb) {
    return "Building";
  } else if (transaction.is_waiting_on_email) {
    return "Completed";
  } else if (transaction.is_completed) {
    return "For Sale";
  }
  return "Arrived";
};

/**
 * Check if a user has a specific permission
 */
export const checkUserPermissions = (
  user: User | null,
  permissionName: string,
): boolean => {
  if (user === null) return false;
  if (debug) console.log("checking permission: ", permissionName);
  const permissions = user.permissions?.find(
    (perm) => perm.name === permissionName,
  );
  return permissions ? true : false;
};

/**
 * Calculate total with sales tax applied
 */
export const calculateTotalWithTax = (subtotal: number): number => {
  return subtotal * SALES_TAX_MULTIPLIER;
};
