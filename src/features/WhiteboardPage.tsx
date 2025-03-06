import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { CellClassParams, CellClickedEvent, ColDef, EditableCallbackParams, NewValueParams } from 'ag-grid-community';
import { Container, Typography, Button, Grid2 } from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import DBModel from '../model';
import { OrderRequest } from '../model';
import { queryClient } from '../app/main';
import { useNavigate } from 'react-router-dom';

interface WhiteboardPageProps {
    user_id: string;
}

const WhiteboardPage: React.FC<WhiteboardPageProps> = (
    // { user_id }: WhiteboardPageProps
) => {
    const nav = useNavigate();
    const { data: orderRequestData, error: orderRequestError, fetchStatus: orderRequestStatus } = useQuery({
        queryKey: ["orderRequest"],
        queryFn: () => {
            return DBModel.getOrderRequests();
        },
        select: (data) => {
            console.log("converting incoming data", data);
            // if (data === undefined) return [];
            return data as OrderRequest[] ?? Array<OrderRequest>()

        },
    });

    // const createOrderRequest = useMutation({
    //     mutationFn: (req: OrderRequest) => DBModel.postOrderRequest(req),
    //     onSuccess: () => {
    //         queryClient.invalidateQueries({
    //             queryKey: ["orderRequest"],
    //         });
    //     },
    //     onError: (error) => {
    //         console.error("Error creating order request", error);
    //     }
    // });

    const updateOrderRequest = useMutation({
        mutationFn: (req: OrderRequest) => {
            const { Item, User, ...reqWithoutAgg } = req;
            console.log(Item, User);
            return DBModel.putOrderRequest(reqWithoutAgg);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["orderRequest"],
            });
        },
        onError: (error) => {
            console.error("Error updating order request", error);
        }
    });


    const deleteOrderRequest = useMutation({
        mutationFn: (req: OrderRequest) => DBModel.deleteOrderRequest(req),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["orderRequest"],
            });

        },
        onError: (error) => {
            console.error("Error deleting order request", error)
        }
    });


    if (orderRequestError) {
        console.error(orderRequestError);
        return <div>Error: {orderRequestError.message}</div>;
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
            flex: 2,
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
            headerName: "Transaction Link",
            colId: "link",
            onCellClicked: (event: CellClickedEvent<OrderRequest>) => {
                console.log("showing add btn", event);
                try {
                    //TODO: MAKE SURE THIS URL PARAMS ASSUMPTION IS CORRECT
                    return event.data ? nav(`/transaction-details/${event.data.transaction_id}?type=Inpatient`) : console.error("cannot add order request to transaction", event)
                }
                catch (error) {
                    console.error('Error in onCellClicked:', error);
                    throw error; // Re-throw to be caught by error boundary
                }
            },
            cellRenderer: () => <Button type="submit">🔗</Button>
        },

        // {
        //     headerName: "Ordered",
        //     colId: "ordered",
        //     onCellClicked: (event: CellClickedEvent<OrderRequest>) => {
        //         console.log("showing add btn", event);
        //         try {
        //             //TODO: MAKE SURE THIS URL PARAMS ASSUMPTION IS CORRECT
        //             return event.data ? nav(`/transaction-details/${event.data.transaction_id}?type=Inpatient`) : console.error("cannot add order request to transaction", event)
        //         }
        //         catch (error) {
        //             console.error('Error in onCellClicked:', error);
        //             throw error; // Re-throw to be caught by error boundary
        //         }
        //     },
        //     cellRenderer: () => <Button type="submit">🔗</Button>
        // }
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
                        queryKey: ["orderRequest"],
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

    // const handleAddPart = (event: RowClickedEvent) => {
    //     try {
    //         console.log('Event received:', event);
    //         const part = event.data as Part;
    //         console.log('Part data:', part);

    //         if (!part.item_id) {
    //             console.error('No item_id found in part data');
    //         }

    //         const newOrderRequest = {
    //             item_id: part.item_id,
    //             quantity: quantity,
    //             notes: "",
    //             created_by: user_id,
    //         } as OrderRequest;

    //         console.log('Creating order request:', newOrderRequest);
    //         createOrderRequest.mutate(newOrderRequest);
    //     } catch (error) {
    //         console.error('Error in handleAddPart:', error);
    //         throw error; // Re-throw to be caught by error boundary
    //     }
    // };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Order Requests
            </Typography>
            {
                <Grid2 container spacing={4}>
                    <Grid2 size={12}>
                        <Typography variant="h6">Customer Orders</Typography>
                        <div style={{ height: 400, width: '100%' }}>
                            <AgGridReact
                                // onGridReady={onGridReady}
                                rowData={orderRequestData ?? Array<OrderRequest>()}
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
                        <Typography variant="h6">Customer Orders</Typography>
                        <div style={{ height: 400, width: '100%' }}>
                            TBD
                            {/* <AgGridReact
                                // onGridReady={onGridReady}
                                rowData={orderRequestData ?? Array<OrderRequest>()}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                columnTypes={columnTypes}
                                loading={orderRequestStatus === "fetching"}
                                overlayNoRowsTemplate="Add a part to the whiteboard!"
                                suppressMenuHide={true} // Disable menu completely
                                enableCellTextSelection={true}
                            /> */}
                        </div>
                    </Grid2>
                </Grid2>
            }
        </Container>
    );
};

export default WhiteboardPage;