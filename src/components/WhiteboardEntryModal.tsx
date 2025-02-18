import { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid2,
  //   CircularProgress,
} from "@mui/material";
import {
  CellClassParams,
  ColDef,
  EditableCallbackParams,
  ITooltipParams,
  NewValueParams,
  RowClickedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import DBModel, { OrderRequest, Part } from "../model";
import { useMutation, useQuery } from "@tanstack/react-query";
import SearchModal from "./TransactionPage/SearchModal";
import { queryClient } from "../app/main";

type WhiteboardEntryModalProps = {
  open: boolean;
  onClose: () => void;
  parts: Part[];
  transaction_id: string;
  user_id: string;
};

const WhiteboardEntryModal = ({
  open,
  onClose,
  parts,
  transaction_id,
  user_id,
}: WhiteboardEntryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { data: orderRequestData, error: orderRequestError } = useQuery({
    queryKey: ["orderRequest", transaction_id],
    queryFn: () => {
      setLoading(true);
      return DBModel.getOrderRequests(transaction_id);
    },
    select: (data) => data as OrderRequest[],
  });

  const createOrderRequest = useMutation({
    mutationFn: (req: OrderRequest) => DBModel.postOrderRequest(req),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orderRequest", transaction_id],
      });
    },
  });

  const updateOrderRequest = useMutation({
    mutationFn: (req: OrderRequest) => DBModel.putOrderRequest(req),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orderRequest", transaction_id],
      });
    },
  });

  useEffect(() => {
    if (orderRequestData) {
      console.log(orderRequestData);
      setLoading(false);
    }
  }, [orderRequestData]);

  if (orderRequestError) {
    console.error(orderRequestError);
    return <div>Error: {orderRequestError.message}</div>;
  }
  console.log("reqs", orderRequestData);
  const columnDefs: Array<ColDef<OrderRequest>> = [
    {
      headerName: "Name",
      valueGetter: (params) => params.data?.Item?.name,
    },
    { headerName: "Notes", field: "notes", type: "editableColumn" },
    { headerName: "Quantity", field: "quantity" },
    {
      headerName: "Price",
      valueGetter: (params) => params.data?.Item?.standard_price,
    },
    { headerName: "UPC", valueGetter: (params) => params.data?.Item?.upc },
    {
      headerName: "User",
      valueGetter: (params) =>
        params.data?.User?.firstname + " " + params.data?.User?.lastname,
    },
  ];

  const defaultColDef: ColDef = {
    flex: 1,
  };

  function isCellEditable(params: EditableCallbackParams | CellClassParams) {
    console.log("params", params);
    return params.colDef.field === "notes";
  }
  const columnTypes = {
    editableColumn: {
      editable: (params: EditableCallbackParams<OrderRequest>) => {
        return isCellEditable(params);
      },
      cellStyle: (params: CellClassParams<OrderRequest>) => {
        if (isCellEditable(params)) {
          return { backgroundColor: "#2244CC44" };
        }
      },
      onCellValueChanged: (event: NewValueParams<OrderRequest>) => {
        console.log("cellValueChanged", event);
        const updatedOrderRequest = {
          ...event.data,
          notes: event.data?.notes,
        } as OrderRequest;
        updateOrderRequest.mutate(updatedOrderRequest);
        console.log("updating", updatedOrderRequest);
      },
    },
  };

  const handleAddPart = (event: RowClickedEvent) => {
    // Logic to add a part
    const part = event.data as Part;
    const newOrderRequest = {
      item_id: part.item_id,
      quantity: quantity,
      notes: "",
      transaction_id: transaction_id,
      created_by: user_id,
    } as OrderRequest;
    createOrderRequest.mutate(newOrderRequest);
    console.log("Adding part", part, newOrderRequest);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Parts Waiting</DialogTitle>
      <DialogContent>
        <div style={{ height: 400, minHeight: 400, width: "100%" }}>
          <AgGridReact
            rowData={orderRequestData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            columnTypes={columnTypes}
            loading={loading}
            overlayNoRowsTemplate="Add a part to the whiteboard!"
          />
        </div>
        {/* {loading && <CircularProgress />} */}
      </DialogContent>
      <DialogActions>
        <Grid2 container spacing={2} sx={{ width: "100%" }}>
          <Grid2
            size={12}
            container
            spacing={2}
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Grid2 size={3}>
              <SearchModal
                searchData={parts}
                columnData={[
                  {
                    field: "name",
                    headerName: "Name",
                    width: 200,
                    autoHeight: true,
                    wrapText: true,
                    flex: 2,
                    filter: true,
                    tooltipField: "description",
                    headerTooltip: "Name of items",
                    cellRenderer: (params: ITooltipParams) => {
                      return (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <p>
                            <b>{params.value}</b>
                          </p>
                          <i className="fa-solid fa-circle-info"></i>
                        </div>
                      );
                    },
                  },
                  { field: "brand", headerName: "Brand" },
                  { field: "standard_price", headerName: "Price", width: 200 },
                  // { field: "stock", headerName: "Stock", width: 200 }, //TODO: Verify that this piece is actually true
                  {
                    field: "upc",
                    headerName: "UPC",
                    width: 200,
                    wrapText: true,
                    autoHeight: true,
                    filter: true,
                  },
                ]}
                colDefaults={{
                  flex: 1,
                }}
                onRowClick={handleAddPart}
                onQuantityChange={(quantity) => setQuantity(quantity)}
              >
                Add Part
              </SearchModal>
            </Grid2>
            <Grid2>
              <Button onClick={onClose} color="secondary">
                Close
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
      </DialogActions>
    </Dialog>
  );
};

export default WhiteboardEntryModal;
