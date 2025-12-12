import { queryOptions } from "@tanstack/react-query";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  $Compiler,
  wrapCompilerAsTypeGuard,
  FromSchema,
} from "json-schema-to-ts";
import {
  partSchema,
  partArraySchema,
  partResponseSchema,
  CustomerSchema,
  BikeSchema,
  UpdateBikeSchema,
  TransactionSchema,
  repairArraySchema,
  repairSchema,
  repairResponseSchema,
  TransactionArraySchema,
  ArrayResponseSchema,
  ObjectResponseSchema,
  TransactionDetailsSchema,
  TransactionDetailsArraySchema,
  RepairDetailsSchema,
  ItemDetailsSchema,
  CreateTransactionSchema,
  CreateCustomerSchema,
  updateTransactionSchema,
  TransactionSummarySchema,
  UserSchema,
  OrderRequestSchema,
  CreateOrderRequestsSchema,
  TransactionLogSchema,
  TransactionLogArraySchema,
  CreatePartSchema,
  RoleSchema,
  PermissionsSchema,
  FeatureFlagSchema,
  OrderSchema,
  CreateOrderSchema,
  GetOrderSchema,
  WorkflowStepSchema,
  WorkflowStepsArraySchema,
  WorkflowProgressSchema,
  CreateWorkflowSchema,
} from "./schema";
import { IRow } from "./features/TransactionsTable/TransactionsTable";
import { queryClient } from "./app/queryClient";

export const hostname = import.meta.env.VITE_API_URL;

export type Part = FromSchema<typeof partSchema>;
export type ItemDetails = FromSchema<typeof ItemDetailsSchema>;
export type Repair = FromSchema<typeof repairSchema>;
export type RepairDetails = FromSchema<typeof RepairDetailsSchema>;
export type Transaction = FromSchema<typeof TransactionSchema>;
export type TransactionDetails = FromSchema<typeof TransactionDetailsSchema>;
export type CreateTransaction = FromSchema<typeof CreateTransactionSchema>;
export type UpdateTransaction = FromSchema<typeof updateTransactionSchema>;
export type TransactionSummary = FromSchema<typeof TransactionSummarySchema>;
export type Customer = FromSchema<typeof CustomerSchema>;
export type CreateCustomer = FromSchema<typeof CreateCustomerSchema>;
export type Bike = FromSchema<typeof BikeSchema>;
export type UpdateBike = FromSchema<typeof UpdateBikeSchema>;
export type User = FromSchema<typeof UserSchema>;
export type Role = FromSchema<typeof RoleSchema>;
export type Permission = FromSchema<typeof PermissionsSchema>;
export type OrderRequest = FromSchema<typeof OrderRequestSchema>;
export type CreateOrderRequests = FromSchema<typeof CreateOrderRequestsSchema>;
export type CreatePart = FromSchema<typeof CreatePartSchema>;
export type FeatureFlag = FromSchema<typeof FeatureFlagSchema>;
export type Order = FromSchema<typeof OrderSchema>;
export type CreateOrder = FromSchema<typeof CreateOrderSchema>;
export type GetOrder = FromSchema<typeof GetOrderSchema>;
export type WorkflowStep = FromSchema<typeof WorkflowStepSchema>;
export type WorkflowProgress = FromSchema<typeof WorkflowProgressSchema>;
export type CreateWorkflow = FromSchema<typeof CreateWorkflowSchema>;

export type PartArray = FromSchema<typeof partArraySchema>;
export type RepairArray = FromSchema<typeof repairArraySchema>;
export type TransactionArray = FromSchema<typeof TransactionArraySchema>;
export type TransactionDetailsArray = FromSchema<
  typeof TransactionDetailsArraySchema
>;
export type TransactionLogArray = FromSchema<typeof TransactionLogArraySchema>;
export type TransactionLog = FromSchema<typeof TransactionLogSchema>;
export type WorkflowStepsArray = FromSchema<typeof WorkflowStepsArraySchema>;

export type PartResponse = FromSchema<typeof partResponseSchema>;
export type RepairResponse = FromSchema<typeof repairResponseSchema>;
export type ArrayResponse = FromSchema<typeof ArrayResponseSchema>;
export type ObjectResponse = FromSchema<typeof ObjectResponseSchema>;

type TransactionDetailType = "item" | "repair";

export interface ExtractedRow {
  lineNumber: string;
  quantity: string;
  ordered: string;
  partNumber: string;
  description: string;
  unit: string;
  price: string;
  discount: string;
  total: string;
}

/**
 * The `DBModel` class provides methods for fetching and validating data from the server.
 * It includes methods for fetching transactions, items, and repairs, as well as methods for validating
 * the structure of the data received from the server.
 *
 * @class DBModel
 *
 * @method static initialize
 * Initializes the validation methods using AJV schemas.
 *
 * @method static fetchTransactions
 * Fetches transactions from the server and validates the response.
 * @param {number} page_limit - The number of transactions to fetch per page.
 * @param {boolean} aggregate - Whether to aggregate the transactions.
 * @returns {Promise<any[]>} - A promise that resolves to an array of validated transactions.
 *
 * @method static fetchItems
 * Fetches items from the server and validates the response.
 * @returns {Promise<any[]>} - A promise that resolves to an array of validated items.
 *
 * @method static fetchRepairs
 * Fetches repairs from the server and validates the response.
 * @returns {Promise<any[]>} - A promise that resolves to an array of validated repairs.
 *
 * @method static getTransactionsQuery
 * Returns a query configuration object for fetching transactions.
 * @param {number} page_limit - The number of transactions to fetch per page.
 * @param {boolean} aggregate - Whether to aggregate the transactions.
 * @returns {object} - The query configuration object.
 *
 * @method static getItemsQuery
 * Returns a query configuration object for fetching items.
 * @returns {object} - The query configuration object.
 *
 * @method static getRepairsQuery
 * Returns a query configuration object for fetching repairs.
 * @returns {object} - The query configuration object.
 */
