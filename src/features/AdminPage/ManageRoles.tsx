// import React, { useState, useRef, useEffect } from "react";
// import { AgGridReact } from "ag-grid-react";
// import { ColDef, ICellRendererParams } from "ag-grid-community";
// import { Role } from "../../model"
// import {
//     Box,
//     Button,
//     Dialog,
//     Typography,
//     TextField,
//     Stack,
//     Skeleton,
//     SelectChangeEvent,
// } from "@mui/material";
// import { toast } from "react-toastify";
// import { useMutation, useQuery } from "@tanstack/react-query";
// import DBModel from "../../model";
// import { queryClient } from "../../app/main";
// import { MenuItem, Select, InputLabel, FormControl } from "@mui/material";

// const RolesPage: React.FC = () => {
//     const [roles, setRoles] = useState<Role[]>([]);
//     const [dialogVisible, setDialogVisible] = useState(false);
//     const [roleId, setRoleId] = useState<string | null>(null);
//     const [roleName, setEditedRoleName] = useState("");
//     const [editedLastName, setEditedLastName] = useState("");
//     const [editedNetId, setEditedNetId] = useState("");
//     const [editedActive, setEditedActive] = useState(false);
//     const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

//     const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
//         const { value } = event.target;
//         setSelectedRoles(typeof value === "string" ? value.split(",") : value);

//     };


//     const gridApiRef = useRef<AgGridReact>(null);
//     const { data: roleData, error: roleError, isLoading: rolesLoading } = useQuery({
//         queryKey: ['roles'],
//         queryFn: () => {
//             return DBModel.fetchRoles();
//         },
//         select: (data) => data as Role[]
//     })
//     const deleteRole = useMutation({
//         mutationFn: (id: string) => DBModel.deleteRole(id),
//         onSuccess: () => {
//             queryClient.invalidateQueries({
//                 queryKey: ['roles'],
//             });
//             toast.success("Role deleted successfully");
//         },
//         onError: (error) => {
//             console.error("Error deleting role:", error);
//             toast.error("Error deleting role");
//         },
//     });
//     if (roleError) {
//         toast.error("Error fetching roles");
//     }
//     useEffect(() => {
//         if (roleData && !rolesLoading) {
//             setRoles(roleData);
//         }
//     }
//         , [roleData, rolesLoading]);
//     const columnDefs: ColDef[] = [
//         { colId: "name", headerName: "Name", sortable: true, filter: true, flex: 0.4, valueGetter: (params) => `${params.data.firstname} ${params.data.lastname}` },
//         { field: "rolename", headerName: "Net Id", sortable: true, filter: true, flex: 0.2 },
//         {
//             field: "roles", headerName: "Roles", flex: 0.3, valueGetter: (params) => params.data.roles ? params.data.roles.join(", ") : "", cellRenderer: (params: ICellRendererParams) => (
//                 <Stack direction="row" spacing={1}>
//                     {params.data && params.data.roles && params.data.roles.map((role: string) => (
//                         <Button
//                             key={role}
//                             variant="outlined"
//                             size="small"
//                         >
//                             {role}
//                         </Button>
//                     ))}
//                 </Stack>
//             )
//         },
//         {
//             field: "active", headerName: "Active", flex: 0.2, valueGetter: (params) => params.data.active ? "Yes" : "No", cellRenderer: (params: ICellRendererParams) => (
//                 <Stack direction="row" spacing={1}>
//                     <Button
//                         variant="outlined"
//                         onClick={() => {
//                             setEditedActive(!params.data.active);
//                             console.log("current selected role:", params.data as Role)
//                             const updatedRole = {
//                                 ...params.data,
//                                 active: !params.data.active,
//                             } as Role;
//                             handleSave(updatedRole)
//                         }
//                         }
//                         color={params.data.active ? "success" : "error"}
//                         size="small"
//                     >
//                         {params.data.active ? "✓" : "X"}
//                     </Button>
//                 </Stack>
//             )
//         },
//         {
//             headerName: "Actions",
//             colId: "actions",
//             flex: 0.3,
//             cellRenderer: (params: ICellRendererParams) => (
//                 <Stack direction="row" spacing={1}>
//                     <Button
//                         variant="outlined"
//                         onClick={() => handleEdit(params.data)}
//                         size="small"
//                     >
//                         Edit
//                     </Button>
//                     <Button
//                         variant="outlined"
//                         color="error"
//                         onClick={() => handleDelete(params.data.role_id)}
//                         size="small"
//                     >
//                         Delete
//                     </Button>
//                 </Stack>
//             ),
//         },
//     ];

//     const handleEdit = (role: Role) => {
//         setRoleId(role.role_id);
//         setEditedRoleName(role.role_name);
//         setEditedNetId(role.rolename);
//         setDialogVisible(true);
//     };

