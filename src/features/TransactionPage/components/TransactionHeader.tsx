import { Box, Typography, Stack, Button, Grid2, Divider } from "@mui/material";
import { Transaction, User } from "../../../model";
import TransactionOptionDropdown from "../../../components/TransactionPage/TransactionOptionDropdown";
import TransactionsLogModal from "../../../components/TransactionsLogModal";
import DeleteTransactionsModal from "../DeleteTransactionsModal";
import Item from "../../../components/TransactionPage/HeaderItem";
import { checkStatusOfRetrospec, checkUserPermissions } from "../utils";

interface TransactionHeaderProps {
  transactionData: Transaction;
  transactionType: string;
  user: User | null;
  beerBike?: boolean;
  refurb?: boolean;
  isEmployee?: boolean;
  onTransactionTypeChange: (type: string) => void;
  onRetrospecStatusChange: (status: string) => void;
  onDeleteTransaction: () => void;
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  transactionData,
  transactionType,
  user,
  beerBike,
  refurb,
  isEmployee,
  onTransactionTypeChange,
  onRetrospecStatusChange,
  onDeleteTransaction,
}) => {
  if (!transactionData.Customer) {
    return null;
  }

  return (
    <Box>
      <Grid2 container>
        <Grid2
          size={{ xs: 12, md: 6 }}
          className="transaction-options-container"
        >
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 2 }}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" },
              }}
            >
              {`${transactionData.transaction_num}: ${transactionData.Customer.first_name} ${transactionData.Customer.last_name}`}
            </Typography>
          </Stack>
          <TransactionOptionDropdown
            options={["Inpatient", "Outpatient", "Merch", "Retrospec"]}
            colors={["green", "blue", "gray", "orange"]}
            setTransactionType={onTransactionTypeChange}
            initialOption={transactionType.toLowerCase()}
            isAllowed={(index: string) =>
              index === "Retrospec"
                ? checkUserPermissions(
                    user ?? null,
                    "createRetrospecTransaction",
                  )
                : true
            }
          />
          {transactionType.toLowerCase() === "retrospec" && (
            <TransactionOptionDropdown
              options={["Arrived", "Building", "Completed", "For Sale"]}
              colors={["gray"]}
              setTransactionType={onRetrospecStatusChange}
              initialOption={checkStatusOfRetrospec(transactionData)}
              isAllowed={(option: string) =>
                ["For Sale", "Arrived"].includes(option)
                  ? checkUserPermissions(user ?? null, "safetyCheckBikes")
                  : true
              }
            />
          )}
          {beerBike && (
            <Button
              style={{
                backgroundColor: "turquoise",
                color: "black",
                pointerEvents: "none",
                width: "fit-content",
                whiteSpace: "nowrap",
              }}
              variant="contained"
              size="small"
              sx={{
                fontSize: { xs: "0.7rem", md: "0.875rem" },
                py: { xs: 0.25, md: 0.5 },
                px: { xs: 0.5, md: 1 },
              }}
            >
              Beer Bike
            </Button>
          )}

          {refurb && transactionType.toLowerCase() !== "retrospec" && (
            <Button
              style={{
                backgroundColor: "beige",
                color: "black",
                pointerEvents: "none",
              }}
              variant="contained"
              size="small"
              sx={{
                fontSize: { xs: "0.7rem", md: "0.875rem" },
                py: { xs: 0.25, md: 0.5 },
                px: { xs: 0.5, md: 1 },
              }}
            >
              Refurb
            </Button>
          )}
          {isEmployee && (
            <Button
              style={{
                backgroundColor: "green",
                color: "white",
                pointerEvents: "none",
              }}
              variant="contained"
              size="small"
              sx={{
                fontSize: { xs: "0.7rem", md: "0.875rem" },
                py: { xs: 0.25, md: 0.5 },
                px: { xs: 0.5, md: 1 },
              }}
            >
              Employee
            </Button>
          )}
        </Grid2>
        <Grid2
          size={{ xs: 12, md: 6 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            gap: "5px",
            mt: { xs: 1, md: 0 },
          }}
        >
          <TransactionsLogModal
            transaction_num={transactionData.transaction_num}
          />

          {(transactionType.toLowerCase() !== "retrospec" ||
            (transactionType.toLowerCase() === "retrospec" &&
              checkUserPermissions(
                user ?? null,
                "createRetrospecTransaction",
              ))) && (
            <DeleteTransactionsModal handleConfirm={onDeleteTransaction} />
          )}
        </Grid2>
      </Grid2>
      <Item
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "8px 12px",
        }}
      >
        <h3
          style={{
            fontSize: "clamp(0.75rem, 2vw, 1.17rem)",
            margin: "4px 0",
            wordBreak: "break-word",
          }}
        >
          <strong>📧: </strong>
          <a
            target="_blank"
            href={`mailto:${transactionData.Customer.email}?subject=Your bike`}
            rel="noreferrer"
            style={{ fontSize: "clamp(0.7rem, 1.8vw, 1rem)" }}
          >
            {transactionData.Customer.email}
          </a>
        </h3>
        <h3
          style={{
            fontSize: "clamp(0.75rem, 2vw, 1.17rem)",
            margin: "4px 0",
            whiteSpace: "nowrap",
          }}
        >
          <strong>#: </strong>
          {transactionData.Customer.phone}
        </h3>
      </Item>
      <Divider sx={{ my: { xs: 1, md: 2 } }} />
    </Box>
  );
};
