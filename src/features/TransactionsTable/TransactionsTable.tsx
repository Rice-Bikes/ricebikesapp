import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { themeQuartz } from "ag-grid-community";
import { useState, useMemo, useRef, useEffect } from "react"; // React State Hook
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Select,
  MenuItem,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import { ErrorSharp, Search } from "@mui/icons-material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import type {
  ColDef,
  RowClickedEvent,
  RowSelectionOptions,
  ICellRendererParams,
  IRowNode,
} from "ag-grid-community";
import CreateTransactionDropdown from "./TransactionTypeDropdown";
import "./TransactionsTable.css";
import {
  Transaction,
  Bike,
  Customer,
  TransactionSummary,
  OrderRequest,
  TransactionDetails,
} from "../../model";
import { useNavigate } from "react-router-dom";
import DBModel from "../../model";
import PriceCheckModal from "../../components/PriceCheckModal";
import { getBikeSalesColumnDefs } from "./BikeSalesColumns";
import ConstructionIcon from "@mui/icons-material/Construction";
import PanToolIcon from "@mui/icons-material/PanTool";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export interface IRow {
  Transaction: Transaction;
  Customer: Customer;
  OrderRequests: Array<OrderRequest>;
  Bike?: Bike;
}

const isDaysLess = (numDays: number, date1: Date, date2: Date): boolean => {
  const twoDaysInMillis = numDays * 24 * 60 * 60 * 1000; // Two days in milliseconds
  const diffInMillis = Math.abs(date2.getTime() - date1.getTime());
  return diffInMillis > twoDaysInMillis;
};

function timeAgo(input: Date) {
  const date = input;
  const formatter = new Intl.RelativeTimeFormat("en");
  const ranges = [
    ["years", 3600 * 24 * 365],
    ["months", 3600 * 24 * 30],
    ["weeks", 3600 * 24 * 7],
    ["days", 3600 * 24],
    ["hours", 3600],
    ["minutes", 60],
    ["seconds", 1],
  ] as const;
  const secondsElapsed = (date.getTime() - Date.now()) / 1000;

  for (const [rangeType, rangeVal] of ranges) {
    if (rangeVal < Math.abs(secondsElapsed)) {
      const delta = secondsElapsed / rangeVal;
      return formatter.format(Math.round(delta), rangeType);
    }
  }
}

const checkStatusOfRetrospec = (
  refurb: boolean,
  email: boolean,
  completed: boolean,
) => {
  // Different states:
  // 1. Arrived (not building): !refurb && !email && !completed
  // 2. Building: refurb && !email && !completed
  // 3. Ready for inspection/email: !refurb && email && !completed
  // 4. For sale: completed

  if (completed) {
    return (
      <MonetizationOnIcon style={{ color: "green", marginRight: "5px" }} />
    );
  } else if (email && !refurb) {
    return <PanToolIcon style={{ color: "red", marginRight: "5px" }} />;
  } else if (refurb) {
    return <ConstructionIcon style={{ color: "gold", marginRight: "5px" }} />;
  }
  // Default state: arrived but not building yet
  return <LocalShippingIcon style={{ color: "blue", marginRight: "5px" }} />;
};

const debug: boolean = import.meta.env.VITE_DEBUG;

