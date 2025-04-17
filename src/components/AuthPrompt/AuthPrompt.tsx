import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid2 } from "@mui/material";
import DBModel, { User } from "../../model";
import { queryClient } from "../../app/main";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface AuthPromptProps {
  setUser: (user: User) => void;
}

const debug: boolean = import.meta.env.VITE_DEBUG

const AuthPrompt: React.FC<AuthPromptProps> = ({
  setUser,
}: AuthPromptProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [netId, setNetId] = useState<string>("");
  const [currentNetId, setCurrentNetId] = useState<string>("");
  const timerDuration = 7 * 60;
  const [timer, setTimer] = useState<number>(timerDuration);





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
    const interval = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          queryClient.removeQueries({
            queryKey: ["user"],
          });
          return timerDuration; // Reset timer to 5
        }
        return prevTimer - 1;
      });
    }, 1000)

    if (!data) {
      // setNetId("test");
      setOpen(true);
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (debug) console.log(data);
    if (error) {
      toast.error("Error fetching user: " + error);
      setOpen(true);
    }
    if (!error && status !== "pending" && data) {
      if (debug) console.log("current user is submitted, closing dialog");
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
    else {
      setUser(data);
      setTimer(timerDuration);
    }

  }, [data, setUser, setOpen]);




  const nav = useNavigate();


  return (
    <>
      <Grid2 container spacing={2} >
        <Grid2 size={6}>
          <Button
            onClick={() => {
              nav("/admin");
            }}
            variant="contained"
            hidden
            sx={{ display: "none" }}
          >
            Admin Page
          </Button>
        </Grid2>
        <Grid2 size={2} >
          <Button sx={{ pointerEvents: "none" }}>Session expires in {Math.floor(timer / 60)}:{timer % 60 < 10 ? "0" : ""}{timer % 60}</Button>
        </Grid2>
        <Grid2 size={4} justifyItems={"flex-start"}>
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
