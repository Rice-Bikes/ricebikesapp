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
} from "./schema";
import Ajv from "ajv";

const hostname = import.meta.env.VITE_API_URL;

export type Part = FromSchema<typeof partSchema>;
export type Repair = FromSchema<typeof repairSchema>;
export type Transaction = FromSchema<typeof TransactionSchema>;
export type Customer = FromSchema<typeof CustomerSchema>;
export type Bike = FromSchema<typeof BikeSchema>;
export type TransactionDetails = FromSchema<typeof TransactionDetailsSchema>;

export type PartArray = FromSchema<typeof partArraySchema>;
export type RepairArray = FromSchema<typeof repairArraySchema>;
export type TransactionArray = FromSchema<typeof TransactionArraySchema>;
export type TransactionDetailsArray = FromSchema<
  typeof TransactionDetailsArraySchema
>;

export type PartResponse = FromSchema<typeof partResponseSchema>;
export type RepairResponse = FromSchema<typeof repairResponseSchema>;
export type ArrayResponse = FromSchema<typeof ArrayResponseSchema>;
export type ObjectResponse = FromSchema<typeof ObjectResponseSchema>;

/**
 * The `DBQueries` class provides methods for fetching and validating data from the server.
 * It includes methods for fetching transactions, items, and repairs, as well as methods for validating
 * the structure of the data received from the server.
 *
 * @class DBQueries
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
class DBQueries {
  // OBJECT VERIFICATION METHODS
  static validateTransaction: (data: unknown) => data is Transaction;
  static validateCustomer: (data: unknown) => data is Customer;
  static validateBike: (data: unknown) => data is Bike;
  static validatePart: (data: unknown) => data is Part;
  static validateRepair: (data: unknown) => data is Repair;
  static validateTransactionDetails: (
    data: unknown
  ) => data is TransactionDetails;
  // ARRAY VERIFICATION METHODS
  static validatePartsArray: (data: unknown) => data is Part[];
  static validateTransactionsArray: (data: unknown) => data is Transaction[];
  static validateRepairsArray: (data: unknown) => data is Repair[];
  static validateTransactionDetailsArray: (
    data: unknown
  ) => data is TransactionDetails[];

  // RESPONSE VERIFICATION METHODS
  static validateRepairsResponse: (data: unknown) => data is RepairResponse;
  static validatePartsResponse: (data: unknown) => data is PartResponse;
  static validateObjectResponse: (data: unknown) => data is ObjectResponse;
  static validateArrayResponse: (data: unknown) => data is ArrayResponse;

  static initialize() {
    const ajv = new Ajv();
    const $compile: $Compiler = (schema) => ajv.compile(schema);
    const compile = wrapCompilerAsTypeGuard($compile);

    // OBJECT VERIFICATION METHODS
    DBQueries.validateTransaction = compile(TransactionSchema);
    DBQueries.validateCustomer = compile(CustomerSchema);
    DBQueries.validateBike = compile(BikeSchema);
    DBQueries.validatePart = compile(partSchema);
    DBQueries.validateRepair = compile(repairSchema);
    DBQueries.validateTransactionDetails = compile(TransactionDetailsSchema);

    // ARRAY VERIFICATION METHODS
    DBQueries.validateTransactionsArray = compile(TransactionArraySchema);
    DBQueries.validatePartsArray = compile(partArraySchema);
    DBQueries.validateRepairsArray = compile(repairArraySchema);
    DBQueries.validateTransactionDetailsArray = compile(
      TransactionDetailsArraySchema
    );

    // RESPONSE VERIFICATION METHODS
    DBQueries.validateArrayResponse = compile(ArrayResponseSchema);
    DBQueries.validateObjectResponse = compile(ObjectResponseSchema);
    DBQueries.validatePartsResponse = compile(partResponseSchema);
    DBQueries.validateRepairsResponse = compile(repairResponseSchema);
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
        console.log("Raw Parts Data:", transactionData);
        if (!DBQueries.validateArrayResponse(transactionData)) {
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
          if (!DBQueries.validateTransaction(part)) {
            console.log("Invalid transaction:", part);
            throw new Error("Invalid transaction found");
          }
        });

        if (!DBQueries.validateTransactionsArray(partsData)) {
          throw new Error("Invalid part array");
        }

        const transactionRowsPromises = partsData.map((part) => {
          const bikeField: unknown = part.Bike;
          if (!DBQueries.validateBike(bikeField)) {
            console.error("Invalid bike:", bikeField);
            throw new Error("Invalid bike found");
          }

          if (!DBQueries.validateCustomer(part.Customer)) {
            console.error("Invalid customer:", part.Customer);
            throw new Error("Invalid customer found");
          }
          return {
            Transaction: part,
            Customer: part.Customer,
            Bike: part.Bike,
            Submitted: new Date(part.date_created),
          };
        });
        return transactionRowsPromises;
      });

  public static fetchItems = async () =>
    fetch(`${hostname}/items`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw Parts Data:", itemsData);
        if (!DBQueries.validatePartsResponse(itemsData)) {
          throw new Error("Invalid part response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load parts");
        }
        console.log(" Parts Array Data:", itemsData.responseObject);
        return itemsData.responseObject;
      })
      .then((partsData: unknown[]) => {
        console.log("Mapped Parts Data:", partsData);
        partsData.forEach((part) => {
          if (!DBQueries.validatePart(part)) {
            console.log("Invalid Part:", part);
            throw new Error("Invalid part found");
          }
        });

        if (!DBQueries.validatePartsArray(partsData)) {
          throw new Error("Invalid part array");
        }
        return partsData;
      })
      .catch((error) => {
        console.error("Error loading or parsing items data: ", error);
      });

  public static fetchRepairs = async () =>
    fetch(`${hostname}/repairs`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw repairs Data:", itemsData);
        if (!DBQueries.validateRepairsResponse(itemsData)) {
          throw new Error("Invalid repair response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load repairs");
        }
        console.log("repairs Array Data:", itemsData.responseObject);
        return itemsData.responseObject;
      })
      .then((repairsData: unknown[]) => {
        console.log("Mapped repairs Data:", repairsData);
        repairsData.forEach((part) => {
          if (!DBQueries.validateRepair(part)) {
            console.log("Invalid Part:", part);
            throw new Error("Invalid part found");
          }
        });
        if (!DBQueries.validateRepairsArray(repairsData)) {
          throw new Error("Invalid part array");
        }
        return repairsData;
      })
      .catch((error) => {
        console.error("Error loading server data: ", error); // More detailed error logging
      });

  public static fetchTransactionDetails = async (transaction_id: string) =>
    fetch(`${hostname}/transactionDetails/${transaction_id}`)
      .then((response) => {
        if(!response.ok){
          throw new Error("Failed to load Transactions Details");
        }
        if(response.status > 299){
          throw new Error("Failed to load Transactions Details");
        }
        return response;
      })
      .then((response) => response.json())
      .then((transactionDetailsData: unknown) => {
        console.log("Raw Transactions Details Data:", transactionDetailsData);
        if (!DBQueries.validateArrayResponse(transactionDetailsData)) {
          throw new Error("Invalid Transactions Details response");
        }
        if (!transactionDetailsData.success) {
          throw new Error("Failed to load Transactions Details");
        }
        console.log("Transactions Details Array Data:", transactionDetailsData.responseObject);
        return transactionDetailsData.responseObject;
      })
      .then((transactionDetailsArray: unknown[]) => {
        console.log("Mapped Transactions Details Data:", transactionDetailsArray);
        transactionDetailsArray.forEach((part) => {
          if (!DBQueries.validateTransactionDetails(part)) {
            console.log("Invalid Transactions Details:", part);
            throw new Error("Invalid Transactions Details found");
          }
        });
        if (!DBQueries.validateTransactionDetailsArray(transactionDetailsArray)) {
          throw new Error("Invalid Transactions Details array");
        }
        return transactionDetailsArray;
      })
      .catch((error) => {
        console.error("Error loading transactions data: ", error); // More detailed error logging
      });

  public static postTransactionDetails = async () =>
    fetch(`${hostname}/transactionDetails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw repairs Data:", itemsData);
        if (!DBQueries.validateRepairsResponse(itemsData)) {
          throw new Error("Invalid repair response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load repairs");
        }
        console.log("repairs Array Data:", itemsData.responseObject);
        return itemsData.responseObject;
      })
      .then((repairsData: unknown[]) => {
        console.log("Mapped repairs Data:", repairsData);
        repairsData.forEach((part) => {
          if (!DBQueries.validateRepair(part)) {
            console.log("Invalid Part:", part);
            throw new Error("Invalid part found");
          }
        });
        if (!DBQueries.validateRepairsArray(repairsData)) {
          throw new Error("Invalid part array");
        }
        return repairsData;
      })
      .catch((error) => {
        console.error("Error loading server data: ", error); // More detailed error logging
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

  public static getItemsQuery = () => {
    return queryOptions({
      queryKey: ["items"],
      queryFn: () => this.fetchItems(),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
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

  public static getTransactionDetailsQuery = (transaction_id: string) => {
    return queryOptions({
      queryKey: ["transactionDetails", transaction_id],
      queryFn: () => this.fetchTransactionDetails(transaction_id),
      refetchOnWindowFocus: false,
      staleTime: 600000, // Cache products for 10 minutes
    });
  };
}

DBQueries.initialize();

export default DBQueries;
