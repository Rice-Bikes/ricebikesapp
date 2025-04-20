import React, { useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { Role, Permission } from "../../model"
import {
    Box,
    Button,
    Dialog,
    Typography,
    TextField,
    Stack,
    Skeleton,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
} from "@mui/material";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import DBModel from "../../model";
import { queryClient } from "../../app/main";

const RolesPage: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [roleId, setRoleId] = useState<string | null>(null);
    const [roleName, setEditedRoleName] = useState("");
    const [description, setEditedDescription] = useState("");
    const [disabled, setDisabled] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);


    useEffect(() => {
        console.log("Role permissions:", rolePermissions);
        if (rolePermissions.length > 0) {
            // Extract just the role IDs from the userRoles array
            setSelectedPermissionIds(rolePermissions.map(permission => permission.id));
        } else {
            setSelectedPermissionIds([]);
        }
    }
        , [rolePermissions]);

    const handlePermissionChange = (event: SelectChangeEvent<number[]>) => {
        const idArray: number[] = Array.isArray(event.target.value) ? event.target.value as number[] : [event.target.value as unknown as number];


        if (!roleId) return;

        // Find roles to add (new selections)
        const permissionsToAdd = idArray.filter(
            permissionId => !rolePermissions.some(permission => permission.id === permissionId)
        );

        // Find roles to remove (unselected)
        const permissionsToRemove = rolePermissions
            .filter(permission => !idArray.includes(permission.id))
            .map(permission => permission.id);

        // Process additions
        for (const permissionId of permissionsToAdd) {
            attachPermissionToRole.mutate({
                role_id: roleId,
                permission_id: permissionId
            });
        }

        // Process removals
        for (const permissionId of permissionsToRemove) {
            detachPermissionToRole.mutate({
                role_id: roleId,
                permission_id: permissionId
            });
        }
    }
    const gridApiRef = useRef<AgGridReact>(null);
    const { data: roleData, error: roleError, isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => {
            return DBModel.fetchRoles();
        },
        select: (data) => data as Role[]
    })

    const { data: permissionData, error: permissionError, isLoading: permissionsLoading } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => {
            return DBModel.fetchPermissions();
        },
        select: (data) => data as Permission[]
    })

    const checkRolePermissions = useMutation({
        mutationKey: ['checkRolePermissions'],
        mutationFn: (role_id: string) => DBModel.fetchPermissionsForRole(role_id),
        onSuccess: (data: Permission[]) => {
            console.log("User roles:", data);
            setRolePermissions(data);
        },
        onError: (error) => {
            console.error("Error fetching user roles:", error);
            toast.error("Error fetching user roles");
        },
    });
    type AttachPermissionParams = {
        role_id: string;
        permission_id: number;
    };
    const attachPermissionToRole = useMutation({
        mutationFn: ({ role_id, permission_id }: AttachPermissionParams) => DBModel.attachPermission(permission_id, role_id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles'],
            });
            checkRolePermissions.mutate(roleId || "");
            toast.success("Permission attached to role successfully");
        },
        onError: (error) => {
            toast.error("Error attaching permission to role" + error);
        }
    });
    const detachPermissionToRole = useMutation({
        mutationFn: ({ role_id, permission_id }: AttachPermissionParams) => DBModel.detachPermission(permission_id, role_id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles'],
            });
            checkRolePermissions.mutate(roleId || "");
            toast.success("Permission detached to role successfully");
        },
        onError: (error) => {
            toast.error("Error detaching permission to role" + error);
        }
    });


    useEffect(() => {
        if (permissionError) {
            toast.error("Error fetching permissions " + permissionError);
        }
    }, [permissionError]);
    const deleteRole = useMutation({
        mutationFn: (id: string) => DBModel.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['roles'],
            });
            toast.success("Role deleted successfully");
        },
        onError: (error) => {
            console.error("Error deleting role:", error);
            toast.error("Error deleting role");
        },
    });
    useEffect(() => {
        if (roleError) {
            toast.error("Error fetching roles" + roleError);
        }
    }, [roleError]);
    useEffect(() => {
        if (roleData && !rolesLoading) {
            setRoles(roleData);
        }
        if (permissionData && !permissionsLoading) {
            setPermissions(permissionData);
        }
    }, [roleData, rolesLoading, permissionData, permissionsLoading]);
    const columnDefs: ColDef[] = [
        { field: "name", headerName: "Name", sortable: true, filter: true, flex: 0.6 },
        {
            field: "disabled", headerName: "Active", flex: 0.2, valueGetter: (params) => params.data.disabled ? "Yes" : "No", cellRenderer: (params: ICellRendererParams) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setDisabled(!params.data.disabled);
                            console.log("current selected role:", params.data as Role)
                            const updatedRole = {
                                ...params.data,
                                disabled: !params.data.disabled,
                            } as Role;
                            handleSave(updatedRole)
                        }
                        }
                        color={!params.data.disabled ? "success" : "error"}
                        size="small"
                    >
                        {!params.data.disabled ? "✓" : "X"}
                    </Button>
                </Stack>
            )
        },
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
                        onClick={() => handleDelete(params.data.role_id)}
                        size="small"
                    >
                        Delete
                    </Button>
                </Stack>
            ),
        },
    ];

    const handleEdit = (role: Role) => {
        checkRolePermissions.mutate(role.role_id);
        setRoleId(role.role_id);
        setEditedRoleName(role.name || "");
        setEditedDescription(role.description || "");
        setDisabled(role.disabled);
        setDialogVisible(true);
    };

    const handleDelete = (id: string) => {
        deleteRole.mutate(id);
        // setRoles(roles.filter((role) => role.id !== id));
    };

    const handleSave = (selectedRole: Role) => {
        console.log("current selected role:", selectedRole)
        if (selectedRole.role_id !== "") {
            console.log(selectedRole);
            const updatedRole = {
                ...selectedRole,
            } as Role;
            DBModel.updateRole(updatedRole)
                .then(() => {
                    queryClient.invalidateQueries(
                        {
                            queryKey: ['roles']
                        }
                    );
                    toast.success("Role updated successfully");
                })
                .catch((error) => {
                    console.error("Error updating role:", error);
                    toast.error("Error updating role");
                });
        }
        else {
            const newRole = {
                name: roleName,
                disabled: false,
                description: description,
            } as Role;
            DBModel.createRole(newRole)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['roles'] });
                    toast.success("Role created successfully");
                })
                .catch((error) => {
                    console.error("Error creating role:", error);
                    toast.error("Error creating role");
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
                Roles Management
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    variant="contained"
                    onClick={() => {
                        setEditedRoleName("");
                        setEditedDescription("");
                        setSelectedPermissionIds([]);
                        setDialogVisible(true);
                    }}
                >
                    Add Role
                </Button>
            </Stack>
            <Box sx={{ height: "70vh", width: "100%" }}>
                <AgGridReact
                    loadingOverlayComponent={Skeleton}
                    ref={gridApiRef}
                    rowData={roles}
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
                        Edit Role
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Role Name"
                            value={roleName}
                            onChange={(e) => setEditedRoleName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="description"
                            value={description}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel id="roles-label">Permissions</InputLabel>
                            <Select
                                sx={{ display: roleId === null ? "none" : "inherit" }}
                                labelId="roles-label"
                                multiple
                                value={selectedPermissionIds}
                                onChange={handlePermissionChange}
                                renderValue={(selected) => {
                                    const selectedPermissions = permissions.filter((permission) =>
                                        selected.includes(permission.id)
                                    );
                                    return selectedPermissions.map((permission) => permission.name).join(", ");
                                }}
                            >
                                {permissions.map((role) => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {/* {selectedRoles.includes(role) ? "✓ " : ""}{role} */}
                                        {role.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button variant="outlined" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={() => handleSave({
                                role_id: roleId || "",
                                name: roleName,
                                description: description,
                                disabled,
                            } as Role
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

export default RolesPage;