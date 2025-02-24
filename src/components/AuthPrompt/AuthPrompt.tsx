import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import DBModel, { User } from "../../model";

import { queryClient } from "../../app/main";
import { useQuery } from "@tanstack/react-query";

interface AuthPromptProps {
  // expediteAuth: boolean;
  // setExpediteAuth: (value: boolean) => void;
  setUser: (user: User) => void;
}

const AuthPrompt = ({
  // expediteAuth,
  // setExpediteAuth: setAuthExpedited,
  setUser,
}: AuthPromptProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [netId, setNetId] = useState<string>("");
  const [currentNetId, setCurrentNetId] = useState<string>("");


  const { error, data, status, isFetching } = useQuery({
    queryKey: ["user"],
    queryFn: () => {
      // setNetId("");
      if (netId.trim() === "") return;
      const newNetId = netId;
      setNetId(" ");
      return DBModel.fetchUser(newNetId);
    },
    retry: false,
    enabled: netId !== "",
  });

  console.log("auth is currently loading", isFetching, error);

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

    console.log("user data has changed", status, data);

    if (isFetching || data === undefined || status === "error") {
      // setNetId("test");
      setOpen(true);
      // setAuthExpedited(false);
    }
    return () => clearInterval(interval);
  }, [status, data, isFetching]);

  useEffect(() => {
    console.log(data);
    if (!error && status === "success" && data) {
      console.log("current user is submitted, closing dialog");
      setOpen(false);
    }
  }, [netId, data, status, error]);

  const handleSubmit = () => {
    setNetId(currentNetId);
    setCurrentNetId("");
    // queryClient.invalidateQueries({
    //   queryKey: ["user"],
    // });
    // setAuthExpedited(false);
  };

  if (data) {
    setUser(data);
  }

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          queryClient.invalidateQueries({
            queryKey: ["user"],
          });
        }}
        variant="contained"
        sx={{
          marginLeft: "70vw",
        }}
      >
        {"Current User: " +
          (data ? data.firstname + " " + data.lastname : "None")}
      </Button>
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
            error={error !== null && netId.trim().length > 0}
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
