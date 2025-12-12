import { Button, Grid2, Stack, Typography } from "@mui/material";
import { ErrorSharp } from "@mui/icons-material";
import type {
  Transaction,
  RepairDetails,
  ItemDetails,
  Part,
  User,
} from "../../../model";
import CheckoutModal from "../CheckoutModal";
import CompleteTransactionDropdown from "../CompleteTransactionDropdown";
import SetProjectsTypesDropdown from "../SetProjectsTypesDropdown";
import WhiteboardEntryModal from "../../../components/WhiteboardEntryModal";
import CopyReceiptButton from "../../RecieptButton";
import {
  SALES_TAX_MULTIPLIER,
  MECHANIC_PART_MULTIPLIER,
} from "../../../constants/transaction";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionActionsProps {
  transactionData: Transaction;
  transaction_id: string;
  user: User | null;

  // State
  totalPrice: number;
  isCompleted: boolean | undefined;

  isEmployee: boolean;
  beerBike: boolean | undefined;
  waitPart: boolean | undefined;
  waitEmail: boolean;
  priority: boolean | undefined;
  nuclear: boolean | undefined;
  refurb: boolean | undefined;
  showCheckout: boolean;
  showWaitingParts: boolean;

  // Data
  repairDetails: RepairDetails[];
  itemDetails: ItemDetails[];
  parts: Part[];

  // Handlers
  setShowCheckout: (show: boolean) => void;
  setShowWaitingParts: (show: boolean) => void;
  setWaitPart: (wait: boolean | undefined) => void;
  setWaitEmail: (wait: boolean) => void;
  setPriority: (priority: boolean | undefined) => void;
  setNuclear: (nuclear: boolean | undefined) => void;
  setIsRefurb: (refurb: boolean | undefined) => void;
  setBeerBike: (beerBike: boolean | undefined) => void;
  setIsCompleted: (completed: boolean | undefined) => void;
  setPaid: (paid: boolean) => void;

  handlePaid: () => void;
  handleMarkDone: (email: boolean) => void;
  handleAddOrderedPart: (item: Part) => void;
  blockCompletion: () => boolean;

  totalRef: React.RefObject<HTMLDivElement>;
}

/**
 * TransactionActions component displays all action buttons for a transaction.
 * Includes checkout, completion, email, pricing, and status toggles.
 */
