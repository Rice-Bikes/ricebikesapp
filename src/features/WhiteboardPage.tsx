import React, { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  CellClassParams,
  CellClickedEvent,
  ColDef,
  EditableCallbackParams,
  ICellRendererParams,
  NewValueParams,
  ITooltipParams,
  RowClickedEvent,
} from "ag-grid-community";
import { Container, Typography, Button, Grid2 } from "@mui/material";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import DBModel, { type Part } from "../model";
import { OrderRequest } from "../model";
import { queryClient } from "../app/queryClient";
import { useNavigate } from "react-router-dom";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { toast } from "react-toastify";
import OrderModal from "../components/OrderModal";
import { useUser } from "../contexts/UserContext";
import SearchModal from "../components/ItemSearch/SearchModal";

const WhiteboardPage: React.FC = () => {
  const nav = useNavigate();
  const { data: user } = useUser();
  const [quantity, setQuantity] = useState<number>(1);

  const {
    data: orderRequestData,
    error: orderRequestError,
    fetchStatus: orderRequestStatus,
  } = useQuery({
    queryKey: ["orderRequest"],
    queryFn: () => {
      return DBModel.getOrderRequests();
    },
    select: (data) => {
      // console.log("converting incoming data", data);
      // if (data === undefined) return [];
      return (data as OrderRequest[]) ?? Array<OrderRequest>();
    },
  });

  const [partsQuery] = useQueries({
    queries: [DBModel.getItemsQuery()],
  });

  const {
    isLoading: partsLoading,
    data: parts,
    error: partsError,
  } = partsQuery;
  const createStockOrderRequest = useMutation({
    mutationFn: (payload: {
      item_id: string;
      quantity?: number;
      notes?: string;
    }) => {
      const orderReq = {
        created_by: user?.user_id ?? "", // or set to SYSTEM user id if desired
        transaction_id: "828ea912-8a3a-4521-b5ea-a00e7a786708",
        item_id: payload.item_id,
        quantity: payload.quantity ?? 1,
        notes: payload.notes ?? "",
      } as OrderRequest;
      return DBModel.postOrderRequest(orderReq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderRequest"] });
      toast.success("Stock order created");
    },
    onError: (err) => {
      toast.error(
        "Failed to create stock order: " + ((err as Error)?.message ?? ""),
      );
    },
  });

  const updateOrderRequest = useMutation({
    mutationFn: (req: OrderRequest) => {
      const { Item, User, ...reqWithoutAgg } = req;
      console.log(Item, User);
      return DBModel.putOrderRequest(reqWithoutAgg);
    },
    onSuccess: (orderReq: OrderRequest) => {
      queryClient.invalidateQueries({
        queryKey: ["orderRequest"],
      });
      if (orderReq === undefined || orderReq.Item === undefined) return;
      if (orderReq.ordered) {
        toast.success(
          "Order request marked as ordered " +
            orderReq.Item.name +
            " | " +
            orderReq.ordered,
        );
      } else {
        toast.success(
          "Order request unmarked successfully " +
            orderReq.Item.name +
            " | " +
            orderReq.ordered,
        );
      }
    },
    onError: () => {
      toast.error("500 Server Error: Failed to update order request");
    },
  });

  const deleteOrderRequest = useMutation({
    mutationFn: (req: OrderRequest) => DBModel.deleteOrderRequest(req),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orderRequest"],
      });
    },
    onError: () => {
      toast.error("500 Server Error: Failed to delete order request");
    },
  });

  useEffect(() => {
    if (orderRequestError) {
      console.error(orderRequestError);
      toast.error("500 Server Error: Failed to load order requests");
    }
  }, [orderRequestError]);

  if (orderRequestError) {
    return <div>Loading...</div>;
  }

  // // console.log("reqs", orderRequestData);
  if (!orderRequestData) return <div>Loading...</div>;
  const columnDefs: Array<ColDef<OrderRequest>> = [
    {
      headerName: "Name",
      colId: "name",
      valueGetter: (params) => {
        // console.log("showing name", params);
        if (!params.data || !params.data.Item) return "";
        try {
          return params.data.Item.name ?? "";
        } catch (error) {
          console.error("Error in valueGetter for Name:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
    {
      headerName: "Notes",
      field: "notes",
      type: "editableColumn",
      valueGetter: (params) => {
        // console.log("showing notes", params);
        if (!params.data || !params.data.notes) return "";
        try {
          return params.data.notes ?? "";
        } catch (error) {
          console.error("Error in valueGetter for notes:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      flex: 2,
    },
    // { headerName: "Quantity", field: "quantity" },
    {
      headerName: "Price",
      colId: "price",
      valueGetter: (params) => {
        // console.log("showing price", params);
        if (!params.data || !params.data.Item) return "";
        try {
          return params.data?.Item?.standard_price ?? "";
        } catch (error) {
          console.error("Error in valueGetter for Price:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
    {
      headerName: "UPC",
      colId: "upc",
      valueGetter: (params) => {
        // console.log("showing upc", params);
        if (!params.data || !params.data.Item) return "";
        try {
          return params.data?.Item?.upc ?? "";
        } catch (error) {
          console.error("Error in valueGetter for UPC:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
    {
      headerName: "User",
      colId: "user",
      valueGetter: (params) => {
        // console.log("showing user", params);
        if (!params.data || !params.data.User) return "";
        try {
          return params.data?.User
            ? params.data.User.firstname + " " + params.data.User.lastname
            : "";
        } catch (error) {
          console.error("Error in valueGetter for User:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },

    {
      headerName: "Transaction Link",
      colId: "link",
      onCellClicked: (event: CellClickedEvent<OrderRequest>) => {
        try {
          return event.data
            ? nav(
                `/transaction-details/${event.data.transaction_id}?type=Inpatient`,
              )
            : console.error("cannot add order request to transaction", event);
        } catch (error) {
          console.error("Error in onCellClicked:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      cellRenderer: () => <Button type="submit">🔗</Button>,
    },

    {
      headerName: "Ordered",
      field: "ordered",
      onCellClicked: (event: CellClickedEvent<OrderRequest>) => {
        updateOrderRequest.mutate({
          ...event.data,
          ordered: !event.data!.ordered,
        } as OrderRequest);
      },
      cellRenderer: (params: ICellRendererParams) => {
        const ordered = params.data?.ordered;
        return (
          <Button type="submit">
            {ordered ? <CheckBox /> : <CheckBoxOutlineBlank />}
          </Button>
        );
      },
      valueGetter: (params) => {
        // console.log("showing ordered", params);
        if (!params.data || !params.data.ordered) return false;
        return params.data.ordered;
      },
    },
    {
      headerName: "Delete",
      colId: "delete",
      // valueGetter: () => 'X',
      onCellClicked: (event: CellClickedEvent<OrderRequest>) => {
        // console.log("showing delete btn", event);
        try {
          return event.data
            ? deleteOrderRequest.mutate(event.data)
            : console.error("cannot delete order request", event);
        } catch (error) {
          console.error("Error in onCellClicked:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      cellRenderer: () => <Button type="reset"> X </Button>,
    },
  ];

  const defaultColDef: ColDef = {
    flex: 1,
  };

  function isCellEditable(params: EditableCallbackParams | CellClassParams) {
    try {
      if (!params.colDef) return false;
      return params.colDef.field === "notes";
    } catch (error) {
      console.error("Error in isCellEditable:", error);
      throw error;
    }
  }
  const columnTypes = {
    editableColumn: {
      editable: (params: EditableCallbackParams<OrderRequest>) => {
        try {
          return isCellEditable(params);
        } catch (error) {
          console.error("Error in editableColumn:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      cellStyle: (params: CellClassParams<OrderRequest>) => {
        try {
          if (isCellEditable(params)) {
            return { backgroundColor: "#2244CC44" };
          }
        } catch (error) {
          console.error("Error in cellStyle:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
      onCellValueChanged: (event: NewValueParams<OrderRequest>) => {
        // console.log("cell value changes event", event);
        try {
          // console.log("cellValueChanged", event);
          const updatedOrderRequest = {
            ...event.data,
            notes: event.data?.notes,
          } as OrderRequest;
          updateOrderRequest.mutate(updatedOrderRequest);
          queryClient.invalidateQueries({
            queryKey: ["orderRequest"],
          });
          // console.log("updating", updatedOrderRequest);
        } catch (error) {
          console.error("Error in onCellValueChanged:", error);
          throw error; // Re-throw to be caught by error boundary
        }
      },
    },
  };

  const handleAddPart = (event: RowClickedEvent) => {
    try {
      // console.log('Event received:', event);
      const part = event.data as Part;
      // console.log('Part data:', part);

      if (!part.item_id) {
        console.error("No item_id found in part data");
      }

      // console.log('Creating order request:', newOrderRequest);
      createStockOrderRequest.mutate({
        item_id: part.item_id,
        quantity,
        notes: "Restock Request",
      });
    } catch (error) {
      console.error("Error in handleAddPart:", error);
      throw error;
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Order Requests
      </Typography>
      <Grid2 container alignItems="center">
        <Grid2 size={5}>
          <OrderModal />
        </Grid2>
        <Grid2 sx={{ textAlign: "right" }} size={7}>
          {!partsLoading && !partsError && parts && (
            <SearchModal
              variant="contained"
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
              Request restock part
            </SearchModal>
          )}
        </Grid2>
      </Grid2>
      {
        <Grid2 container spacing={4}>
          <Grid2 size={12}>
            <Typography variant="h6">Customer Orders</Typography>
            <div style={{ height: 400, width: "100%" }}>
              <AgGridReact
                // onGridReady={onGridReady}
                rowData={
                  orderRequestData.filter(
                    (order: OrderRequest) => order.User?.firstname !== "SYSTEM",
                  ) ?? Array<OrderRequest>()
                }
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                columnTypes={columnTypes}
                loading={orderRequestStatus === "fetching"}
                overlayNoRowsTemplate="Add a part to the whiteboard!"
                suppressMenuHide={true} // Disable menu completely
                enableCellTextSelection={true}
              />
            </div>
          </Grid2>
          <Grid2 size={12}>
            <Typography variant="h6">Stock Orders</Typography>
            <div style={{ height: 400, width: "100%" }}>
              <AgGridReact
                // onGridReady={onGridReady}
                rowData={
                  orderRequestData.filter(
                    (order: OrderRequest) => order.User?.firstname === "SYSTEM",
                  ) ?? Array<OrderRequest>()
                }
                columnDefs={columnDefs.filter((col) => col.colId !== "link")}
                defaultColDef={defaultColDef}
                columnTypes={columnTypes}
                loading={
                  orderRequestData === undefined || orderRequestError !== null
                }
                overlayNoRowsTemplate="Add a part to the whiteboard!"
                suppressMenuHide={true} // Disable menu completely
                enableCellTextSelection={true}
              />
            </div>
          </Grid2>
        </Grid2>
      }
    </Container>
  );
};

export default WhiteboardPage;
