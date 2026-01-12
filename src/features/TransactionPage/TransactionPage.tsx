// React & Routing
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

// MUI Components
import { Box, Paper, Stack, Divider, Grid2, Skeleton } from "@mui/material";

// Contexts
import { useUser } from "../../contexts/UserContext";

// Model & Types
import type {
  Repair,
  Part,
  RepairDetails,
  ItemDetails,
  Customer,
  Bike,
} from "../../model";

// Query Client
import { queryClient } from "../../app/queryClient";

// Extracted Hooks
import {
  useTransactionData,
  useTransactionMutations,
  useTransactionState,
} from "./hooks";

// Extracted Components
import {
  TransactionHeader,
  BikeInformation,
  RepairsList,
  PartsList,
  OrderRequestsList,
  TransactionActions,
} from "./components";

// Other Components
import SearchModal from "../../components/ItemSearch/SearchModal";
import Notes from "../../components/TransactionPage/Notes";
import { RowClickedEvent } from "ag-grid-community";

// Utilities
import { calculateTotalCost } from "./utils";

// Styles
import "./TransactionPage.css";

// Constants
const debug: boolean = import.meta.env.VITE_DEBUG;

const TransactionDetail = () => {
  // ===================================
  const { transaction_id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const { data: user } = useUser();

  if (!transaction_id) {
    throw new Error("Transaction ID not provided");
  }

  const {
    parts,
    partsLoading,
    repairs,
    repairsLoading,
    repairDetails,
    repairDetailsLoading,
    repairDetailsIsFetching,
    itemDetails,
    itemDetailsLoading,
    itemDetailsIsFetching,
    transactionData,
    transactionLoading,
    orderRequestData,
    orderRequestLoading,
    orderRequestIsFetching,
  } = useTransactionData(transaction_id);

  // ===================================
  // 3. STATE MANAGEMENT (Hook)
  // ===================================
  const {
    bike,
    setBike,
    transactionType,
    setTransactionType,
    showCheckout,
    setShowCheckout,
    showBikeForm,
    setShowBikeForm,
    showWaitingParts,
    setShowWaitingParts,
    refurb,
    setIsRefurb,
    waitEmail,
    setWaitEmail,
    waitPart,
    setWaitPart,
    priority,
    setPriority,
    nuclear,
    setNuclear,
    setDescription,
    setPaid,
    isCompleted,
    setIsCompleted,
    beerBike,
    setBeerBike,
    isEmployee,
    setIsEmployee,
    totalPrice,
    setTotalPrice,
    totalRef,
    lastCheckedNetIdRef,
  } = useTransactionState({ transactionData, searchParams });

  // ===================================
  // 4. MUTATIONS (Hook)
  // ===================================
  const {
    sendCheckoutEmail,
    sendReceiptEmail,
    updateTransaction,
    addRepair,
    deleteRepair,
    completeRepair,
    addPart,
    deletePart,
    deleteTransaction,
    checkUser,
  } = useTransactionMutations({
    transaction_id,
    transactionData,
    user: user ?? null,
    setIsEmployee,
  });

  // ===================================
  // 5. EFFECTS
  // ===================================

  // Check if customer is employee
  useEffect(() => {
    try {
      const email = transactionData?.Customer?.email;
      if (!email) return;
      const netId = email.split("@")[0];
      if (transactionType === "Retrospec") return;
      if (lastCheckedNetIdRef.current === netId) return;

      // Update ref
      (lastCheckedNetIdRef as React.MutableRefObject<string | null>).current =
        netId;
      checkUser.mutate(netId);
    } catch (error) {
      if (debug) console.log("Error checking user:", error);
    }
  }, [
    transactionData?.Customer?.email,
    transactionType,
    checkUser,
    lastCheckedNetIdRef,
  ]);

  // Calculate total price when data changes
  useEffect(() => {
    if (
      !repairDetailsIsFetching &&
      !itemDetailsIsFetching &&
      !orderRequestIsFetching &&
      (repairDetails || itemDetails || orderRequestData)
    ) {
      setTotalPrice(
        calculateTotalCost(
          repairDetails ?? [],
          itemDetails ?? [],
          orderRequestData ?? [],
          isEmployee,
          beerBike ?? false,
        ),
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
    beerBike,
    setTotalPrice,
  ]);

  // Sync transaction type from URL params
  useEffect(() => {
    if (transactionData) {
      const typeFromParams = searchParams.get("type");
      if (typeFromParams && typeFromParams !== transactionType) {
        setTransactionType(typeFromParams);
      }
    }
  }, [transactionData, searchParams, transactionType, setTransactionType]);

  // ===================================
  // 6. HANDLERS
  // ===================================

  const handlePaid = () => {
    setPaid(true);
    setWaitEmail(false);
    setNuclear(false);
    setPriority(false);
    setShowCheckout(false);

    // Persist is_paid to database
    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          is_paid: true,
          is_waiting_on_email: false,
          is_nuclear: false,
          is_urgent: false,
        },
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });

    // Transaction log handled in mutation hook

    const customer: Customer = transactionData?.Customer as Customer;
    sendReceiptEmail.mutate({
      customer,
      transaction_id: transactionData!.transaction_id,
    });

    nav("/");
  };

  const handleMarkDone = async (email: boolean) => {
    if (!transactionData?.Customer) return;

    setIsCompleted(true);

    if (isCompleted === false && email) {
      const customer: Customer = transactionData.Customer as Customer;
      sendCheckoutEmail.mutate(customer);
      // Transaction log handled in mutation hook
    }

    // Persist is_completed and date_completed to database
    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          is_completed: true,
          date_completed: new Date().toISOString(),
        },
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const handleRetrospecStatusChange = (newStatus: string) => {
    let newRefurb = false;
    let newWaitEmail = false;
    let newCompleted = false;
    let dateCompleted: string | null = null;

    switch (newStatus) {
      case "Building":
        newRefurb = true;
        break;
      case "Completed":
        newRefurb = false;
        newWaitEmail = true;
        break;
      case "For Sale":
        newWaitEmail = false;
        newCompleted = true;
        dateCompleted = new Date().toISOString();
        break;
      default:
        newRefurb = false;
        newWaitEmail = false;
        newCompleted = false;
        break;
    }

    setIsRefurb(newRefurb);
    setWaitEmail(newWaitEmail);
    setIsCompleted(newCompleted);

    // Persist to database
    if (transactionData) {
      const updateData = {
        ...transactionData,
        is_refurb: newRefurb,
        is_waiting_on_email: newWaitEmail,
        is_completed: newCompleted,
        ...(dateCompleted && { date_completed: dateCompleted }),
      };

      updateTransaction.mutate({
        transaction_id,
        transaction: updateData,
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const handleTransactionTypeChange = (newTransactionType: string) => {
    setSearchParams((params) => {
      params.set("type", newTransactionType);
      return params;
    });
    setTransactionType(newTransactionType);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const handleSaveNotes = (newNotes: string) => {
    if (debug) console.log("new notes: ", newNotes);
    setDescription(newNotes);

    // Persist description to database with all required fields
    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          description: newNotes,
        },
      });
    }

    queryClient.resetQueries({
      queryKey: ["transactionLogs", transaction_id],
    });
  };

  const handleAddRepair = (event: RowClickedEvent) => {
    const repair = event.data as Repair;
    if (debug) console.log("handle add repair");
    addRepair.mutate(repair);
  };

  const handleRemoveRepair = (repair: RepairDetails) => {
    deleteRepair.mutate(repair);
  };

  const handleToggleDone = (id: string, status: boolean, name: string) => {
    completeRepair.mutate({
      repair_name: name,
      transaction_detail_id: id,
      status,
    });
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

  const handleBikeCreated = (createdBike: Bike) => {
    if (transactionData && createdBike?.bike_id) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          bike_id: createdBike.bike_id,
        },
      });
    }
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  // Wrapper handlers for persisting transaction flags to database
  const handleWaitEmailToggle = () => {
    const newWaitEmail = !waitEmail;
    setWaitEmail(newWaitEmail);

    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          is_waiting_on_email: newWaitEmail,
        },
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handlePriorityToggle = () => {
    const newPriority = !priority;
    setPriority(newPriority);

    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          is_urgent: newPriority,
        },
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleNuclearToggle = () => {
    const newNuclear = !nuclear;
    setNuclear(newNuclear);

    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          is_nuclear: newNuclear,
        },
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleRefurbToggle = () => {
    const newRefurb = !refurb;
    setIsRefurb(newRefurb);

    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          is_refurb: newRefurb,
        },
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleBeerBikeToggle = () => {
    const newBeerBike = !beerBike;
    setBeerBike(newBeerBike);

    if (transactionData) {
      updateTransaction.mutate({
        transaction_id,
        transaction: {
          ...transactionData,
          is_beer_bike: newBeerBike,
        },
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleDeleteTransaction = () => {
    if (transactionData) {
      deleteTransaction.mutate(transactionData);
    }
  };

  const blockCompletion = () => {
    if (!repairDetails) return false;
    if (
      repairDetails.length === 0 &&
      (searchParams.get("type") === "Merch" || refurb)
    ) {
      return false;
    }
    if (debug) console.log("repair details: ", repairDetails);
    return !repairDetails.every((repair: RepairDetails) => repair.completed);
  };

  // ===================================
  // 7. LOADING & ERROR STATES
  // ===================================

  if (repairsLoading || partsLoading || transactionLoading) {
    return <Skeleton />;
  }

  if (!transactionData?.Customer) {
    return <p>Customer not found</p>;
  }

  // ===================================
  // 8. RENDER
  // ===================================

  return (
    <Box sx={{ px: { xs: 0.5, sm: 2, md: "10vw" }, py: { xs: 0.5, md: 2 } }}>
      <Paper
        elevation={3}
        sx={{ p: { xs: 1, sm: 1.5, md: 3 }, borderRadius: { xs: 2, md: 3 } }}
      >
        <Stack sx={{ gap: 2 }}>
          {/* HEADER SECTION */}
          <TransactionHeader
            transactionData={transactionData}
            transactionType={transactionType}
            user={user ?? null}
            beerBike={beerBike}
            refurb={refurb}
            isEmployee={isEmployee}
            onTransactionTypeChange={handleTransactionTypeChange}
            onRetrospecStatusChange={handleRetrospecStatusChange}
            onDeleteTransaction={handleDeleteTransaction}
          />

          {/* NOTES SECTION */}
          <Notes
            notes={transactionData.description ?? ""}
            onSave={handleSaveNotes}
            transaction_num={transactionData.transaction_num}
          />

          <Divider sx={{ my: 2 }} />

          {/* BIKE SECTION */}
          <BikeInformation
            transactionData={transactionData}
            bike={bike}
            setBike={setBike}
            showBikeForm={showBikeForm}
            setShowBikeForm={setShowBikeForm}
            onBikeCreated={handleBikeCreated}
          />
        </Stack>

        <hr />

        {/* PARTS & REPAIRS GRID */}
        <Grid2
          container
          id="transaction-details"
          spacing={{ xs: 0.5, md: 2 }}
          sx={{
            paddingBottom: { xs: "5px", md: "20px" },
            backgroundColor: "white",
            padding: { xs: "5px", sm: "10px", md: "20px" },
            borderRadius: { xs: "4px", md: "16px" },
            boxShadow: 2,
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          {/* SEARCH MODALS */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <SearchModal
              searchData={repairs ?? []}
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
              colDefaults={{ flex: 1 }}
              onRowClick={handleAddRepair}
            >
              Add Repair
            </SearchModal>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <SearchModal
              searchData={parts ?? []}
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
                  field: "standard_price",
                  headerName: "Price",
                  width: 200,
                },
                {
                  field: "upc",
                  headerName: "UPC",
                  width: 200,
                  wrapText: true,
                  autoHeight: true,
                  filter: true,
                },
              ]}
              colDefaults={{ flex: 1 }}
              onRowClick={handleAddPart}
            >
              Add Part
            </SearchModal>
          </Grid2>

          {/* REPAIRS LIST */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <RepairsList
              repairDetails={repairDetails ?? []}
              isLoading={repairDetailsLoading}
              onToggleDone={handleToggleDone}
              onRemove={(id: string) => {
                const repair = repairDetails?.find(
                  (r) => r.transaction_detail_id === id,
                );
                if (repair) handleRemoveRepair(repair);
              }}
            />
          </Grid2>

          {/* PARTS LIST */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <PartsList
              itemDetails={itemDetails ?? []}
              isLoading={itemDetailsLoading}
              isEmployee={isEmployee}
              isBeerBike={beerBike ?? false}
              onRemove={(id: string) => {
                const part = itemDetails?.find(
                  (p) => p.transaction_detail_id === id,
                );
                if (part) handleRemovePart(part);
              }}
            />
          </Grid2>

          {/* ORDERED PARTS LIST */}
          {orderRequestData && orderRequestData.length > 0 && (
            <Grid2 size={{ xs: 12, md: 6 }}>
              <OrderRequestsList
                orderRequestData={orderRequestData}
                isLoading={orderRequestLoading}
                isEmployee={isEmployee}
                isBeerBike={beerBike ?? false}
              />
            </Grid2>
          )}
        </Grid2>

        {/* ACTIONS SECTION */}
        <TransactionActions
          transactionData={transactionData}
          transaction_id={transaction_id}
          user={user ?? null}
          totalPrice={totalPrice}
          isCompleted={isCompleted}
          isEmployee={isEmployee}
          beerBike={beerBike}
          waitPart={waitPart}
          waitEmail={waitEmail}
          priority={priority}
          nuclear={nuclear}
          refurb={refurb}
          showCheckout={showCheckout}
          showWaitingParts={showWaitingParts}
          repairDetails={repairDetails ?? []}
          itemDetails={itemDetails ?? []}
          parts={parts ?? []}
          setShowCheckout={setShowCheckout}
          setShowWaitingParts={setShowWaitingParts}
          setWaitPart={setWaitPart}
          setWaitEmail={handleWaitEmailToggle}
          setPriority={handlePriorityToggle}
          setNuclear={handleNuclearToggle}
          setIsRefurb={handleRefurbToggle}
          setBeerBike={handleBeerBikeToggle}
          setIsCompleted={setIsCompleted}
          setPaid={setPaid}
          handlePaid={handlePaid}
          handleMarkDone={handleMarkDone}
          handleAddOrderedPart={handleAddOrderedPart}
          blockCompletion={blockCompletion}
          totalRef={totalRef}
        />
      </Paper>
    </Box>
  );
};

export default TransactionDetail;
