import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { useState, useMemo, useRef, useEffect } from "react"; // React State Hook
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  ButtonGroup,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Stack,
} from "@mui/material";
import { ErrorSharp } from "@mui/icons-material";
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
import { Transaction, Bike, Customer, TransactionSummary, OrderRequest, User } from "../../model";
import { useNavigate } from "react-router-dom";
import DBModel from "../../model";
import PriceCheckModal from "../../components/PriceCheckModal";
import ConstructionIcon from '@mui/icons-material/Construction';
import PanToolIcon from '@mui/icons-material/PanTool';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
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

const checkStatusOfRetrospec = (refurb: boolean, email: boolean, completed: boolean) => {

  if (refurb) {
    return <ConstructionIcon style={{ color: "gold" }} />;
  }
  else if (email) {
    return <PanToolIcon style={{ color: "red" }} />;
  }
  else if (completed) {
    return <MonetizationOnIcon style={{ color: "green" }} />;
  }
  return <LocalShippingIcon style={{ color: "blue" }} />;
}


interface TransactionTableProps {
  alertAuth: () => void;
  user: User;
}

const debug: boolean = import.meta.env.VITE_DEBUG

export function TransactionsTable({
  alertAuth,
  user,
}: TransactionTableProps): JSX.Element {

  //TODO: sell view
  const navigate = useNavigate();
  const currDate: Date = new Date();
  const [viewType, setViewType] = useState<string>("main");
  const gridApiRef = useRef<AgGridReact>(null);
  const [, setRowData] = useState<IRow[]>([]);
  const [summaryData, setSummaryData] = useState<TransactionSummary>();
  const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);

  const onRowClicked = (e: RowClickedEvent) => {
    navigate(
      `/transaction-details/${e.data.Transaction.transaction_id}?type=${e.data.Transaction.transaction_type}`
    );
  };

  const { status, data, error } = useQuery(
    DBModel.getTransactionsQuery(100000000, true)
  );

  const {
    status: summaryStatus,
    data: summaryQueryData,
    error: summaryError,
  } = useQuery({
    queryKey: ["transactionSummary"],
    queryFn: () => DBModel.fetchTransactionSummary(),
  });
  console.error("summary error", summaryError);

  useEffect(() => {
    if (status === "success") {
      setRowData(data as IRow[]);
    }
    if (summaryStatus === "success") {
      setSummaryData(summaryQueryData as TransactionSummary);
    }
  }, [status, data, error, summaryStatus, summaryQueryData, summaryError]);
  if (debug) console.log(status, data, error);

  const [colDefs] = useState<ColDef<IRow>[]>([
    {
      headerName: "#",
      colId: "transaction_num",
      valueGetter: (params) => params.data?.Transaction.transaction_num,
      filter: true,
    },
    {
      headerName: "Status",
      flex: 2,
      valueGetter: (params) => {
        const isWaitEmail = params.data?.Transaction.is_waiting_on_email;
        const isUrgent = params.data?.Transaction.is_urgent;
        const isNuclear = params.data?.Transaction.is_nuclear;
        const isBeerBike = params.data?.Transaction.is_beer_bike;
        const transaction_type = params.data?.Transaction.transaction_type;
        const isWaitingOnParts = (params.data?.OrderRequests?.length ?? 0) > 0;
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
          isBeerBike,
          transaction_type,
          isWaitingOnParts,
          is_completed,
          refurb,
        } = params.value;

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
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "5px",
              }}
              direction={"row"}
            ><Chip
                label="Retrospec"
                sx={{
                  margin: "0 0.5vw",
                  backgroundColor: "orange",
                  color: "white",
                }}
              />
              <span> {checkStatusOfRetrospec(refurb, isWaitEmail, is_completed)} </span>
            </Stack>
          )
        };
      }
    },
    {
      headerName: "Name",
      valueGetter: (params) =>
        `${params.data?.Customer.first_name} ${params.data?.Customer.last_name}`,
      filter: true,
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
          params.data?.Transaction.date_created === ""
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

        return (new Date(params.data?.Transaction.date_completed));
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
    }
  ]);

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


  const handleViewType = (
    _: React.MouseEvent<HTMLElement>,
    newAlignment: string
  ) => {
    if (newAlignment !== null) {
      if (debug) console.log("new alignment", newAlignment);
      setViewType(newAlignment);
      const sortFunc = sortMap.get(newAlignment) ?? clearSort;
      if (newAlignment === "paid" || newAlignment === "pickup") {
        gridApiRef.current!.api.applyColumnState({
          state: [{ colId: "time_since_completion", hide: false }, { colId: "submitted", hide: true }],
          defaultState: { hide: null },
        });
      }
      else {
        gridApiRef.current!.api.applyColumnState({
          state: [{ colId: "time_since_completion", hide: true }, { colId: "submitted", hide: false }],
          defaultState: { hide: null },

        });
      }
      sortFunc();
      gridApiRef.current!.api.sizeColumnsToFit();
    }
    // gridApiRef.current?.onFilterChanged();
  };

  function isExternalFilterPresent() {
    return true;
  }

  function doesExternalFilterPass(node: IRowNode) {
    // if (debug) console.log(node);
    const transaction = node.data.Transaction as Transaction;
    if (transaction.transaction_num === 16279) {
      if (debug) console.log("transaction", transaction);
    }
    return (
      (viewType === "retrospec" &&
        transaction.transaction_type === "retrospec" &&
        transaction.is_paid === false) ||
      (viewType === "pickup" &&
        transaction.is_paid === false &&
        transaction.is_completed === true
        && transaction.is_refurb === false
        && transaction.transaction_type.toLowerCase() !== "retrospec"
        && !isDaysLess(183, new Date(transaction.date_created), new Date())
      ) ||
      (viewType === "paid" && transaction.is_paid === true) ||
      (viewType === "main" &&
        transaction.is_completed === false &&
        transaction.transaction_type.toLowerCase() !== "retrospec" &&
        transaction.is_employee === false &&
        transaction.is_refurb === false || transaction.transaction_type.toLowerCase() === "retrospec" && transaction.is_refurb) ||
      (viewType === "employee" &&
        transaction.is_employee === true &&
        transaction.is_completed === false) ||
      (viewType === "refurb" && transaction.is_refurb === true && transaction.is_paid === false && transaction.is_completed === false) ||
      (viewType === "beer bike" &&
        transaction.is_beer_bike === true && !isDaysLess(364, new Date(transaction.date_created), new Date())));
  }


  function sortByTransactionNumDesc() {
    gridApiRef.current!.api.applyColumnState({
      state: [{ colId: "transaction_num", sort: "desc" }],
      defaultState: { sort: null },
    });
  }

  function sortByCompletionDateAsc() {
    return gridApiRef.current!.api.applyColumnState({
      state: [{ colId: "time_since_completion", sort: "desc" }],
      defaultState: { sort: null },
    });
  }

  function sortBySubmittedDateAsc() {
    return gridApiRef.current!.api.applyColumnState({
      state: [{ colId: "submitted", sort: "desc" }],
      defaultState: { sort: null },
    });
  }

  function clearSort() {
    gridApiRef.current!.api.applyColumnState({
      defaultState: { sort: null },
    });
  }

  const sortMap: Map<string, () => void> = new Map([
    ["main", sortBySubmittedDateAsc],
    ["pickup", sortByCompletionDateAsc],
    ["paid", sortByTransactionNumDesc],
    ["employee", sortByTransactionNumDesc],
    ["refurb", sortByTransactionNumDesc],
    ["beer bike", sortByTransactionNumDesc],
    ["retrospec", sortByTransactionNumDesc]
  ]);



  return (
    <main style={{ width: "100vw" }}>
      <Button></Button>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <ButtonGroup id="nav-buttons" variant="outlined">
          <CreateTransactionDropdown alertAuth={alertAuth} user={user} />
          <Button onClick={() => navigate("/whiteboard")}>Whiteboard</Button>
          <Button onClick={() => setShowPriceCheckModal(!showPriceCheckModal)}>Price Check</Button>
        </ButtonGroup>
        <PriceCheckModal open={showPriceCheckModal} onClose={() => { setShowPriceCheckModal(false) }} />
        <article id="indicators">
          <Button style={{ backgroundColor: "blue" }}>
            {summaryData?.quantity_incomplete} Incomplete Bikes
          </Button>
          <Button style={{ backgroundColor: "turquoise", color: "black" }}>
            {summaryData?.quantity_beer_bike_incomplete} Incomplete Beer Bikes
          </Button>
          <Button style={{ backgroundColor: "green" }}>
            {summaryData?.quantity_waiting_on_pickup} Bikes For Pickup
          </Button>
          {/* <Button style={{ backgroundColor: "orange" }}>
            {summaryData?.quantity_waiting_on_safety_check} Bikes To
            Safety Check
          </Button> */}
        </article>
      </header>
      <section
        id="transactions-table"
      >
        <>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewType}

            aria-label="text alignment"
          >
            <ToggleButton value="main">Main Transactions</ToggleButton>
            <ToggleButton value="pickup">Waiting on Pickup</ToggleButton>
            <ToggleButton value="retrospec">Retrospec</ToggleButton>
            <ToggleButton value="paid">Paid</ToggleButton>
            <ToggleButton value="employee"> Employee </ToggleButton>
            <ToggleButton value="refurb"> Refurbs </ToggleButton>
            <ToggleButton value="beer bike"> Beer Bike </ToggleButton>
          </ToggleButtonGroup>

          <AgGridReact
            ref={gridApiRef}
            loading={status !== "success"}
            rowData={data}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            rowSelection={rowSelection}
            onRowClicked={onRowClicked}
            getRowStyle={({ data }) => {
              const transaction = data?.Transaction as Transaction;
              if (transaction.is_completed === false &&
                transaction.transaction_type !== "retrospec" &&
                transaction.is_employee === false &&
                transaction.is_refurb === false) {
                if (
                  isDaysLess(
                    5,
                    currDate,
                    new Date(transaction.date_created)
                  )
                ) {
                  return { backgroundColor: "lightcoral" };
                } else if (
                  isDaysLess(
                    2,
                    currDate,
                    new Date(transaction.date_created)
                  )
                ) {
                  return { backgroundColor: "lightyellow" };
                } else return { backgroundColor: "white" };
              }
              else if (
                transaction.is_paid === false &&
                transaction.is_completed === true
                && transaction.is_refurb === false && transaction.date_completed !== null && transaction.date_completed !== undefined) {
                if (
                  isDaysLess(
                    5,
                    currDate,
                    new Date(transaction.date_completed)
                  )
                ) {
                  return { backgroundColor: "lightcoral" };
                } else if (
                  isDaysLess(
                    2,
                    currDate,
                    new Date(transaction.date_completed)
                  )
                ) {
                  return { backgroundColor: "lightyellow" };
                } else return { backgroundColor: "white" };
              }

            }
            }
            isExternalFilterPresent={isExternalFilterPresent}
            doesExternalFilterPass={doesExternalFilterPass}
            domLayout="autoHeight"
            pagination={viewType === "paid"}
            onGridReady={(params) => {
              gridApiRef.current!.api.applyColumnState({
                state: [{ colId: "time_since_completion", hide: true }, { colId: "submitted", hide: false }],
                defaultState: { sort: null },
              });
              params.api.sizeColumnsToFit();
            }}
          />
        </>

      </section>
    </main>
  );
}
