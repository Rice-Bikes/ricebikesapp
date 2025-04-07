import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid2,
} from "@mui/material";
import DBModel, { User } from "../../model";

import { queryClient } from "../../app/main";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface AuthPromptProps {
  expediteAuth: boolean;
  setExpediteAuth: (value: boolean) => void;
  setUser: (user: User) => void;
}

const AuthPrompt = ({
  expediteAuth,
  setExpediteAuth: setExpeditAuth,
  setUser,
}: AuthPromptProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [netId, setNetId] = useState<string>("");
  const [currentNetId, setCurrentNetId] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeout((prevTimer: number) => {
        if (prevTimer <= 1) {
          setOpen(true);
          return 15 * 60; // Reset timer to 15 minutes
        }
        return prevTimer - 1;
      });
    }, 1000); // Update every second

    if (expediteAuth) {
      // setNetId("test");
      setOpen(true);
      setExpeditAuth(false);
    }
    return () => clearInterval(interval);
  }, []);



  const { error, data, status } = useQuery({
    queryKey: ["user"],
    queryFn: () => {
      if (netId.trim() === "") throw new Error("No netid");
      const newNetId = String(netId);
      setNetId("");
      return DBModel.fetchUser(newNetId);
    },
    retry: false,
    enabled: netId !== "" && open,
  });

  useEffect(() => {
    console.log(data);
    if (!error && status !== "pending" && data) {
      console.log("current user is submitted, closing dialog");
      setOpen(false);
    }
  }, [netId, data, status, error]);

  const handleSubmit = () => {
    setNetId(currentNetId);
    setCurrentNetId("");
    queryClient.removeQueries({
      queryKey: ["user"],
    });
  };

  useEffect(() => {
    if (!data) {
      setOpen(true);
    }

  }, [data]);



  if (data) {
    setUser(data);
  }
  const nav = useNavigate();


  return (
    <>
      <Grid2 container spacing={2} sx={{ margin: "0 15vw" }}>
        <Grid2 size={6}>
          <Button
            onClick={() => {
              nav("/admin");
            }}
            variant="contained"
            hidden
          >
            Admin Page
          </Button>
        </Grid2>
        <Grid2 size={2} />
        <Grid2 size={4} justifyItems={"flex-end"}>
          <Button
            onClick={() => {
              setOpen(true);
              queryClient.removeQueries({
                queryKey: ["user"],
              });
            }}
            variant="contained"

          >
            {"Current User: " +
              (data ? data.firstname + " " + data.lastname : "None")}
          </Button>
        </Grid2>
      </Grid2>

      <Dialog open={open}>
        <DialogTitle>Enter your NetID</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="NetID"
            type="text"
            fullWidth
            value={currentNetId}
            error={error !== null}
            helperText={
              error
                ? "Invalid netId"
                : netId.length === 0
                  ? "Enter your NetID to continue"
                  : ""
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            onChange={(e) => setCurrentNetId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AuthPrompt;
