import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { queryClient } from "../../../app/queryClient";
import DBModel, {
  Transaction,
  UpdateTransaction,
  Customer,
  Repair,
  RepairDetails,
  Part,
  ItemDetails,
  User,
} from "../../../model";

const debug: boolean = import.meta.env.VITE_DEBUG;

interface UseTransactionMutationsProps {
  transaction_id: string;
  transactionData?: Transaction;
  user: User | null;
  setIsEmployee: (value: boolean) => void;
}

/**
 * Custom hook to centralize all transaction mutation logic
 */
export const useTransactionMutations = ({
  transaction_id,
  transactionData,
  user,
  setIsEmployee,
}: UseTransactionMutationsProps) => {
  // Email mutations
  const sendCheckoutEmail = useMutation({
    mutationFn: (customer: Customer) => {
      if (!transactionData) throw new Error("Transaction data not found");
      DBModel.postTransactionLog(
        transactionData.transaction_num,
        user?.user_id ?? "",
        "sent email",
        "completed transaction",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData.transaction_num],
      });
      return DBModel.sendEmail(customer, transactionData.transaction_num);
    },
    onSuccess: () => {
      toast.success("Email sent");
    },
    onError: (error) => {
      toast.error("Error sending email: " + error);
    },
  });

  const sendReceiptEmail = useMutation({
    mutationFn: ({
      customer,
      transaction_id: txId,
    }: {
      customer: Customer;
      transaction_id: string;
    }) => {
      if (!transactionData || !transactionData.transaction_num)
        throw new Error("Transaction data not found");
      return DBModel.sendRecieptEmail(
        customer,
        transactionData.transaction_num ?? "",
        txId,
      );
    },
    onSuccess: () => {
      toast.success("Receipt email sent");
    },
    onError: (error) => {
      toast.error("Error sending receipt email: " + error);
    },
  });

  // Transaction mutations
  const updateTransaction = useMutation({
    mutationFn: (input: {
      transaction_id: string;
      transaction: UpdateTransaction;
    }) => {
      if (debug) console.log("calling update transaction on dbmodel");
      return DBModel.updateTransaction(input.transaction_id, input.transaction);
    },
    onSuccess: (data: Transaction) => {
      queryClient.invalidateQueries({
        queryKey: ["transaction", transaction_id],
      });
      if (debug) console.log("transaction updated", data);
    },
    onError: (error) => {
      toast.error("error updating transaction" + error);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (transaction: Transaction) => {
      DBModel.postTransactionLog(
        transaction.transaction_num,
        user?.user_id ?? "",
        "transaction deleted",
        "transaction",
      );
      queryClient.invalidateQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      return DBModel.deleteTransaction(transaction.transaction_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transaction", transaction_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
      if (debug) console.log("transaction deleted");
    },
  });

  // Repair mutations
  const completeRepair = useMutation({
    mutationFn: (input: {
      transaction_detail_id: string;
      status: boolean;
      repair_name: string;
    }) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user?.user_id ?? "",
        input.repair_name,
        `${input.status ? "completed" : "reopened"} repair`,
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      if (debug)
        console.log("calling update transaction on dbmodel", input.status);
      return DBModel.updateTransactionDetails(
        input.transaction_detail_id,
        input.status,
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "repair"],
      });
      if (debug) console.log("repair updated", data);
    },
    onError: (error) => {
      toast.error("error updating repair" + error);
    },
  });

  const addRepair = useMutation({
    mutationFn: (repair: Repair) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user?.user_id ?? "",
        repair.name,
        "added repair",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      return DBModel.postTransactionDetails(
        transaction_id,
        repair.repair_id,
        user?.user_id ?? "",
        1,
        "repair",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "repair"],
      });
      if (debug) console.log("repair added");
    },
  });

  const deleteRepair = useMutation({
    mutationFn: (transactionDetail: RepairDetails) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user?.user_id ?? "",
        transactionDetail.Repair.name,
        "deleted repair",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      return DBModel.deleteTransactionDetails(
        transactionDetail.transaction_detail_id,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "repair"],
      });
      if (debug) console.log("repair deleted");
    },
  });

  // Part mutations
  const addPart = useMutation({
    mutationFn: (part: Part) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user?.user_id ?? "",
        part.name,
        "added part",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      return DBModel.postTransactionDetails(
        transaction_id,
        part.item_id,
        user?.user_id ?? "",
        1,
        "item",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "item"],
      });
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });
      if (debug) console.log("part added");
    },
  });

  const deletePart = useMutation({
    mutationFn: (transactionDetail: ItemDetails) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user?.user_id ?? "",
        transactionDetail.Item.name,
        "deleted item",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });
      return DBModel.deleteTransactionDetails(
        transactionDetail.transaction_detail_id,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "item"],
      });
      if (debug) console.log("part deleted");
    },
  });

  // User check mutation
  const checkUser = useMutation({
    mutationFn: (net_id: string) => {
      return DBModel.fetchUser(net_id);
    },
    onSuccess: (data) => {
      if (debug) console.log("User found", data);
      setIsEmployee(true);
    },
    onError: (error) => {
      console.error("Error finding user", error);
      setIsEmployee(false);
    },
  });

  return {
    // Email
    sendCheckoutEmail,
    sendReceiptEmail,

    // Transaction
    updateTransaction,
    deleteTransaction,

    // Repairs
    completeRepair,
    addRepair,
    deleteRepair,

    // Parts
    addPart,
    deletePart,

    // User
    checkUser,
  };
};
