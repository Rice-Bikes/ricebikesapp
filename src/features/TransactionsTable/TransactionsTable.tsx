import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { useState, useMemo, useRef, useEffect } from "react"; // React State Hook
// import { TransactionTableModel } from "./TransactionTableModel"; // Transaction Table Model
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
import { Repair } from "../../components/RepairItem/RepairItem";
import { useNavigate } from "react-router-dom";
import { Part } from "../../components/PartItem/PartItem";
import type { JSONSchema } from "json-schema-to-ts";
import {
  wrapCompilerAsTypeGuard,
  $Compiler,
  FromSchema,
} from "json-schema-to-ts";
import Ajv from "ajv";

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

export type Customer = FromSchema<typeof CustomerSchema>;
export type Bike = FromSchema<typeof BikeSchema>;
export const CustomerSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Customer",
  type: "object",
  properties: {
    customer_id: { type: "string", nullable: true },
    first_name: { type: "string" },
    last_name: { type: "string" },
    email: { type: "string" },
    phone: { type: ["string", "null"] },
  },
  required: ["first_name", "last_name", "email", "phone"],

  additionalProperties: false,
} as const satisfies JSONSchema;

export const BikeSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Bike",
  type: "object",
  properties: {
    bike_id: { type: "string", nullable: true },
    make: { type: "string" },
    model: { type: "string" },
    date_created: { type: "string", nullable: true },
    description: { type: "string" },
  },
  required: ["make", "model", "description"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Transaction",
  type: "object",
  properties: {
    transaction_num: { type: "number" },
    transaction_id: { type: "string" },
    date_created: { type: "string" },
    transaction_type: { type: "string" },
    customer_id: { type: "string", nullable: true },
    bike_id: { type: "string", nullable: true },
    total_cost: { type: "number" },
    description: { type: "string", nullable: true },
    is_completed: { type: "boolean" },
    is_paid: { type: "boolean" },
    is_refurb: { type: "boolean" },
    is_urgent: { type: "boolean" },
    is_nuclear: { type: "boolean", nullable: true },
    is_beer_bike: { type: "boolean" },
    is_employee: { type: "boolean" },
    is_reserved: { type: "boolean" },
    is_waiting_on_email: { type: "boolean" },
    date_completed: { type: "string", nullable: true },
    Bike: {
      type: ["object", "null"],
      nullable: true,
      properties: BikeSchema.properties,
    },
    Customer: {
      type: "object",
      nullable: true,
      properties: CustomerSchema.properties,
    },
  },
  required: [
    "transaction_num",
    "date_created",
    "transaction_type",
    "total_cost",
    "is_completed",
    "is_paid",
    "is_refurb",
    "is_urgent",
    "is_beer_bike",
    "is_employee",
    "is_reserved",
    "is_waiting_on_email",
    "transaction_id",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;
const TransactionArraySchema = {
  $id: "partArray.json",
  type: "array",
  items: TransactionSchema,
} as const satisfies JSONSchema;

const TransactionsResponseSchema = {
  $id: "transactionsResponse.json",
  type: "object",
  properties: {
    message: { type: "string" },
    responseObject: { type: ["array"] },
    statusCode: { type: "number" },
    success: { type: "boolean" },
    additionalProperties: false,
  },
  required: ["message", "responseObject", "statusCode", "success"],
  additionalProperties: false,
} as const satisfies JSONSchema;

// const TransactionResponseSchema = {
//   $id: "transactionResponse.json",
//   type: "object",
//   properties: {
//     message: { type: "string" },
//     responseObject: { type: ["object"] },
//     statusCode: { type: "number" },
//     success: { type: "boolean" },
//     additionalProperties: false,
//   },
//   required: ["message", "responseObject", "statusCode", "success"],
//   additionalProperties: false,
// } as const satisfies JSONSchema;

export type Transaction = FromSchema<typeof TransactionSchema>;
export type TransactionsResponse = FromSchema<
  typeof TransactionsResponseSchema
>;
// export type TransactionResponse = FromSchema<typeof TransactionResponseSchema>;
export type TransactionArray = FromSchema<typeof TransactionArraySchema>;
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

export function TransactionsTable(): JSX.Element {
  // const model = new TransactionTableModel();
  // Row Data: The data to be displayed.
  const hostname = import.meta.env.VITE_API_URL;
  const ajv = new Ajv();
  const $compile: $Compiler = (schema) => ajv.compile(schema);
  const compile = wrapCompilerAsTypeGuard($compile);
  const validateTransaction: (data: unknown) => data is Transaction =
    compile(TransactionSchema);
  const validateTransactionsArray: (data: unknown) => data is Transaction[] =
    compile(TransactionArraySchema);
  const validateTransactionsResponse: (
    data: unknown
  ) => data is TransactionsResponse = compile(TransactionsResponseSchema);
  // const validateTransactionResponse: (
  //   data: unknown
  // ) => data is TransactionResponse = compile(TransactionResponseSchema);
  const validateCustomer: (data: unknown) => data is Customer =
    compile(CustomerSchema);
  const validateBike: (data: unknown) => data is Bike = compile(BikeSchema);
  const navigate = useNavigate();
  const onRowClicked = (e: RowClickedEvent) => {
    // fetch(`${hostname}/transactions/${e.data.Transaction.transaction_num}`)
    //   .then((response) => response.json())
    //   .then((transactionData: unknown) => {
    //     if (!validateTransactionResponse(transactionData)) {
    //       throw new Error("Invalid transaction response");
    //     }
    //     console.log("Raw Transaction Data:", transactionData);
    //     if (!validateTransaction(transactionData.responseObject)) {
    //       throw new Error("Invalid transaction response");
    //     }
    //     if (!transactionData.success) {
    //       throw new Error("Failed to load transaction");
    //     }
    //     console.log(" Transaction Data:", transactionData.responseObject);
    //     return transactionData.responseObject;
    //   })
    //   .then((transactionData: Transaction) => {
    // const selectedTransaction = e.data;
    navigate("/transaction-details", {
      state: { transaction: { Transaction: e.data } },
      // });
    });
    // // const selectedTransaction = e.data;
    // navigate("/transaction-details", {
    //   state: { transaction: selectedTransaction },
    // });
  };

  const [rowData, setRowData] = useState<IRow[]>([
    {
      // "#": 1,
      Transaction: {
        transaction_num: 1234,
        transaction_id: "1234",
        date_created: new Date("2021-01-16").toTimeString(),
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
        is_waiting_on_email: false,
        date_completed: null,
      },
      Customer: {
        customer_id: "1234",
        first_name: "Chase",
        last_name: "Geyer",
        email: "chase.geyer@rice.edu",
        phone: "1234567890",
      },
      Bike: {
        bike_id: "1234",
        make: "Huffy",
        model: "Rockcreek",
        description: "Blue MTB",
        date_created: new Date("2021-01-16").toDateString(),
      },
      Repairs: [],
      Parts: [],
      Submitted: new Date("2018-01-16"),
    },
  ]);

  useEffect(() => {
    console.log(
      `${hostname}/transactions?` +
        new URLSearchParams({ page_limit: "10", aggregate: "true" })
    );
    fetch(
      `${hostname}/transactions?` +
        new URLSearchParams({ page_limit: "1000000", aggregate: "true" })
    )
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw Parts Data:", itemsData);
        if (!validateTransactionsResponse(itemsData)) {
          throw new Error("Invalid transactions response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load transactions");
        }
        console.log(" Transaction Array Data:", itemsData.responseObject);
        // if (!validatePartsArray(itemsData.responseObject)) {
        //   throw new Error("Invalid part array");
        // }
        // validateParts(itemsData)}
        return itemsData.responseObject;
      })
      .then((partsData: unknown[]) => {
        console.log("Mapped Parts Data:", partsData);
        partsData.forEach((part) => {
          if (!validateTransaction(part)) {
            console.log("Invalid transaction:", part);
            throw new Error("Invalid transaction found");
          }
          if (!validateCustomer(part.Customer)) {
            console.log("Invalid Customer:", part.Customer);
            throw new Error("Invalid customer found");
          }
          if (part.Bike && !validateBike(part.Bike)) {
            console.log("Invalid Bike:", part.Bike);
            throw new Error("Invalid bike found");
          }
        });

        if (!validateTransactionsArray(partsData)) {
          throw new Error("Invalid part array");
        }

        const transactionRows: IRow[] = partsData.map((part) => {
          if (!part.Customer) {
            throw Error("Need aggregate data for transaction");
          }
          if (!part.Bike) {
            return {
              Transaction: part,
              Customer: {
                ...part.Customer,
                first_name: part.Customer.first_name || "Unknown", // Provide a default value
                last_name: part.Customer.last_name || "Unknown",
                email: part.Customer.email || "Unknown",
                phone: part.Customer.phone || "Unknown",
              },
              // Bike: part.Bike,
              // Repairs: part.Repairs,
              // Parts: part.Parts,
              Submitted: new Date(part.date_created),
            };
          } else {
            return {
              Transaction: part,
              Customer: {
                ...part.Customer,
                first_name: part.Customer.first_name || "", // Provide a default value
                last_name: part.Customer.last_name || "",
                email: part.Customer.email || "",
                phone: part.Customer.phone || "",
              },
              Bike: {
                ...part.Bike,
                make: part.Bike.make || "",
                model: part.Bike.model || "",
                description: part.Bike.description || "",
                date_created: part.Bike.date_created || "",
              },
              // Repairs: part.Repairs,
              // Parts: part.Parts,
              Submitted: new Date(part.date_created),
            };
          }
        });

        setRowData(transactionRows);
        // setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Error loading or parsing transactions from server: ",
          error
        );
        // setLoading(false);
      });
  }, []);

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
        onRowClicked={onRowClicked}
        pagination={true}
      />
    </main>
  );
}
