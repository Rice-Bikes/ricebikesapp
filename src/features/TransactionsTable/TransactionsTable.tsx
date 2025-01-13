import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { useState, useMemo, useRef, useEffect } from "react"; // React State Hook
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  Modal,
  Box,
} from "@mui/material";
import type {
  ColDef,
  RowClickedEvent,
  RowSelectionOptions,
  ICellRendererParams,
} from "ag-grid-community";
import "./TransactionsTable.css"; // CSS Stylesheet
import NewTransactionForm from "../../components/TransactionPage/BikeForm";
import { Transaction, Bike, Customer } from "../../model";
import { useNavigate } from "react-router-dom";
import DBModel from "../../model";

// Row Data Interface
export interface IRow {
  // "#": number;
  Transaction: Transaction;
  Customer: Customer;
  Bike?: Bike;
}

// Creating new transaction

const isDaysLess = (numDays: number, date1: Date, date2: Date): boolean => {
  const twoDaysInMillis = numDays * 24 * 60 * 60 * 1000; // Two days in milliseconds
  const diffInMillis = Math.abs(date2.getTime() - date1.getTime());
  return diffInMillis > twoDaysInMillis;
};

const options = ["Inpatient", "Outpatient", "Merchandise", "Retrospec"]; // list of actions
function CreateTransactionDropdown() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1);

  // const handleClick = () => {
  //   console.info(`You clicked ${options[selectedIndex]}`);
  // };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    console.info(`You clicked ${options[index]} with ${event}`);
    setSelectedIndex(index);
    setOpen(false);
    setShowForm(true);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  const handleTransactionCreated = (newTransaction: Transaction) => {
    console.log("Transaction created", newTransaction);
    setShowForm(false);
  };

  return (
    <>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        aria-label="Button group with a nested menu"
      >
        <Button
          aria-controls={open ? "split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          New Transaction
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 100 }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  <MenuItem disabled={true}>Choose a transaction type</MenuItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      // disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <Box>
          <NewTransactionForm
            onTransactionCreated={handleTransactionCreated}
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            t_type={options[selectedIndex]}
          />
        </Box>
      </Modal>
    </>
  );
}

export function TransactionsTable(): JSX.Element {
  // const model = new TransactionTableModel();
  // Row Data: The data to be displayed.

  const navigate = useNavigate();
  const currDate: Date = new Date();
  const [rowData, setRowData] = useState<IRow[]>([]);
  console.log(rowData);
  // const [pageSize, setPageSize] = useState(100);
  const onRowClicked = (e: RowClickedEvent) => {
    navigate("/transaction-details", {
      state: { transaction: e.data },
    });
  };

  const { status, data, error } = useQuery(
    DBModel.getTransactionsQuery(10000000, true)
  );

  useEffect(() => {
    if (status === "success") {
      setRowData(data as IRow[]);
    }
  }, [status, data, error]);
  console.log(status, data, error);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs] = useState<ColDef<IRow>[]>([
    {
      headerName: "#",
      valueGetter: (params) => params.data?.Transaction.transaction_num,
      filter: true,
    },
    {
      headerName: "Type",
      cellRenderer: (params: ICellRendererParams) => {
        // console.log("object params", params);
        return (
          <div style={{ pointerEvents: "none" }}>
            {params.data.Transaction?.transaction_type == "inpatient" ? (
              <Button tabIndex={-1} color="success" variant="contained">
                Inpatient
              </Button>
            ) : params.data.Transaction?.transaction_type == "outpatient" ? (
              <Button tabIndex={-1} color="secondary" variant="contained">
                Outpatient
              </Button>
            ) : params.data.Transaction?.transaction_type == "merch" ? (
              <Button tabIndex={-1} variant="contained" color="info">
                Merch
              </Button>
            ) : (
              <></>
            )}
          </div>
        );
      },
      filter: true,
      autoHeight: true,
      // filterParams: {
      //   filterOptions: ["Inpatient", "Outpatient", "Merchandise", "Rental"],
      // },
    },
    {
      headerName: "Status",
      valueGetter: (params) => {
        const isWaitEmail = params.data?.Transaction.is_waiting_on_email;
        const isUrgent = params.data?.Transaction.is_urgent;
        const isNuclear = params.data?.Transaction.is_nuclear;
        const isBeerBike = params.data?.Transaction.is_beer_bike;

        return (
          <span>
            {isWaitEmail && (
              <i className="fas fa-envelope" style={{ marginRight: "5px" }}></i>
            )}
            {isUrgent && (
              <i
                className="fas fa-exclamation-circle"
                style={{ color: "red", marginRight: "5px" }}
              ></i>
            )}
            {isNuclear && (
              <i
                className="fas fa-radiation"
                style={{ color: "red", marginRight: "5px" }}
              ></i>
            )}
            {isBeerBike && <i className="bb">Beer Bike</i>}
          </span>
        );
        // let iconHtml = '';
        // if(isWaitEmail) {
        //   iconHtml += '<i className="fas fa-envelope"></i>';
        // }
        // if(isUrgent) {
        //   iconHtml += '<i className="fas fa-exclamation" style="color: red;"></i>';
        // }
        // return iconHtml;
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
      headerName: "Created",
      valueGetter: (params) => {
        if (
          !params.data?.Transaction ||
          params.data?.Transaction.date_created === ""
        ) {
          return "";
        }
        return new Date(params.data?.Transaction.date_created).toDateString();
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

  // Container: Defines the grid's theme & dimensions.
  return (
    <main style={{ width: "100vw", height: "66vh" }}>
      <Button></Button>
      <header>
        <ButtonGroup id="nav-buttons">
          <CreateTransactionDropdown />
          <Button>Whiteboard</Button>
          <Button>Price Check</Button>
        </ButtonGroup>
        <article id="indicators">
          <button># Incomplete Bikes</button>
          <button># Bike Awaiting Pickup</button>
          <button># Bike Awaiting Safety Check</button>
        </article>
      </header>
      <section
        className={status === "pending" ? "lds-dual-ring" : ""}
        id="transactions-table"
      >
        {status === "pending" ? (
          "Loading..."
        ) : status === "error" ? (
          "Error loading data"
        ) : (
          <AgGridReact
            rowData={data}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            rowSelection={rowSelection}
            onRowClicked={onRowClicked}
            pagination={true}
            getRowStyle={({ data }) => {
              if (
                isDaysLess(
                  5,
                  currDate,
                  new Date(data?.Transaction.date_created)
                )
              ) {
                return { backgroundColor: "lightcoral" };
              } else if (
                isDaysLess(
                  2,
                  currDate,
                  new Date(data?.Transaction.date_created)
                )
              ) {
                return { backgroundColor: "lightyellow" };
              } else return { backgroundColor: "lightgreen" };
            }}
            // onPaginationChanged={(e) => {
            //   console.log(e);
            //   if (e.newPageSize) {
            //     setPageSize(e.api.paginationGetPageSize());
            //   }
            // }}
            paginationPageSize={20}
            // paginationPageSize={true}
          />
        )}
      </section>
    </main>
  );
}
