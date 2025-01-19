import React, { useState, useEffect } from "react";
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
      // setNetId("");
      if (netId.trim() === "") throw new Error("No netid");
      const newNetId = netId;
      setNetId("");
      return DBModel.fetchUser(newNetId);
    },
    retry: false,
    enabled: netId !== "" && open,
  });

  useEffect(() => {
    console.log(data);
    if (!error && status !== "pending" && data) {
      setOpen(false);
    }
  }, [netId, open, data, status, error]);

  const handleSubmit = () => {
    setNetId(currentNetId);
    setCurrentNetId("");
    queryClient.invalidateQueries({
      queryKey: ["user"],
    });
  };

  if (data) {
    setUser(data);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            onChange={(e) => setCurrentNetId(e.target.value)}
          />
          <p
            style={{
              color: "red",
              display: error ? "grid" : "none",
            }}
          >
            {error ? "Invalid netId" : ""}
          </p>
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
