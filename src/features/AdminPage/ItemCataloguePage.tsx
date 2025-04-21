import React, { useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { CellClassParams, ColDef, EditableCallbackParams, ICellRendererParams, NewValueParams } from "ag-grid-community";
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

const ItemsTable: React.FC = () => {
    const [items, setItems] = useState<Part[]>([]);
    const [selectedItem, setSelectedItem] = useState<Part>();
    const [dialogVisible, setDialogVisible] = useState(false);

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
            return params.colDef.field === "stock";
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
                        return { backgroundColor: "#2244CC44" };
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
        { field: "name", headerName: "Name", sortable: true, filter: true },
        { field: "standard_price", headerName: "Price", sortable: true, filter: true, flex: 0.75 },
        {
            field: "stock", headerName: "Stock", sortable: true, filter: true, type: "editableColumn",
        },
        { field: "upc", headerName: "UPC", sortable: true, filter: true },
        {
            headerName: "Actions",
            colId: "actions",
            cellRenderer: (params: ICellRendererParams) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={() => handleEdit(params.data)}
                        size="small"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(params.data.item_id)}
                        size="small"
                    >
                        Delete
                    </Button>
                </Stack>
            ),
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