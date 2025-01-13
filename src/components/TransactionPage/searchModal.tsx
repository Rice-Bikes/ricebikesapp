import React, { useState } from "react";
import { Button, Dialog, Box, Typography, TextField } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { ColDef, RowClickedEvent } from "ag-grid-community";
import { Part, Repair } from "../../model";

interface SearchModalProps {
  searchData: Array<Part | Repair>;
  columnData: Array<ColDef<Part | Repair>>;
  colDefaults: ColDef;
  onRowClick: (e: RowClickedEvent) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  searchData,
  columnData,
  colDefaults,
  onRowClick,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const showModal = () => {
    setVisible(true);
  };

  //   const handleOk = () => {
  //     console.log("Search Term:", searchTerm);
  //     setVisible(false);
  //   };
  console.log("search data", searchData);

  const handleCancel = () => {
    setVisible(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      <Button variant="outlined" onClick={showModal}>
        Search for{" "}
        {searchData.length > 0 && "upc" in searchData[0] ? "Parts" : "Repairs"}
      </Button>
      <main
        style={{
          height: "100%",
          width: "100%",
          alignSelf: "center",
        }}
      >
        <Dialog
          fullWidth={true}
          maxWidth="lg"
          open={visible}
          onClose={handleCancel}
        >
          <Box
            sx={{
              width: "80vw",
              height: "85vh",
              alignContent: "center",
              padding: "2%",
            }}
          >
            <Typography
              id="modal-modal-title"
              variant="h3"
              component="h2"
              align="center"
            >
              Search for Repairs
            </Typography>
            {/* <Typography
              id="modal-modal-description"
              sx={{ mt: 2, alignSelf: "center" }}
            >
              Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
            </Typography> */}
            <header
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginTop: "1%",
              }}
            >
              <TextField
                placeholder="Enter search term"
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ width: "50%" }}
              />
              {/* <Switch
                color="primary"
                inputProps={{ "aria-label": "primary checkbox" }}
              ></Switch> */}
            </header>
            <section
              style={{
                height: "60vh",
                // overflow: "auto",
                width: "100%",
                // alignSelf: "center",
                // paddingBottom: "2vh",
              }}
            >
              <AgGridReact
                rowData={searchData}
                columnDefs={columnData}
                defaultColDef={colDefaults}
                pagination={true}
                onRowClicked={(event) => {
                  setVisible(false);
                  return onRowClick(event);
                }}
                paginationPageSizeSelector={false}
                // paginationPageSize={10}
                paginationAutoPageSize={true}
                quickFilterText={searchTerm}
              />
            </section>
          </Box>
        </Dialog>
      </main>
    </>
  );
};

export default SearchModal;