class DBModel {
  // OBJECT VERIFICATION METHODS
  static validateTransaction: (data: unknown) => data is Transaction;
  static validateCustomer: (data: unknown) => data is Customer;
  static validateBike: (data: unknown) => data is Bike;
  static validateUpdateBike: (data: unknown) => data is UpdateBike;
  static validatePart: (data: unknown) => data is Part;
  static validateRepair: (data: unknown) => data is Repair;
  static validateOrderRequest: (data: unknown) => data is OrderRequest;
  static validateTransactionDetails: (
    data: unknown,
  ) => data is TransactionDetails;
  public static validateRepairDetails: (data: unknown) => data is RepairDetails;
  public static validateItemDetails: (data: unknown) => data is ItemDetails;
  public static validateUser: (data: unknown) => data is User;
  public static validateTransactionLog: (
    data: unknown,
  ) => data is TransactionLog;
  public static validateRole: (data: unknown) => data is Role;
  public static validatePermissions: (data: unknown) => data is Permission;
  public static validateFeatureFlags: (data: unknown) => data is FeatureFlag[];
  public static validateOrder: (data: unknown) => data is Order;
  public static validateWorkflowStep: (data: unknown) => data is WorkflowStep;
  public static validateWorkflowProgress: (
    data: unknown,
  ) => data is WorkflowProgress;
  public static validateWorkflowSteps: (
    data: unknown,
  ) => data is WorkflowStep[];

  // ARRAY VERIFICATION METHODS
  static validatePartsArray: (data: unknown) => data is Part[];
  static validateTransactionsArray: (data: unknown) => data is Transaction[];
  static validateRepairsArray: (data: unknown) => data is Repair[];
  static validateTransactionDetailsArray: (
    data: unknown,
  ) => data is TransactionDetails[] | RepairDetails[] | ItemDetails[];
  static validateTransactionLogArray: (
    data: unknown,
  ) => data is TransactionLog[];

  // RESPONSE VERIFICATION METHODS
  static validateRepairsResponse: (data: unknown) => data is RepairResponse;
  static validatePartsResponse: (data: unknown) => data is PartResponse;
  static validateObjectResponse: (data: unknown) => data is ObjectResponse;
  static validateArrayResponse: (data: unknown) => data is ArrayResponse;
  static validateTransactionSummary: (
    data: unknown,
  ) => data is TransactionSummary;

  static initialize() {
    const ajv = new Ajv();
    addFormats(ajv); // Enables support for 'date-time' and other formats
    const $compile: $Compiler = (schema) => ajv.compile(schema);
    const compile = wrapCompilerAsTypeGuard($compile);

    // OBJECT VERIFICATION METHODS
    DBModel.validateTransaction = compile(TransactionSchema);
    DBModel.validateTransactionSummary = compile(TransactionSummarySchema);
    DBModel.validateCustomer = compile(CustomerSchema);
    DBModel.validateBike = compile(BikeSchema);
    DBModel.validateUpdateBike = compile(UpdateBikeSchema);
    DBModel.validatePart = compile(partSchema);
    DBModel.validateRepair = compile(repairSchema);
    DBModel.validateTransactionDetails = compile(TransactionDetailsSchema);
    DBModel.validateItemDetails = compile(ItemDetailsSchema);
    DBModel.validateRepairDetails = compile(RepairDetailsSchema);
    DBModel.validateUser = compile(UserSchema);
    DBModel.validateOrderRequest = compile(OrderRequestSchema);
    DBModel.validateTransactionLog = compile(TransactionLogSchema);
    DBModel.validateRole = compile(RoleSchema);
    DBModel.validatePermissions = compile(PermissionsSchema);
    DBModel.validateFeatureFlags = compile(FeatureFlagSchema);
    DBModel.validateOrder = compile(OrderSchema);
    DBModel.validateWorkflowStep = compile(WorkflowStepSchema);
    DBModel.validateWorkflowProgress = compile(WorkflowProgressSchema);
    DBModel.validateWorkflowSteps = compile(WorkflowStepsArraySchema);

    // ARRAY VERIFICATION METHODS
    DBModel.validateTransactionsArray = compile(TransactionArraySchema);
    DBModel.validatePartsArray = compile(partArraySchema);
    DBModel.validateRepairsArray = compile(repairArraySchema);
    DBModel.validateTransactionDetailsArray = compile(
      TransactionDetailsArraySchema,
    );

    // RESPONSE VERIFICATION METHODS
    DBModel.validateArrayResponse = compile(ArrayResponseSchema);
    DBModel.validateObjectResponse = compile(ObjectResponseSchema);
    DBModel.validatePartsResponse = compile(partResponseSchema);
    DBModel.validateRepairsResponse = compile(repairResponseSchema);
  }

  /**
   * Fetches transactions from the server.
   *
   * @param page_limit - The maximum number of transactions to fetch per page.
   * @param aggregate - Whether to aggregate the transactions.
   * @returns A promise that resolves to an array of transaction rows, each containing
   *          the transaction, customer, bike, and submission date.
   * @throws Will throw an error if the response is invalid, if the transactions fail to load,
   *         if any transaction or bike or customer is invalid, or if the transactions array is invalid.
   */
  public static fetchTransactions = async (
    page_limit: number,
    aggregate: boolean,
  ) =>
    fetch(
      `${hostname}/transactions?` +
        new URLSearchParams({
          page_limit: page_limit.toString(),
          aggregate: aggregate.toString(),
        }),
    )
      .then((response) => response.json())
      .then((transactionData: unknown) => {
        console.log("Raw Transactions Data:", transactionData);
        if (!DBModel.validateArrayResponse(transactionData)) {
          throw new Error("Invalid transactions response");
        }
        if (!transactionData.success) {
          throw new Error("Failed to load transactions");
        }
        console.log(" Transaction Array Data:", transactionData.responseObject);
        return transactionData.responseObject;
      })
      .then((transactionsData: unknown[]) => {
        console.log("Mapped Parts Data:", transactionsData);
        transactionsData.forEach((part) => {
          if (part && typeof part === "object" && part !== null) {
            const transaction = part as Record<string, unknown>;
            // Only validate essential transaction fields for backwards compatibility
            if (!transaction.transaction_id || !transaction.transaction_num) {
              console.warn(
                "Transaction missing essential fields (transaction_id, transaction_num):",
                part,
              );
              // Don't throw error - just log warning
            }
            // Don't validate the optional fields - they can be null/undefined
          } else if (part !== null) {
            console.warn("Invalid transaction data type:", part);
          }
        });

        // More lenient validation for backwards compatibility
        if (!Array.isArray(transactionsData)) {
          throw new Error("Parts data must be an array");
        }

        // Don't validate each transaction strictly - just ensure it's an array
        console.log(`Processing ${transactionsData.length} transactions`);

        const transactionRowsPromises = transactionsData.map((partData) => {
          const part = partData as Record<string, unknown>;
          const bikeField: unknown = part.Bike;
          if (bikeField !== null) {
            // Coerce string values to numbers for validation
            if (typeof bikeField === "object" && bikeField !== null) {
              // Cast to a more specific type with expected properties
              const bikeCopy = {
                ...(bikeField as Record<string, unknown>),
              } as {
                size_cm?: string | number;
                price?: string | number;
                deposit_amount?: string | number;
              };

              // Convert size_cm from string to number if it's a string
              if (typeof bikeCopy.size_cm === "string") {
                bikeCopy.size_cm = parseFloat(bikeCopy.size_cm);
              }
              // Convert price from string to number if it's a string
              if (typeof bikeCopy.price === "string") {
                bikeCopy.price = parseFloat(bikeCopy.price);
              }
              // Convert deposit_amount from string to number if it's a string
              if (typeof bikeCopy.deposit_amount === "string") {
                bikeCopy.deposit_amount = parseFloat(bikeCopy.deposit_amount);
              }

              if (!DBModel.validateBike(bikeCopy)) {
                console.warn("Invalid bike:", bikeField);
                throw new Error("Invalid bike found");
              }
            } else if (!DBModel.validateBike(bikeField)) {
              console.warn("Invalid bike:", bikeField);
              throw new Error("Invalid bike found");
            }
          }

          if (!DBModel.validateCustomer(part.Customer)) {
            console.error("Invalid customer:", part.Customer);
            throw new Error("Invalid customer found");
          }

          if (part.OrderRequests && part.OrderRequests instanceof Array) {
            for (let i = 0; i < part.OrderRequests.length; i++) {
              if (!DBModel.validateOrderRequest(part.OrderRequests[i])) {
                console.error("Invalid order request:", part.OrderRequests[i]);
                throw new Error("Invalid order request found");
              }
            }
          }
          return {
            Transaction: part,
            Customer: part.Customer,
            Bike: part.Bike,
            OrderRequests: part.OrderRequests ?? [],
            Submitted: new Date((part.date_created as string | number) ?? 0),
          };
        });
        return transactionRowsPromises;
      });

