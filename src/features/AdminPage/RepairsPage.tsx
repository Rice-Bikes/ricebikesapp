import React, { useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { Repair } from "../../model"
import {
    Box,
    Button,
    Dialog,
    Typography,
    TextField,
    Stack,
    Skeleton,
} from "@mui/material";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import DBModel from "../../model";
import { queryClient } from "../../app/queryClient";

const RepairsPage: React.FC = () => {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [editedPrice, setEditedPrice] = useState(0);
    const [editedDescription, setEditedDescription] = useState("");


    const gridApiRef = useRef<AgGridReact>(null);
    const { data: repairData, error: repairError, isLoading: repairsLoading } = useQuery(DBModel.getRepairsQuery())
    const deleteRepair = useMutation({
        mutationFn: (id: string) => DBModel.deleteRepair(id),
        onSuccess: () => {
            queryClient.invalidateQueries(DBModel.getRepairsQuery());
            toast.success("Repair deleted successfully");
        },
        onError: (error) => {
            console.error("Error deleting repair:", error);
            toast.error("Error deleting repair");
        },
    });
    if (repairError) {
        toast.error("Error fetching repairs");
    }
    useEffect(() => {
        if (repairData && !repairsLoading) {
            setRepairs(repairData);
        }
    }
        , [repairData, repairsLoading]);

    const columnDefs: ColDef[] = [
        { field: "name", headerName: "Name", sortable: true, filter: true },
        { field: "price", headerName: "Price", sortable: true, filter: true, flex: 0.5 },
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
                        onClick={() => handleDelete(params.data.repair_id)}
                        size="small"
                    >
                        Delete
                    </Button>
                </Stack>
            ),
        },
    ];

    const handleEdit = (repair: Repair) => {
        setSelectedRepair(repair);
        setEditedName(repair.name);
        setEditedPrice(repair.price);
        setEditedDescription(repair.description ?? "");
        setDialogVisible(true);
    };

    const handleDelete = (id: string) => {
        deleteRepair.mutate(id);
        // setRepairs(repairs.filter((repair) => repair.id !== id));
    };

    const handleSave = () => {
        if (selectedRepair) {
            const updatedRepair = {
                ...selectedRepair,
                name: editedName,
                price: editedPrice,
                description: editedDescription,
            } as Repair;
            DBModel.updateRepair(updatedRepair)
                .then(() => {
                    queryClient.invalidateQueries(DBModel.getRepairsQuery());
                    toast.success("Repair updated successfully");
                })
                .catch((error) => {
                    console.error("Error updating repair:", error);
                    toast.error("Error updating repair");
                });
        }
        else {
            const newRepair = {
                name: editedName,
                price: editedPrice,
                description: editedDescription,
            } as Repair;
            DBModel.createRepair(newRepair)
                .then(() => {
                    queryClient.invalidateQueries(DBModel.getRepairsQuery());
                    toast.success("Repair created successfully");
                })
                .catch((error) => {
                    console.error("Error creating repair:", error);
                    toast.error("Error creating repair");
                });
        }
        setDialogVisible(false);
        setSelectedRepair(null);
    };

    const handleCancel = () => {
        setDialogVisible(false);
        setSelectedRepair(null);
    };

    return (
        <Box sx={{ padding: "2%" }}>
            <Typography variant="h3" align="center" gutterBottom>
                Repairs Management
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    variant="contained"
                    onClick={() => {
                        setEditedName("");
                        setEditedPrice(0);
                        setEditedDescription("");
                        setDialogVisible(true);
                    }}
                >
                    Add Repair
                </Button>
            </Stack>
            <Box sx={{ height: "70vh", width: "100%" }}>
                <AgGridReact
                    loadingOverlayComponent={Skeleton}
                    ref={gridApiRef}
                    rowData={repairs}
                    columnDefs={columnDefs}
                    defaultColDef={{ flex: 1, resizable: false }}
                    domLayout="autoHeight"
                    pagination
                    onGridReady={(params) => {
                        gridApiRef.current!.api.applyColumnState({
                            state: [{ colId: "time_since_completion", hide: true }, { colId: "submitted", hide: false }],
                            defaultState: { sort: null },
                        });
                        params.api.sizeColumnsToFit();
                    }}
                />
            </Box>
            <Dialog open={dialogVisible} onClose={handleCancel}>
                <Box sx={{ padding: "2rem", width: "400px" }}>
                    <Typography variant="h5" gutterBottom>
                        Edit Repair
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Price"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(Number.parseInt(e.target.value) ? Number(e.target.value) : (e.target.value === '-' ? Number(e.target.value) * -1 : 0))}
                            fullWidth
                        />

                        <TextField
                            label="Description"
                            value={editedDescription}
                            onChange={(e) => setEditedDescription((e.target.value))}
                            fullWidth
                            multiline
                        />

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button variant="outlined" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSave}>
                                Save
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Dialog>
        </Box>
    );
};

export default RepairsPage;