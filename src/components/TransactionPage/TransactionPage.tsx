import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
// import { Repair, useRepairs } from "../RepairItem/RepairItem";
// import { Part, useParts } from "../PartItem/PartItem";
import { Button } from "@mui/material";

import Notes from "./Notes";
import { IRow } from "../../features/TransactionsTable/TransactionsTable";
import { ITooltipParams, RowClickedEvent } from "ag-grid-community";
import DBModel, {
  ItemDetails,
  Part,
  Repair,
  RepairDetails,
  Transaction,
} from "../../model";
import { useMutation, useQueries } from "@tanstack/react-query";
import { queryClient } from "../../app/main";
import { ToastContainer, toast } from "react-toastify";
import SearchModal from "./searchModal";
import "./TransactionPage.css";

const calculateTotalCost = (repairs: RepairDetails[], parts: ItemDetails[]) => {
  let total = 0;
  repairs.forEach((repair) => {
    total += repair.Repair.price;
  });
  parts.forEach((part) => {
    total += part.Item.standard_price;
  });
  return total;
};

const TransactionDetail = () => {
  // const { repairs, loading: repairsLoading } = useRepairs();
  // const { parts, loading: partsLoading } = useParts();

  const location = useLocation();
  const [currLocation, setCurrLocation] = useState(location);
  useEffect(() => {
    if (location !== currLocation) {
      setCurrLocation(location);
    }
  }, [location, currLocation]);
  const transaction = location.state?.transaction;

  // const [, setShowModal] = useState(false);
  // const [showModal2, setShowModal2] = useState(false);

  const [user, setUser] = useState("00000000-633a-fa44-a9b8-005aa337288b");
  const [bike, setBike] = useState(transaction?.Bike);
  const [customer, setCustomer] = useState(transaction?.Customer);
  const [totalPrice, setTotalPrice] = useState(0);
  // setUser("00000000-633a-fa44-a9b8-005aa337288b");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMarkDone, setShowMarkDone] = useState(false);

  const [waitEmail, setWaitEmail] = useState(false);
  const [waitPart, setWaitPart] = useState(false);
  const [priority, setPriority] = useState(false);
  const [nuclear, setNuclear] = useState(false);

  const [repairSearchQuery, setRepairSearchQuery] = useState("");
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);

  const [doneRepairs, setDoneRepairs] = useState<Record<string, boolean>>({});

  const [currentTransaction, setCurrentTransaction] = useState({
    ...transaction,
    Repairs: transaction?.Repairs || [],
    Parts: transaction?.Parts || [],
    Notes: transaction?.Notes || "",
  });

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
      DBModel.getTransactionDetailsQuery(
        currentTransaction.Transaction.transaction_id,
        "repair"
      ),
      DBModel.getTransactionDetailsQuery(
        currentTransaction.Transaction.transaction_id,
        "item"
      ),
      DBModel.getTransactionQuery(
        currentTransaction.Transaction.transaction_id,
        currentTransaction.Transaction
      ),
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
  // if(repairDetailsError) {
  //   toast.error(repairDetailsError)
  //   return <p>error</p>
  // }
  const repairDetails = queriedRepairDetails as RepairDetails[];
  const {
    isFetching: itemDetailsIsFetching,
    isLoading: itemDetailsLoading,
    // status: itemDetailsStatus,
    data: itemDetails,
    error: itemDetailsError,
  } = itemDetailsQuery;
  if (itemDetailsError) toast.error("itemDetails: " + itemDetailsError);

  const {
    // isLoading: transactionLoading,
    isFetching: transactionIsFetching,
    data: transactionData,
    error: transactionError,
  } = transactionQuery;
  if (transactionError) toast.error("transaction: " + transactionError);
  // console.log("itemDetails: ", itemDetails);
  useEffect(() => {
    if (
      currentTransaction.Transaction != transactionData &&
      !transactionIsFetching
    ) {
      setCurrentTransaction({
        ...currentTransaction,
        Transaction: transactionData,
      });
    }
  }, [currentTransaction, transactionData, transactionIsFetching]);

  const addRepair = useMutation({
    mutationFn: (repair: Repair) => {
      return DBModel.postTransactionDetails(
        currentTransaction.Transaction.transaction_id,
        repair.repair_id,
        user,
        1,
        "repair"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "transactionDetails",
          currentTransaction.Transaction.transaction_id,
          "repair",
        ],
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
        queryKey: [
          "transactionDetails",
          currentTransaction.Transaction.transaction_id,
          "repair",
        ],
      });
      console.log("repair added");
    },
  });

  const addPart = useMutation({
    mutationFn: (part: Part) => {
      return DBModel.postTransactionDetails(
        currentTransaction.Transaction.transaction_id,
        part.upc,
        user,
        1,
        "item"
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "transactionDetails",
          currentTransaction.Transaction.transaction_id,
          "item",
        ],
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
        queryKey: [
          "transactionDetails",
          currentTransaction.Transaction.transaction_id,
          "item",
        ],
      });
      console.log("repair added");
    },
  });

  const handlePaid = () => {
    setCurrentTransaction({
      ...currentTransaction,
      Transaction: {
        ...currentTransaction.Transaction,
        is_paid: true,
      },
    });
  };

  // const updateTransaction = useMutation({});

  const handleCompleteT = () => {
    // TODO: need to close transaction and go back to home page
    setCurrentTransaction({
      ...currentTransaction,
      Transaction: {
        ...currentTransaction.Transaction,
        is_completed: true,
      },
    });
  };

  const handleWaitEmail = () => {
    setWaitEmail(!waitEmail);
    setCurrentTransaction({
      ...currentTransaction,
      Transaction: {
        ...currentTransaction.Transaction,
        is_wait_email: waitEmail,
      },
    });
  };

  const handleWaitPart = () => {
    setWaitPart(!waitPart);
    // setCurrentTransaction({
    //     ...currentTransaction,
    //     Transaction: {
    //         ...currentTransaction.Transaction,
    //         is_wait_email: waitEmail,
    //     },
    // });
    // TODO: there is no boolean?
  };

  const handlePriority = () => {
    setPriority(!priority);
    setCurrentTransaction({
      ...currentTransaction,
      Transaction: {
        ...currentTransaction.Transaction,
        is_urgent: priority,
      },
    });
  };

  const handleNuclear = () => {
    setNuclear(!nuclear);
    setCurrentTransaction({
      ...currentTransaction,
      Transaction: {
        ...currentTransaction.Transaction,
        is_nuclear: nuclear,
      },
    });
  };

  const handleMarkDone = () => {
    setShowMarkDone(true);
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
    setCurrentTransaction((prevTransaction: IRow) => ({
      ...prevTransaction,
      Notes: newNotes,
    }));
  };

  useEffect(() => {
    if (!repairDetailsIsFetching && !itemDetailsIsFetching) {
      setTotalPrice(
        calculateTotalCost(
          repairDetails as RepairDetails[],
          itemDetails as ItemDetails[]
        )
      );
    }
  }, [repairDetails, itemDetails]);

  useEffect(() => {
    if (
      repairSearchQuery.trim() !== "" &&
      repairsLoading === false &&
      repairs
    ) {
      const matches = repairs
        .filter(
          (repair: Repair) =>
            repair.name
              .toLowerCase()
              .includes(repairSearchQuery.toLowerCase()) &&
            !repairDetails.some(
              (r: RepairDetails) => r.Repair.repair_id === repair.repair_id
            )
        )
        .slice(0, 10);
      setFilteredRepairs(matches);
    } else {
      setFilteredRepairs([]);
    }
  }, [
    repairSearchQuery,
    repairDetails,
    repairs,
    currentTransaction.Repairs,
    repairsLoading,
  ]);

  useEffect(() => {
    if (partSearchQuery.trim() !== "" && partsLoading === false && parts) {
      const matches = parts
        .filter(
          (part) =>
            part.name &&
            part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) &&
            !currentTransaction.Parts.some((p: Part) => p.upc === part.upc)
        )
        .slice(0, 10);
      setFilteredParts(matches);
    } else {
      setFilteredParts([]);
    }
  }, [partSearchQuery, parts, currentTransaction.Parts, partsLoading]);

  if (repairsLoading || partsLoading) {
    return <p>Loading data...</p>;
  }

  if (!transaction) {
    return <p>No transaction selected!</p>;
  }

  const handleSearchChangeR = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepairSearchQuery(e.target.value);
  };

  const handleSearchChangeP = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartSearchQuery(e.target.value);
  };

  const handleAddRepair = (event: RowClickedEvent) => {
    const repair = event.data as Repair;
    console.log("handle add repair");
    addRepair.mutate(repair);
    const updatedRepairs = [...currentTransaction.Repairs, repair];
    const updatedTotalCost =
      currentTransaction.Transaction.total_cost + repair.price;

    setCurrentTransaction({
      ...currentTransaction,
      Repairs: updatedRepairs,
      Transaction: {
        ...currentTransaction.Transaction,
        total_cost: updatedTotalCost,
      },
    });

    setRepairSearchQuery("");
    setFilteredRepairs([]);
  };

  const handleRemoveRepair = (repair: RepairDetails) => {
    // const updatedRepairs = currentTransaction.Repairs.filter(
    //   (r: Repair) => r._id !== repair.repair_id
    // );
    deleteRepair.mutate(repair);
    const updatedTotalCost =
      currentTransaction.Transaction.total_cost - repair.Repair.price;

    setCurrentTransaction({
      ...currentTransaction,
      // Repairs: updatedRepairs,
      Transaction: {
        ...currentTransaction.Transaction,
        total_cost: updatedTotalCost,
      },
    });
  };

  const handleAddPart = (part: Part) => {
    addPart.mutate(part);
    const updatedParts = [...currentTransaction.Parts, part];
    const updatedTotalCost =
      currentTransaction.Transaction.total_cost + part.standard_price;

    setCurrentTransaction({
      ...currentTransaction,
      Parts: updatedParts,
      Transaction: {
        ...currentTransaction.Transaction,
        total_cost: updatedTotalCost,
      },
    });

    setRepairSearchQuery("");
    setFilteredParts([]);
  };

  const handleRemovePart = (part: ItemDetails) => {
    // const updatedParts = currentTransaction.Parts.filter(
    //   (p: Part) => p._id !== part.upc
    // );
    // console.log("updated parts: ", updatedParts);
    deletePart.mutate(part);
    const updatedTotalCost =
      currentTransaction.Transaction.total_cost - part.Item.standard_price;

    setCurrentTransaction({
      ...currentTransaction,
      // Parts: updatedParts,
      Transaction: {
        ...currentTransaction.Transaction,
        total_cost: updatedTotalCost,
      },
    });
  };
  console.log("current transaction: ", currentTransaction);
  const toggleDoneRepair = (repairId: string) => {
    setDoneRepairs((prevState) => ({
      ...prevState,
      [repairId]: !prevState[repairId],
    }));
  };

  const allRepairsDone = () => {
    return currentTransaction.Repairs.every(
      (repair: Repair) => doneRepairs[repair.repair_id]
    );
  };

  // if(!repairDetailsLoading && repairDetails && !itemDetailsLoading && itemDetails) {
  //   let total = 0;
  //   (repairDetails as RepairDetails[]).forEach((repairDetail) => {
  //     total += repairDetail.Repair.price;
  //   });
  // }

  console.log(
    "current transaction cost ",
    currentTransaction.Transaction.total_cost
  );
  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <h2>Transaction Details</h2>
        <h3>Bike Information</h3>
        {currentTransaction.Transaction.Bike ? (
          <>
            <p>
              <strong>Make: </strong>
              {currentTransaction.Transaction.Bike.make}
            </p>
            <p>
              <strong>Model: </strong>
              {currentTransaction.Transaction.Bike.model}
            </p>
            <p>
              <strong>Color: </strong>
              {currentTransaction.Transaction.Bike.description}
            </p>
          </>
        ) : (
          <p>No bike information available</p>
        )}

        <h3>Customer Information</h3>
        <p>
          <strong>Name: </strong>
          {currentTransaction.Transaction.Customer.first_name}{" "}
          {currentTransaction.Transaction.Customer.last_name}
        </p>
        <p>
          <strong>Email: </strong>
          {currentTransaction.Transaction.Customer.email}
        </p>
        <p>
          <strong>Phone: </strong>
          {currentTransaction.Transaction.Customer.phone}
        </p>

        <Notes notes={currentTransaction.Notes} onSave={handleSaveNotes} />
      </header>
      <main id="transaction-details">
        <section>
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
              // {
              //   field: "description",
              //   headerName: "Description",
              //   width: 200,
              //   wrapText: true,
              //   autoHeight: true,
              // },
            ]}
            colDefaults={{
              flex: 1,
            }}
            onRowClick={(row) => handleAddRepair(row)}
          />
          <h3>Add Repair</h3>
          <input
            type="text"
            placeholder="Search for a repair"
            value={repairSearchQuery}
            onChange={handleSearchChangeR}
          />
          <ul>
            {filteredRepairs.map((repair) => (
              <li
                key={repair.repair_id}
                // onClick={() => handleAddRepair(repair)}
                style={{ cursor: "pointer" }}
              >
                <Button>
                  {repair.name} - ${repair.price.toFixed(2)}
                </Button>
              </li>
            ))}
          </ul>
          <h3>Repairs</h3>
          <ul>
            {!repairDetailsLoading && repairDetails ? (
              repairDetails.map((transactionDetail: RepairDetails) => (
                // const repair = transactionDetail.Repair;
                <li key={transactionDetail.transaction_detail_id}>
                  <>
                    {transactionDetail.Repair.name} - $
                    {transactionDetail.Repair.price.toFixed(2)}
                    <button
                      onClick={() =>
                        toggleDoneRepair(
                          transactionDetail.transaction_detail_id
                        )
                      }
                      style={{
                        border: "2px solid white",
                        marginLeft: "10px",
                        cursor: "pointer",
                        backgroundColor: doneRepairs[
                          transactionDetail.transaction_detail_id
                        ]
                          ? "green"
                          : "initial",
                        color: "white",
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
                  </>
                </li>
              ))
            ) : (
              <p> loading..</p>
            )}
          </ul>
        </section>

        <section>
          <h3>Add Part</h3>
          <input
            type="text"
            placeholder="Search for a part"
            value={partSearchQuery}
            onChange={handleSearchChangeP}
          />
          <ul>
            {filteredParts.map((part) => (
              <li>
                <Button
                  key={part.upc.trim()}
                  onClick={() => handleAddPart(part)}
                  style={{ cursor: "pointer" }}
                >
                  {part.name} - ${part.standard_price.toFixed(2)}
                </Button>
              </li>
            ))}
          </ul>
          <h3>Parts</h3>
          <ul>
            {!itemDetailsLoading && itemDetails ? (
              (itemDetails as ItemDetails[]).map((part: ItemDetails) => (
                <li key={part.Item.upc}>
                  {part.Item.name} - ${part.Item.standard_price.toFixed(2)}
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
                </li>
              ))
            ) : (
              <p> loading...</p>
            )}
          </ul>
        </section>
      </main>
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
          disabled={!allRepairsDone() || currentTransaction.Transaction.is_paid}
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
                  $
                  {(currentTransaction.Transaction.total_cost * 1.0625).toFixed(
                    2
                  )}
                </strong>
              </p>

              <p>
                <strong>Repairs:</strong>
              </p>
              <ul>
                {currentTransaction.Repairs.map((repair: Repair) => (
                  <li key={repair.repair_id}>
                    {repair.name} - ${repair.price.toFixed(2)}
                  </li>
                ))}
              </ul>

              <p>
                <strong>Parts</strong>
              </p>
              <ul>
                {currentTransaction.Parts.map((part: Part) => (
                  <li key={part.upc}>
                    {part.name} - ${part.standard_price.toFixed(2)}
                  </li>
                ))}
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
          disabled={!currentTransaction.Transaction.is_paid}
          style={{
            marginRight: "10px",
            cursor: currentTransaction.Transaction.is_paid
              ? "pointer"
              : "not-allowed",
            border: "white",
            color: "white",
            backgroundColor: currentTransaction.Transaction.is_completed
              ? "green"
              : "black",
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
