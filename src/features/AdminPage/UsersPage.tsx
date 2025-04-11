import React, { useState, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { User } from "../../model"
import {
    Box,
    Button,
    Dialog,
    Typography,
    TextField,
    Stack,
    Skeleton,
    SelectChangeEvent,
} from "@mui/material";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import DBModel from "../../model";
import { queryClient } from "../../app/main";
import { MenuItem, Select, InputLabel, FormControl } from "@mui/material";

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [editedFirstName, setEditedFirstName] = useState("");
    const [editedLastName, setEditedLastName] = useState("");
    const [editedNetId, setEditedNetId] = useState("");
    const [editedActive, setEditedActive] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
        const { value } = event.target;
        setSelectedRoles(typeof value === "string" ? value.split(",") : value);

    };


    const gridApiRef = useRef<AgGridReact>(null);
    const { data: userData, error: userError, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => {
            return DBModel.fetchUsers();
        },
        select: (data) => data as User[]
    })
    const deleteUser = useMutation({
        mutationFn: (id: string) => DBModel.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['users'],
            });
            toast.success("User deleted successfully");
        },
        onError: (error) => {
            console.error("Error deleting user:", error);
            toast.error("Error deleting user");
        },
    });
    if (userError) {
        toast.error("Error fetching users");
    }
    useEffect(() => {
        if (userData && !usersLoading) {
            setUsers(userData);
        }
    }
        , [userData, usersLoading]);
    const columnDefs: ColDef[] = [
        { colId: "name", headerName: "Name", sortable: true, filter: true, flex: 0.4, valueGetter: (params) => `${params.data.firstname} ${params.data.lastname}` },
        { field: "username", headerName: "Net Id", sortable: true, filter: true, flex: 0.2 },
        {
            field: "roles", headerName: "Roles", flex: 0.3, valueGetter: (params) => params.data.roles ? params.data.roles.join(", ") : "", cellRenderer: (params: ICellRendererParams) => (
                <Stack direction="row" spacing={1}>
                    {params.data && params.data.roles && params.data.roles.map((role: string) => (
                        <Button
                            key={role}
                            variant="outlined"
                            size="small"
                        >
                            {role}
                        </Button>
                    ))}
                </Stack>
            )
        },
        {
            field: "active", headerName: "Active", flex: 0.2, valueGetter: (params) => params.data.active ? "Yes" : "No", cellRenderer: (params: ICellRendererParams) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setEditedActive(!params.data.active);
                            console.log("current selected user:", params.data as User)
                            const updatedUser = {
                                ...params.data,
                                active: !params.data.active,
                            } as User;
                            handleSave(updatedUser)
                        }
                        }
                        color={params.data.active ? "success" : "error"}
                        size="small"
                    >
                        {params.data.active ? "✓" : "X"}
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
                        onClick={() => handleDelete(params.data.user_id)}
                        size="small"
                    >
                        Delete
                    </Button>
                </Stack>
            ),
        },
    ];

    const handleEdit = (user: User) => {
        setUserId(user.user_id);
        setEditedFirstName(user.firstname);
        setEditedLastName(user.lastname);
        setEditedNetId(user.username);
        setDialogVisible(true);
    };

    const handleDelete = (id: string) => {
        deleteUser.mutate(id);
        // setUsers(users.filter((user) => user.id !== id));
    };

    const handleSave = (selectedUser: User) => {
        console.log("current selected user:", selectedUser)
        if (selectedUser.user_id !== "") {
            console.log(selectedUser);
            const updatedUser = {
                ...selectedUser,
            } as User;
            DBModel.updateUser(updatedUser)
                .then(() => {
                    queryClient.invalidateQueries(
                        {
                            queryKey: ['users']
                        }
                    );
                    toast.success("User updated successfully");
                })
                .catch((error) => {
                    console.error("Error updating user:", error);
                    toast.error("Error updating user");
                });
        }
        else {
            const newUser = {
                firstname: editedFirstName,
                lastname: editedLastName,
                username: editedNetId,
                active: true,
            } as User;
            DBModel.createUser(newUser)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                    toast.success("User created successfully");
                })
                .catch((error) => {
                    console.error("Error creating user:", error);
                    toast.error("Error creating user");
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
                Users Management
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    variant="contained"
                    onClick={() => {
                        setEditedFirstName("");
                        setEditedLastName("");
                        setEditedNetId("");
                        setDialogVisible(true);
                    }}
                >
                    Add User
                </Button>
            </Stack>
            <Box sx={{ height: "70vh", width: "100%" }}>
                <AgGridReact
                    loadingOverlayComponent={Skeleton}
                    ref={gridApiRef}
                    rowData={users}
                    columnDefs={columnDefs}
                    defaultColDef={{ resizable: false }}
                    domLayout="autoHeight"
                    pagination
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10]}
                />
            </Box>
            <Dialog open={dialogVisible} onClose={handleCancel}>
                <Box sx={{ padding: "2rem", width: "400px" }}>
                    <Typography variant="h5" gutterBottom>
                        Edit User
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="First Name"
                            value={editedFirstName}
                            onChange={(e) => setEditedFirstName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Last Name"
                            value={editedLastName}
                            onChange={(e) => setEditedLastName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Net Id"
                            value={editedNetId}
                            onChange={(e) => setEditedNetId(e.target.value)}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel id="roles-label">Roles</InputLabel>
                            <Select
                                labelId="roles-label"
                                multiple
                                value={selectedRoles}
                                onChange={handleRoleChange}
                                renderValue={(selected) => (selected as string[]).join(", ")}
                            >
                                {["Projects", "Operations", "General Manager", "Logistics", "Head Mechanic", "Finance", "Personnel", "SRB Director"].map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {selectedRoles.includes(role) ? "✓ " : ""}{role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button variant="outlined" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={() => handleSave({
                                user_id: userId || "",
                                firstname: editedFirstName,
                                lastname: editedLastName,
                                username: editedNetId,
                                active: editedActive,
                            } as User
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

export default UsersPage;