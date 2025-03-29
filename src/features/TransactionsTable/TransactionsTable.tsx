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
import CreateTransactionDropdown from "./TransactionTypeDropdown"; // Create Transaction Dropdown Component
import "./TransactionsTable.css"; // CSS Stylesheet
import { Transaction, Bike, Customer, TransactionSummary, OrderRequest, User } from "../../model";
import { useNavigate } from "react-router-dom";
import DBModel from "../../model";
import PriceCheckModal from "../../components/PriceCheckModal";
// import { queryClient } from "../../app/main";
// import SearchModal from "../../components/TransactionPage/SearchModal";

// Row Data Interface
export interface IRow {
  Transaction: Transaction;
  Customer: Customer;
  OrderRequests: Array<OrderRequest>;
  Bike?: Bike;
}

// interface SortConfig {
//   colId: string;
//   sort: "asc" | "desc" | null | undefined;
//   sortIndex: number | null | undefined;

// }

// Creating new transaction

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

interface TransactionTableProps {
  alertAuth: () => void;
  user: User;
}

export function TransactionsTable({
  alertAuth,
  user,
}: TransactionTableProps): JSX.Element {
  // const model = new TransactionTableModel();
  // Row Data: The data to be displayed.

  // const itemsQuery = useQuery(
  //   DBModel.getItemsQuery(),
  // );

  // if (partsError) toast.error("parts: " + partsError);

  const navigate = useNavigate();
  const currDate: Date = new Date();
  const [viewType, setViewType] = useState("main");
  const gridApiRef = useRef<AgGridReact>(null); // <= defined useRef for gridApi
  const [, setRowData] = useState<IRow[]>([]);
  const [summaryData, setSummaryData] = useState<TransactionSummary>();
  const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);
  // const [savedSort, setSavedSort] = useState<SortConfig[]>();
  // console.log(rowData);
  // const [pageSize, setPageSize] = useState(100);
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
  console.log(status, data, error);

  // Column Definitions: Defines & controls grid columns.
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

            {transaction_type?.toLowerCase() === "retrospec" && (
              <Chip
                label="Retrospec"
                sx={{
                  margin: "0 0.5vw",
                  backgroundColor: "orange",
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
      },
      cellRenderer: (params: ICellRendererParams) => {
        return params.value;
      },
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
      headerName: "Submitted",
      colId: "submitted",
      valueGetter: (params) => {

        if (
          !params.data?.Transaction ||
          params.data?.Transaction.date_created === ""
        ) {
          return "";
        }
        return params.data.Transaction.date_completed ? timeAgo(new Date(params.data?.Transaction.date_completed)) : timeAgo(new Date(params.data?.Transaction.date_created));
      },
    },
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
      console.log("new alignment", newAlignment);
      setViewType(newAlignment);
      const sortFunc = sortMap.get(newAlignment) ?? clearSort;
      sortFunc();
    }
    // gridApiRef.current?.onFilterChanged();
  };

  function isExternalFilterPresent() {
    return true;
  }

  function doesExternalFilterPass(node: IRowNode) {
    // console.log(node);
    const transaction = node.data.Transaction as Transaction;
    return (
      (viewType === "retrospec" &&
        transaction.transaction_type === "retrospec" &&
        transaction.is_paid === false) ||
      (viewType === "pickup" &&
        transaction.is_paid === false &&
        transaction.is_completed === true
        && transaction.is_refurb === false
        && !isDaysLess(183, new Date(transaction.date_created), new Date())
      ) ||
      (viewType === "paid" && transaction.is_paid === true) ||
      (viewType === "main" &&
        transaction.is_completed === false &&
        transaction.transaction_type !== "retrospec" &&
        transaction.is_employee === false &&
        transaction.is_refurb === false) ||
      (viewType === "employee" &&
        transaction.is_employee === true &&
        transaction.is_completed === false) ||
      (viewType === "refurb" && transaction.is_refurb === true && transaction.is_paid === false && transaction.is_completed === false) ||
      (viewType === "beer bike" &&
        transaction.is_beer_bike === true && !isDaysLess(364, new Date(transaction.date_created), new Date())) ||
      viewType === ""
    );
  }

  // function sortByTransactionNumAsc() {
  //   gridApiRef.current!.api.applyColumnState({
  //     state: [{ colId: "transaction_num", sort: "asc" }],
  //     defaultState: { sort: null },
  //   });
  // }

  function sortByTransactionNumDesc() {
    gridApiRef.current!.api.applyColumnState({
      state: [{ colId: "transaction_num", sort: "desc" }],
      defaultState: { sort: null },
    });
  }

  function sortByDateAsc() {
    gridApiRef.current!.api.applyColumnState({
      state: [{ colId: "submitted", sort: "asc" }],
      defaultState: { sort: null },
    });
  }


  function clearSort() {
    gridApiRef.current!.api.applyColumnState({
      defaultState: { sort: null },
    });
  }

  const sortMap: Map<string, () => void> = new Map([
    ["pickup", sortByDateAsc],
    ["paid", sortByTransactionNumDesc],
    ["employee", sortByTransactionNumDesc],
    ["refurb", sortByTransactionNumDesc],
    ["beer bike", sortByTransactionNumDesc],
    ["retrospec", sortByTransactionNumDesc]
  ]);



  // Container: Defines the grid's theme & dimensions.
  return (
    <main style={{ width: "100vw" }}>
      <Button></Button>
      <header>
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
        // className={status === "pending" ? "lds-dual-ring" : ""}
        id="transactions-table"
      >
        {/* {status === "pending" ? (
          "Loading..."
        ) : status === "error" ? (
          "Error loading data"
        ) : ( */}
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
                transaction.is_refurb === false ||
                transaction.is_paid === false &&
                transaction.is_completed === true
                && transaction.is_refurb === false
              )
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
            }}
            isExternalFilterPresent={isExternalFilterPresent}
            doesExternalFilterPass={doesExternalFilterPass}
            domLayout="autoHeight"
            pagination={viewType === "paid"}
          // paginationPageSize={true}
          />
        </>

      </section>
    </main>
  );
}
