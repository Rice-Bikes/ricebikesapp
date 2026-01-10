import { ColDef, ICellRendererParams } from "ag-grid-community";
import { Chip, Stack, Typography } from "@mui/material";
import type { IRow } from "./TransactionsTable.types";

// Column definitions specifically for Bike Sales transactions
export const getBikeSalesColumnDefs = (): ColDef<IRow>[] => [
  {
    headerName: "#",
    colId: "transaction_num",
    valueGetter: (params) => params.data?.Transaction.transaction_num,
    filter: true,
    width: 80,
    resizable: false,
    lockPosition: "left",
  },
  {
    headerName: "Customer",
    valueGetter: (params) =>
      params.data?.Customer.first_name !== ""
        ? `${params.data?.Customer.first_name} ${params.data?.Customer.last_name}`
        : "No customer assigned",
    filter: true,
    width: 150,
  },
  {
    headerName: "Bike Details",
    flex: 3,
    width: 250,
    cellRenderer: (params: ICellRendererParams) => {
      const bike = params.data?.Bike;

      return (
        <Stack
          spacing={0.5}
          sx={{ py: 1 }}
          direction={"row"}
          alignItems="center"
        >
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
            {bike && `${bike.make} ${bike.model}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {!bike && "No bike assigned"}
          </Typography>
          {bike && (
            <Stack direction="row" spacing={1} alignItems="center">
              {bike.bike_type && (
                <Chip size="small" label={bike.bike_type} variant="outlined" />
              )}
              {bike.size_cm && (
                <Typography variant="caption" color="text.secondary">
                  {bike.size_cm} cm
                </Typography>
              )}
              {bike.condition && (
                <Chip
                  size="small"
                  label={bike.condition}
                  color={
                    bike.condition === "New"
                      ? "success"
                      : bike.condition === "Refurbished"
                        ? "warning"
                        : "default"
                  }
                />
              )}
            </Stack>
          )}
        </Stack>
      );
    },
  },
  {
    headerName: "Price",
    valueGetter: (params) => {
      const p = Number(params.data?.Bike?.price);
      return Number.isFinite(p) ? p : 0;
    },
    cellRenderer: (params: ICellRendererParams) => {
      const raw = params.data?.Bike?.price;
      const price = Number(raw);
      const showPrice = Number.isFinite(price) && price !== 0;
      return (
        <Stack
          spacing={0.5}
          sx={{ py: 1 }}
          direction={"row"}
          alignItems="center"
        >
          {showPrice ? (
            <Typography color="text.secondary">${price.toFixed(2)}</Typography>
          ) : (
            <Typography color="text.secondary">TBD</Typography>
          )}
        </Stack>
      );
    },
    width: 100,
  },
  {
    headerName: "Status",
    flex: 1,
    width: 150,
    cellRenderer: (params: ICellRendererParams) => {
      const transaction = params.data?.Transaction;
      const bike = params.data?.Bike;

      if (!transaction) return null;

      const isReserved = transaction.is_reserved;
      const isCompleted = transaction.is_completed;
      const isPaid = transaction.is_paid;
      const isAvailable = bike?.is_available;

      return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
          {isReserved && !isCompleted && (
            <Chip size="small" label="Reserved" color="warning" />
          )}
          {!isReserved && isAvailable && (
            <Chip size="small" label="Available" color="success" />
          )}
          {isCompleted && !isPaid && (
            <Chip size="small" label="Awaiting Payment" color="info" />
          )}
          {isCompleted && isPaid && (
            <Chip size="small" label="Sold" color="success" />
          )}
          {!isAvailable && !isReserved && (
            <Chip size="small" label="Unavailable" color="error" />
          )}
        </Stack>
      );
    },
  },
  {
    headerName: "Created",
    colId: "created_date",
    valueGetter: (params) => {
      const dateCreated = params.data?.Transaction.date_created;
      return dateCreated ? new Date(dateCreated) : null;
    },
    cellRenderer: (params: ICellRendererParams) => {
      const date = params.value;
      if (!date) return "";

      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString();
    },
    width: 120,
  },
];
