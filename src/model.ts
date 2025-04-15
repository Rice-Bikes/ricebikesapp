import { queryOptions } from "@tanstack/react-query";
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
} from "./schema";
import Ajv from "ajv";

const hostname = import.meta.env.VITE_API_URL;

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
export type User = FromSchema<typeof UserSchema>;
export type Role = FromSchema<typeof RoleSchema>;
export type Permission = FromSchema<typeof PermissionsSchema>;
export type OrderRequest = FromSchema<typeof OrderRequestSchema>;
export type CreateOrderRequests = FromSchema<typeof CreateOrderRequestsSchema>;
export type CreatePart = FromSchema<typeof CreatePartSchema>;

export type PartArray = FromSchema<typeof partArraySchema>;
export type RepairArray = FromSchema<typeof repairArraySchema>;
export type TransactionArray = FromSchema<typeof TransactionArraySchema>;
export type TransactionDetailsArray = FromSchema<typeof TransactionDetailsArraySchema>;
export type TransactionLogArray = FromSchema< typeof TransactionLogArraySchema>;
export type TransactionLog = FromSchema<typeof TransactionLogSchema>;

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
  static validatePart: (data: unknown) => data is Part;
  static validateRepair: (data: unknown) => data is Repair;
  static validateOrderRequest: (data: unknown) => data is OrderRequest;
  static validateTransactionDetails: (data: unknown) => data is TransactionDetails;
  public static validateRepairDetails: (data: unknown) => data is RepairDetails;
  public static validateItemDetails: (data: unknown) => data is ItemDetails;
  public static validateUser: (data: unknown) => data is User;
  public static validateTransactionLog: (data: unknown) => data is TransactionLog;
  public static validateRole: (data: unknown) => data is Role;

  // ARRAY VERIFICATION METHODS
  static validatePartsArray: (data: unknown) => data is Part[];
  static validateTransactionsArray: (data: unknown) => data is Transaction[];
  static validateRepairsArray: (data: unknown) => data is Repair[];
  static validateTransactionDetailsArray: (
    data: unknown
  ) => data is TransactionDetails[] | RepairDetails[] | ItemDetails[];
  static validateTransactionLogArray: (data: unknown) => data is TransactionLog[];

  // RESPONSE VERIFICATION METHODS
  static validateRepairsResponse: (data: unknown) => data is RepairResponse;
  static validatePartsResponse: (data: unknown) => data is PartResponse;
  static validateObjectResponse: (data: unknown) => data is ObjectResponse;
  static validateArrayResponse: (data: unknown) => data is ArrayResponse;
  static validateTransactionSummary: (
    data: unknown
  ) => data is TransactionSummary;

  static initialize() {
    const ajv = new Ajv();
    const $compile: $Compiler = (schema) => ajv.compile(schema);
    const compile = wrapCompilerAsTypeGuard($compile);

    // OBJECT VERIFICATION METHODS
    DBModel.validateTransaction = compile(TransactionSchema);
    DBModel.validateTransactionSummary = compile(TransactionSummarySchema);
    DBModel.validateCustomer = compile(CustomerSchema);
    DBModel.validateBike = compile(BikeSchema);
    DBModel.validatePart = compile(partSchema);
    DBModel.validateRepair = compile(repairSchema);
    DBModel.validateTransactionDetails = compile(TransactionDetailsSchema);
    DBModel.validateItemDetails = compile(ItemDetailsSchema);
    DBModel.validateRepairDetails = compile(RepairDetailsSchema);
    DBModel.validateUser = compile(UserSchema);
    DBModel.validateOrderRequest = compile(OrderRequestSchema);
    DBModel.validateTransactionLog = compile(TransactionLogSchema);
    DBModel.validateRole = compile(RoleSchema);

    // ARRAY VERIFICATION METHODS
    DBModel.validateTransactionsArray = compile(TransactionArraySchema);
    DBModel.validatePartsArray = compile(partArraySchema);
    DBModel.validateRepairsArray = compile(repairArraySchema);
    DBModel.validateTransactionDetailsArray = compile(
      TransactionDetailsArraySchema
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
    aggregate: boolean
  ) =>
    fetch(
      `${hostname}/transactions?` +
        new URLSearchParams({
          page_limit: page_limit.toString(),
          aggregate: aggregate.toString(),
        })
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
      .then((partsData: unknown[]) => {
        console.log("Mapped Parts Data:", partsData);
        partsData.forEach((part) => {
          if (!DBModel.validateTransaction(part)) {
            console.log("Invalid transaction:", part);
            throw new Error("Invalid transaction found");
          }
        });

        if (!DBModel.validateTransactionsArray(partsData)) {
          throw new Error("Invalid part array");
        }

        const transactionRowsPromises = partsData.map((part) => {
          const bikeField: unknown = part.Bike;
          if (!DBModel.validateBike(bikeField)) {
            console.error("Invalid bike:", bikeField);
            throw new Error("Invalid bike found");
          }

          if (!DBModel.validateCustomer(part.Customer)) {
            console.error("Invalid customer:", part.Customer);
            throw new Error("Invalid customer found");
          }

          if( part.OrderRequests && (part.OrderRequests instanceof Array )){
            for(let i = 0; i < part.OrderRequests.length; i++){
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
            Submitted: new Date(part.date_created),
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
        if (response.status === 404) {
          console.error("Permissions not found");
          return [];
        }
        if (!DBModel.validateArrayResponse(response)) {
          throw new Error("Invalid response");
        }
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

  public static createRole = async (role: Role) =>
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
  public static attachRole = async (user_id: string, role_id: string) =>
    fetch(`${hostname}/users/roles/`, {
      method: "PATCH",
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
  public static fetchPermissions = async () =>
    fetch(`${hostname}/permissions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.status === 404) {
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

  

  public static fetchCustomers = async () =>  
    fetch(`${hostname}/customers`, 
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
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
    }
    )


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
          throw new Error("Invalid transaction response");
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
    Transaction: UpdateTransaction
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
          response
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
          throw new Error("Failed to load parts");
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

  public static fetchItems = async () =>
    fetch(`${hostname}/items`)
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

  public static refreshItems = async (csv: string) =>{

    console.log("sending file in dbModel", csv);
    return fetch(`${hostname}/items`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({csv: csv}),
    }
    ) 
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
      })
    }

  public static activateItem = async (upc: string) =>
    fetch(`${hostname}/items/${upc}`, {
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
      })

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
  })

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
        repairsData.forEach((part) => {
          if (!DBModel.validateRepair(part)) {
            console.log("Invalid Part:", part);
            throw new Error("Invalid part found");
          }
        });
        if (!DBModel.validateRepairsArray(repairsData)) {
          throw new Error("Invalid part array");
        }
        return repairsData;
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
  public static fetchUser = async (netid: string) =>
    fetch(`${hostname}/users/${netid}`)
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
          throw new Error("Invalid user data");
        }

        return usersData;
      })
      .catch((error) => {
        throw new Error("Error loading server data: " + error); // More detailed error logging
      });
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
  public static updateUser = async (user: User) =>
    fetch(`${hostname}/users/${user.user_id}`, {
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
    type: TransactionDetailType
  ) => {
    console.log("fetching transaction id", transaction_id, "of type", type);
    console.log(
      `${hostname}/transactionDetails/${transaction_id}?` +
        new URLSearchParams({ detailType: type })
    );
    return fetch(
      `${hostname}/transactionDetails/${transaction_id}?` +
        new URLSearchParams({ detailType: type })
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to load Transactions Details -- failed to fetch"
          );
        }
        if (response.status > 299) {
          throw new Error(
            "Failed to load Transactions Details: request unsuccessful" +
              response
          );
        }
        return response;
      })
      .then((response) => response.json())
      .then((transactionDetailsData: unknown) => {
        console.log("Raw Transactions Details Data:", transactionDetailsData);
        if (!DBModel.validateArrayResponse(transactionDetailsData)) {
          throw new Error("Invalid Transactions Details response");
        }
        if (!transactionDetailsData.success) {
          throw new Error("Failed to load Transactions Details");
        }
        console.log(
          "Transactions Details Array Data:",
          transactionDetailsData.responseObject
        );
        return transactionDetailsData.responseObject;
      })
      .then((transactionDetailsArray: unknown[]) => {
        console.log(
          "Mapped Transactions Details Data:",
          transactionDetailsArray
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
    type: TransactionDetailType
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
    completed: boolean 
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
      .then((response) => response.json())
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


    public static postTransactionLog = async (
      transaction_id: number,
      changed_by: string,
      description: string,
      change_type: string
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
      }
      )
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

        if (!this.validateBike(response.responseObject)) {
          throw new Error("Invalid bike response");
        }
        return response.responseObject;
      })
      .catch((error) => {
        throw new Error("Error posting bike data: " + error); // More detailed error logging
      });

  public static deleteTransactionDetails = async (
    transaction_detail_id: string
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
      })
      .catch((error) => {
        console.error("Error posting order request data: ", error);
        throw new Error("Error posting order request data: " + error); // More detailed error logging
      });

  public static getOrderRequests = async (transaction_id?: string) =>
    fetch(`${hostname}/orderRequests/${transaction_id? transaction_id : ""}`)
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        if (response.statusCode === 404) {
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

    public static sendEmail = async (customer: Customer, transaction_num: number) => 
      fetch(`${hostname}/customers/${transaction_num}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer
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
    aggregate: boolean
  ) => {
    return queryOptions({
      queryKey: ["transactions"],
      queryFn: () => this.fetchTransactions(page_limit, aggregate),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 1 minute
    });
  };

  public static getTransactionQuery = (
    transaction_id: string
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

  public static getItemsQuery = () => {
    return queryOptions({
      queryKey: ["items"],
      queryFn: () => this.fetchItems(),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
      select: (data) =>  data as Part[],
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
    type: TransactionDetailType
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
  }

  static async processPdf(formData: FormData): Promise<ExtractedRow[]> {
    const response = await fetch(`${hostname}/orderRequests/process-pdf`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to process PDF');
    }
    
    return response.json();
  }
}

DBModel.initialize();

export default DBModel;
