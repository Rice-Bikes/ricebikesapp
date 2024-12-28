import { AgGridReact, CustomCellRendererProps } from "ag-grid-react"; // React Data Grid Component
import { useState, useMemo } from "react"; // React State Hook
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
    {
      "#": 2,
      tag: {
        inpatient: true,
        beerBike: false,
        nuclear: false,
        retrospec: false,
        merch: false,
      },
      Name: "Melanie",
      Make: "idx",
      Model: "idx",
      Submitted: new Date("2019-01-6"),
    },
    {
      "#": 3,
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
      Submitted: new Date("2019-01-16"),
    },
    {
      "#": 4,
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
      Submitted: new Date("2020-01-16"),
    },
    {
      "#": 5,
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
      Submitted: new Date("2021-01-16"),
    },
    {
      "#": 6,
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
      Submitted: new Date("2022-01-16"),
    },
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
    <div style={{ width: "100vw", height: "100vh" }}>
      <header>
        <article id="nav-buttons">
          <button>New Transaction</button>
          <button>Whiteboard</button>
          <button>Price Check</button>
        </article>
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
    </div>
  );
}