//     const handleDelete = (id: string) => {
//         deleteRole.mutate(id);
//         // setRoles(roles.filter((role) => role.id !== id));
//     };

//     const handleSave = (selectedRole: Role) => {
//         console.log("current selected role:", selectedRole)
//         if (selectedRole.role_id !== "") {
//             console.log(selectedRole);
//             const updatedRole = {
//                 ...selectedRole,
//             } as Role;
//             DBModel.updateRole(updatedRole)
//                 .then(() => {
//                     queryClient.invalidateQueries(
//                         {
//                             queryKey: ['roles']
//                         }
//                     );
//                     toast.success("Role updated successfully");
//                 })
//                 .catch((error) => {
//                     console.error("Error updating role:", error);
//                     toast.error("Error updating role");
//                 });
//         }
//         else {
//             const newRole = {
//                 firstname: roleName,
//                 lastname: editedLastName,
//                 rolename: editedNetId,
//                 active: true,
//             } as Role;
//             DBModel.createRole(newRole)
//                 .then(() => {
//                     queryClient.invalidateQueries({ queryKey: ['roles'] });
//                     toast.success("Role created successfully");
//                 })
//                 .catch((error) => {
//                     console.error("Error creating role:", error);
//                     toast.error("Error creating role");
//                 });
//         }
//         setDialogVisible(false);
//     };

//     const handleCancel = () => {
//         setDialogVisible(false);
//     };

//     return (
//         <Box sx={{ padding: "2%" }}>
//             <Typography variant="h3" align="center" gutterBottom>
//                 Roles Management
//             </Typography>
//             <Stack direction="row" spacing={2} justifyContent="flex-end">
//                 <Button
//                     variant="contained"
//                     onClick={() => {
//                         setEditedRoleName("");
//                         setEditedLastName("");
//                         setEditedNetId("");
//                         setDialogVisible(true);
//                     }}
//                 >
//                     Add Role
//                 </Button>
//             </Stack>
//             <Box sx={{ height: "70vh", width: "100%" }}>
//                 <AgGridReact
//                     loadingOverlayComponent={Skeleton}
//                     ref={gridApiRef}
//                     rowData={roles}
//                     columnDefs={columnDefs}
//                     defaultColDef={{ resizable: false }}
//                     domLayout="autoHeight"
//                     pagination
//                     paginationPageSize={10}
//                     paginationPageSizeSelector={[10, 20, 50]}
//                 />
//             </Box>
//             <Dialog open={dialogVisible} onClose={handleCancel}>
//                 <Box sx={{ padding: "2rem", width: "400px" }}>
//                     <Typography variant="h5" gutterBottom>
//                         Edit Role
//                     </Typography>
//                     <Stack spacing={2}>
//                         <TextField
//                             label="Role Name"
//                             value={roleName}
//                             onChange={(e) => setEditedRoleName(e.target.value)}
//                             fullWidth
//                         />
//                         <TextField
//                             label="Last Name"
//                             value={editedLastName}
//                             onChange={(e) => setEditedLastName(e.target.value)}
//                             fullWidth
//                         />
//                         <TextField
//                             label="Net Id"
//                             value={editedNetId}
//                             onChange={(e) => setEditedNetId(e.target.value)}
//                             fullWidth
//                         />

//                         <FormControl fullWidth>
//                             <InputLabel id="roles-label">Roles</InputLabel>
//                             <Select
//                                 labelId="roles-label"
//                                 multiple
//                                 value={selectedRoles}
//                                 onChange={handleRoleChange}
//                                 renderValue={(selected) => (selected as string[]).join(", ")}
//                             >
//                                 {["Projects", "Operations", "General Manager", "Logistics", "Head Mechanic", "Finance", "Personnel", "SRB Director"].map((role) => (
//                                     <MenuItem key={role} value={role}>
//                                         {selectedRoles.includes(role) ? "✓ " : ""}{role}
//                                     </MenuItem>
//                                 ))}
//                             </Select>
//                         </FormControl>

//                         <Stack direction="row" spacing={2} justifyContent="flex-end">
//                             <Button variant="outlined" onClick={handleCancel}>
//                                 Cancel
//                             </Button>
//                             <Button variant="contained" onClick={() => handleSave({
//                                 role_id: roleId || "",
//                                 firstname: roleName,
//                                 lastname: editedLastName,
//                                 rolename: editedNetId,
//                                 active: editedActive,
//                             } as Role
//                             )}>
//                                 Save
//                             </Button>
//                         </Stack>
//                     </Stack>
//                 </Box>
//             </Dialog>
//         </Box>
//     );
// };

// export default RolesPage;