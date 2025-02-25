import { useState } from "react";
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
  CellClickedEvent,
  ColDef,
  EditableCallbackParams,
  // GridReadyEvent,
  ITooltipParams,
  NewValueParams,
  RowClickedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import DBModel, { OrderRequest, Part } from "../model";
import { useMutation, useQuery } from "@tanstack/react-query";
import SearchModal from "./TransactionPage/SearchModal";
import { queryClient } from "../app/main";
import { ErrorBoundary } from "react-error-boundary";

type WhiteboardEntryModalProps = {
  open: boolean;
  onClose: () => void;
  parts: Part[];
  setWaitingOnParts: (waitingOnParts: boolean) => void;
  transaction_id: string;
  user_id: string;
  waitingOnParts: boolean;
};

const WhiteboardEntryModal = ({
  open,
  onClose,
  parts,
  setWaitingOnParts,
  transaction_id,
  user_id,
  waitingOnParts,

}: WhiteboardEntryModalProps) => {
  // const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { data: orderRequestData, error: orderRequestError, fetchStatus: orderRequestStatus } = useQuery({
    queryKey: ["orderRequest", transaction_id],
    queryFn: () => {
      return DBModel.getOrderRequests(transaction_id);
    },
    select: (data) => {
      console.log("converting incoming data", data);
      // if (data === undefined) return [];
      return data as OrderRequest[] ?? Array<OrderRequest>()

    },
  });

  const createOrderRequest = useMutation({
    mutationFn: (req: OrderRequest) => DBModel.postOrderRequest(req),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orderRequest", transaction_id],
      });
    },
    onError: (error) => {
      console.error("Error creating order request", error);
    }
  });

  const updateOrderRequest = useMutation({
    mutationFn: (req: OrderRequest) => {
      const { Item, User, ...reqWithoutAgg } = req;
      console.log(Item, User);
      return DBModel.putOrderRequest(reqWithoutAgg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orderRequest", transaction_id],
      });
    },
    onError: (error) => {
      console.error("Error updating order request", error);
    }
  });

  // useEffect(() => {
  //   if (gridApi && orderRequestData) {
  //     gridApi.setRowData(orderRequestData);
  //     gridApi.sizeColumnsToFit();
  //   }
  // }, [gridApi, orderRequestData]);

  const deleteOrderRequest = useMutation({
    mutationFn: (req: OrderRequest) => DBModel.deleteOrderRequest(req),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orderRequest", transaction_id],
      });

    },
    onError: (error) => {
      console.error("Error deleting order request", error)
    }
  });

  // useEffect(() => {
  //   if (orderRequestData) {
  //     console.log("order data changed:", orderRequestData);
  //     // setLoading(false);
  //   }
  // }, []);

  if (orderRequestError) {
    console.error(orderRequestError);
    return <div>Error: {orderRequestError.message}</div>;
  }

  if (orderRequestData && waitingOnParts !== (orderRequestData.length > 0)) {
    console.log("setting waiting on parts", orderRequestData.length > 0);
    setWaitingOnParts(orderRequestData.length > 0);
  }
  // console.log("reqs", orderRequestData);
  if (!orderRequestData) return <div>Loading...</div>;
  const columnDefs: Array<ColDef<OrderRequest>> = [
    {
      headerName: "Name",
      colId: "name",
      valueGetter: (params) => {
        console.log("showing name", params);
        if (!params.data || !params.data.Item) return '';
        try {
          return params.data.Item.name ?? ''
        }
        catch (error) {
          console.error('Error in valueGetter for Name:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
    {
      headerName: "Notes", field: "notes", type: "editableColumn",
      valueGetter: (params) => {
        console.log("showing notes", params);
        if (!params.data || !params.data.notes) return '';
        try {
          return params.data.notes ?? ''
        }
        catch (error) {
          console.error('Error in valueGetter for notes:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
    // { headerName: "Quantity", field: "quantity" },
    {
      headerName: "Price",
      colId: "price",
      valueGetter: (params) => {
        console.log("showing price", params);
        if (!params.data || !params.data.Item) return '';
        try {
          return params.data?.Item?.standard_price ?? ''
        }
        catch (error) {
          console.error('Error in valueGetter for Price:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
    {
      headerName: "UPC",
      colId: "upc",
      valueGetter: (params) => {
        console.log("showing upc", params);
        if (!params.data || !params.data.Item) return '';
        try {
          return params.data?.Item?.upc ?? ''
        }
        catch (error) {
          console.error('Error in valueGetter for UPC:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      }

    },
    {
      headerName: "User",
      colId: "user",
      valueGetter: (params) => {
        console.log("showing user", params);
        if (!params.data || !params.data.User) return '';
        try {
          return params.data?.User ? params.data.User.firstname + " " + params.data.User.lastname : ''
        }
        catch (error) {
          console.error('Error in valueGetter for User:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      }
    },
    {
      headerName: "Delete",
      colId: "delete",
      // valueGetter: () => 'X',
      onCellClicked: (event: CellClickedEvent<OrderRequest>) => {
        console.log("showing delete btn", event);
        try {
          return event.data ? deleteOrderRequest.mutate(event.data) : console.error("cannot delete order request", event)
        }
        catch (error) {
          console.error('Error in onCellClicked:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      cellRenderer: () => <Button type="reset"> X </Button>
    },
  ];

  const defaultColDef: ColDef = {
    flex: 1,
  };


  // Add grid ready handler
  // const onGridReady = (params: GridReadyEvent) => {
  //   params.api.sizeColumnsToFit();
  // };
  function isCellEditable(params: EditableCallbackParams | CellClassParams) {
    console.log("params", params);
    try {
      if (!params.colDef) return false;
      return params.colDef.field === "notes";
    }
    catch (error) {
      console.error('Error in isCellEditable:', error);
      throw error; // Re-throw to be caught by error boundary
    }

  }
  const columnTypes = {
    editableColumn: {
      editable: (params: EditableCallbackParams<OrderRequest>) => {
        try {
          return isCellEditable(params);
        } catch (error) {
          console.error('Error in editableColumn:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      cellStyle: (params: CellClassParams<OrderRequest>) => {
        try {
          if (isCellEditable(params)) {
            return { backgroundColor: "#2244CC44" };
          }
        }
        catch (error) {
          console.error('Error in cellStyle:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      onCellValueChanged: (event: NewValueParams<OrderRequest>) => {
        console.log("cell value changes event", event);
        try {
          console.log("cellValueChanged", event);
          const updatedOrderRequest = {
            ...event.data,
            notes: event.data?.notes,
          } as OrderRequest;
          updateOrderRequest.mutate(updatedOrderRequest);
          queryClient.invalidateQueries({
            queryKey: ["orderRequest", transaction_id],
          });
          console.log("updating", updatedOrderRequest);
        }
        catch (error) {
          console.error('Error in onCellValueChanged:', error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
  };

  const handleAddPart = (event: RowClickedEvent) => {
    try {
      console.log('Event received:', event);
      const part = event.data as Part;
      console.log('Part data:', part);

      if (!part.item_id) {
        console.error('No item_id found in part data');
      }

      const newOrderRequest = {
        item_id: part.item_id,
        quantity: quantity,
        notes: "",
        transaction_id: transaction_id,
        created_by: user_id,
      } as OrderRequest;

      console.log('Creating order request:', newOrderRequest);
      createOrderRequest.mutate(newOrderRequest);
    } catch (error) {
      console.error('Error in handleAddPart:', error);
      throw error; // Re-throw to be caught by error boundary
    }
  };



  return (
    <ErrorBoundary fallback={<div>Whiteboard is no bueno</div>}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Parts Waiting</DialogTitle>
        <DialogContent>
          <div style={{ height: 400, minHeight: 400, width: "100%" }}>
            <ErrorBoundary fallback={<div>Whiteboard table is no bueno</div>}>
              <AgGridReact
                // onGridReady={onGridReady}
                rowData={orderRequestData ?? Array<OrderRequest>()}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                columnTypes={columnTypes}
                loading={orderRequestStatus === "fetching"}
                overlayNoRowsTemplate="Add a part to the whiteboard!"
                suppressMenuHide={true} // Disable menu completely
              // suppressChangeDetection={true}
              />
            </ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default WhiteboardEntryModal;
