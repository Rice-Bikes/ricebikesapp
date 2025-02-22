import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Stack, List, ListItem, Grid2 } from "@mui/material";
import { User } from "../../model";
import { useNavigate } from "react-router-dom";
import Item from "../../components/TransactionPage/HeaderItem";
import Notes from "../../components/TransactionPage/Notes";
import { ITooltipParams, RowClickedEvent } from "ag-grid-community";
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
import { useMutation, useQueries } from "@tanstack/react-query";
import { queryClient } from "../../app/main";
import { ToastContainer, toast } from "react-toastify";
import SearchModal from "../../components/TransactionPage/SearchModal";
import "./TransactionPage.css";
import NewBikeForm from "../../components/TransactionPage/BikeForm";
import TransactionOptionDropdown from "../../components/TransactionPage/TransactionOptionDropdown";
import WhiteboardEntryModal from "../../components/WhiteboardEntryModal";
import ErrorSharp from "@mui/icons-material/ErrorSharp";

const calculateTotalCost = (repairs: RepairDetails[], parts: ItemDetails[]) => {
  let total = 0;
  if (repairs)
    repairs.forEach((repair) => {
      total += repair.Repair.price;
    });
  if (parts)
    parts.forEach((part) => {
      total += part.Item.standard_price;
    });
  return total;
};

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
    // status: itemDetailsStatus,
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

  // const queriedUser: User | undefined = queryClient.getQueryData(["user"]);

  const [bike, setBike] = useState<Bike>();
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

  const [refurb] = useState<boolean>(transactionData?.is_refurb ?? false); // TODO: create refurb Button
  const [reserved] = useState<boolean>(transactionData?.is_reserved ?? false); // TODO: create retrospec stuff
  const [waitEmail, setWaitEmail] = useState<boolean>(
    transactionData?.is_waiting_on_email ?? false
  );
  const [waitPart, setWaitPart] = useState<boolean>(false);
  const [priority, setPriority] = useState<boolean>();
  const [nuclear, setNuclear] = useState<boolean>();
  const [description, setDescription] = useState<string>();
  const [isPaid, setPaid] = useState<boolean>(transactionData?.is_paid ?? false);
  const [isCompleted, setIsCompleted] = useState<boolean>(transactionData?.is_waiting_on_email ?? false);
  const [beerBike, setBeerBike] = useState<boolean>();

  // const [doneRepairs, setDoneRepairs] = useState<Record<string, boolean>>({});

  const sendCheckoutEmail = useMutation({
    mutationFn: (customer: Customer) => {
      if (!transactionData) throw new Error("Transaction data not found");
      else
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

  const updateTransaction = useMutation({
    mutationFn: (input: {
      transaction_id: string;
      transaction: UpdateTransaction;
    }) => {
      console.log("calling update transaction on dbmodel");
      return DBModel.updateTransaction(input.transaction_id, input.transaction);
    },
    onSuccess: (data: Transaction) => {
      queryClient.invalidateQueries({
        queryKey: ["transaction", transaction_id],
      });
      console.log("transaction updated", data);
    },
    onError: (error) => {
      toast.error("error updating transaction" + error);
    },
  });


  const completeRepair = useMutation({
    mutationFn: (input: {
      transaction_detail_id: string;
      status: boolean;
    }) => {
      console.log("calling update transaction on dbmodel", input.status);
      return DBModel.updateTransactionDetails(input.transaction_detail_id, input.status);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "repair"],
      });
      console.log("repair updated", data);
    },
    onError: (error) => {
      toast.error("error updating repair" + error);
    },
  });
  useEffect(() => {
    console.log(
      "waiting on data",
      transactionStatus,
      description === "",
      description === null
    );
    if (
      transactionStatus !== "pending" &&
      transactionStatus !== "error" &&
      description !== "" &&
      description !== null
    ) {
      // console.log("description before update: ", description);
      const updatedTransaction = {
        description: description ?? "",
        transaction_type: transactionType,
        total_cost: totalPrice,
        is_waiting_on_email: waitEmail,
        // waiting_on_part: waitPart,
        is_urgent: priority ?? false,
        is_nuclear: nuclear ?? false,
        is_completed: isCompleted,
        is_paid: isPaid,
        is_beer_bike: beerBike ?? false,
        is_refurb: refurb,
        is_reserved: reserved,
        bike_id: bike?.bike_id,
        date_completed:
          transactionData?.date_completed === null && isCompleted
            ? new Date().toISOString()
            : transactionData?.date_completed,
      } as UpdateTransaction;

      // console.log("description after update", updatedTransaction.description);
      updateTransaction.mutate({
        transaction_id: transaction_id,
        transaction: updatedTransaction,
      });
      console.log("submitted update");
      // setCurrentTransaction({
      //   ...transactionData,
      //   Transaction: transactionData,
      // });
    }
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
  ]);

  useEffect(() => {
    if (transactionData) {
      // if (transactionData.is_refurb !== refurb) setRefurb(transactionData.is_refurb);
      // if (transactionData.is_reserved !== reserved) setReserved(transactionData.is_reserved);
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
    }
  }, [transactionData]);

  const addRepair = useMutation({
    mutationFn: (repair: Repair) => {
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
      console.log("repair added");
    },
  });

  const deleteRepair = useMutation({
    mutationFn: (transactionDetail: RepairDetails) => {
      return DBModel.deleteTransactionDetails(
        transactionDetail.transaction_detail_id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "repair"],
      });
      console.log("repair deleted");
    },
  });

  const addPart = useMutation({
    mutationFn: (part: Part) => {
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
      console.log("repair added");
    },
  });

  const deletePart = useMutation({
    mutationFn: (transactionDetail: ItemDetails) => {
      return DBModel.deleteTransactionDetails(
        transactionDetail.transaction_detail_id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactionDetails", transaction_id, "item"],
      });
      console.log("part deleted");
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (transaction: Transaction) => {
      return DBModel.deleteTransaction(transaction.transaction_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transaction", transaction_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
      console.log("transaction deleted");
      nav("/");
    },
  });

  const handlePaid = () => {
    setPaid(true);
    closeCheckout();
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      
      queryKey: ["transactions"],
    });
    nav("/");
  };

  const handleTransactionTypeChange = (newTransactionType: string) => {
    setSearchParams((params) => {
      params.set("type", newTransactionType);
      return params;
    });
    setTransactionType(newTransactionType);
  };

  // const updateTransaction = useMutation({});

  // const handleCompleteT = () => {
  //   // TODO: need to close transaction and go back to home page
  //   setIsCompleted(!isCompleted);
  // };

  const handleWaitEmail = () => {
    setWaitEmail(!waitEmail);
  };

  const handleWaitPart = () => {
    setShowWaitingParts(!showWaitingParts);
    setWaitPart(!waitPart);
  };

  const handlePriority = () => {
    console.log("priority: ", priority);
    setPriority(!priority);
  };

  const handleNuclear = () => {
    console.log("nuclear: ", nuclear);
    setNuclear(!nuclear);
  };

  const handleMarkDone = async () => {
    if (!transactionData) return;
    if (!transactionData.Customer) return;
    setIsCompleted(!isCompleted);

    const customer: Customer = transactionData?.Customer as Customer;
    if(isCompleted === false){
      sendCheckoutEmail.mutate(customer);
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    }
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
  };



  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const closeCheckout = () => {
    setShowCheckout(false);
  };

  const handleSaveNotes = (newNotes: string) => {
    console.log("new notes: ", newNotes);
    setDescription(newNotes);
  };

  useEffect(() => {
    if (
      !repairDetailsIsFetching &&
      !itemDetailsIsFetching &&
      (repairDetails || itemDetails)
    ) {
      setTotalPrice(
        calculateTotalCost(
          repairDetails as RepairDetails[],
          itemDetails as ItemDetails[]
        )
      );
    }
  }, [
    repairDetails,
    repairDetailsIsFetching,
    itemDetails,
    itemDetailsIsFetching,
  ]);

  if (repairsLoading || partsLoading || transactionLoading) {
    return <p>Loading data...</p>;
  }

  if (repairError || partsError || transactionError) {
    return <p>Error loading data</p>;
  }

  const handleAddRepair = (event: RowClickedEvent) => {
    const repair = event.data as Repair;
    console.log("handle add repair");
    addRepair.mutate(repair);
  };

  const handleRemoveRepair = (repair: RepairDetails) => {
    deleteRepair.mutate(repair);
  };

  const handleAddPart = (event: RowClickedEvent) => {
    const part = event.data as Part;
    addPart.mutate(part);
  };

  const handleRemovePart = (part: ItemDetails) => {
    deletePart.mutate(part);
  };

  const toggleDoneRepair = (repairDetail: RepairDetails) => {
    const newStatus: boolean = !repairDetail.completed;
    const repairId: string = repairDetail.transaction_detail_id;
    completeRepair.mutate({ transaction_detail_id: repairId, status: newStatus });

  };

  const allRepairsDone = () => {
    if (!repairDetails) return false;
    console.log("repair details: ", repairDetails);
    return repairDetails.every((repair: RepairDetails) => repair.completed);
  };

  if (transactionData === undefined || transactionData.Customer === undefined) {
    return <p>Loading...</p>;
  }

  if (transactionData.Customer === null) {
    return <p>Customer not found</p>;
  }



  // console.log("current transaction cost ", transactionData?.total_cost);
  return (
    <div
      style={{
        padding: "0 10vw",
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "90%%",
      }}
    >
      <Stack
        style={{
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          // borderBottom: "1px solid black",
          paddingBottom: "20px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          marginTop: "20px",
        }}
      >
        {/* <h2>Transaction Details</h2> */}
        <Grid2 container>
          <Grid2
            size={6}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
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
              options={["Inpatient", "Outpatient", "Merch"]}
              setTransactionType={handleTransactionTypeChange}
              initialOption={["inpatient", "outpatient", "merch"].indexOf(
                transactionType.toLowerCase()
              )}
            />
          </Grid2>
          <Grid2
            size={6}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="contained"
              sx={{ backgroundColor: "red", alignSelf: "center" }}
              onClick={() =>
                deleteTransaction.mutate(transactionData as Transaction)
              }
            >
              Delete
            </Button>
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
            {transactionData.Customer.email}
          </h3>
          <h3>
            <strong>#: </strong>
            {transactionData.Customer.phone}
          </h3>
        </Item>

        <Notes
          notes={transactionData.description ?? ""}
          onSave={handleSaveNotes}
          user={user}
        />

        <h3>Bike Information</h3>
        <Item style={{ color: "black" }}>
          {" "}
          {transactionData.Bike ? (
            <>
              <h2>
                {transactionData.Bike.make + " " + transactionData.Bike.model}
              </h2>
              <h2>{transactionData.Bike.description}</h2>
            </>
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
                cellRenderer: (params: ITooltipParams) => {
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "16px",
                      }}
                    >
                      <p>
                        <b>{params.value}</b>
                      </p>
                      <i className="fa-solid fa-circle-info"></i>
                    </div>
                  );
                },
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
                field: "description",
                headerName: "Name",
                width: 200,
                autoHeight: true,
                wrapText: true,
                flex: 2,
                filter: true,
                tooltipField: "name",
                headerTooltip: "Name of items",
                cellRenderer: (params: ITooltipParams) => {
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <p>
                        <b>{params.value}</b>
                      </p>
                      <i className="fa-solid fa-circle-info"></i>
                    </div>
                  );
                },
              },
              { field: "brand", headerName: "Brand" },
              { field: "standard_price", headerName: "Price", width: 200 },
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
        <Grid2 size={6} sx={{ textAlign: "center" }}>
          <h3>Repairs</h3>
          <List sx={{ width: "100%", bgcolor: "background.paper" }}>
            {!repairDetailsLoading && repairDetails ? (
              repairDetails.map((transactionDetail: RepairDetails) => (
                // const repair = transactionDetail.Repair;
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
              ))
            ) : (
              <p> loading..</p>
            )}
          </List>
        </Grid2>

        <Grid2 size={6} sx={{ textAlign: "center" }}>
          <h3>Parts</h3>
          <List sx={{ width: "100%", bgcolor: "background.paper" }}>
            {!itemDetailsLoading && itemDetails ? (
              (itemDetails as ItemDetails[]).map((part: ItemDetails) => (
                <ListItem
                  key={part.transaction_detail_id}
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span>
                    {part.Item.name} - ${part.Item.standard_price.toFixed(2)}
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
              ))
            ) : (
              <p> loading...</p>
            )}
          </List>
        </Grid2>
      </Grid2>

      <Grid2 container>
        <Grid2
          size={12}
          style={{
            marginTop: "20px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h3>Total</h3>
          <p>
            <strong>${(totalPrice * 1.0825).toFixed(2)}</strong>
          </p>
          <WhiteboardEntryModal
            open={showWaitingParts}
            onClose={() => setShowWaitingParts(false)}
            parts={parts as Part[]}
            transaction_id={transaction_id}
            user_id={user.user_id}
          />
          <Grid2
            style={{ marginBottom: "20px", color: "white", gap: "2px" }}
            size={12}
          // gap={2}
          >
            <Button
              onClick={handleWaitPart}
              style={{
                backgroundColor: waitPart ? "red" : "grey",
                color: "white",
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
              }}
              variant="contained"
            >
              Wait on Email
            </Button>
            <Button
              onClick={handlePriority}
              style={{
                backgroundColor: "black",
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
                backgroundColor: nuclear ? "white" : "grey",
                color: "white",
              }}
              variant="contained"
            >
              Mark as Nuclear
            </Button>
            <Button
              onClick={() => setBeerBike(!beerBike)}
              style={{
                backgroundColor: beerBike ? "turquoise" : "white",
                color: "black",
              }}
              variant="contained"
            >
              {" "}
              Mark as Beer Bike
            </Button>
          </Grid2>
          <Grid2 size={6}>
            <Button
              onClick={handleCheckout}
              disabled={!isCompleted}
              style={{
                backgroundColor: "green",
                border: "white",
                marginRight: "10px",
                color: "white",
                // cursor: allRepairsDone() ? "pointer" : "not-allowed",
                opacity: allRepairsDone() ? 1 : 0.5,
              }}
            >
              Checkout
            </Button>
            {showCheckout && (
              <div className="checkout">
                <div className="checkout-content">
                  <p>
                    <strong>
                      ${(totalPrice * 1.0825).toFixed(2)}
                    </strong>
                  </p>

                  <p>
                    <strong>Repairs:</strong>
                  </p>
                  <ul>
                    {repairDetails.map((repair: RepairDetails) => (
                      <ListItem key={repair.transaction_detail_id}>
                        {repair.Repair.name} - ${repair.Repair.price.toFixed(2)}
                      </ListItem>
                    ))}
                  </ul>

                  <p>
                    <strong>Parts</strong>
                  </p>
                  <ul>
                    {itemDetails === undefined ? (
                      <></>
                    ) : (
                      itemDetails.map((part: ItemDetails) => (
                        <ListItem key={part.transaction_detail_id}>
                          {part.Item.name} - $
                          {part.Item.standard_price.toFixed(2)}
                        </ListItem>
                      ))
                    )}
                  </ul>
                  <Button
                    onClick={handlePaid}
                    style={{
                      backgroundColor: "green",
                      cursor: "pointer",
                      color: "white",
                    }}
                  >
                    Finish
                  </Button>
                  <Button onClick={closeCheckout}>Back</Button>
                </div>
              </div>
            )}
            <style>
              {`
                .checkout {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 80vw;
                    height: 80vh%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .checkout-content {
                    background-color: grey;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: center;
                }
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                    color: white
                }
                `}
            </style>
            <Button
              onClick={handleMarkDone}
              disabled={!allRepairsDone()}
              style={{
                marginRight: "10px",
                // border: "white",
                color: "white",

                backgroundColor: isCompleted ? "gray" : "blue",
                //   ? "green"
                //   : "black",
              }}
              variant="contained"
            >
              {isCompleted? "Open Transaction": "Complete Transaction"}
            </Button>
            {/* {showMarkDone && (
              <div className="markDone">
                <div className="markDone-content">
                  <p>
                    Are you sure you want to mark this transaction as complete?
                    You <strong>MUST</strong> checkout first.
                  </p>
                  <Button onClick={handleCompleteT}>Complete</Button>
                  <Button onClick={handleMarkDoneClose}>Go Back</Button>
                </div>
              </div>
            )} */}
            <style>
              {`
                .markDone {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .markDone-content {
                    background-color: grey;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: center;
                }
                Button {
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                }
                `}
            </style>
          </Grid2>
        </Grid2>
      </Grid2>
      <ToastContainer />
    </div>
  );
};

export default TransactionDetail;
