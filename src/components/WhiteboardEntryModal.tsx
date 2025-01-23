// import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
//   CircularProgress,
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
import { Part } from "../model";

type WhiteboardEntryModalProps = {
  open: boolean;
  onClose: () => void;
  parts: Part[];
};

const WhiteboardEntryModal = ({
  open,
  onClose,
  parts,
}: WhiteboardEntryModalProps) => {
//   const [loading, setLoading] = useState(false);
  // const [parts, setParts] = useState([
  //     { name: 'Part 1', price: 100, upc: '1234567890' },
  //     { name: 'Part 2', price: 200, upc: '0987654321' },
  // ]);

  const columnDefs = [
    { headerName: "Name", field: "name" },
    { headerName: "Price", field: "price" },
    { headerName: "UPC", field: "upc" },
  ];

  const handleAddPart = () => {
    // Logic to add a part
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Parts Waiting</DialogTitle>
      <DialogContent>
        <div  style={{ height: 400, width: "100%" }}>
          <AgGridReact
            rowData={parts}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={10}
          />
        </div>
        {/* {loading && <CircularProgress />} */}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAddPart} color="primary">
          Add Part
        </Button>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhiteboardEntryModal;
