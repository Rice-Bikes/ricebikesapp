
import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid2 } from "@mui/material";
import { User } from "../../model";
import { queryClient } from "../../app/queryClient";
import { useUserQuery } from "../../hooks/useUserQuery";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface AuthPromptProps {
  setUser: (user: User) => void;
}

const TIMER_DURATION = 7 * 60;

export default function AuthPrompt({ setUser }: AuthPromptProps) {
  const [open, setOpen] = useState(true);
  const [netIdInput, setNetIdInput] = useState("");
  const [netId, setNetId] = useState("");
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [user, setUserState] = useState<User | null>(null);

  const { data, error } = useUserQuery(netId, open);

  useEffect(() => {
    if (data) {
      setUser(data);
      setUserState(data);
      setOpen(false);
      setTimer(TIMER_DURATION);
    }
    if (error) {
      toast.error("Error fetching user: " + error.message);
      setOpen(true);
    }
  }, [data, error, setUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          queryClient.removeQueries({ queryKey: ["user"] });
          setOpen(true);
          setUserState(null);
          return TIMER_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    setNetId(netIdInput.trim());
    setNetIdInput("");
    queryClient.removeQueries({ queryKey: ["user"] });
  };

  const nav = useNavigate();

  return (
    <>
      <Grid2 container spacing={2}>
        <Grid2 size={2} />
        <Grid2 size={4}>
          <Button
            onClick={() => nav("/admin")}
            variant="contained"
            sx={{ display: (user?.permissions?.length || 0) > 0 ? "inherit" : "none", width: "40%" }}
          >
            Admin Page
          </Button>
        </Grid2>
        <Grid2 size={2}>
          <Button sx={{ pointerEvents: "none" }}>
            Session expires in {Math.floor(timer / 60)}:{timer % 60 < 10 ? "0" : ""}{timer % 60}
          </Button>
        </Grid2>
        <Grid2 size={4}>
          <Button
            onClick={() => setOpen(true)}
            variant="contained"
          >
            {"Current User: " + (user ? user.firstname + " " + user.lastname : "None")}
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
            value={netIdInput}
            error={!!error}
            helperText={error ? "Invalid netId" : !netIdInput ? "Enter your NetID to continue" : ""}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            onChange={(e) => setNetIdInput(e.target.value)}
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
}
