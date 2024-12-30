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
} from "@mui/material";
import type { ColDef, RowSelectionOptions } from "ag-grid-community";
import "./TransactionsTable.css"; // CSS Stylesheet

// Row Data Interface
interface IRow {
  "#": number;
  tag: Tag;
  Name: string;
  Make: string;
  Model: string;
  Submitted: Date;
}

type Tag = {
  inpatient: boolean;
  beerBike: boolean;
  nuclear: boolean;
  retrospec: boolean;
  merch: boolean;
};

const CompanyLogoRenderer = (param: CustomCellRendererProps) => (
  <div className="tags">
    {param.value.inpatient && <button>Inpatient</button>}
    {param.value.beerBike && <button>Beer Bike</button>}
    {param.value.nuclear && <button>Nuclear</button>}
    {param.value.retrospec && <button>Retrospec</button>}
    {param.value.merch && <button>Merch</button>}
  </div>
);

const options = ["Inpatient", "Outpatient", "Merchandise", "Retrospec"]; // list of actions
function CreateTransactionDropdown() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
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
    </>
  );
}

export function Transactions() {
  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState<IRow[]>([
    {
      "#": 1,
      tag: {
        inpatient: true,
        beerBike: false,
        nuclear: false,
        retrospec: false,
        merch: false,
      },
      Name: "Chase Geyer",
      Make: "Specialized",
      Model: "Roubaix",
      Submitted: new Date("2018-01-16"),
    },
    // {
    //   "#": 2,
    //   tag: {
    //     inpatient: true,
    //     beerBike: false,
    //     nuclear: false,
    //     retrospec: false,
    //     merch: false,
    //   },
    //   Name: "Melanie",
    //   Make: "idx",
    //   Model: "idx",
    //   Submitted: new Date("2019-01-6"),
    // },
    // {
    //   "#": 3,
    //   tag: {
    //     inpatient: true,
    //     beerBike: false,
    //     nuclear: false,
    //     retrospec: false,
    //     merch: false,
    //   },
    //   Name: "Chase Geyer",
    //   Make: "Specialized",
    //   Model: "Roubaix",
    //   Submitted: new Date("2019-01-16"),
    // },
    // {
    //   "#": 4,
    //   tag: {
    //     inpatient: true,
    //     beerBike: false,
    //     nuclear: false,
    //     retrospec: false,
    //     merch: false,
    //   },
    //   Name: "Chase Geyer",
    //   Make: "Specialized",
    //   Model: "Roubaix",
    //   Submitted: new Date("2020-01-16"),
    // },
    // {
    //   "#": 5,
    //   tag: {
    //     inpatient: true,
    //     beerBike: false,
    //     nuclear: false,
    //     retrospec: false,
    //     merch: false,
    //   },
    //   Name: "Chase Geyer",
    //   Make: "Specialized",
    //   Model: "Roubaix",
    //   Submitted: new Date("2021-01-16"),
    // },
    // {
    //   "#": 6,
    //   tag: {
    //     inpatient: true,
    //     beerBike: false,
    //     nuclear: false,
    //     retrospec: false,
    //     merch: false,
    //   },
    //   Name: "Chase Geyer",
    //   Make: "Specialized",
    //   Model: "Roubaix",
    //   Submitted: new Date("2022-01-16"),
    // },
  ]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([
    { field: "#", filter: true },
    { field: "tag", cellRenderer: CompanyLogoRenderer },
    { field: "Name" },
    { field: "Make" },
    { field: "Model" },
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

  // Container: Defines the grid's theme & dimensions.
  return (
    <main style={{ width: "100vw", height: "80vh" }}>
      <header>
        <ButtonGroup id="nav-buttons">
          <CreateTransactionDropdown></CreateTransactionDropdown>
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
