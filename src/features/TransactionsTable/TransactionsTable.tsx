import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { useState, useMemo, useRef } from "react"; // React State Hook
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
} from "ag-grid-community";
import "./TransactionsTable.css"; // CSS Stylesheet
import NewTransactionForm from "../../components/TransactionPage/BikeForm";
import { Part, Repair } from "../../queries";
import { useNavigate } from "react-router-dom";
import DBQueries from "../../queries";

// Row Data Interface
export interface IRow {
  // "#": number;
  Transaction: Transaction;
  Customer: Customer;
  Bike?: Bike;
  Repairs?: Repair[];
  Parts?: Part[];
  Submitted: Date;
}

interface Bike {
  make: string;
  model: string;
  date_created?: string;
  description: string;
  bike_id: string;
}

interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface Transaction {
  transaction_num: number;
  transaction_id: string;
  date_created: string;
  transaction_type: string;
  customer_id: string;
  bike_id: string;
  total_cost: number;
  description: string;
  is_completed: boolean;
  is_paid: boolean;
  is_refurb: boolean;
  Customer: Customer;
  Bike?: Bike;
}

// Creating new transaction
interface CreateTransactionDropdownProps {
  onCreateTransaction: (newTransaction: IRow) => void;
}

const options = ["Inpatient", "Outpatient", "Merchandise", "Retrospec"]; // list of actions
function CreateTransactionDropdown({
  onCreateTransaction,
}: CreateTransactionDropdownProps) {
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

  const handleTransactionCreated = (newTransaction: IRow) => {
    onCreateTransaction(newTransaction);
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
  // const [pageSize, setPageSize] = useState(100);
  const onRowClicked = (e: RowClickedEvent) => {
    navigate("/transaction-details", {
      state: { transaction: e.data },
    });
  };

  const { status, data, error } = useQuery(
    DBQueries.getTransactionsQuery(10000000, true)
  );

  console.log(status, data, error);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs] = useState<ColDef<IRow>[]>([
    {
      headerName: "#",
      valueGetter: (params) => params.data?.Transaction.transaction_num,
      filter: true,
    },
    {
      headerName: "Name",
      valueGetter: (params) =>
        `${params.data?.Customer.first_name} ${params.data?.Customer.last_name}`,
    },
    {
      headerName: "Make",
      valueGetter: (params) => {
        if (!params.data?.Bike || params.data?.Bike.make === "") {
          return "";
        }
        return params.data?.Bike.make;
      },
    },
    {
      headerName: "Model",
      valueGetter: (params) => {
        if (!params.data?.Bike || params.data?.Bike.model === "") {
          return "";
        }
        return params.data?.Bike.model;
      },
    },
    { field: "Submitted" },
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

  const addTransaction = (newTransaction: IRow) => {
    console.log("adding new transaction");
    setRowData((prevRowData) => [...prevRowData, newTransaction]);
  };

  // Container: Defines the grid's theme & dimensions.
  return (
    <main style={{ width: "100vw", height: "66vh" }}>
      <Button></Button>
      <header>
        <ButtonGroup id="nav-buttons">
          <CreateTransactionDropdown onCreateTransaction={addTransaction} />
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
            // onPaginationChanged={(e) => {
            //   console.log(e);
            //   if (e.newPageSize) {
            //     setPageSize(e.api.paginationGetPageSize());
            //   }
            // }}
            // paginationPageSize={10}
            // paginationPageSize={true}
          />
        )}
      </section>
    </main>
  );
}