  public static fetchRoles = async () =>
    fetch(`${hostname}/roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.statusCode === 404) {
          console.error("Role not found");
          return [];
        }
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        console.warn(response.responseObject);
        for (const role of response.responseObject) {
          if (!DBModel.validateRole(role)) {
            console.error("Invalid role:", role);
            throw new Error("Invalid role found");
          }
        }
        if (!response.success) {
          throw new Error("Failed to load roles");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error loading roles data: " + error); // More detailed error logging
      });
  public static deleteRole = async (role_id: string) =>
    fetch(`${hostname}/roles/${role_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete role");
        }
      })
      .catch((error) => {
        throw new Error("Error deleting role data: " + error); // More detailed error logging
      });

  public static createRole = async (role: Role): Promise<Role> =>
    fetch(`${hostname}/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(role),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post role");
        }
        if (!DBModel.validateRole(response.responseObject))
          throw new Error("Invalid role response");

        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting role data: " + error); // More detailed error logging
      });
  public static updateRole = async (role: Role) =>
    fetch(`${hostname}/roles/${role.role_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(role),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update role");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error updating role data: " + error); // More detailed error logging
      });

  public static fetchRolesForUser = async (user_id: string) =>
    fetch(`${hostname}/roles/${user_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.statusCode === 404) {
          console.error("Role not found");
          return [];
        }
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load roles");
        }
        for (const role of response.responseObject) {
          if (!DBModel.validateRole(role)) {
            console.error("Invalid role:", role);
            throw new Error("Invalid role found");
          }
        }

        return response.responseObject as Role[];
      })
      .catch((error) => {
        throw new Error("Error loading roles data: " + error); // More detailed error logging
      });
  public static attachRole = async (user_id: string, role_id: string) =>
    fetch(`${hostname}/users/roles/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role_id: role_id, user_id }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to attach role");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error attaching role data: " + error); // More detailed error logging
      });
  public static detachRole = async (user_id: string, role_id: string) =>
    fetch(`${hostname}/users/roles/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role_id, user_id }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to attach role");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error attaching role data: " + error); // More detailed error logging
      });
  public static fetchPermissions = async () =>
    fetch(`${hostname}/permissions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.statusCode === 404) {
          console.error("Permissions not found");
          return [];
        }
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load permissions");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error loading permissions data: " + error); // More detailed error logging
      });
  public static deletePermission = async (permission_id: string) =>
    fetch(`${hostname}/permissions/${permission_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete permission");
        }
      })
      .catch((error) => {
        throw new Error("Error deleting permission data: " + error); // More detailed error logging
      });
  public static createPermission = async (permission: Permission) =>
    fetch(`${hostname}/permissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(permission),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post permission");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting permission data: " + error); // More detailed error logging
      });
  public static updatePermission = async (permission: Permission) =>
    fetch(`${hostname}/permissions/${permission.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(permission),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update permission");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error updating permission data: " + error); // More detailed error logging
      });

  public static attachPermission = async (
    permission_id: number,
    role_id: string,
  ) =>
    fetch(`${hostname}/roles/permission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ permission_id, role_id }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to attach permission");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error attaching permission data: " + error); // More detailed error logging
      });

  public static detachPermission = async (
    permission_id: number,
    role_id: string,
  ) =>
    fetch(`${hostname}/roles/permission`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ permission_id, role_id }),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to detach permission");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error detaching permission data: " + error); // More detailed error logging
      });

  public static fetchPermissionsForRole = async (role_id: string) =>
    fetch(`${hostname}/permissions/role/${role_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.statusCode === 404) {
          console.error("Permissions not found");
          return [];
        }
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load permissions");
        }
        return response.responseObject as Permission[];
      })
      .catch((error) => {
        throw new Error("Error loading permissions data: " + error); // More detailed error logging
      });

  public static fetchCustomers = async () =>
    fetch(`${hostname}/customers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load customers");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error loading customers data: " + error); // More detailed error logging
      });

  public static fetchTransaction = async (transaction_id: string) =>
    fetch(`${hostname}/transactions/${transaction_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load transaction");
        }
        return response.responseObject;
      })
      .then((transactionData: unknown) => {
        console.log("Raw Transaction Data:", transactionData);
        if (!DBModel.validateTransaction(transactionData)) {
          console.error("Invalid transaction data:", transactionData);
          throw new Error("Invalid transaction response");
        }
        if (transactionData?.Bike) {
          // Coerce string values to numbers for validation
          const bikeCopy = { ...transactionData.Bike };
          // Convert size_cm from string to number if it's a string
          if (typeof bikeCopy.size_cm === "string") {
            bikeCopy.size_cm = parseFloat(bikeCopy.size_cm);
          }
          // Convert price from string to number if it's a string
          if (typeof bikeCopy.price === "string") {
            bikeCopy.price = parseFloat(bikeCopy.price);
          }
          // Convert deposit_amount from string to number if it's a string
          if (typeof bikeCopy.deposit_amount === "string") {
            bikeCopy.deposit_amount = parseFloat(bikeCopy.deposit_amount);
          }

          if (!DBModel.validateBike(bikeCopy)) {
            console.error("Invalid bike data:", transactionData.Bike);
            throw new Error("Invalid bike response");
          }
        }

        return transactionData;
      });

  public static deleteTransaction = async (transaction_id: string) =>
    fetch(`${hostname}/transactions/${transaction_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post transaction");
        }
      })
      .catch((error) => {
        throw new Error("Error posting transaction data: " + error); // More detailed error logging
      });

  public static updateTransaction = async (
    transaction_id: string,
    Transaction: UpdateTransaction,
  ) => {
    console.log("updating transaction", Transaction);
    return fetch(`${hostname}/transactions/${transaction_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Transaction),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(
          "successfully recieved update transaction response",
          response,
        );
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update transaction");
        }
        if (!DBModel.validateTransaction(response.responseObject)) {
          throw new Error("Invalid transaction response");
        }
        queryClient.invalidateQueries({
          queryKey: ["transactionLogs", transaction_id],
        });
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting transaction data: " + error); // More detailed error logging
      });
  };

  public static postTransaction = async (Transaction: CreateTransaction) =>
    fetch(`${hostname}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Transaction),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post transaction");
        }

        if (!this.validateTransaction(response.responseObject)) {
          throw new Error("Invalid transaction response");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting transaction data: " + error); // More detailed error logging
      });

  public static fetchTransactionSummary = async () =>
    fetch(`${hostname}/summary/transactions`)
      .then((response) => response.json())
      .then((summaryResponse: unknown) => {
        console.log("Raw Summary Response:", summaryResponse);
        if (!DBModel.validateObjectResponse(summaryResponse)) {
          throw new Error("Invalid part response");
        }
        if (!summaryResponse.success) {
          throw new Error("Failed to load transactions");
        }
        console.log(" Summary Data:", summaryResponse.responseObject);
        return summaryResponse.responseObject;
      })
      .then((summaryData: unknown) => {
        console.log("Mapped summary Data:", summaryData);

        if (!DBModel.validateTransactionSummary(summaryData)) {
          throw new Error("Invalid summary");
        }
        return summaryData;
      })
      .catch((error) => {
        throw Error("Error loading or parsing summary data: " + error);
      });

  public static fetchItems = async (includeDisabled = false) =>
    fetch(`${hostname}/items?includeDisabled=${includeDisabled}`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw Parts Data:", itemsData);
        if (!DBModel.validatePartsResponse(itemsData)) {
          throw new Error("Invalid part response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load parts");
        }
        // console.log(" Parts Array Data:", itemsData.responseObject);
        return itemsData.responseObject;
      })
      .then((partsData: unknown[]) => {
        console.log("Mapped Parts Data:", partsData);
        partsData.forEach((part) => {
          if (!DBModel.validatePart(part)) {
            console.log("Invalid Part:", part);
            // throw new Error("Invalid part found");
          }
        });

        // if (!DBModel.validatePartsArray(partsData)) {
        //   throw new Error("Invalid part array");
        // }
        return partsData;
      })
      .catch((error) => {
        throw Error("Error loading or parsing items data: " + error);
      });

  public static createItem = async (item: CreatePart) =>
    fetch(`${hostname}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post item");
        }
        // if (!DBModel.validatePart(response.responseObject)) {
        //   throw new Error("Invalid item response");
        // }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting item data: " + error); // More detailed error logging
      });

  public static updateItem = async (item: Part) =>
    fetch(`${hostname}/items/${item.item_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update item");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting item data: " + error); // More detailed error logging
      });

  public static deleteItem = async (item_id: string) =>
    fetch(`${hostname}/items/${item_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete item");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error deleting item data: " + error); // More detailed error logging
      });

  public static refreshItems = async (csv: string) => {
    console.log("sending file in dbModel", csv);
    return fetch(`${hostname}/items`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ csv: csv }),
    })
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw Parts Data:", itemsData);
        if (!DBModel.validateArrayResponse(itemsData)) {
          throw new Error("Invalid part response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load parts");
        }
        // console.log(" Parts Array Data:", itemsData.responseObject);
        return itemsData.responseObject;
      });
  };

  public static activateItem = async (upc: string) =>
    fetch(`${hostname}/items/update/${upc}`, {
      method: "PATCH",
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to activate item");
        }
      });

  public static fetchItemCategory = async (category: number) =>
    fetch(`${hostname}/items/categories/?category=${category}`)
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load items");
        }
        return response.responseObject;
      });

  public static fetchRepairs = async () =>
    fetch(`${hostname}/repairs`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw repairs Data:", itemsData);
        if (!DBModel.validateRepairsResponse(itemsData)) {
          throw new Error("Invalid repair response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load repairs");
        }
        // console.log("repairs Array Data:", itemsData.responseObject);
        return itemsData.responseObject;
      })
      .then((repairsData: unknown[]) => {
        console.log("Mapped repairs Data:", repairsData);
        const filteredRepairs = repairsData.filter((repair) => {
          return DBModel.validateRepair(repair);
        });
        if (!DBModel.validateRepairsArray(filteredRepairs)) {
          throw new Error("Invalid repair array");
        }
        return filteredRepairs;
      })
      .catch((error) => {
        throw new Error("Error loading server data: " + error); // More detailed error logging
      });

  public static createRepair = async (repair: Repair) =>
    fetch(`${hostname}/repairs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(repair),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post repair");
        }
        // if (!DBModel.validateRepair(response.responseObject)) {
        //   throw new Error("Invalid repair response");
        // }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting repair data: " + error); // More detailed error logging
      });
  public static updateRepair = async (repair: Repair) =>
    fetch(`${hostname}/repairs/${repair.repair_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(repair),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update repair");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error patching repair data: " + error); // More detailed error logging
      });
  public static deleteRepair = async (repair_id: string) =>
    fetch(`${hostname}/repairs/${repair_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete repair");
        }
      })
      .catch((error) => {
        throw new Error("Error deleting repair data: " + error); // More detailed error logging
      });

  public static fetchUser = async (netid: string) => {
    try {
      // Lightweight instrumentation: log who is being fetched and the API host.
      // This helps trace where requests like `/users/eesanders25` are coming from.
      // The stack trace provides an initiator hint in the browser console.
      // Remove this logging after debugging.
      console.log("DBModel.fetchUser called", {
        netid,
        hostname,
        stack: new Error().stack,
      });
    } catch {
      // ignore logging failures
    }

    return fetch(`${hostname}/users/${netid}`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw users Data:", itemsData);
        if (!DBModel.validateObjectResponse(itemsData)) {
          throw new Error("Invalid user response");
        }

        if (!itemsData.success) {
          throw new Error("Failed to load users");
        }
        // console.log("users object Data:", itemsData.responseObject);
        return itemsData.responseObject;
      })
      .then((usersData: unknown) => {
        if (!DBModel.validateUser(usersData)) {
          throw new Error("Invalid user data: " + JSON.stringify(usersData));
        }

        return usersData;
      })
      .catch((error) => {
        throw new Error("Error loading server data: " + error); // More detailed error logging
      });
  };
  public static fetchUsers = async () =>
    fetch(`${hostname}/users`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw users Data:", itemsData);
        if (!DBModel.validateArrayResponse(itemsData)) {
          throw new Error("Invalid user response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load users");
        }
        // console.log("users Array Data:", itemsData.responseObject);
        return itemsData.responseObject;
      })
      .then((usersData: unknown[]) => {
        console.log("Mapped users Data:", usersData);
        usersData.forEach((part) => {
          if (!DBModel.validateUser(part)) {
            console.log("Invalid user:", part);
            throw new Error("Invalid user found");
          }
        });
        return usersData as User[];
      })
      .catch((error) => {
        throw new Error("Error loading server data: " + error); // More detailed error logging
      });
  public static createUser = async (user: User) =>
    fetch(`${hostname}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post user");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting user data: " + error); // More detailed error logging
      });
  public static updateUser = async (user: User) => {
    try {
      // Lightweight instrumentation: log which user object is being updated.
      // Useful for tracking down unexpected PATCHes to /users/:id
      console.log("DBModel.updateUser called", {
        user_id: user?.user_id,
        hostname,
        stack: new Error().stack,
      });
    } catch {
      // ignore logging failures
    }
    return fetch(`${hostname}/users/${user.user_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update user");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error patching user data: " + error); // More detailed error logging
      });
  };
  public static deleteUser = async (netid: string) =>
    fetch(`${hostname}/users/${netid}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete user");
        }
      })
      .catch((error) => {
        throw new Error("Error deleting user data: " + error); // More detailed error logging
      });

  public static fetchTransactionDetails = async (
    transaction_id: string,
    type: TransactionDetailType,
  ) => {
    console.log("fetching transaction id", transaction_id, "of type", type);
    console.log(
      `${hostname}/transactionDetails/${transaction_id}?` +
        new URLSearchParams({ detailType: type }),
    );
    return fetch(
      `${hostname}/transactionDetails/${transaction_id}?` +
        new URLSearchParams({ detailType: type }),
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to load Transactions Details -- failed to fetch",
          );
        }
        if (response.status > 299) {
          throw new Error(
            "Failed to load Transactions Details: request unsuccessful" +
              response,
          );
        }
        return response;
      })
      .then(async (response) => {
        // Handle 204 No Content or empty response bodies to avoid JSON parse errors
        if (response.status === 204) {
          return {
            success: true,
            responseObject: [],
            message: "No content",
            statusCode: 204,
          };
        }
        const text = await response.text();
        if (!text) {
          return {
            success: true,
            responseObject: [],
            message: "Empty response body",
            statusCode: response.status,
          };
        }
        return JSON.parse(text);
      })
      .then((transactionDetailsData: unknown) => {
        console.log("Raw Transactions Details Data:", transactionDetailsData);
        if (!DBModel.validateArrayResponse(transactionDetailsData)) {
          throw new Error("Transaction Detail Response not in an array ");
        }
        if (!transactionDetailsData.success) {
          throw new Error("Failed to load Transactions Details");
        }
        console.log(
          "Transactions Details Array Data:",
          transactionDetailsData.responseObject,
        );
        return transactionDetailsData.responseObject;
      })
      .then((transactionDetailsArray: unknown[]) => {
        console.log(
          "Mapped Transactions Details Data:",
          transactionDetailsArray,
        );
        switch (type) {
          case "item":
            transactionDetailsArray.map((part) => {
              if (!DBModel.validateItemDetails(part)) {
                console.error("Invalid Item Transaction Details:", part);
                throw new Error("Invalid Item Transaction Details");
              }
              return part;
            });
            break;
          case "repair":
            transactionDetailsArray.forEach((part) => {
              if (!DBModel.validateRepairDetails(part)) {
                console.error("Invalid repair Transaction Details:", part);
                throw new Error("Invalid repair Transaction Details");
              }
            });
            break;
          default:
            transactionDetailsArray.forEach((part) => {
              if (!DBModel.validateTransactionDetails(part)) {
                console.error("Invalid Transaction Details:", part);
                throw new Error("Invalid Transaction Details");
              }
            });
        }

        if (!DBModel.validateTransactionDetailsArray(transactionDetailsArray)) {
          throw new Error("Invalid Transactions Details array");
        }
        return transactionDetailsArray;
      })
      .catch((error) => {
        throw new Error("Error loading transactions data: " + error); // More detailed error logging
      });
  };
  public static postTransactionDetails = async (
    transaction_id: string,
    object_id: string,
    changed_by: string,
    quantity: number,
    type: TransactionDetailType,
  ) => {
    const body =
      type == "item"
        ? {
            item_id: object_id.trim(),
            repair_id: null,
            changed_by: changed_by,
            quantity: quantity,
          }
        : {
            item_id: null,
            repair_id: object_id,
            changed_by: changed_by,
            quantity: quantity,
            completed: false,
          };
    console.log("posting transaction details", body);
    return fetch(`${hostname}/transactionDetails/${transaction_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          console.error(response);
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post transaction details");
        }
      })
      .catch((error) => {
        throw new Error("Error posting transaction details data: " + error); // More detailed error logging
      });
  };

  public static updateTransactionDetails = async (
    transaction_detail_id: string,
    completed: boolean,
  ) => {
    return fetch(`${hostname}/transactionDetails/${transaction_detail_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed }),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update transaction details");
        }
        return response.responseObject;
      })
      .catch((error) => {
        console.error("Error updating transaction details data: ", error);
        throw new Error("Error updating transaction details data: " + error); // More detailed error logging
      });
  };

  public static fetchTransactionLogs = async (transaction_id: number) =>
    fetch(`${hostname}/transactionLogs/${transaction_id}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load transaction logs -- failed to fetch");
        }
        if (response.status === 204) {
          return {
            success: true,
            responseObject: [],
            message: "No content",
            statusCode: 204,
          };
        }
        const text = await response.text();
        if (!text) {
          return {
            success: true,
            responseObject: [],
            message: "Empty response body",
            statusCode: response.status,
          };
        }
        return JSON.parse(text);
      })
      .then((response) => {
        console.log(response);
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load transaction logs");
        }
        return response.responseObject;
      })
      .then((transactionLogs: unknown[]) => {
        if (transactionLogs.length === 0) {
          return [];
        }
        for (const transactionLog of transactionLogs) {
          if (!DBModel.validateTransactionLog(transactionLog)) {
            throw new Error("Invalid transaction log data");
          }
        }
        return transactionLogs;
      })
      .catch((error) => {
        console.error("Error loading transaction logs data: ", error);
        throw new Error("Error loading transaction logs data: " + error);
      });

  public static postTransactionLog = async (
    transaction_id: number,
    changed_by: string,
    description: string,
    change_type: string,
  ) => {
    const body = {
      changed_by: changed_by,
      description: description,
      change_type: change_type,
    };

    return fetch(`${hostname}/transactionLogs/${transaction_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post transaction log");
        }
        queryClient.removeQueries({
          queryKey: ["transactionLogs", transaction_id],
        });
      })
      .catch((error) => {
        console.error("Error posting transaction log data: ", error);
        throw new Error("Error posting transaction log data: " + error); // More detailed error logging
      });
  };

  public static createCustomer = async (customer: CreateCustomer) => {
    return fetch(`${hostname}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customer),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post customer");
        }
        if (!DBModel.validateCustomer(response.responseObject)) {
          throw new Error("Invalid customer response");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting customer data: " + error); // More detailed error logging
      });
  };

  public static updateCustomer = async (customer: Customer) =>
    fetch(`${hostname}/customers/${customer.customer_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customer),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post customer");
        }
        if (!DBModel.validateCustomer(response.responseObject)) {
          throw new Error("Invalid customer response");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting customer data: " + error); // More detailed error logging
      });

  public static createBike = async (bike: Bike) =>
    fetch(`${hostname}/bikes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bike),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post bike");
        }

        // More lenient validation for bike creation - only validate essential fields
        const bike = response.responseObject;
        if (
          !bike ||
          typeof bike !== "object" ||
          !bike.make ||
          !bike.model ||
          !bike.description
        ) {
          console.warn(
            "Invalid bike response - missing essential fields:",
            bike,
          );
          throw new Error("Invalid bike response");
        }

        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting bike data: " + error); // More detailed error logging
      });

  public static updateBike = async (
    bike_id: string,
    bikeData: Partial<UpdateBike>,
  ) => {
    // Make sure we have valid data
    if (!bikeData || Object.keys(bikeData).length === 0) {
      console.error("Empty bike data provided for update");
      throw new Error("Cannot update bike with empty data");
    }

    // Ensure we don't send undefined values - convert them to null for the API
    const cleanedData: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(bikeData)) {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    }

    // Debug output before sending request
    console.log(`Updating bike ${bike_id} with data:`, cleanedData);

    return fetch(`${hostname}/bikes/${bike_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanedData),
    })
      .then(async (response) => {
        const responseText = await response.text();
        console.log(`Update bike response (${response.status}):`, responseText);

        // Try to parse the response as JSON
        try {
          return JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
          throw new Error(`Server response is not valid JSON: ${responseText}`);
        }
      })
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          console.error("Invalid response object:", response);
          throw new Error("Invalid response structure");
        }
        if (!response.success) {
          console.error("Update bike failed:", response.message);
          throw new Error(
            `Failed to update bike: ${response.message || "Unknown error"}`,
          );
        }

        // Validate the updated bike response
        const bikeToValidate = { ...response.responseObject };
        // Convert string values to numbers for validation
        if (typeof bikeToValidate.size_cm === "string") {
          bikeToValidate.size_cm = parseFloat(bikeToValidate.size_cm);
        }
        if (typeof bikeToValidate.price === "string") {
          bikeToValidate.price = parseFloat(bikeToValidate.price);
        }
        if (typeof bikeToValidate.deposit_amount === "string") {
          bikeToValidate.deposit_amount = parseFloat(
            bikeToValidate.deposit_amount,
          );
        }

        if (!DBModel.validateBike(bikeToValidate)) {
          console.warn(
            "Invalid bike response after update:",
            response.responseObject,
          );
          throw new Error("Invalid bike response");
        }

        return response.responseObject;
      })
      .catch((error) => {
        console.error("Error in updateBike:", error);
        throw new Error("Error updating bike data: " + error);
      });
  };

  public static deleteTransactionDetails = async (
    transaction_detail_id: string,
  ) =>
    fetch(`${hostname}/transactionDetails/${transaction_detail_id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete transaction details");
        }
      })
      .catch((error) => {
        console.error("Error deleting transaction details data: ", error);
        throw new Error("Error posting transaction details data: " + error); // More detailed error logging
      });

  public static postOrderRequest = async (req: OrderRequest) =>
    fetch(`${hostname}/orderRequests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post order request");
        }
      })
      .catch((error) => {
        console.error("Error posting order request data: ", error);
        throw new Error("Error posting order request data: " + error); // More detailed error logging
      });
  public static putOrderRequest = async (req: OrderRequest) =>
    fetch(`${hostname}/orderRequests/${req.order_request_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post order request");
        }
        if (!DBModel.validateOrderRequest(response.responseObject)) {
          throw new Error("Invalid order request response");
        }
        return response.responseObject;
      })
      .catch((error) => {
        console.error("Error posting order request data: ", error);
        throw new Error("Error posting order request data: " + error); // More detailed error logging
      });

  public static getOrderRequests = async (transaction_id?: string) =>
    fetch(`${hostname}/orderRequests/${transaction_id ? transaction_id : ""}`)
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (response.statusCode === 400) {
          return [];
        }
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response -- " + response.message);
        }
        if (!response.success) {
          throw new Error("Failed to load order requests");
        }

        return response.responseObject;
      })
      .then((orderRequests: unknown[]) => {
        if (orderRequests.length === 0) {
          return [];
        }
        for (const orderRequest of orderRequests) {
          if (!DBModel.validateOrderRequest(orderRequest)) {
            throw new Error("Invalid order request data" + orderRequest);
          }
        }
        return orderRequests as OrderRequest[];
      })
      .catch((error) => {
        throw new Error("Error loading order requests data: " + error); // More detailed error logging
      });

  public static deleteOrderRequest = async (req: OrderRequest) =>
    fetch(`${hostname}/orderRequests/${req.order_request_id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete order request");
        }
      })
      .catch((error) => {
        console.error("Error deleting order request data: ", error);
        throw new Error("Error posting order request data: " + error); // More detailed error logging
      });

  public static fetchOrders = async () =>
    fetch(`${hostname}/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load orders");
        }
        for (const order of response.responseObject) {
          if (!DBModel.validateOrder(order)) {
            throw new Error("Invalid order data");
          }
        }
        return response.responseObject as Order[];
      })
      .catch((error) => {
        throw new Error("Error loading orders data: " + error);
      });

  public static fetchOrder = async (order_id: string) =>
    fetch(`${hostname}/orders/${order_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to load order");
        }
        if (!DBModel.validateOrder(response.responseObject)) {
          throw new Error("Invalid order data");
        }
        return response.responseObject as Order;
      })
      .catch((error) => {
        throw new Error("Error loading order data: " + error);
      });

  public static createOrder = async (
    order: Omit<Order, "order_id" | "order_date">,
  ) =>
    fetch(`${hostname}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to create order");
        }
        if (!DBModel.validateOrder(response.responseObject)) {
          throw new Error("Invalid order response");
        }
        return response.responseObject as Order;
      })
      .catch((error) => {
        throw new Error("Error creating order data: " + error);
      });

  public static updateOrder = async (order: Order) =>
    fetch(`${hostname}/orders/${order.order_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to update order");
        }
        if (!DBModel.validateOrder(response.responseObject)) {
          throw new Error("Invalid order response");
        }
        return response.responseObject as Order;
      })
      .catch((error) => {
        throw new Error("Error updating order data: " + error);
      });

  public static deleteOrder = async (order_id: string) =>
    fetch(`${hostname}/orders/${order_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to delete order");
        }
      })
      .catch((error) => {
        throw new Error("Error deleting order data: " + error);
      });

  public static getClosestFutureOrder = async () =>
    fetch(`${hostname}/orders/closest-future`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to get closest future order");
        }
        if (!DBModel.validateOrder(response.responseObject)) {
          throw new Error("Invalid order response");
        }
        return response.responseObject as Order;
      })
      .catch((error) => {
        throw new Error("Error getting closest future order: " + error);
      });

  public static sendEmail = async (
    customer: Customer,
    transaction_num: number,
  ) =>
    fetch(`${hostname}/customers/${transaction_num}/emails/pickup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer,
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post order request");
        }
      })
      .catch((error) => {
        console.error("Error posting order request data: ", error);
        throw new Error("Error posting order request data: " + error); // More detailed error logging
      });

  public static sendRecieptEmail = async (
    customer: Customer,
    transaction_num: number,
    transaction_id: string,
  ) =>
    fetch(`${hostname}/customers/${transaction_num}/emails/receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer,
        transaction_id,
        transaction_num,
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response");
        }
        if (!response.success) {
          throw new Error("Failed to post order request");
        }
      })
      .catch((error) => {
        console.error("Error posting order request data: ", error);
        throw new Error("Error posting order request data: " + error); // More detailed error logging
      });
  public static getTransactionsQuery = (
    page_limit: number,
    aggregate: boolean,
  ) => {
    return queryOptions({
      queryKey: ["transactions"],
      queryFn: () => this.fetchTransactions(page_limit, aggregate),
      refetchOnWindowFocus: "always",
      staleTime: 600000, // Cache products for 1 minute
      select: (data) => data as unknown as IRow[],
    });
  };

  public static getTransactionQuery = (
    transaction_id: string,
    // onTransactionSuccess: (t: Transaction) => void
    // initialData: Transaction
  ) => {
    return queryOptions({
      queryKey: ["transaction", transaction_id],
      queryFn: () => this.fetchTransaction(transaction_id),
      // onFetch: onTransactionSuccess,
      // initialData: initialData,
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 1 minute
    });
  };

  public static getItemsQuery = (includeDisabled = false) => {
    return queryOptions({
      queryKey: ["items", includeDisabled],
      queryFn: () => this.fetchItems(includeDisabled),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
      select: (data) => data as Part[],
    });
  };
  public static getRepairsQuery = () => {
    return queryOptions({
      queryKey: ["repairs"],
      queryFn: () => this.fetchRepairs(),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
    });
  };

  public static getTransactionDetailsQuery = (
    transaction_id: string,
    type: TransactionDetailType,
  ) => {
    return queryOptions({
      queryKey: ["transactionDetails", transaction_id, type],
      queryFn: () => this.fetchTransactionDetails(transaction_id, type),
      refetchOnWindowFocus: false,
      staleTime: 60000, // Cache products for 10 minutes
    });
  };

  public static getRolesQuery = () => {
    return queryOptions({
      queryKey: ["roles"],
      queryFn: () => this.fetchRoles(),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
    });
  };
  public static getPermissionsQuery = () => {
    return queryOptions({
      queryKey: ["permissions"],
      queryFn: () => this.fetchPermissions(),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
    });
  };
  public static getFeatureFlagsQuery = () => {
    return queryOptions({
      queryKey: ["featureFlags"],
      queryFn: () => this.fetchFeatureFlags(),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
    });
  };

  public static getClosestFutureOrderQuery = () => {
    return queryOptions({
      queryKey: ["closestFutureOrder"],
      queryFn: () => this.getClosestFutureOrder(),
      refetchOnWindowFocus: false,
      staleTime: 300000, // Cache for 5 minutes
    });
  };

  /**
   * Fetch all feature flags from the backend
   */
  public static fetchFeatureFlags = async () =>
    fetch(`${hostname}/feature-flags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        // Optionally validate response shape here
        return data;
      });

  /**
   * Update a feature flag value (admin only)
   */
  public static updateFeatureFlags = async (flags: Record<string, boolean>) =>
    fetch(`${hostname}/feature-flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flags),
    })
      .then((response) => response.json())
      .then((data) => {
        // Optionally validate response shape here
        return data;
      });
  public static addFeatureFlag = async (
    flagName: string,
    value: boolean,
    details: string,
    user: User,
  ) => {
    return fetch(`${hostname}/feature-flags/${flagName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, details, user }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Optionally validate response shape here
        return data;
      });
  };

  public static deleteFeatureFlag = async (flagName: string) => {
    return fetch(`${hostname}/feature-flags/${flagName}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        // Optionally validate response shape here
        return data;
      });
  };

  /**
   * Fetch feature flag audit log (optional)
   */
  public static fetchFeatureFlagAudit = async () =>
    fetch(`${hostname}/feature-flags/audit`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        // Optionally validate response shape here
        return data;
      });

  static async processPdf(formData: FormData): Promise<ExtractedRow[]> {
    const response = await fetch(`${hostname}/orderRequests/process-pdf`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to process PDF");
    }

    return response.json();
  }

  // Special case: Initialize endpoint uses 'bike-sales' (hyphen) and is hardcoded in the API
  public static initializeWorkflow = async (
    transactionId: string,
    createdBy?: string,
  ) =>
    fetch(`${hostname}/workflow-steps/initialize/bike-sales/${transactionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(createdBy && { created_by: createdBy }), // Only include created_by if provided
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          // Try to get the error message from the response body
          let errorMessage = `HTTP ${response.status}: Initialize workflow endpoint error`;
          try {
            const errorBody = await response.json();
            if (errorBody.message) {
              errorMessage = `HTTP ${response.status}: ${errorBody.message}`;
            }
          } catch {
            // If we can't parse the error response, use the default message
          }
          throw new Error(errorMessage);
        }
        try {
          return await response.json();
        } catch (error) {
          throw new Error(
            `Invalid JSON response from initialize workflow API: ${error}`,
          );
        }
      })
      .then((response) => {
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response structure");
        }
        if (!response.success) {
          throw new Error(response.message || "Failed to initialize workflow");
        }
        if (!DBModel.validateWorkflowSteps(response.responseObject)) {
          throw new Error("Invalid workflow steps data received");
        }
        return response.responseObject as WorkflowStep[];
      })
      .catch((error) => {
        console.error("Error initializing workflow:", error);
        throw error;
      });

  public static fetchWorkflowProgress = async (
    transactionId: string,
    workflowType: string = "bike_sales",
  ) =>
    fetch(
      `${hostname}/workflow-steps/progress/${transactionId}/${workflowType}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: Workflow progress endpoint not found`,
          );
        }
        try {
          return await response.json();
        } catch (error) {
          throw new Error(
            `Invalid JSON response from workflow progress API: ${error}`,
          );
        }
      })
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response structure");
        }
        if (!response.success) {
          throw new Error(
            response.message || "Failed to fetch workflow progress",
          );
        }

        // Debug: Log the actual response data to see what we're getting
        console.log(
          "Workflow progress response:",
          JSON.stringify(response.responseObject, null, 2),
        );

        if (!DBModel.validateWorkflowProgress(response.responseObject)) {
          console.error(
            "Workflow progress validation failed. Expected schema:",
            WorkflowProgressSchema,
          );
          console.error("Received data:", response.responseObject);
          throw new Error("Invalid workflow progress data received");
        }
        return response.responseObject as WorkflowProgress;
      })
      .catch((error) => {
        console.error("Error fetching workflow progress:", error);
        throw error;
      });

  public static fetchWorkflowSteps = async (
    transactionId: string,
    workflowType: string = "bike_sales",
  ) =>
    fetch(
      `${hostname}/workflow-steps/transaction/${transactionId}/${workflowType}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: Workflow steps endpoint not found`,
          );
        }
        try {
          return await response.json();
        } catch (error) {
          throw new Error(
            `Invalid JSON response from workflow steps API: ${error}`,
          );
        }
      })
      .then((response) => {
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response structure");
        }
        if (!response.success) {
          throw new Error(response.message || "Failed to fetch workflow steps");
        }
        if (!DBModel.validateWorkflowSteps(response.responseObject)) {
          throw new Error("Invalid workflow steps data received");
        }
        return response.responseObject as WorkflowStep[];
      })
      .catch((error) => {
        console.error("Error fetching workflow steps:", error);
        throw error;
      });

  public static completeWorkflowStep = async (stepId: string) => {
    const url = `${hostname}/workflow-steps/complete/${stepId}`;
    console.log("Attempting to complete workflow step at URL:", url);

    return fetch(url, {
      method: "POST", // Changed from PATCH to POST to match backend
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Optional: include completed_by if we want to track who completed it
        // completed_by: currentUserId
      }),
    })
      .then(async (response) => {
        console.log("Complete workflow step response status:", response.status);
        console.log(
          "Complete workflow step response headers:",
          Object.fromEntries(response.headers.entries()),
        );

        if (!response.ok) {
          const responseText = await response.text();
          console.log(
            "Complete workflow step error response body:",
            responseText.substring(0, 500),
          );
          throw new Error(
            `HTTP ${response.status}: Workflow step completion endpoint not implemented yet. Response: ${responseText.substring(0, 100)}...`,
          );
        }

        const responseText = await response.text();
        console.log(
          "Complete workflow step success response body:",
          responseText,
        );

        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          throw new Error(
            `Invalid JSON response from workflow completion endpoint: ${responseText.substring(0, 200)}...`,
          );
        }
      })
      .then((response) => {
        console.log("Parsed workflow step completion response:", response);

        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response structure");
        }
        if (!response.success) {
          throw new Error(
            response.message || "Failed to complete workflow step",
          );
        }
        if (!DBModel.validateWorkflowStep(response.responseObject)) {
          throw new Error("Invalid workflow step data received");
        }
        return response.responseObject as WorkflowStep;
      })
      .catch((error) => {
        console.error("Error completing workflow step:", error);
        throw error;
      });
  };

  public static uncompleteWorkflowStep = async (stepId: string) =>
    fetch(`${hostname}/workflow-steps/uncomplete/${stepId}`, {
      method: "POST", // Changed from PATCH to POST to match backend
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // Empty body as backend expects POST with body
    })
      .then((response) => response.json())
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response structure");
        }
        if (!response.success) {
          throw new Error(
            response.message || "Failed to uncomplete workflow step",
          );
        }
        if (!DBModel.validateWorkflowStep(response.responseObject)) {
          throw new Error("Invalid workflow step data received");
        }
        return response.responseObject as WorkflowStep;
      })
      .catch((error) => {
        console.error("Error uncompleting workflow step:", error);
        throw error;
      });

  // Reset/Delete workflow - for admin use
  public static resetWorkflow = async (transactionId: string) =>
    fetch(`${hostname}/workflow-steps/reset/${transactionId}`, {
      method: "POST", // Changed from DELETE to POST to match backend
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_type: "bike_sales", // Required by backend
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: Reset workflow endpoint error`;
          try {
            const errorBody = await response.json();
            if (errorBody.message) {
              errorMessage = `HTTP ${response.status}: ${errorBody.message}`;
            }
          } catch {
            // If we can't parse the error response, use the default message
          }
          throw new Error(errorMessage);
        }
        try {
          return await response.json();
        } catch (error) {
          throw new Error(
            `Invalid JSON response from reset workflow API: ${error}`,
          );
        }
      })
      .then((response) => {
        if (!DBModel.validateObjectResponse(response)) {
          throw new Error("Invalid response structure");
        }
        if (!response.success) {
          throw new Error(response.message || "Failed to reset workflow");
        }
        return response.responseObject;
      })
      .catch((error) => {
        console.error("Error resetting workflow:", error);
        throw error;
      });
}

DBModel.initialize();

export default DBModel;
