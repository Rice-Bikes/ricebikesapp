import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Stack, List, ListItem, Grid2, Skeleton } from "@mui/material";
import { OrderRequest, User } from "../../model";
import { useNavigate } from "react-router-dom";
import Item from "../../components/TransactionPage/HeaderItem";
import Notes from "../../components/Notes/Notes";
import { RowClickedEvent } from "ag-grid-community";
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import {
  SALES_TAX_MULTIPLIER,
  MECHANIC_PART_MULTIPLIER
} from "../../constants/transaction"
import DBModel, {
  ItemDetails,
  Part,
  Repair,
  RepairDetails,
  Transaction,
  UpdateTransaction,
  Bike,
  Customer
} from "../../model";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../app/queryClient";
import { toast } from "react-toastify";
import SearchModal from "../../components/ItemSearch/SearchModal";
import "./TransactionPage.css";
import NewBikeForm from "../../components/TransactionPage/BikeForm";
import TransactionOptionDropdown from "../../components/TransactionPage/TransactionOptionDropdown";
import WhiteboardEntryModal from "../../components/WhiteboardEntryModal";
import ErrorSharp from "@mui/icons-material/ErrorSharp";
import TransactionsLogModal from "../../components/TransactionsLogModal";
import CompleteTransactionDropdown from "./CompleteTransactionDropdown";
import SetProjectsTypesDropdown from "./SetProjectsTypesDropdown";
import DeleteTransactionsModal from "./DeleteTransactionsModal";
import CheckoutModal from "./CheckoutModal";

const debug: boolean = import.meta.env.VITE_DEBUG

const calculateTotalCost = (repairs: RepairDetails[], parts: ItemDetails[], orderRequest: Part[], isEmployee: boolean, isBeerBike: boolean) => {
  let total = 0;
  if (repairs)
    repairs.forEach((repair) => {
      total += repair.Repair.price;
    });
  if (parts)
    parts.forEach((part) => {
      total += !isEmployee || isBeerBike ? part.Item.standard_price : (part.Item.wholesale_cost * MECHANIC_PART_MULTIPLIER);
    });
  if (orderRequest)
    if (debug) console.log("calculating order request cost: ", orderRequest, total);
  orderRequest.forEach((part) => {
    total += !isEmployee || isBeerBike ? part.standard_price : (part.wholesale_cost * MECHANIC_PART_MULTIPLIER);
  });
  if (debug) console.log("total cost: ", total);
  return total;
};

const checkStatusOfRetrospec = (transaction: Transaction) => {

  if (transaction.is_refurb) {
    return "Building";
  }
  else if (transaction.is_waiting_on_email) {
    return "Completed";
  }
  else if (transaction.is_completed) {
    return "For Sale";
  }
  return "Arrived";
}

const checkUserPermissions = (user: User, permissionName: string): boolean => {
  if (debug) console.log("checking permission: ", permissionName);
  const permissions = user.permissions?.find((perm) => perm.name === permissionName);
  return permissions ? true : false;
}

//["Arrived", "Building", "Completed", "For Sale"]

interface TransactionDetailProps {
  propUser: User;
}

