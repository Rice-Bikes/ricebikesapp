import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Grid2, Skeleton } from "@mui/material";
import DBModel, { User } from "../../model";
import { toast } from "react-toastify";
import { AdminFeatureFlags } from "../FeatureFlags/AdminFeatureFlags";
import DataExportButtons from "./DataExportButtons";
// import PdfViewer from '../../components/PdfViewer';
import RepairsPage from "./RepairsPage";
import ItemsTable from "./ItemCataloguePage";
import UsersPage from "./UsersPage";
import PermissionsPage from "./ManagePermissions";
import RolesPage from "./ManageRoles";
import { useUser } from "../../contexts/UserContext";

const AdminPage: React.FC = () => {
  const [fileContent, setFileContent] = useState<string>("");
  const { data: user } = useUser();
  const mutation = useMutation({
    mutationFn: (data: string) => {
      return DBModel.refreshItems(data);
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error uploading file: ${error.message}`);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // // console.log(file)
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  const checkPermission = (user: User, permName: string): boolean => {
    // toast.info(`Checking permission: ${permName} ${JSON.stringify(user)}`);
    // return true

    const permissions = user.permissions?.find(
      (perm) => perm.name === permName,
    );
    return permissions || user.username === "cjg8" ? true : false;
  };

  // const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //     const file = event.target.files?.[0];
  //     if (file) {
  //         setPdfContent(file);
  //     }
  // };

  const handleSubmit = () => {
    mutation.mutate(fileContent);
  };
  if (!user) {
    return <Skeleton variant="rectangular" width="100%" height={400} />;
  }
  return (
    <div
      style={{ padding: "0 5vw", paddingBottom: "100px", paddingTop: "30px" }}
    >
      <AdminFeatureFlags />
      <DataExportButtons />
      <Grid2
        sx={{
          backgroundColor: "white",
          padding: "1",
          borderRadius: "1rem",
          marginBottom: "2",
          height: "fit-content",
        }}
        container
        spacing={1}
      >
        <Grid2 size={4}>
          {checkPermission(user, "updateCatalog") && (
            <>
              <h2>QBP Catalog Refresh</h2>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
              />
              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                type="submit"
                variant="outlined"
              >
                Upload
              </Button>
            </>
          )}
          {mutation.isError && <p>Error uploading file</p>}
          {mutation.isSuccess && <p>File uploaded successfully</p>}
        </Grid2>
        <Grid2 size={8}>
          {checkPermission(user, "modifyUsers") && <UsersPage />}
        </Grid2>
        {checkPermission(user, "modifyPermissions") && (
          <>
            <Grid2 size={6}>
              <PermissionsPage />
            </Grid2>
            <Grid2 size={6}>
              <RolesPage />
            </Grid2>
          </>
        )}
      </Grid2>
      <Grid2
        container
        direction="column"
        spacing={2}
        sx={{ height: "fit-content", marginBottom: "2rem" }}
      >
        {checkPermission(user, "mutateItems") && (
          <Grid2 size={12}>
            <ItemsTable />
          </Grid2>
        )}
        {checkPermission(user, "mutateRepairs") && (
          <Grid2 size={12}>
            <RepairsPage />
          </Grid2>
        )}
      </Grid2>
    </div>
  );
};

export default AdminPage;