export const TransactionActions = ({
  transactionData,
  transaction_id,
  user,
  totalPrice,
  isCompleted,
  isEmployee,
  beerBike,
  waitPart,
  waitEmail,
  priority,
  nuclear,
  refurb,
  showCheckout,
  showWaitingParts,
  repairDetails,
  itemDetails,
  parts,
  setShowCheckout,
  setShowWaitingParts,
  setWaitPart,
  setWaitEmail,
  setPriority,
  setNuclear,
  setIsRefurb,
  setBeerBike,
  setIsCompleted,
  setPaid,
  handlePaid,
  handleMarkDone,
  handleAddOrderedPart,
  blockCompletion,
  totalRef,
}: TransactionActionsProps) => {
  const queryClient = useQueryClient();

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const closeCheckout = () => {
    setShowCheckout(false);
  };

  const handleWaitPartClick = () => {
    setShowWaitingParts(!showWaitingParts);
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

  const handlePriority = () => {
    setPriority(!priority);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleNuclear = () => {
    setNuclear(!nuclear);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  const handleReopenTransaction = () => {
    setIsCompleted(false);
    setPaid(false);
    queryClient.invalidateQueries({
      queryKey: ["transaction", transaction_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
  };

  return (
    <Grid2
      container
      sx={{
        mt: { xs: 2, md: "5vh" },
        backgroundColor: "white",
        borderRadius: "10px",
        padding: { xs: "8px", md: "10px" },
      }}
    >
      {/* Total Section */}
      <Grid2
        size={12}
        style={{
          borderRadius: "10px",
          marginBottom: "5px",
        }}
        ref={totalRef}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: { xs: "1rem", md: "1.25rem" } }}
        >
          Total
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "1.75rem" } }}
        >
          ${(totalPrice * SALES_TAX_MULTIPLIER).toFixed(2)}
        </Typography>
        <WhiteboardEntryModal
          open={showWaitingParts}
          onClose={() => setShowWaitingParts(false)}
          setWaitingOnParts={(waiting: boolean) => setWaitPart(waiting)}
          waitingOnParts={waitPart ?? false}
          parts={parts}
          transaction_id={transaction_id}
          user_id={user?.user_id ?? ""}
          handleAddOrderedPart={handleAddOrderedPart}
        />
      </Grid2>

      {/* Status Toggle Buttons */}
      <Grid2
        size={12}
        sx={{
          color: "white",
          marginBottom: { xs: "8px", md: "10px" },
        }}
      >
        <Stack
          spacing={{ xs: 0.75, md: 1 }}
          direction={{ xs: "column", md: "row" }}
          alignItems="stretch"
          sx={{
            "& > *": {
              minHeight: { xs: "40px", md: "6vh" },
            },
          }}
        >
          <Stack
            spacing={{ xs: 0.75, md: 1 }}
            direction="row"
            sx={{
              flexWrap: { xs: "wrap", md: "nowrap" },
              width: "100%",
            }}
          >
            <Button
              onClick={handleWaitPartClick}
              style={{
                backgroundColor: waitPart ? "red" : "grey",
                color: "white",
              }}
              variant="contained"
              size="small"
              sx={{
                flex: { xs: "1 1 calc(50% - 3px)", md: "0 1 auto" },
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                padding: { xs: "6px 8px", md: "6px 16px" },
              }}
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
              size="small"
              sx={{
                flex: { xs: "1 1 calc(50% - 3px)", md: "0 1 auto" },
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                padding: { xs: "6px 8px", md: "6px 16px" },
              }}
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
              size="small"
              sx={{
                minWidth: { xs: "40px", md: "auto" },
                padding: { xs: "6px", md: "6px 16px" },
              }}
            >
              <ErrorSharp
                style={{
                  color: priority ? "red" : "white",
                  marginRight: "5px",
                }}
                sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
              />
            </Button>
            <Button
              onClick={handleNuclear}
              style={{
                borderColor: nuclear ? "red" : "black",
                color: nuclear ? "red" : "black",
              }}
              variant="outlined"
              size="small"
              sx={{
                flex: { xs: "1 1 100%", md: "0 1 auto" },
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                padding: { xs: "6px 8px", md: "6px 16px" },
              }}
            >
              {nuclear ? (
                <i className="fas fa-radiation" style={{ color: "red" }} />
              ) : (
                "Mark as Nuclear"
              )}
            </Button>

            <SetProjectsTypesDropdown
              setRefurb={() => setIsRefurb(!refurb)}
              setBeerBike={() => setBeerBike(!beerBike)}
            />
          </Stack>
        </Stack>
      </Grid2>

      {/* Action Buttons */}
      <Grid2 size={12}>
        <Stack
          spacing={{ xs: 1, md: 1.25 }}
          direction={{ xs: "column", md: "row" }}
          sx={{
            "& > button": {
              width: { xs: "100%", md: "auto" },
            },
          }}
        >
          <Button
            onClick={handleCheckout}
            disabled={!isCompleted}
            style={{
              backgroundColor: isCompleted ? "green" : "grey",
              border: "white",
              color: "white",
              opacity: isCompleted ? 1 : 0.5,
            }}
            variant="outlined"
            size="medium"
            sx={{
              fontSize: { xs: "0.875rem", md: "0.875rem" },
              padding: { xs: "8px 16px", md: "6px 16px" },
            }}
          >
            Checkout
          </Button>

          {showCheckout && (
            <CheckoutModal
              repairDetails={repairDetails}
              itemDetails={itemDetails}
              totalPrice={totalPrice}
              isEmployee={isEmployee}
              beerBike={beerBike ?? false}
              handlePaid={handlePaid}
              closeCheckout={closeCheckout}
            />
          )}

          {!isCompleted ? (
            <CompleteTransactionDropdown
              sendEmail={() => handleMarkDone(true)}
              disabled={blockCompletion()}
              completeTransaction={() => handleMarkDone(false)}
            />
          ) : (
            <Button
              onClick={handleReopenTransaction}
              style={{
                color: "white",
                backgroundColor: "gray",
              }}
              variant="outlined"
              size="medium"
              sx={{
                fontSize: { xs: "0.875rem", md: "0.875rem" },
                padding: { xs: "8px 16px", md: "6px 16px" },
              }}
            >
              Reopen Transaction
            </Button>
          )}

          <CopyReceiptButton
            transactionData={transactionData}
            items={
              itemDetails?.map((item) => ({
                ...item.Item,
                standard_price:
                  !isEmployee || beerBike
                    ? item.Item.standard_price
                    : item.Item.wholesale_cost * MECHANIC_PART_MULTIPLIER,
              })) ?? []
            }
            repairs={repairDetails?.map((repair) => repair.Repair) ?? []}
          />
        </Stack>
      </Grid2>
    </Grid2>
  );
};
