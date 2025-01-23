import React, { useState } from "react";
import {
  Button,
  Dialog,
  Box,
  Typography,
  TextField,
  Stack,
} from "@mui/material";
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
  // console.log("search data", searchData);

  const handleCancel = () => {
    setVisible(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={showModal}
        style={{ margin: "1%", width: "100%" }}
      >
        Search for{" "}
        {searchData.length > 0 && "item_id" in searchData[0]
          ? "Parts"
          : "Repairs"}
      </Button>
      <main
        style={{
          height: "100%",
          width: "100%",
          alignSelf: "center",
          display: "none",
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
              height: "100%",
              alignContent: "center",
              padding: "2%",
              margin: "5% 2.5%",
            }}
          >
            <Typography
              id="modal-modal-title"
              variant="h3"
              component="h2"
              align="center"
            >
              Search for{" "}
              {searchData.length > 0 && "item_id" in searchData[0]
                ? "Parts"
                : "Repairs"}
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
                width: "100%",
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                style={{ paddingTop: "1%", width: "100%" }}
              >
                <TextField
                  label="Search Term"
                  placeholder={
                    "Enter" +
                    (searchData.length > 0 && "upc" in searchData[0]
                      ? " part upc or part name"
                      : " repair name")
                  }
                  value={searchTerm}
                  onChange={handleSearchChange}
                  // style={{ width: "50%" }}
                  multiline
                  variant="outlined"
                />
              </Stack>
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
                onRowClicked={(event) => {
                  setVisible(false);
                  setSearchTerm("");
                  return onRowClick(event);
                }}
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