const TransactionDetail = ({ propUser }: TransactionDetailProps) => {
  const { transaction_id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  if (!transaction_id) {
    throw new Error("Transaction ID not provided");
  }

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

  const {
    isLoading: partsLoading,
    data: parts,
    error: partsError,
  } = itemsQuery;
  if (partsError) toast.error("parts: " + partsError);

  const {
    isLoading: repairsLoading,
    data: repairs,
    error: repairError,
  } = repairsQuery;
  if (repairError) toast.error("repairs: " + repairError);

  const {
    isFetching: repairDetailsIsFetching,
    isLoading: repairDetailsLoading,
    data: queriedRepairDetails,
    error: repairDetailsError,
  } = repairDetailsQuery;
  if (repairDetailsError) toast.error("repairDetails: " + repairDetailsError);

  const repairDetails = queriedRepairDetails as RepairDetails[];
  const {
    isFetching: itemDetailsIsFetching,
    isLoading: itemDetailsLoading,
    data: queriedItemDetails,
    error: itemDetailsError,
  } = itemDetailsQuery;
  if (itemDetailsError) toast.error("itemDetails: " + itemDetailsError);
  const itemDetails = queriedItemDetails as ItemDetails[];
  const {
    status: transactionStatus,
    isLoading: transactionLoading,
    data: transactionData,
    error: transactionError,
  } = transactionQuery;
  if (transactionError) toast.error("transaction: " + transactionError);

  const { data: orderRequestData, error: orderRequestError, isLoading: orderRequestLoading, isFetching: orderRequestIsFetching } = useQuery({
    queryKey: ["orderRequest", transaction_id],
    queryFn: () => {
      return DBModel.getOrderRequests(transaction_id);
    },
    select: (data: OrderRequest[]) => {
      if (debug) console.log("converting incoming data", data);
      return data.flatMap((dataItem: OrderRequest) => {
        // Create an array with the same part repeated based on quantity
        return Array(dataItem.quantity).fill(dataItem.Item);
      }) as Part[] ?? Array<Part>();
    },
  });
  if (orderRequestError) toast.error("orderRequest: " + orderRequestError);


  const [bike, setBike] = useState<Bike>(null);
  const user: User = propUser; //queriedUser ?? { user_id: "1" };
  // const [customer, setCustomer] = useState(transaction?.Customer);
  const [transactionType, setTransactionType] = useState<string>(
    searchParams.get("type") ?? ""
  );
  // TODO: make a state that checks to see if you're the first person to
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showBikeForm, setShowBikeForm] = useState<boolean>(false);
  const [showWaitingParts, setShowWaitingParts] = useState<boolean>(false);

  const [refurb, setIsRefurb] = useState<boolean>(); // TODO: create refurb Button
  const [reserved] = useState<boolean>(transactionData?.is_reserved ?? false); // TODO: create retrospec stuff
  const [waitEmail, setWaitEmail] = useState<boolean>(
    transactionData?.is_waiting_on_email ?? false
  );
  const [waitPart, setWaitPart] = useState<boolean>();
  const [priority, setPriority] = useState<boolean>();
  const [nuclear, setNuclear] = useState<boolean>();
  const [description, setDescription] = useState<string>();
  const [isPaid, setPaid] = useState<boolean>(transactionData?.is_paid ?? false);
  const [isCompleted, setIsCompleted] = useState<boolean>();
  const [beerBike, setBeerBike] = useState<boolean>();
  const [isEmployee, setIsEmployee] = useState<boolean>(false);

  // const [doneRepairs, setDoneRepairs] = useState<Record<string, boolean>>({});
  // Remember last checked netid to avoid repeatedly calling fetchUser for
  // the same customer when transactionData updates (prevents noisy requests
  // like `/users/eesanders25` on every transaction refetch).
  const lastCheckedNetIdRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      const email = transactionData?.Customer?.email;
      if (!email) return;
      const netId = email.split("@")[0];
      if (transactionType === "Retrospec") return;
      if (lastCheckedNetIdRef.current === netId) return;
      lastCheckedNetIdRef.current = netId;
      checkUser.mutate(netId);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionData, transactionType]);

  const sendCheckoutEmail = useMutation({
    mutationFn: (customer: Customer) => {
      if (!transactionData) throw new Error("Transaction data not found");
      else
        DBModel.postTransactionLog(
          transactionData.transaction_num,
          user.user_id,
          "sent email",
          "completed transaction"
        );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData.transaction_num],
      });
      return DBModel.sendEmail(
        customer,
        transactionData.transaction_num
      );
    },
    onSuccess: () => {
      toast.success("Email sent");
    },
    onError: (error) => {
      toast.error("Error sending email: " + error);
    },
  })

  const sendRecieptEmail = useMutation({
    mutationFn: ({ customer, transaction_id }: { customer: Customer, transaction_id: string }) => {
      if (!transactionData || !transactionData.transaction_num) throw new Error("Transaction data not found");
      return DBModel.sendRecieptEmail(
        customer,
        transactionData.transaction_num ?? '',
        transaction_id,
      );
    },
    onSuccess: () => {
      toast.success("Receipt email sent");
    },
    onError: (error) => {
      toast.error("Error sending receipt email: " + error);
    },
  });

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


  const completeRepair = useMutation({
    mutationFn: (input: {
      transaction_detail_id: string;
      status: boolean;
      repair_name: string;
    }) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user.user_id,
        input.repair_name,
        `${input.status ? "completed" : "reopened"} repair`,
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      if (debug) console.log("calling update transaction on dbmodel", input.status);
      return DBModel.updateTransactionDetails(input.transaction_detail_id, input.status);
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

  const checkUser = useMutation({
    mutationFn: (net_id: string) => {
      return DBModel.fetchUser(net_id);
    },
    onSuccess: (data) => {
      if (debug) console.log("User found", data);
      setIsEmployee(true)
    },
    onError: (error) => {
      console.error("Error finding user", error);
      setIsEmployee(false)
    }
  });
  useEffect(() => {
    if (debug) console.log(
      "waiting on data",
      transactionStatus,
      description === "",
      description === null
    );
    if (
      transactionStatus !== "pending" &&
      transactionStatus !== "error" &&
      description !== "" &&
      description !== null &&
      isCompleted !== undefined

    ) {
      // if (debug) // console.log("description before update: ", description);


      const updatedTransaction = {
        description: description ?? "",
        transaction_type: transactionType,
        total_cost: totalPrice,
        is_waiting_on_email: waitEmail,
        is_urgent: priority ?? false,
        is_nuclear: nuclear ?? false,
        is_completed: isCompleted,
        is_paid: isPaid,
        is_beer_bike: beerBike ?? false,
        is_refurb: refurb,
        is_reserved: reserved,
        is_employee: isEmployee ?? false,
        bike_id: bike?.bike_id,
        date_completed: !isCompleted ? null : transactionData?.date_completed === null && isCompleted
          ? new Date().toISOString()
          : transactionData?.date_completed,
      } as UpdateTransaction;

      // if (debug) // console.log("description after update", updatedTransaction.description);
      updateTransaction.mutate({
        transaction_id: transaction_id,
        transaction: updatedTransaction,
      });
      if (debug) console.log("submitted update");
      // setCurrentTransaction({
      //   ...transactionData,
      //   Transaction: transactionData,
      // });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isPaid,
    transactionData,
    description,
    totalPrice,
    waitEmail,
    priority,
    nuclear,
    isCompleted,
    showCheckout,
    bike,
    beerBike,
    refurb,
    reserved,
    transactionStatus,
    transactionType,
    isEmployee,
  ]);

  useEffect(() => {
    if (transactionData) {
      if (transactionData.is_waiting_on_email !== waitEmail)
        setWaitEmail(transactionData.is_waiting_on_email);
      if (transactionData.is_urgent && transactionData.is_urgent !== priority)
        setPriority(transactionData.is_urgent);
      if (transactionData.is_nuclear && transactionData.is_nuclear !== nuclear)
        setNuclear(transactionData.is_nuclear);
      if (
        transactionData.description &&
        transactionData.description !== description
      )
        setDescription(transactionData.description);
      if (transactionData.is_paid !== isPaid) setPaid(transactionData.is_paid);
      if (transactionData.is_completed !== isCompleted)
        setIsCompleted(transactionData.is_completed);
      if (transactionData.is_beer_bike !== beerBike)
        setBeerBike(transactionData.is_beer_bike);
      if (transactionData.is_refurb !== refurb)
        setIsRefurb(transactionData.is_refurb);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionData]);

  const addRepair = useMutation({
    mutationFn: (repair: Repair) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user.user_id,
        repair.name,
        "added repair",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      return DBModel.postTransactionDetails(
        transaction_id,
        repair.repair_id,
        user.user_id,
        1,
        "repair"
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
        user.user_id,
        transactionDetail.Repair.name,
        "deleted repair",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      return DBModel.deleteTransactionDetails(
        transactionDetail.transaction_detail_id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "repair"],
      });
      if (debug) console.log("repair deleted");
    },
  });

  const addPart = useMutation({
    mutationFn: (part: Part) => {
      DBModel.postTransactionLog(
        transactionData?.transaction_num ?? 0,
        user.user_id,
        part.name,
        "added part",
      );
      queryClient.removeQueries({
        queryKey: ["transactionLogs", transactionData?.transaction_num],
      });
      return DBModel.postTransactionDetails(
        transaction_id,
        part.item_id,
        user.user_id,
        1,
        "item"
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
        user.user_id,
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
        transactionDetail.transaction_detail_id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "item"],
      });
      if (debug) console.log("part deleted");
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (transaction: Transaction) => {
      DBModel.postTransactionLog(
        transaction.transaction_num,
        user.user_id,
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
      nav("/");
    },
  });

  const handlePaid = () => {
    setPaid(true);
    setWaitEmail(false);
    setNuclear(false);
    setPriority(false);
    closeCheckout();
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
    DBModel.postTransactionLog(
      transactionData!.transaction_num,
      user.user_id,
      `checked out transaction for $${totalPrice}`,
      "transaction",
    );
    const customer: Customer = transactionData?.Customer as Customer;
    sendRecieptEmail.mutate({ customer, transaction_id: transactionData!.transaction_id });
    nav("/");
  };

  const handleRetrospecStatusChange = (newStatus: string) => {
    // console.log("new status retrospec", newStatus)
    switch (newStatus) {
      case "Building":
        setIsRefurb(true);
        break;
      case "Completed":
        setIsRefurb(false);
        setWaitEmail(true);
        break;
      case "For Sale":
        if (!checkUserPermissions(user, "safetyCheckBikes")) {
          return;
        }
        setWaitEmail(false);
        setIsCompleted(true);
        break;
      default:
        setIsCompleted(false);
        setWaitEmail(false);
        setIsRefurb(false);
        break;
    }
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  }

  const handleTransactionTypeChange = (newTransactionType: string) => {
    setSearchParams((params) => {
      params.set("type", newTransactionType);
      return params;
    });
    setTransactionType(newTransactionType);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleWaitEmail = () => {
    setWaitEmail(!waitEmail);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleWaitPartClick = () => {
    setShowWaitingParts(!showWaitingParts);
  };

  const handlePriority = () => {
    if (debug) console.log("priority: ", priority);

    setPriority(!priority);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleNuclear = () => {
    if (debug) console.log("nuclear: ", nuclear);
    setNuclear(!nuclear);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleMarkDone = async (email: boolean) => {
    if (!transactionData) return;
    if (!transactionData.Customer) return;
    setIsCompleted(true);

    const customer: Customer = transactionData?.Customer as Customer;
    if (isCompleted === false && email) {
      sendCheckoutEmail.mutate(customer);
      DBModel.postTransactionLog(
        transactionData.transaction_num,
        user.user_id,
        "completed and sent email",
        "transaction",
      );
    }
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });

  }

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const closeCheckout = () => {
    setShowCheckout(false);
  };

  const handleSaveNotes = (newNotes: string) => {
    if (debug) console.log("new notes: ", newNotes);
    queryClient.resetQueries({
      queryKey: ["transactionLogs", transaction_id],
    });
    // Ensure we store valid Lexical JSON. If the incoming notes are plain
    // text, wrap them in a minimal Lexical paragraph node to avoid
    // overwriting canonical editor JSON (which may contain decorator nodes).
    const isValidLexical = (s: string) => {
      try {
        const p = JSON.parse(s);
        return typeof p === 'object' && p !== null;
      } catch {
        return false;
      }
    };

    const payload = isValidLexical(newNotes)
      ? newNotes
      : JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: newNotes }] }] } });

    setDescription(payload);
  };

  useEffect(() => {
    if (
      !repairDetailsIsFetching &&
      !itemDetailsIsFetching &&
      !orderRequestIsFetching &&
      (repairDetails || itemDetails || orderRequestData)
    ) {
      setTotalPrice(
        calculateTotalCost(
          repairDetails as RepairDetails[],
          itemDetails as ItemDetails[],
          orderRequestData as Part[],
          isEmployee,
          beerBike ?? false
        )
      );
    }
  }, [
    repairDetails,
    repairDetailsIsFetching,
    itemDetails,
    itemDetailsIsFetching,
    orderRequestData,
    orderRequestIsFetching,
    isEmployee,
    beerBike
  ]);

  if (repairsLoading || partsLoading || transactionLoading) {
    return <Skeleton />;
  }

  if (repairError || partsError || transactionError) {
    return <p>Error loading data</p>;
  }

  const handleAddRepair = (event: RowClickedEvent) => {
    const repair = event.data as Repair;
    if (debug) console.log("handle add repair");
    addRepair.mutate(repair);
  };

  const handleRemoveRepair = (repair: RepairDetails) => {
    deleteRepair.mutate(repair);
  };

  const handleAddPart = (event: RowClickedEvent) => {
    const part = event.data as Part;
    addPart.mutate(part);
  };
  const handleAddOrderedPart = (item: Part) => {
    addPart.mutate(item);
  };

  const handleRemovePart = (part: ItemDetails) => {
    deletePart.mutate(part);
  };

  const toggleDoneRepair = (repairDetail: RepairDetails) => {
    const newStatus: boolean = !repairDetail.completed;
    const repairId: string = repairDetail.transaction_detail_id;
    completeRepair.mutate({ repair_name: repairDetail.Repair.name, transaction_detail_id: repairId, status: newStatus });

  };

  const blockCompletion = () => {
    if (!repairDetails) return false;
    if (repairDetails.length === 0 && (searchParams.get("type") === "Merch" || refurb)) return false;
    if (debug) console.log("repair details: ", repairDetails);
    return !repairDetails.every((repair: RepairDetails) => repair.completed);
  };

  if (transactionData === undefined || transactionData.Customer === undefined) {
    return <Skeleton />;
  }

  if (transactionData.Customer === null) {
    return <p>Customer not found</p>;
  }
  return (
    <div
      className="transaction-container"
    >
      <Stack
        className="transaction-header"
      >
        {/* <h2>Transaction Details</h2> */}
        <Grid2 container>
          <Grid2
            size={6}
            className="transaction-options-container"
          >
            <h2
              style={{
                marginRight: "10px",
                paddingTop: "5px",
              }}
            >
              {transactionData.transaction_num + ": "}
              {/* <strong>Name: </strong> */}
              {"  " + transactionData.Customer.first_name}{" "}
              {transactionData.Customer.last_name}
            </h2>
            <TransactionOptionDropdown
              options={["Inpatient", "Outpatient", "Merch", "Retrospec"]}
              colors={["green", "blue", "gray", "orange"]}
              setTransactionType={handleTransactionTypeChange}
              initialOption={transactionType.toLowerCase()}
              isAllowed={(index: string) => index === "Retrospec" ? checkUserPermissions(user, "createRetrospecTransaction") : true}
            />
            {transactionType.toLowerCase() === "retrospec" &&
              <TransactionOptionDropdown
                options={["Arrived", "Building", "Completed", "For Sale"]}
                colors={["gray"]}
                setTransactionType={handleRetrospecStatusChange}
                initialOption={checkStatusOfRetrospec(transactionData)}
                isAllowed={(option: string) => ["For Sale", "Arrived"].includes(option) ? checkUserPermissions(user, "safetyCheckBikes") : true}
              />}
            {beerBike && <Button
              style={{
                backgroundColor: "turquoise",
                color: "black",
                pointerEvents: "none",
                width: "fit-content",
                // wordWrap: "break-word",
                whiteSpace: "nowrap",
              }}
              variant="contained"
              size="small"

            > Beer Bike</Button>
            }

            {(refurb && transactionType.toLowerCase() !== "retrospec") && <Button
              style={{
                backgroundColor: "beige",
                color: "black",
                pointerEvents: "none",
              }}
              variant="contained"
              size="small"
            >
              Refurb
            </Button>
            }
            {isEmployee && <Button
              style={{
                backgroundColor: "green",
                color: "white",
                pointerEvents: "none",
              }}
              variant="contained"
              size="small"
            >
              Employee
            </Button>}
          </Grid2>
          <Grid2
            size={6}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "5px"
            }}
          >
            <TransactionsLogModal
              transaction_num={transactionData.transaction_num}
            />

            {
              (transactionType.toLowerCase() !== "retrospec"
                ||
                transactionType.toLowerCase() === "retrospec"
                && checkUserPermissions(user, "createRetrospecTransaction"))
              &&
              <DeleteTransactionsModal
                handleConfirm={() => deleteTransaction.mutate(transactionData as Transaction)}
              />
            }
          </Grid2>
        </Grid2>
        <Item
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "space-between",
          }}
        >
          <h3>
            <strong>📧: </strong>
            <a
              href={`mailto:${transactionData.Customer.email}?subject=Your bike`} >
              {transactionData.Customer.email}
            </a>
          </h3>
          <h3>
            <strong>#: </strong>
            {transactionData.Customer.phone}
          </h3>
        </Item>

        <Notes
          notes={transactionData.description ?? ""}
          onSave={handleSaveNotes}
          transaction_num={transactionData.transaction_num}
          // checkUser={alertAuth}
          user={user}
        />

        <h3>Bike Information</h3>
        <Item style={{ color: "black" }}>
          {" "}
          {transactionData.Bike ? (
            <Grid2 container>
              <Grid2 size={2} sx={{ display: "flex", justifyContent: "flex-start", margin: "30px 0" }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "gray",
                    marginLeft: "10px",
                  }}
                  onClick={() => {
                    setBike({
                      ...bike,
                      description: transactionData.Bike?.description ?? "",
                      make: transactionData.Bike?.make ?? "",
                      model: transactionData.Bike?.model ?? "",
                    });
                    setShowBikeForm(true);
                  }}
                >
                  <ModeEditIcon />
                </Button>
              </Grid2>
              <Grid2 size={8}>
                <h2>
                  {transactionData.Bike.make + " " + transactionData.Bike.model}
                </h2>
                <h2>{transactionData.Bike.description}</h2>
              </Grid2>
              <Grid2 size={2} sx={{ display: "flex", justifyContent: "flex-end", margin: "30px 0" }}>
              </Grid2>

            </Grid2>
          ) : (
            <Button
              color="primary"
              variant="contained"
              onClick={() => setShowBikeForm(true)}
            >
              Add Bike
            </Button>
          )}
        </Item>

        <NewBikeForm
          isOpen={showBikeForm}
          onClose={() => setShowBikeForm(false)}
          onBikeCreated={(bike: Bike) => {
            setBike(bike);
            setShowBikeForm(false);
            queryClient.invalidateQueries({
              queryKey: ["transactions"],
            });
          }}
          bike={bike === null ? {
            make: "",
            model: "",
            description: "",
          } : bike}
        />
      </Stack>
      <hr />
      <Grid2
        container
        id="transaction-details"
        spacing={2}
        sx={{
          paddingBottom: "20px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        {/* <Grid2 id="search" size = {12}> */}
        <Grid2 size={6}>
          <SearchModal
            searchData={repairs == undefined ? [] : repairs}
            columnData={[
              {
                field: "name",
                headerName: "Name",
                width: 200,
                autoHeight: true,
                wrapText: true,
                filter: true,
                tooltipField: "description",
                headerTooltip: "Name of repairs",
              },
              { field: "price", headerName: "Price", width: 200 },
            ]}
            colDefaults={{
              flex: 1,
            }}
            onRowClick={(row) => handleAddRepair(row)}
          >
            Add Repair
          </SearchModal>
        </Grid2>
        <Grid2 size={6}>
          <SearchModal
            searchData={parts == undefined ? [] : parts}
            columnData={[
              {
                field: "name",
                headerName: "Name",
                width: 200,
                autoHeight: true,
                wrapText: true,
                flex: 2,
                filter: true,
              },
              { field: "description", headerName: "Description" },
              { field: "brand", headerName: "Brand" },
              {
                field: "standard_price", headerName: "Price", width: 200,
                valueGetter: (params) => params.data?.standard_price as number > 0 ? params.data?.standard_price : params.data?.wholesale_cost as number * 2,

              },
              // { field: "stock", headerName: "Stock", width: 200 }, //TODO: Verify that this piece is actually true
              {
                field: "upc",
                headerName: "UPC",
                width: 200,
                wrapText: true,
                autoHeight: true,
                filter: true,
              },
            ]}
            colDefaults={{
              flex: 1,
            }}
            onRowClick={(row) => handleAddPart(row)}
          >
            Add Part
          </SearchModal>
        </Grid2>
        <Grid2 size={6} sx={{ textAlign: "center", bgcolor: "#FFF3E0", padding: "10px", borderRadius: "10px" }}>
          <h3>Repairs</h3>
          {!repairDetailsLoading && repairDetails ? (
            <List sx={{
              width: "100%",
              borderRadius: "7px",
              bgcolor: "background.paper",
              opacity: repairDetails.length === 0 ? 0 : 1
            }}>
              {repairDetails.map((transactionDetail: RepairDetails) => (
                <ListItem
                  key={transactionDetail.transaction_detail_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    padding: "10px",
                    width: "100%",
                  }}
                >
                  <>
                    <span>
                      {transactionDetail.Repair.name} - $
                      {transactionDetail.Repair.price.toFixed(2)}
                    </span>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ padding: " 0 2px" }}
                    >
                      <Button
                        onClick={() =>
                          toggleDoneRepair(
                            transactionDetail
                          )
                        }
                        style={{
                          border: "2px solid black",
                          marginLeft: "10px",
                          cursor: "pointer",
                          backgroundColor: transactionDetail.completed
                            ? "green"
                            : "initial",
                          color: "black",
                        }}
                        size="medium"
                      >
                        {transactionDetail.completed
                          ? "Done"
                          : "Mark as Done"}
                      </Button>
                      <Button
                        onClick={() => handleRemoveRepair(transactionDetail)}
                        style={{
                          marginLeft: "10px",
                          cursor: "pointer",
                          border: "white",
                          backgroundColor: "red",
                          color: "white",
                          // margin: "10px",
                        }}
                        size="medium"
                      >
                        Delete
                      </Button>
                    </Stack>
                  </>
                </ListItem>
              ))}
            </List>

          ) : (
            <Skeleton
              variant="rectangular"
              animation="wave"
              style={{ marginBottom: "10px", opacity: 0.5 }}
            />)}
        </Grid2>

        <Grid2 size={6} sx={{ textAlign: "center", bgcolor: "#E3F2FD", padding: "10px", borderRadius: "10px" }}>
          <h3>Parts</h3>

          {!itemDetailsLoading && itemDetails ? (
            <List sx={{
              width: "100%", bgcolor: "background.paper", borderRadius: "7px", opacity: itemDetails.length === 0 ? 0 : 1
            }}>
              {(itemDetails as ItemDetails[]).map((part: ItemDetails) => (

                <ListItem
                  key={part.transaction_detail_id}
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span>
                    {part.Item.name} - ${!isEmployee || beerBike ? part.Item.standard_price.toFixed(2) : (part.Item.wholesale_cost * MECHANIC_PART_MULTIPLIER).toFixed(2)}
                  </span>
                  <Stack direction="row" spacing={2} sx={{ padding: " 0 2px" }}>
                    <Button
                      onClick={() => {
                        handleRemovePart(part);
                      }}
                      style={{
                        marginLeft: "10px",
                        cursor: "pointer",
                        border: "white",
                        backgroundColor: "red",
                        color: "white",
                      }}
                      size="medium"
                    >
                      Delete
                    </Button>
                  </Stack>
                </ListItem>
              ))}
            </List>

          ) : (
            <Skeleton
              variant="rectangular"
              animation="wave"
              style={{ marginBottom: "10px", opacity: 0.5 }}
            />
          )}

          {!orderRequestLoading && orderRequestData ? (
            <List sx={{
              width: "100%",
              bgcolor: "background.paper",
              borderRadius: "7px",
              opacity: orderRequestData.length === 0 ? 0 : 1,
              marginTop: "10px",
            }}>
              {(orderRequestData).map((part: Part) => (
                <ListItem
                  key={part.item_id}
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    opacity: 0.5,
                  }}
                >
                  <span>
                    {part.name} - ${!isEmployee || beerBike ? part.standard_price.toFixed(2) : (part.wholesale_cost * MECHANIC_PART_MULTIPLIER).toFixed(2)}
                  </span>
                  <Stack direction="row" spacing={2} sx={{ padding: " 0 2px" }}>
                    <Button
                      style={{
                        marginLeft: "10px",
                        cursor: "pointer",
                        border: "white",
                        backgroundColor: "red",
                        color: "white",
                      }}
                      disabled
                      size="medium"
                    >
                      Delete
                    </Button>
                  </Stack>
                </ListItem>

              ))}
            </List>

          ) : (
            <Skeleton
              variant="rectangular"
              animation="wave"
              style={{ marginBottom: "10px", opacity: 0.5 }}
            />
          )}
        </Grid2>
      </Grid2>

      <Grid2 container sx={{ marginTop: "5vh", backgroundColor: "white", borderRadius: "10px", padding: "10px" }}>
        <Grid2
          size={12}
          style={{
            borderRadius: "10px",
            height: "50%",
            marginBottom: "5px",
          }}
        >
          <h3>Total</h3>
          <p>
            <strong>${(totalPrice * SALES_TAX_MULTIPLIER).toFixed(2)}</strong>
          </p>
          <WhiteboardEntryModal
            open={showWaitingParts}
            onClose={() => setShowWaitingParts(false)}
            setWaitingOnParts={(waiting: boolean) => setWaitPart(waiting)}
            waitingOnParts={waitPart ?? false}
            parts={parts as Part[]}
            transaction_id={transaction_id}
            user_id={user.user_id}
            handleAddOrderedPart={handleAddOrderedPart}
          />
        </Grid2>
        <Grid2
          style={{
            color: "white", gap: "2px", height: "50%", marginBottom: "10px",
          }}
          size={12}
          gap={2}

        >
          <Grid2 size={6} >
            <Stack spacing={1} direction="row" alignItems="center" height={"6vh"}>
              <Button
                onClick={handleWaitPartClick}
                style={{
                  backgroundColor: waitPart ? "red" : "grey",
                  color: "white",
                  height: "100%"
                }}
                variant="contained"
              >
                Wait on Part
              </Button>
              <Button
                onClick={handleWaitEmail}
                style={{
                  backgroundColor: waitEmail ? "red" : "grey",
                  color: "white",
                  height: "100%"
                }}
                variant="contained"
              >
                Wait on Email
              </Button>
              <Button
                onClick={handlePriority}
                style={{
                  backgroundColor: "black",
                  height: "100%"

                }}
                disableElevation={!priority}
                variant="contained"
              >
                <ErrorSharp
                  style={{
                    color: priority ? "red" : "white",
                    marginRight: "5px",
                  }}
                />
              </Button>
              <Button
                onClick={handleNuclear}
                style={{
                  // backgroundColor: nuclear ? "white" : "grey",
                  borderColor: nuclear ? "red" : "black",
                  color: nuclear ? "red" : "black",
                  width: "fit-content",
                  height: "100%"

                }}
                // disabled={checkUserPermissions(user, "setAtomic")}

                variant="outlined"
              >
                {nuclear ?
                  <i
                    className="fas fa-radiation"
                    style={{ color: "red" }}
                  /> : "Mark as Nuclear"}
              </Button>

              <SetProjectsTypesDropdown
                setRefurb={() => setIsRefurb(!refurb)}
                setBeerBike={() => setBeerBike(!beerBike)}
              />
            </Stack>
          </Grid2>

        </Grid2>
        <Grid2 size={6} >
          <Button
            onClick={handleCheckout}
            disabled={!isCompleted}
            style={{
              backgroundColor: isCompleted ? "green" : "grey",
              border: "white",
              marginRight: "10px",
              color: "white",
              // cursor: allRepairsDone() ? "pointer" : "not-allowed",
              opacity: isCompleted ? 1 : 0.5,
            }}
            variant="outlined"
          >
            Checkout
          </Button>
          {showCheckout &&
            <CheckoutModal
              repairDetails={repairDetails as RepairDetails[]}
              itemDetails={itemDetails as ItemDetails[]}
              totalPrice={totalPrice}
              isEmployee={isEmployee}
              beerBike={beerBike ?? false}
              handlePaid={handlePaid}
              closeCheckout={closeCheckout}
            />
          }
          {!isCompleted ? (
            <CompleteTransactionDropdown
              sendEmail={() => handleMarkDone(true)}
              disabled={blockCompletion()}
              completeTransaction={() => handleMarkDone(false)}
            />
          ) : <Button
            onClick={() => {
              setIsCompleted(false);
              setPaid(false);
              queryClient.invalidateQueries({
                queryKey: ["transaction", transaction_id],
              });
              queryClient.invalidateQueries({
                queryKey: ["transactions"],
              });
            }}
            style={{
              marginRight: "10px",
              color: "white",
              backgroundColor: "gray",
            }}
            variant="outlined"
          >
            Reopen Transaction
          </Button>

          }
        </Grid2>
      </Grid2>

    </div>
  );
};

export default TransactionDetail;
