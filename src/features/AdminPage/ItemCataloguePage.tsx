import React, { useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
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
    if (itemError) {
        toast.error("Error fetching items");
    }
    useEffect(() => {
        if (itemData && !itemsLoading) {
            setItems(itemData);
        }
    }, [itemData, itemsLoading]);
    const columnDefs: ColDef[] = [
        { field: "name", headerName: "Name", sortable: true, filter: true },
        { field: "standard_price", headerName: "Price", sortable: true, filter: true },
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
                    columnDefs={columnDefs}
                    defaultColDef={{ flex: 1, resizable: true }}
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