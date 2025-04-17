import React, { useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { Permission } from "../../model"
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
import { queryClient } from "../../app/main";

const PermissionsPage: React.FC = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [permissionId, setPermissionId] = useState<number | null>(null);
    const [permissionName, setEditedPermissionName] = useState("");
    const [description, setEditedDescription] = useState("");

    const gridApiRef = useRef<AgGridReact>(null);
    const { data: permissionData, error: permissionError, isLoading: permissionsLoading } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => {
            return DBModel.fetchPermissions();
        },
        select: (data) => data as Permission[]
    })
    const deletePermission = useMutation({
        mutationFn: (id: string) => DBModel.deletePermission(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['permissions'],
            });
            toast.success("Permission deleted successfully");
        },
        onError: (error) => {
            console.error("Error deleting permission:", error);
            toast.error("Error deleting permission");
        },
    });
    useEffect(() => {
        if (permissionError) {
            toast.error("Error fetching permissions" + permissionError);
        }
    }
        , [permissionError]);

    useEffect(() => {
        if (permissionData && !permissionsLoading) {
            setPermissions(permissionData);
        }
    }
        , [permissionData, permissionsLoading]);
    const columnDefs: ColDef[] = [
        { field: "name", headerName: "Name", sortable: true, filter: true, flex: 0.3 },
        { field: "description", headerName: "Description", sortable: true, filter: true, flex: 0.4 },
        {
            headerName: "Actions",
            colId: "actions",
            flex: 0.3,
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
                        onClick={() => handleDelete(params.data.id)}
                        size="small"
                    >
                        Delete
                    </Button>
                </Stack>
            ),
        },
    ];

    const handleEdit = (permission: Permission) => {
        setPermissionId(permission.id);
        setEditedPermissionName(permission.name);
        setEditedDescription(permission.description ?? "");
        setDialogVisible(true);
    };

    const handleDelete = (id: string) => {
        deletePermission.mutate(id);
        // setPermissions(permissions.filter((permission) => permission.id !== id));
    };

    const handleSave = (selectedPermission: Permission) => {
        console.log("current selected permission:", selectedPermission)
        if (selectedPermission.id !== null) {
            console.log(selectedPermission);
            const updatedPermission = {
                ...selectedPermission,
            } as Permission;
            DBModel.updatePermission(updatedPermission)
                .then(() => {
                    queryClient.invalidateQueries(
                        {
                            queryKey: ['permissions']
                        }
                    );
                    toast.success("Permission updated successfully");
                })
                .catch((error) => {
                    console.error("Error updating permission:", error);
                    toast.error("Error updating permission");
                });
        }
        else {
            const newPermission = {
                name: permissionName,
                description: description,
            } as Permission;
            DBModel.createPermission(newPermission)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['permissions'] });
                    toast.success("Permission created successfully");
                })
                .catch((error) => {
                    console.error("Error creating permission:", error);
                    toast.error("Error creating permission");
                });
        }
        setDialogVisible(false);
    };

    const handleCancel = () => {
        setDialogVisible(false);
    };

    return (
        <Box sx={{ padding: "2%" }}>
            <Typography variant="h3" align="center" gutterBottom>
                Permissions Management
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    variant="contained"
                    onClick={() => {
                        setEditedPermissionName("");
                        setEditedDescription("");
                        setDialogVisible(true);
                    }}
                >
                    Add Permission
                </Button>
            </Stack>
            <Box sx={{ height: "70vh", width: "100%" }}>
                <AgGridReact
                    loadingOverlayComponent={Skeleton}
                    ref={gridApiRef}
                    rowData={permissions}
                    columnDefs={columnDefs}
                    defaultColDef={{ resizable: false }}
                    domLayout="autoHeight"
                    pagination
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 20, 50]}
                />
            </Box>
            <Dialog open={dialogVisible} onClose={handleCancel}>
                <Box sx={{ padding: "2rem", width: "400px" }}>
                    <Typography variant="h5" gutterBottom>
                        Edit Permission
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Permission Name"
                            value={permissionName}
                            onChange={(e) => setEditedPermissionName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Description"
                            value={description}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            fullWidth
                        />



                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button variant="outlined" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={() => handleSave({
                                id: permissionId || null,
                                name: permissionName,
                                description: description,
                            } as Permission
                            )}>
                                Save
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Dialog>
        </Box>
    );
};

export default PermissionsPage;