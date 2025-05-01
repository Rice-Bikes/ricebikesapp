import React, { useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { CellClassParams, ColDef, EditableCallbackParams, ICellRendererParams, NewValueParams, ValueGetterParams } from "ag-grid-community";
import { Part } from "../../model";
import {
    Box,
    Button,
    Typography,
    Stack,
    Skeleton,
} from "@mui/material";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import DBModel from "../../model";
import { queryClient } from "../../app/main";
import ItemPageModal from "../../components/ItemPage";
import { ErrorSharp, ThumbUp, Warning } from "@mui/icons-material";
import PriceCheckModal from "../../components/PriceCheckModal";

const getUrgency = (stock: number, minStock: number) => {
    if (minStock === 0) {
        return 0;
    }
    if (stock < minStock) {
        return 3;
    }
    else if (stock < minStock * 2) {
        return 2;
    }
    else {
        return 1;
    }
}

const ItemsTable: React.FC = () => {
    const [items, setItems] = useState<Part[]>([]);
    const [selectedItem, setSelectedItem] = useState<Part>();
    const [dialogVisible, setDialogVisible] = useState(false);
    const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);

    const gridApiRef = useRef<AgGridReact>(null);
    const { data: itemData, error: itemError, isLoading: itemsLoading } = useQuery(DBModel.getItemsQuery());
    const deleteItem = useMutation({
        mutationFn: (id: string) => DBModel.deleteItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries(DBModel.getItemsQuery());
            toast.success("Item deleted successfully");
        },
        onError: (error) => {
            console.error("Error deleting item:", error);
            toast.error("Error deleting item");
        },
    });
    const updatePart = useMutation({
        mutationFn: (part: Part) => DBModel.updateItem(part),
        onSuccess: () => {
            queryClient.invalidateQueries(DBModel.getItemsQuery());
            toast.success("Item updated successfully");
            queryClient.invalidateQueries({
                queryKey: ["items"],
            });
        },
        onError: (error) => {
            console.error("Error updating item:", error);
            toast.error("Error updating item:" + error);
            queryClient.invalidateQueries({
                queryKey: ["items"],
            });
        },
    });
    if (itemError) {
        toast.error("Error fetching items");
    }
    useEffect(() => {
        if (itemData && !itemsLoading) {
            setItems(itemData);
        }
    }, [itemData, itemsLoading]);

    function isCellEditable(params: EditableCallbackParams | CellClassParams) {
        try {
            if (!params.colDef) return false;
            return params.colDef.field === "stock" || params.colDef.field === "minimum_stock";
        }
        catch (error) {
            console.error('Error in isCellEditable:', error);
            throw error; // Re-throw to be caught by error boundary
        }

    }

    const columnTypes = {
        editableColumn: {
            editable: (params: EditableCallbackParams<Part>) => {
                try {
                    return isCellEditable(params);
                } catch (error) {
                    console.error('Error in editableColumn:', error);
                    throw error; // Re-throw to be caught by error boundary
                }
            },
            cellStyle: (params: CellClassParams<Part>) => {
                try {
                    if (isCellEditable(params)) {
                        return { backgroundColor: params.colDef.field === "stock" ? "lightblue" : "lightgreen" };
                    }
                }
                catch (error) {
                    console.error('Error in cellStyle:', error);
                    throw error; // Re-throw to be caught by error boundary
                }
            },
            onCellValueChanged: (event: NewValueParams<Part>) => {
                console.log("cell value changes event", event);
                try {
                    console.log("cellValueChanged", event);
                    const updatedPart = event.data as Part;
                    updatePart.mutate(updatedPart);

                    console.log("updating", updatedPart);
                }
                catch (error) {
                    console.error('Error in onCellValueChanged:', error);
                    throw error; // Re-throw to be caught by error boundary
                }
            },
        },
    };
    const columnDefs: ColDef[] = [
        { field: "name", headerName: "Name", sortable: true, filter: true, resizable: true },
        { field: "standard_price", headerName: "Price", sortable: true, filter: true, flex: 0.6 },
        {
            field: "stock", headerName: "Stock", sortable: true, type: "editableColumn", flex: 0.45,
        },
        { field: "minimum_stock", headerName: "Min Stock", sortable: true, flex: 0.5, type: "editableColumn" },
        { field: "upc", headerName: "UPC", sortable: true, filter: true, flex: 0.5 },
        {
            headerName: "Actions",
            colId: "actions",
            flex: 0.85,
            cellRenderer: (params: ICellRendererParams) => (
                <Stack direction="row">
                    <Button
                        variant="outlined"
                        onClick={() => handleEdit(params.data)}
                        size="small"
                    >
                        ✎
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(params.data.item_id)}
                        size="small"
                    >
                        🗑️
                    </Button>
                </Stack>
            ),
        },
        {
            colId: "urgency",
            sortable: true,
            flex: 0.4,
            headerName: "Status",
            hide: true,
            cellRenderer: (params: ICellRendererParams) => {
                const stock = params.data.stock;
                const minStock = params.data.minimum_stock;
                if (minStock === 0) {
                    return <ThumbUp
                        style={{
                            color: "green",
                            marginRight: "5px",
                        }}
                    />;
                }
                if (stock < minStock) {
                    return <ErrorSharp
                        style={{
                            color: "red",
                            marginRight: "5px",
                        }}
                    />;
                }
                else if (stock < minStock * 2) {
                    return <Warning
                        style={{
                            color: "orange",
                            marginRight: "5px",
                        }}
                    />;
                }
                else {
                    return <ThumbUp
                        style={{
                            color: "green",
                            marginRight: "5px",
                        }}
                    />;
                }
            },
            valueGetter: (params: ValueGetterParams) => {
                const stock = params.data.stock;
                const minStock = params.data.minimum_stock;
                return getUrgency(stock, minStock);
            }
        },
    ];

    const handleEdit = (item: Part) => {
        setSelectedItem(item);
        setDialogVisible(true);
    };

    const handleDelete = (id: string) => {
        deleteItem.mutate(id);
    };

    const handleCancel = () => {
        setDialogVisible(false);
        setSelectedItem({} as Part);
    };

    return (
        <Box sx={{ padding: "2%" }}>
            <Typography variant="h3" align="center" gutterBottom>
                Items Management
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    variant="contained"
                    onClick={() => {
                        setShowPriceCheckModal(true);
                    }}
                    sx={{ marginBottom: "2%" }}
                >
                    Check for Availability
                </Button>
                <PriceCheckModal
                    open={showPriceCheckModal}
                    onClose={() => {
                        setShowPriceCheckModal(false);
                    }}
                />
                <Button
                    variant="contained"
                    onClick={() => {
                        setDialogVisible(true);
                    }}
                >
                    Add Item
                </Button>
            </Stack>
            <Box sx={{ height: "70vh", width: "100%" }}>
                <AgGridReact
                    loadingOverlayComponent={Skeleton}
                    ref={gridApiRef}
                    rowData={items}
                    columnTypes={columnTypes}
                    columnDefs={columnDefs}
                    defaultColDef={{ flex: 1, resizable: false }}
                    domLayout="autoHeight"
                    pagination
                    getRowStyle={({ data }) => {
                        const part = data as Part;
                        const urgency = getUrgency(part.stock ?? 0, part.minimum_stock ?? 0);
                        console.log("urgency", urgency);
                        if (urgency == 3) {
                            return { backgroundColor: "#F88379" };
                        }
                        else if (urgency == 2) {
                            return { backgroundColor: "lightyellow" };
                        }
                        else if (urgency == 1) {
                            return { backgroundColor: "lightgreen" };
                        }
                        // return { backgroundColor: "black" };
                    }
                    }
                    onGridReady={() => {
                        gridApiRef.current?.api.applyColumnState({
                            state: [
                                { colId: "urgency", sort: "desc" },
                            ],
                            applyOrder: true,
                        });

                    }}
                />
            </Box>
            <ItemPageModal
                open={dialogVisible}
                onClose={handleCancel}
                item={selectedItem}
            />
        </Box>
    );
};

export default ItemsTable;