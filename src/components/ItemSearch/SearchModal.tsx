import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Dialog,
  Box,
  Typography,
  TextField,
  Stack,
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { Part, Repair } from "../../model";
import { CustomNoRowsOverlay } from "./CreateItemModal";
import ItemPageModal from "../ItemPage";
// import { CustomNoRowsOverlay } from "./CreateItemModal";

interface SearchModalProps {
  searchData: Array<Part | Repair>;
  columnData: Array<ColDef<Part | Repair>>;
  colDefaults: ColDef;
  onRowClick: (e: Part | Repair) => void;
  onQuantityChange?: (quantity: number) => void;
  variant?: "contained" | "outlined" | "text";
  children?: React.ReactNode;
}

const SearchModal: React.FC<SearchModalProps> = ({
  searchData,
  columnData,
  colDefaults,
  onRowClick,
  onQuantityChange,
  variant = "outlined",
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [itemPageOpen, setItemPageOpen] = useState(false);


  const gridApiRef = useRef<AgGridReact>(null); // <= defined useRef for gridApi

  const showModal = () => {
    setVisible(true);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    setQuantity(value < 1 ? 1 : value);
    if (onQuantityChange) onQuantityChange(value);
    setErrorMsg("");
  };

  const handleCancel = () => {
    setVisible(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (gridApiRef.current && gridApiRef.current.api.getDisplayedRowCount() == 0) {
      gridApiRef.current.api.showNoRowsOverlay();
    }
    else if (gridApiRef.current) {
      gridApiRef.current.api.hideOverlay();
    }
  }
    , [searchTerm]);

  return (
    <>
      <Button
        variant={variant}
        onClick={showModal}
        style={{ margin: "1%", width: "100%" }}
      >
        {children}
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
            <header
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginTop: "1%",
                marginBottom: "1%",
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
                  variant="outlined"
                  autoFocus
                />
                {children?.toLocaleString().includes("Part") ? (
                  <>
                    <TextField
                      variant="outlined"
                      type="number"
                      label="quantity"
                      value={quantity}
                      onChange={handleQuantityChange}
                      required
                      error={errorMsg !== ""}
                      helperText={errorMsg}
                    ></TextField>
                    <Button 
                      style={{ "pointerEvents": "all" }} variant="contained" color="primary" onClick={() => setItemPageOpen(true)}>
                      Add New Item
                    </Button>
                  </>
                ) : (
                  <></>
                )}
              </Stack>
              {/* <Switch
                color="primary"
                inputProps={{ "aria-label": "primary checkbox" }}
              ></Switch> */}
            </header>
            <section
              style={{
                height: "60vh",
                width: "100%",
              }}
            >
              <AgGridReact
                ref={gridApiRef} // <= attach the ref to AgGridReact
                rowData={searchData}
                columnDefs={columnData}
                defaultColDef={colDefaults}
                onRowClicked={(item) => {
                  if (quantity >= 1) {
                    setVisible(false);
                    setSearchTerm("");
                    onRowClick(item.data);
                  } else {
                    setErrorMsg("Please enter a quantity greater than 0");
                  }
                }}
                noRowsOverlayComponent={
                  searchData.length > 0 && "upc" in searchData[0] ? CustomNoRowsOverlay : "Search for another repair"
                }
                noRowsOverlayComponentParams={{ searchTerm }}
                quickFilterText={searchTerm}
              />
            </section>
            <ItemPageModal
                open={itemPageOpen}
                onClose={(item) => {
                  if (item) {
                    setVisible(false);
                    setSearchTerm("");
                    onRowClick(item);
                  }
                  setItemPageOpen(false);
                }}
            />
          </Box>
        </Dialog>
      </main>
    </>
  );
};

export default SearchModal;
