import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Stack, List, ListItem, Grid2 } from "@mui/material";
import { User } from "../../model";
import { useNavigate } from "react-router-dom";
import Item from "./HeaderItem";
import Notes from "./Notes";
import { ITooltipParams, RowClickedEvent } from "ag-grid-community";
import DBModel, {
  ItemDetails,
  Part,
  Repair,
  RepairDetails,
  Transaction,
  UpdateTransaction,
  Bike,
} from "../../model";
import { useMutation, useQueries } from "@tanstack/react-query";
import { queryClient } from "../../app/main";
import { ToastContainer, toast } from "react-toastify";
import SearchModal from "./SearchModal";
import "./TransactionPage.css";
import NewBikeForm from "./BikeForm";
import TransactionOptionDropdown from "./TransactionOptionDropdown";

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
    isLoading: transactionLoading,
    isFetching: transactionIsFetching,
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
  ); // TODO: create transaction type dropdown
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showMarkDone, setShowMarkDone] = useState<boolean>(false);
  const [showBikeForm, setShowBikeForm] = useState<boolean>(false);

  const [refurb] = useState<boolean>(false); // TODO: create refurb button
  const [reserved] = useState<boolean>(false); // TODO: create retrospec stuff
  const [waitEmail, setWaitEmail] = useState<boolean>(false);
  const [waitPart, setWaitPart] = useState<boolean>(false);
  const [priority, setPriority] = useState<boolean>(false);
  const [nuclear, setNuclear] = useState<boolean>(false);
  const [description, setDescription] = useState<string>(
    transactionData?.description ?? ""
  );
  const [isPaid, setPaid] = useState<boolean>(
    transactionData?.is_paid ?? false
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(
    transactionData?.is_completed ?? false
  );
  const [beerBike, setBeerBike] = useState<boolean>(
    transactionData?.is_beer_bike ?? false
  );
  // const [transactionHasChanged, setTransactionHasChanged] =
  //   useState<boolean>(false);

  const [doneRepairs, setDoneRepairs] = useState<Record<string, boolean>>({});

  const updateTransaction = useMutation({
    mutationFn: (input: {
      transaction_id: string;
      transaction: UpdateTransaction;
    }) => {
      return DBModel.updateTransaction(input.transaction_id, input.transaction);
    },
    onSuccess: (data: Transaction) => {
      queryClient.invalidateQueries({
        queryKey: ["transaction", transaction_id],
      });
      console.log("transaction updated", data);
    },
  });

  // useEffect(() => {
  //   console.log("transactionData: ", transactionData?.description);
  //   if (transactionData && transactionIsFetching === false) {
  //     setTransactionType(transactionData.transaction_type || "");
  //     setTotalPrice(transactionData.total_cost || 0);
  //     setShowCheckout(transactionData.is_paid || false);
  //     setShowMarkDone(transactionData.is_completed || false);
  //     setRefurb(transactionData.is_refurb || false);
  //     // setReserved(transactionData.is_reserved || false);
  //     setWaitEmail(transactionData.is_waiting_on_email || false);
  //     // setWaitPart(transactionData.waiting_on_part || false);
  //     setPriority(transactionData.is_urgent || false);
  //     setNuclear(transactionData.is_nuclear || false);
  //     setBeerBike(transactionData.is_beer_bike || false);
  //   }
  // }, [transactionData]);

  useEffect(() => {
    if (!transactionIsFetching && description !== "" && description !== null) {
      console.log("description before update: ", description);
      const updatedTransaction = {
        description: description,
        transaction_type: transactionType,
        total_cost: totalPrice,
        is_waiting_on_email: waitEmail,
        // waiting_on_part: waitPart,
        is_urgent: priority,
        is_nuclear: nuclear,
        is_completed: showMarkDone,
        is_paid: showCheckout,
        is_beer_bike: beerBike,
        is_refurb: refurb,
        is_reserved: reserved,
        bike_id: bike?.bike_id,
        date_completed:
          transactionData?.date_completed === null && showMarkDone
            ? new Date().toISOString()
            : transactionData?.date_completed,
      } as UpdateTransaction;

      console.log("description after update", updatedTransaction.description);
      updateTransaction.mutate({
        transaction_id: transaction_id,
        transaction: updatedTransaction,
      });
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
    showMarkDone,
    showCheckout,
    bike,
    beerBike,
    refurb,
    reserved,
  ]);

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
  };

  const handleTransactionTypeChange = (newTransactionType: string) => {
    setSearchParams((params) => {
      params.set("type", newTransactionType);
      return params;
    });
    setTransactionType(newTransactionType);
  };

  // const updateTransaction = useMutation({});

  const handleCompleteT = () => {
    // TODO: need to close transaction and go back to home page
    setIsCompleted(!isCompleted);
  };

  const handleWaitEmail = () => {
    setWaitEmail(!waitEmail);
  };

  const handleWaitPart = () => {
    setWaitPart(!waitPart);
  };

  const handlePriority = () => {
    setPriority(!priority);
  };

  const handleNuclear = () => {
    setNuclear(!nuclear);
  };

  const handleMarkDone = () => {
    setShowMarkDone(!showMarkDone);
  };

  const handleMarkDoneClose = () => {
    setShowMarkDone(false);
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
  console.log("current transaction: ", transactionData);
  const toggleDoneRepair = (repairId: string) => {
    setDoneRepairs((prevState) => ({
      ...prevState,
      [repairId]: !prevState[repairId],
    }));
  };

  const allRepairsDone = () => {
    if (!repairDetails) return false;
    return repairDetails.every((repair: RepairDetails) => repair.completed);
  };

  if (transactionData === undefined || transactionData.Customer === undefined) {
    return <p>Loading...</p>;
  }

  if (transactionData.Customer === null) {
    return <p>Customer not found</p>;
  }

  if (description === undefined) {
    return <p>Loading...</p>;
  }

  console.log("current transaction cost ", transactionData?.total_cost);
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

        <Notes notes={transactionData.description ?? ""} onSave={handleSaveNotes} user={user} />

        <h3>Bike Information</h3>
        <Item>
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
          }}
        />
      </Stack>
      <hr />
      <Grid2 container id="transaction-details" spacing={2}>
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
          />
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
                filter: true,
                tooltipField: "description",
                headerTooltip: "Name of items",
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
          />
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
                    width: "100%",
                  }}
                >
                  <>
                    <span>
                      {transactionDetail.Repair.name} - $
                      {transactionDetail.Repair.price.toFixed(2)}
                    </span>
                    <section style={{ display: "flex", flexDirection: "row" }}>
                      <button
                        onClick={() =>
                          toggleDoneRepair(
                            transactionDetail.transaction_detail_id
                          )
                        }
                        style={{
                          border: "2px solid black",
                          marginLeft: "10px",
                          cursor: "pointer",
                          backgroundColor: doneRepairs[
                            transactionDetail.transaction_detail_id
                          ]
                            ? "green"
                            : "initial",
                          color: "black",
                        }}
                      >
                        {doneRepairs[transactionDetail.transaction_detail_id]
                          ? "Done"
                          : "Mark as Done"}
                      </button>
                      <button
                        onClick={() => handleRemoveRepair(transactionDetail)}
                        style={{
                          marginLeft: "10px",
                          cursor: "pointer",
                          border: "white",
                          backgroundColor: "red",
                        }}
                      >
                        Delete
                      </button>
                    </section>
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    width: "100%",
                  }}
                >
                  <span>
                    {part.Item.name} - ${part.Item.standard_price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      handleRemovePart(part);
                    }}
                    style={{
                      marginLeft: "10px",
                      cursor: "pointer",
                      border: "white",
                      backgroundColor: "red",
                    }}
                  >
                    Delete
                  </button>
                </ListItem>
              ))
            ) : (
              <p> loading...</p>
            )}
          </List>
        </Grid2>
      </Grid2>
      <footer>
        <h3>Total</h3>
        <p>
          <strong>${(totalPrice * 1.0625).toFixed(2)}</strong>
        </p>

        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handleWaitPart}
            style={{
              backgroundColor: waitPart ? "red" : "grey",
            }}
          >
            Wait on Part
          </button>
          <button
            onClick={handleWaitEmail}
            style={{
              backgroundColor: waitEmail ? "red" : "grey",
            }}
          >
            Wait on Email
          </button>
          <button
            onClick={handlePriority}
            style={{
              backgroundColor: priority ? "red" : "grey",
            }}
          >
            Mark as Priority
          </button>
          <button
            onClick={handleNuclear}
            style={{
              backgroundColor: nuclear ? "red" : "grey",
            }}
          >
            Mark as Nuclear
          </button>
        </div>

        <button
          onClick={handleCheckout}
          disabled={!allRepairsDone() || transactionData.is_paid}
          style={{
            backgroundColor: "green",
            border: "white",
            marginRight: "10px",
            cursor: allRepairsDone() ? "pointer" : "not-allowed",
            opacity: allRepairsDone() ? 1 : 0.5,
          }}
        >
          Checkout
        </button>
        {showCheckout && (
          <div className="checkout">
            <div className="checkout-content">
              <p>
                <strong>
                  ${(transactionData.total_cost * 1.0625).toFixed(2)}
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
                      {part.Item.name} - ${part.Item.standard_price.toFixed(2)}
                    </ListItem>
                  ))
                )}
              </ul>
              <button
                onClick={handlePaid}
                style={{
                  backgroundColor: "green",
                  cursor: "pointer",
                }}
              >
                Finish
              </button>
              <button onClick={closeCheckout}>Back</button>
              <button onClick={() => setBeerBike(!beerBike)}> Beer Bike</button>
            </div>
          </div>
        )}
        <style>
          {`
                .checkout {
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
                }
                `}
        </style>
        <button
          onClick={handleMarkDone}
          disabled={!transactionData.is_paid}
          style={{
            marginRight: "10px",
            cursor: transactionData.is_paid ? "pointer" : "not-allowed",
            border: "white",
            color: "white",
            backgroundColor: transactionData.is_completed ? "green" : "black",
          }}
        >
          Mark Transaction as Complete
        </button>
        {showMarkDone && (
          <div className="markDone">
            <div className="markDone-content">
              <p>
                Are you sure you want to mark this transaction as complete? You{" "}
                <strong>MUST</strong> checkout first.
              </p>
              <button onClick={handleCompleteT}>Complete</button>
              <button onClick={handleMarkDoneClose}>Go Back</button>
            </div>
          </div>
        )}
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
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                }
                `}
        </style>
      </footer>
      <ToastContainer />
    </div>
  );
};

export default TransactionDetail;
