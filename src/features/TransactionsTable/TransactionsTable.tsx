import { AgGridReact, CustomCellRendererProps } from "ag-grid-react"; // React Data Grid Component
import { useState, useMemo, useRef } from "react"; // React State Hook
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
import {useNavigate} from "react-router-dom";
import NewTransactionForm from "../../components/TransactionPage/BikeForm";
//import TestForm from "../../components/TransactionPage/TestForm";

// Row Data Interface
export interface IRow {
  "#": number;
  Type: Type;
  Customer: Customer;
  Bike: Bike;
  Tags: Tag;
  Submitted: Date;
}

export type Tag = {
  waitEmail: boolean;
  nuclear: boolean;
  waitPart: boolean;
  refurb: boolean;
};

export type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: Number;
}

export type Bike = {
  make: string;
  model: string;
  color: string;
}

export type Type = {
  inpatient: boolean;
  outpatient: boolean;
  merch: boolean;
  retrospec: boolean;
  beerBike: boolean;
}

const CompanyLogoRenderer = (param: CustomCellRendererProps) => (
  <div className="tags">
    {param.value.inpatient && <button>Inpatient</button>}
    {param.value.beerBike && <button>Beer Bike</button>}
    {param.value.nuclear && <button>Nuclear</button>}
    {param.value.retrospec && <button>Retrospec</button>}
    {param.value.merch && <button>Merch</button>}
  </div>
);

// Creating new transaction
interface CreateTransactionDropdownProps{
  onCreateTransaction: (newTransaction: IRow) => void;
}

const options = ["Inpatient", "Outpatient", "Merchandise", "Retrospec"]; // list of actions
function CreateTransactionDropdown({ onCreateTransaction }: CreateTransactionDropdownProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1);

  const handleClick = () => {
    console.info(`You clicked ${options[selectedIndex]}`);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
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
  }

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

export function Transactions() {
  // Row Data: The data to be displayed.
  const navigate = useNavigate();

  const onRowClicked = (e: any) => {
    const selectedTransaction = e.data;
    navigate("/transaction-details", {state: {transaction: selectedTransaction}});
  };

  const [rowData, setRowData] = useState<IRow[]>([
    {
      "#": 1,
      Customer: {
        firstName: "Chase",
        lastName: "Geyer",
        email: "chase.geyer@rice.edu",
        phone: 1234567890
      },
      Bike: {
        make: "Huffy",
        model: "Rockcreek",
        color: "Blue"
      },
      Tags: {
        waitEmail: false,
        nuclear: false,
        waitPart: false,
        refurb: false,
      },
      Type: {
        inpatient: true,
        outpatient: false,
        merch: false,
        retrospec: false,
        beerBike: false,
      },
      Submitted: new Date("2018-01-16"),
    }
  ]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([
    { field: "#", filter: true },
    {
      headerName: "Name",
      valueGetter: (params) => `${params.data?.Customer.firstName} ${params.data?.Customer.lastName}`,
    },
    {
      headerName: "Make",
      valueGetter: (params) => params.data?.Bike.make
    },
    {
      headerName: "Model",
      valueGetter: (params) => params.data?.Bike.model
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
        onRowClicked={onRowClicked}
      />
    </main>
  );
}
