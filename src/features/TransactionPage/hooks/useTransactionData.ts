import { useEffect } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import DBModel, {
  ItemDetails,
  RepairDetails,
  Part,
  OrderRequest,
} from "../../../model";

const debug: boolean = import.meta.env.VITE_DEBUG;

/**
 * Custom hook to fetch all transaction-related data
 */
export const useTransactionData = (transaction_id: string) => {
  const [
    itemsQuery,
    repairsQuery,
    repairDetailsQuery,
    itemDetailsQuery,
    transactionQuery,
  ] = useQueries({
    queries: [
      DBModel.getItemsQuery(),
      DBModel.getRepairsQuery(),
      DBModel.getTransactionDetailsQuery(transaction_id, "repair"),
      DBModel.getTransactionDetailsQuery(transaction_id, "item"),
      DBModel.getTransactionQuery(transaction_id),
    ],
  });

  // Items/Parts query
  const {
    isLoading: partsLoading,
    data: parts,
    error: partsError,
  } = itemsQuery;

  useEffect(() => {
    if (partsError) toast.error("parts: " + partsError);
  }, [partsError]);

  // Repairs query
  const {
    isLoading: repairsLoading,
    data: repairs,
    error: repairError,
  } = repairsQuery;

  useEffect(() => {
    if (repairError) toast.error("repairs: " + repairError);
  }, [repairError]);

  // Repair details query
  const {
    isFetching: repairDetailsIsFetching,
    isLoading: repairDetailsLoading,
    data: queriedRepairDetails,
    error: repairDetailsError,
  } = repairDetailsQuery;

  useEffect(() => {
    if (repairDetailsError) toast.error("repairDetails: " + repairDetailsError);
  }, [repairDetailsError]);

  const repairDetails = queriedRepairDetails as RepairDetails[];

  // Item details query
  const {
    isFetching: itemDetailsIsFetching,
    isLoading: itemDetailsLoading,
    data: queriedItemDetails,
    error: itemDetailsError,
  } = itemDetailsQuery;

  useEffect(() => {
    if (itemDetailsError) toast.error("itemDetails: " + itemDetailsError);
  }, [itemDetailsError]);

  const itemDetails = queriedItemDetails as ItemDetails[];

  // Transaction query
  const {
    status: transactionStatus,
    isLoading: transactionLoading,
    data: transactionData,
    error: transactionError,
  } = transactionQuery;

  useEffect(() => {
    if (transactionError) toast.error("transaction: " + transactionError);
  }, [transactionError]);

  // Order request query
  const {
    data: orderRequestData,
    error: orderRequestError,
    isLoading: orderRequestLoading,
    isFetching: orderRequestIsFetching,
  } = useQuery({
    queryKey: ["orderRequest", transaction_id],
    queryFn: () => {
      return DBModel.getOrderRequests(transaction_id);
    },
    select: (data: OrderRequest[]) => {
      if (debug) console.log("converting incoming data", data);
      return (
        (data.flatMap((dataItem: OrderRequest) => {
          // Create an array with the same part repeated based on quantity
          return Array(dataItem.quantity).fill(dataItem.Item);
        }) as Part[]) ?? Array<Part>()
      );
    },
  });

  useEffect(() => {
    if (orderRequestError) toast.error("orderRequest: " + orderRequestError);
  }, [orderRequestError]);

  return {
    // Parts
    parts,
    partsLoading,
    partsError,

    // Repairs
    repairs,
    repairsLoading,
    repairError,

    // Repair Details
    repairDetails,
    repairDetailsLoading,
    repairDetailsIsFetching,
    repairDetailsError,

    // Item Details
    itemDetails,
    itemDetailsLoading,
    itemDetailsIsFetching,
    itemDetailsError,

    // Transaction
    transactionData,
    transactionLoading,
    transactionStatus,
    transactionError,

    // Order Requests
    orderRequestData,
    orderRequestLoading,
    orderRequestIsFetching,
    orderRequestError,
  };
};
