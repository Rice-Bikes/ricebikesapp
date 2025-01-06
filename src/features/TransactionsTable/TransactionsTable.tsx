import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { useState, useMemo, useRef, useEffect } from "react"; // React State Hook
import { TransactionTableModel } from "./TransactionTableModel"; // Transaction Table Model
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
import type { ColDef, RowSelectionOptions } from "ag-grid-community";
import "./TransactionsTable.css"; // CSS Stylesheet
import NewTransactionForm from "../../components/TransactionPage/BikeForm";
//import TestForm from "../../components/TransactionPage/TestForm";

// Row Data Interface
export interface IRow {
  "#": number;
  Transaction: Transaction;
  Customer: Customer;
  Bike: Bike;
  Submitted: Date;
}

export type Customer = {
  customer_id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type Bike = {
  bike_id?: string;
  make: string;
  model: string;
  date_created?: Date;
  description: string;
};

export type Transaction = {
  transaction_num: string;
  date_created: Date;
  transaction_type: string;
  customer_id?: string;
  bike_id?: string;
  total_cost: number;
  description: string | null;
  is_completed: boolean;
  is_paid: boolean;
  is_refurb: boolean;
  is_urgent: boolean;
  is_nuclear?: boolean;
  is_beer_bike: boolean;
  is_employee: boolean;
  is_reserved: boolean;
  is_wait_email: boolean;
  date_completed: Date | null;
};

// const CompanyLogoRenderer = (param: CustomCellRendererProps) => (
//   <div className="tags">
//     {param.value.inpatient && <button>Inpatient</button>}
//     {param.value.beerBike && <button>Beer Bike</button>}
//     {param.value.nuclear && <button>Nuclear</button>}
//     {param.value.retrospec && <button>Retrospec</button>}
//     {param.value.merch && <button>Merch</button>}
//   </div>
// );

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

export function Transactions(): JSX.Element {
  const model = new TransactionTableModel();
  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState<IRow[]>([
    {
      "#": 1,
      Transaction: {
        transaction_num: "1234",
        date_created: new Date("2021-01-16"),
        transaction_type: "Inpatient",
        customer_id: "1234",
        bike_id: "1234",
        total_cost: 100,
        description: "Bike repair",
        is_completed: false,
        is_paid: false,
        is_refurb: false,
        is_urgent: false,
        is_nuclear: false,
        is_beer_bike: false,
        is_employee: false,
        is_reserved: false,
        is_wait_email: false,
        date_completed: null,
      },
      Customer: {
        customer_id: "1234",
        firstName: "Chase",
        lastName: "Geyer",
        email: "chase.geyer@rice.edu",
        phone: "1234567890",
      },
      Bike: {
        bike_id: "1234",
        make: "Huffy",
        model: "Rockcreek",
        description: "Blue MTB",
        date_created: new Date("2021-01-16"),
      },
      Submitted: new Date("2018-01-16"),
    },
  ]);

  useEffect(() => {
    model
      .pollTransactions()
      .then((data) => {
        console.log("checking current bulk operation");
        console.log(data);
        setRowData(data);
      })
      .catch((err) => console.error(err));

    // .then((res) => res.json())
    // .then((data) => console.log(data))
    // .then((data) => setRowData(data));
  });

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
        `${params.data?.Customer.firstName} ${params.data?.Customer.lastName}`,
    },
    {
      headerName: "Make",
      valueGetter: (params) => params.data?.Bike.make,
    },
    {
      headerName: "Model",
      valueGetter: (params) => params.data?.Bike.model,
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
    <main style={{ width: "100vw", height: "80vh" }}>
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
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        rowSelection={rowSelection}
        onRowClicked={(e) => console.log(e)}
      />
    </main>
  );
}