// Renders a progress bar based on repair-type TransactionDetails for the row
const ProgressCellRenderer = ({ data }: ICellRendererParams) => {
  const transactionId: string | undefined = data?.Transaction?.transaction_id;

  const { data: details, isLoading } = useQuery({
    queryKey: ["transactionDetails", transactionId, "repair"],
    queryFn: () =>
      transactionId
        ? DBModel.fetchTransactionDetails(transactionId, "repair")
        : Promise.resolve([]),
    enabled: !!transactionId,
    select: (data) => data as TransactionDetails[],
  });

  // If loading, keep row height consistent. If details are empty/null, show a completed checkmark.
  if (!transactionId || isLoading) {
    return <div style={{ height: 10 }} />;
  }
  if (!details || details.length === 0) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        style={{ width: "100%", height: "100%" }}
        justifyContent="center"
      >
        <div
          style={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: 10,
              borderRadius: 5,
              background: "#e0e0e0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#2e7d32",
              }}
            />
          </div>
        </div>
        <CheckCircleIcon style={{ color: "#2e7d32" }} fontSize="medium" />
      </Stack>
    );
  }

  const total = details.length;
  const completed = details.filter(
    (d: TransactionDetails) => d.completed === true,
  ).length;
  const percent = Math.round((completed / total) * 100);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      style={{ width: "100%", height: "100%" }}
      justifyContent="center"
    >
      <div style={{ flexGrow: 1 }}>
        <div
          style={{
            width: "100%",
            height: 10,
            borderRadius: 5,
            background: "#e0e0e0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: percent === 100 ? "#2e7d32" : "#fb8c00",
            }}
          />
        </div>
      </div>
      {percent === 100 ? (
        <CheckCircleIcon style={{ color: "#2e7d32" }} fontSize="medium" />
      ) : (
        <span style={{ minWidth: 32 }}>{percent}%</span>
      )}
    </Stack>
  );
};

