import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { themeQuartz } from "ag-grid-community";
import { useState, useMemo, useRef, useEffect } from "react"; // React State Hook
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Select,
  MenuItem,
  Stack,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import type {
  ColDef,
  RowClickedEvent,
  RowSelectionOptions,
  IRowNode,
} from "ag-grid-community";
import CreateTransactionDropdown from "./TransactionTypeDropdown";
import "./TransactionsTable.css";
import { Transaction, TransactionSummary } from "../../model";
import { useNavigate } from "react-router-dom";
import DBModel from "../../model";
import PriceCheckModal from "../../components/PriceCheckModal";
import { buildColDefs, handleRowClick } from "./TransactionsTable.helpers";
import { isDaysLess } from "./TransactionsTable.utils";
import {
  passesExternalFilter,
  isExternalFilterPresent as filterIsExternalFilterPresent,
} from "./TransactionsTable.filter";

import type { IRow } from "./TransactionsTable.types";

const debug: boolean = import.meta.env.VITE_DEBUG;

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
    // Delegate navigation to the testable helper
    handleRowClick(navigate, e.data);
  };

  // `buildColDefs` and `getTransactionRowUrl` are implemented in `TransactionsTable.helpers.tsx` and
  // imported above so they can be unit tested independently of the full table component.

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

  // Dynamic column definitions based on view type
  const colDefs = useMemo<ColDef<IRow>[]>(
    () => buildColDefs(viewType, isMobile),
    [viewType, isMobile],
  );

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
    return filterIsExternalFilterPresent();
  }

  function doesExternalFilterPass(node: IRowNode) {
    return passesExternalFilter(node, viewType, searchText);
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
                // allow the header buttons to be interactive
                pointerEvents: "auto",
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
                  bgcolor: "#0b5cff",
                  color: "#ffffff",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "#084bd9" },
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
                    bgcolor: "#07d1c3",
                    color: "#000000",
                    borderRadius: 1,
                    "&:hover": { bgcolor: "#06bfb0" },
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
                  bgcolor: "#1b9e3a",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "#177e31" },
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
                display: "flex",
                // justifyContent: "center",
                alignItems: "center",
                height: "100%",
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