export function TransactionsTable(): JSX.Element {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const currDate: Date = new Date();
  const [viewType, setViewType] = useState<string>(() => {
    try {
      return localStorage.getItem("transactionsTable:viewType") || "main";
    } catch {
      return "main";
    }
  });
  const gridApiRef = useRef<AgGridReact>(null);
  const [, setRowData] = useState<IRow[]>([]);
  const [summaryData, setSummaryData] = useState<TransactionSummary>();
  const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);
  const [searchText, setSearchText] = useState<string>("");

  // Persist selected view type across navigations
  useEffect(() => {
    localStorage.setItem("transactionsTable:viewType", viewType);
  }, [viewType]);

  // Apply stored view type after mount when the grid API is available
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (gridApiRef.current?.api) {
          applyViewType(viewType);
        }
      } catch (e) {
        console.error("Error applying initial view type:", e);
      }
    }, 0);
    return () => clearTimeout(t);
  });

  const onRowClicked = (e: RowClickedEvent) => {
    // Route Retrospec transactions to the new bike transaction system
    if (e.data.Transaction.transaction_type?.toLowerCase() === "retrospec") {
      navigate(
        `/bike-transaction/${e.data.Transaction.transaction_id}?type=${e.data.Transaction.transaction_type}`,
      );
    } else {
      // Route all other transactions to the regular transaction page
      navigate(
        `/transaction-details/${e.data.Transaction.transaction_id}?type=${e.data.Transaction.transaction_type}`,
      );
    }
  };

  const { status, data, error } = useQuery(
    DBModel.getTransactionsQuery(100000000, true),
  );

  const {
    status: summaryStatus,
    data: summaryQueryData,
    error: summaryError,
  } = useQuery({
    queryKey: ["transactionSummary"],
    queryFn: () => DBModel.fetchTransactionSummary(),
  });
  if (summaryError) console.error("summary error", summaryError);

  useEffect(() => {
    if (status === "success") {
      setRowData(data as IRow[]);
    }
    if (summaryStatus === "success") {
      setSummaryData(summaryQueryData as TransactionSummary);
    }
  }, [status, data, error, summaryStatus, summaryQueryData, summaryError]);
  if (debug) console.log(status, data, error);

  // Dynamic column definitions based on view type
  const colDefs = useMemo<ColDef<IRow>[]>(() => {
    // Use bike sales columns for Retrospec transactions
    if (viewType === "retrospec") {
      try {
        const bikeSalesColumns = getBikeSalesColumnDefs();
        if (
          bikeSalesColumns &&
          Array.isArray(bikeSalesColumns) &&
          bikeSalesColumns.length > 0
        ) {
          // Hide certain columns on mobile for Retrospec view
          if (isMobile) {
            return bikeSalesColumns.map((col) => {
              if (col.colId === "Bike" || col.colId === "submitted") {
                return { ...col, hide: true };
              }
              return col;
            });
          }

          // Validate that all columns have required properties
          const validColumns = bikeSalesColumns.filter(
            (col) => col && typeof col === "object",
          );
          if (validColumns.length === bikeSalesColumns.length) {
            return validColumns;
          }
          console.warn(
            "Some bike sales columns are invalid, falling back to default columns",
          );
        } else {
          console.warn(
            "getBikeSalesColumnDefs returned empty or null, falling back to default columns",
          );
        }
      } catch (error) {
        console.error("Error loading bike sales columns:", error);
      }
      // Fallback to default columns if bike sales columns fail
    }

    // Default columns for all other transaction types
    return [
      {
        headerName: "#",
        colId: "transaction_num",
        valueGetter: (params) => params.data?.Transaction.transaction_num,
        filter: true,
        // hide: isMobile, // Hide on mobile
        // flex: isMobile ? 0 : undefined,
      },
      {
        headerName: "Status",
        flex: 1.35,
        valueGetter: (params) => {
          const isBeerBike = params.data?.Transaction.is_beer_bike;
          const transaction_type = params.data?.Transaction.transaction_type;
          // const refurb = params.data?.Transaction.is_refurb;

          // Return the data to be rendered by the cellRenderer
          return {
            isBeerBike,
            transaction_type,
            // refurb,
          };
        },
        cellRenderer: (params: ICellRendererParams) => {
          const { isBeerBike, transaction_type } = params.value;

          if (transaction_type.toLowerCase() !== "retrospec") {
            return (
              <Stack
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: "5px",
                }}
                direction={"row"}
              >
                {transaction_type?.toLowerCase() === "inpatient" && (
                  <Chip
                    label="Inpatient"
                    sx={{
                      margin: "0 0.5vw",
                      backgroundColor: "green",
                      color: "white",
                    }}
                  />
                )}

                {transaction_type?.toLowerCase() === "outpatient" && (
                  <Chip
                    label="Outpatient"
                    sx={{
                      margin: "0 0.5vw",
                      backgroundColor: "blue",
                      color: "white",
                    }}
                  />
                )}

                {transaction_type?.toLowerCase() === "merch" && (
                  <Chip
                    label="Merch"
                    sx={{
                      margin: "0 0.5vw",
                      backgroundColor: "gray",
                      color: "white",
                    }}
                  />
                )}
                {isBeerBike && (
                  <Chip
                    label="Beer Bike"
                    sx={{
                      margin: "0 0.5vw",
                      backgroundColor: "turquoise",
                      color: "black",
                    }}
                  />
                )}
              </Stack>
            );
          } else {
            return (
              <Stack
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
                direction={"row"}
              >
                <Chip
                  label="Build"
                  sx={{
                    backgroundColor: "orange",
                    color: "white",
                    marginTop: "4px",
                    marginLeft: "10px",
                    marginRight: "5px",
                  }}
                />
              </Stack>
            );
          }
        },
      },
      {
        headerName: "Tags",
        flex: 0.6,
        valueGetter: (params) => {
          const isWaitEmail = params.data?.Transaction.is_waiting_on_email;
          const isUrgent = params.data?.Transaction.is_urgent;
          const isNuclear = params.data?.Transaction.is_nuclear;
          const isBeerBike = params.data?.Transaction.is_beer_bike;
          const transaction_type = params.data?.Transaction.transaction_type;
          const isWaitingOnParts =
            (params.data?.OrderRequests?.length ?? 0) > 0;
          const is_completed = params.data?.Transaction.is_completed;
          const refurb = params.data?.Transaction.is_refurb;

          // Return the data to be rendered by the cellRenderer
          return {
            isWaitEmail,
            isUrgent,
            isNuclear,
            isBeerBike,
            transaction_type,
            isWaitingOnParts,
            is_completed,
            refurb,
          };
        },
        cellRenderer: (params: ICellRendererParams) => {
          const {
            isWaitEmail,
            isUrgent,
            isNuclear,
            transaction_type,
            isWaitingOnParts,
            is_completed,
            refurb,
          } = params.value;

          if (transaction_type.toLowerCase() !== "retrospec") {
            return (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                style={{ width: "100%", minHeight: "100%" }}
                justifyContent="flex-start"
              >
                {isUrgent && !is_completed && (
                  <ErrorSharp style={{ color: "red", marginRight: "5px" }} />
                )}
                {isWaitingOnParts && !is_completed && (
                  <i
                    className="fas fa-wrench"
                    style={{ color: "orange", marginRight: "5px" }}
                  />
                )}
                {isNuclear && !is_completed && (
                  <i
                    className="fas fa-radiation"
                    style={{ color: "red", marginRight: "5px" }}
                  ></i>
                )}
                {isWaitEmail && <EmailOutlinedIcon style={{ color: "red" }} />}
              </Stack>
            );
          } else {
            return (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                style={{ width: "100%", minHeight: "100%" }}
                justifyContent="flex-start"
              >
                {checkStatusOfRetrospec(refurb, isWaitEmail, is_completed)}
                {isNuclear && !is_completed && (
                  <i
                    className="fas fa-radiation"
                    style={{ color: "red", marginRight: "5px" }}
                  ></i>
                )}
              </Stack>
            );
          }
        },
      },
      {
        headerName: "Progress",
        colId: "progress",
        flex: 1.1,
        filter: false,
        sortable: false,
        suppressMenu: true,
        valueGetter: (params) => params.data?.Transaction?.transaction_id,
        cellRenderer: ProgressCellRenderer,
      },
      {
        headerName: "Name",
        valueGetter: (params) =>
          `${params.data?.Customer.first_name} ${params.data?.Customer.last_name}`,
        filter: true,
        hide: isMobile, // Hide on mobile
        flex: isMobile ? 0 : undefined,
      },
      {
        headerName: "Bike",
        valueGetter: (params) => {
          if (
            !params.data?.Bike ||
            (params.data?.Bike.make === "" && params.data?.Bike.model === "")
          ) {
            return "";
          }
          return params.data?.Bike.make + " " + params.data?.Bike.model;
        },
      },
      {
        headerName: "Created",
        colId: "submitted",
        valueGetter: (params) => {
          if (
            !params.data?.Transaction ||
            params.data?.Transaction.date_created === undefined ||
            params.data?.Transaction.date_created === null
          ) {
            return "";
          }

          return new Date(params.data?.Transaction.date_created);
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (
            !params.data?.Transaction ||
            params.data?.Transaction.date_created === undefined ||
            params.data?.Transaction.date_created === null
          ) {
            return "";
          }

          return timeAgo(new Date(params.data?.Transaction.date_created));
        },
      },
      {
        headerName: "Time Since Completion",
        colId: "time_since_completion",
        valueGetter: (params) => {
          if (
            !params.data?.Transaction ||
            params.data?.Transaction.date_completed === undefined ||
            params.data?.Transaction.date_completed === null
          ) {
            return "";
          }

          return new Date(params.data?.Transaction.date_completed);
        },
        cellRenderer: (params: ICellRendererParams) => {
          if (
            !params.data?.Transaction ||
            params.data?.Transaction.date_completed === undefined ||
            params.data?.Transaction.date_completed === null
          ) {
            return "";
          }

          return timeAgo(new Date(params.data?.Transaction.date_completed));
        },
      },
    ];
  }, [viewType]); // Recalculate columns when view type changes

  const defaultColDef: ColDef = {
    flex: 1,
  };
  const rowSelection = useMemo<
    RowSelectionOptions | "single" | "multiple"
  >(() => {
    return {
      mode: "singleRow",
      checkboxes: false,
      enableClickSelection: true,
    };
  }, []);

  const applyViewType = (newAlignment: string) => {
    if (newAlignment !== null) {
      if (debug) console.log("new alignment", newAlignment);
      setViewType(newAlignment);
      // Clear search text when changing views
      setSearchText("");

      // Add a small delay to ensure the column definitions have been updated
      setTimeout(() => {
        try {
          if (!gridApiRef.current?.api) {
            console.warn(
              "Grid API not available, skipping column state updates",
            );
            return;
          }

          const sortFunc = sortMap.get(newAlignment) ?? clearSort;

          if (
            newAlignment === "paid" ||
            newAlignment === "pickup" ||
            newAlignment === "completed"
          ) {
            gridApiRef.current.api.applyColumnState({
              state: [
                { colId: "time_since_completion", hide: false },
                { colId: "submitted", hide: true },
              ],
              defaultState: { hide: null },
            });
          } else {
            gridApiRef.current.api.applyColumnState({
              state: [
                { colId: "time_since_completion", hide: true },
                { colId: "submitted", hide: false },
              ],
              defaultState: { hide: null },
            });
          }

          sortFunc();
          gridApiRef.current.api.sizeColumnsToFit();
        } catch (error) {
          console.error("Error updating grid state:", error);
        }
      }, 100);
    }
  };

  function isExternalFilterPresent() {
    return true;
  }

  function doesExternalFilterPass(node: IRowNode) {
    const transaction = node.data.Transaction as Transaction;
    const isRetrospec =
      transaction.transaction_type != null &&
      transaction.transaction_type.toLowerCase() === "retrospec";

    const matchesView =
      (viewType === "retrospec" &&
        isRetrospec &&
        transaction?.is_paid === false) ||
      (viewType === "pickup" &&
        transaction?.is_paid === false &&
        transaction?.is_completed === true &&
        transaction?.is_refurb === false &&
        transaction.transaction_type != null &&
        !isRetrospec &&
        !isDaysLess(
          183,
          new Date(transaction.date_created ?? ""),
          new Date(),
        )) ||
      (viewType === "paid" && transaction?.is_paid === true) ||
      (viewType === "completed" && transaction?.is_completed === true) ||
      (viewType === "main" &&
        // Include regular non-retrospec transactions that are incomplete
        ((transaction?.is_completed === false &&
          transaction.transaction_type != null &&
          !isRetrospec &&
          (transaction?.is_employee === false ||
            (transaction?.is_employee === true &&
              transaction?.is_beer_bike === true)) &&
          transaction?.is_refurb === false) ||
          // Include retrospec transactions that are actively being built (is_refurb = true)
          (isRetrospec &&
            transaction?.is_refurb === true &&
            !transaction?.is_completed &&
            !transaction?.is_waiting_on_email))) ||
      (viewType === "employee" &&
        transaction?.is_employee === true &&
        transaction?.is_completed === false &&
        transaction?.is_beer_bike === false &&
        transaction.transaction_type != null &&
        !isRetrospec &&
        transaction?.is_refurb === false) ||
      (viewType === "refurb" &&
        transaction?.is_refurb === true &&
        transaction?.is_paid === false &&
        transaction?.is_completed === false &&
        transaction.transaction_type != null &&
        !isRetrospec) ||
      (viewType === "beer bike" &&
        transaction?.is_beer_bike === true &&
        !isDaysLess(
          364,
          new Date(transaction?.date_created ?? ""),
          new Date(),
        ));

    if (!matchesView) return false;

    // Apply search filter only for "completed" view
    if (viewType === "completed" && searchText.trim() !== "") {
      const searchLower = searchText.toLowerCase();
      const transactionNum = transaction?.transaction_id?.toString() || "";
      const customerName = (node.data.Customer?.name || "").toLowerCase();
      const email = (node.data.Customer?.email || "").toLowerCase();
      const phone = (node.data.Customer?.phone || "").toLowerCase();

      return (
        transactionNum.includes(searchLower) ||
        customerName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower)
      );
    }

    return true;
  }

  function sortByTransactionNumDesc() {
    try {
      if (gridApiRef.current?.api) {
        gridApiRef.current.api.applyColumnState({
          state: [{ colId: "transaction_num", sort: "desc" }],
          defaultState: { sort: null },
        });
      }
    } catch (error) {
      console.error("Error applying transaction number sort:", error);
    }
  }

  function sortByCompletionDateAsc() {
    try {
      if (gridApiRef.current?.api) {
        return gridApiRef.current.api.applyColumnState({
          state: [{ colId: "time_since_completion", sort: "desc" }],
          defaultState: { sort: null },
        });
      }
    } catch (error) {
      console.error("Error applying completion date sort:", error);
    }
  }

  function clearSort() {
    try {
      if (gridApiRef.current?.api) {
        gridApiRef.current.api.applyColumnState({
          defaultState: { sort: null },
        });
      }
    } catch (error) {
      console.error("Error clearing sort:", error);
    }
  }

  const sortMap: Map<string, () => void> = new Map([
    // ["main", sortBySubmittedDateAsc],
    ["pickup", sortByCompletionDateAsc],
    ["paid", sortByCompletionDateAsc],
    ["completed", sortByCompletionDateAsc],
    ["employee", sortByTransactionNumDesc],
    ["refurb", sortByTransactionNumDesc],
    ["beer bike", sortByTransactionNumDesc],
    ["retrospec", sortByTransactionNumDesc],
  ]);

  return (
    <Box
      component="main"
      sx={{
        width: { xs: "100%", sm: "100%", md: "95%", lg: "80%" },
        px: { xs: 0, md: 2 },
      }}
    >
      <PriceCheckModal
        open={showPriceCheckModal}
        onClose={() => {
          setShowPriceCheckModal(false);
        }}
      />

      <section id="transactions-table">
        <>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={2}
            mt={{ xs: 1, md: 2 }}
            mb={{ xs: 1, md: 2 }}
            px={{ xs: 1, md: 0 }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 2 }}
              sx={{ width: { xs: "100%", md: "auto" } }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={{ xs: 1, sm: 2 }}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <CreateTransactionDropdown />
                <Select
                  variant="outlined"
                  value={viewType}
                  onChange={(e) => applyViewType(e.target.value as string)}
                  displayEmpty
                  size="small"
                  sx={{
                    minWidth: { xs: "auto", sm: 220 },
                    flex: { xs: 1, sm: "none" },
                    bgcolor: "background.paper",
                    "& fieldset": { borderColor: "divider" },
                    fontSize: { xs: "0.875rem", md: "1rem" },
                  }}
                >
                  <MenuItem value="main">Main Transactions</MenuItem>
                  <MenuItem value="pickup">Waiting on Pickup</MenuItem>
                  <MenuItem value="retrospec">Retrospec</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="completed">Completed Bikes</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="refurb">Refurbs</MenuItem>
                  <MenuItem value="beer bike">Beer Bike</MenuItem>
                </Select>
              </Stack>
            </Stack>
            {viewType === "completed" && (
              <TextField
                size="small"
                placeholder={
                  isMobile
                    ? "Search..."
                    : "Search by transaction #, name, email, or phone..."
                }
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  gridApiRef.current?.api?.onFilterChanged();
                }}
                sx={{
                  minWidth: { xs: "100%", md: 300 },
                  bgcolor: "background.paper",
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyItems={{ xs: "stretch", md: "flex-end" }}
              justifyContent={{ xs: "stretch", md: "flex-end" }}
              flexGrow={1}
              sx={{
                pointerEvents: "none",
                width: { xs: "100%", md: "auto" },
              }}
            >
              <Button
                size="small"
                sx={{
                  height: { xs: 36, md: 40 },
                  lineHeight: 1,
                  px: { xs: 1, md: 1.5 },
                  whiteSpace: "nowrap",
                  bgcolor: "blue",
                  color: "white",
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                }}
              >
                {summaryData?.quantity_incomplete}{" "}
                {isMobile ? "Incomplete" : "Incomplete Bikes"}
              </Button>
              {summaryData?.quantity_beer_bike_incomplete !== 0 && (
                <Button
                  size="small"
                  sx={{
                    height: { xs: 36, md: 40 },
                    lineHeight: 1,
                    px: { xs: 1, md: 1.5 },
                    whiteSpace: "nowrap",
                    bgcolor: "turquoise",
                    color: "black",
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                  }}
                >
                  {summaryData?.quantity_beer_bike_incomplete}{" "}
                  {isMobile ? "Beer Bikes" : "Incomplete Beer Bikes"}
                </Button>
              )}
              <Button
                size="small"
                sx={{
                  height: { xs: 36, md: 40 },
                  lineHeight: 1,
                  px: { xs: 1, md: 1.5 },
                  borderRadius: 1,
                  whiteSpace: "nowrap",
                  bgcolor: "green",
                  color: "white",
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                }}
              >
                {summaryData?.quantity_waiting_on_pickup}{" "}
                {isMobile ? "For Pickup" : "Bikes For Pickup"}
              </Button>
              {summaryData?.quantity_waiting_on_safety_check !== 0 && (
                <Button
                  size="small"
                  sx={{
                    height: { xs: 36, md: 40 },
                    lineHeight: 1,
                    px: { xs: 1, md: 1.5 },
                    borderRadius: 1,
                    whiteSpace: "nowrap",
                    bgcolor: "orange",
                    color: "white",
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                  }}
                >
                  {summaryData?.quantity_waiting_on_safety_check}{" "}
                  {isMobile ? "Safety Check" : "Bikes to Safety Check"}
                </Button>
              )}
            </Stack>
            {/*<OrderModal />*/}
          </Stack>
          <Box
            sx={{
              overflowX: { xs: "auto", md: "visible" },
              mx: { xs: -1, md: 0 },
              "& .ag-theme-quartz": {
                fontSize: { xs: "0.75rem", md: "0.875rem" },
              },
              "& .ag-header-cell": {
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                padding: { xs: "4px", md: "8px" },
              },
              "& .ag-cell": {
                padding: { xs: "4px", md: "8px" },
              },
            }}
          >
            {colDefs &&
            Array.isArray(colDefs) &&
            colDefs.length > 0 &&
            colDefs.every((col) => col && typeof col === "object") ? (
              <AgGridReact
                key={`ag-grid-${viewType}`}
                ref={gridApiRef}
                theme={themeQuartz}
                loading={status !== "success"}
                rowData={data}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                rowSelection={rowSelection}
                onRowClicked={onRowClicked}
                getRowStyle={({ data }) => {
                  const transaction = data?.Transaction as Transaction;
                  if (
                    transaction.date_created &&
                    transaction.transaction_type != null &&
                    ((transaction.is_completed === false &&
                      transaction.transaction_type !== "retrospec" &&
                      transaction.transaction_type !== "Retrospec" &&
                      transaction.is_employee === false &&
                      transaction.is_refurb === false) ||
                      (transaction.is_beer_bike === true &&
                        transaction.is_completed === false))
                  ) {
                    if (
                      isDaysLess(
                        5,
                        currDate,
                        new Date(transaction.date_created),
                      )
                    ) {
                      return { backgroundColor: "lightcoral" };
                    } else if (
                      isDaysLess(
                        2,
                        currDate,
                        new Date(transaction.date_created),
                      )
                    ) {
                      return { backgroundColor: "lightyellow" };
                    } else return { backgroundColor: "white" };
                  } else if (
                    transaction.date_completed !== null &&
                    transaction.transaction_type !== null &&
                    transaction.date_completed !== undefined &&
                    ((transaction.is_paid === false &&
                      transaction.is_completed === true &&
                      transaction.is_refurb === false &&
                      transaction.transaction_type.toLowerCase() !==
                        "retrospec") ||
                      (transaction.is_beer_bike === true &&
                        transaction.is_completed === true &&
                        transaction.is_paid === false))
                  ) {
                    if (
                      isDaysLess(
                        5,
                        currDate,
                        new Date(transaction.date_completed),
                      )
                    ) {
                      return { backgroundColor: "lightcoral" };
                    } else if (
                      isDaysLess(
                        2,
                        currDate,
                        new Date(transaction.date_completed),
                      )
                    ) {
                      return { backgroundColor: "lightyellow" };
                    } else return { backgroundColor: "white" };
                  }
                }}
                isExternalFilterPresent={isExternalFilterPresent}
                doesExternalFilterPass={doesExternalFilterPass}
                domLayout="autoHeight"
                pagination={viewType === "paid" || viewType === "completed"}
                paginationPageSize={viewType === "completed" ? 50 : undefined}
                paginationPageSizeSelector={
                  viewType === "completed" ? [25, 50, 100, 200] : undefined
                }
                onGridReady={(params) => {
                  try {
                    if (params.api) {
                      params.api.applyColumnState({
                        state: [
                          { colId: "time_since_completion", hide: true },
                          { colId: "submitted", hide: false },
                        ],
                        defaultState: { sort: null },
                      });
                      params.api.sizeColumnsToFit();
                    }
                  } catch (error) {
                    console.error(
                      "Error during grid ready initialization:",
                      error,
                    );
                  }
                }}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <p>Error loading table columns. Please refresh the page.</p>
              </div>
            )}
          </Box>
        </>
      </section>
    </Box>
  );
}
