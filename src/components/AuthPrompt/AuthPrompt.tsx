import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid2,
  Typography,
  Stack,
} from "@mui/material";

import { useAuth, useUser } from "../../contexts/UserContext";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const TIMER_DURATION = 7 * 60;

export default function AuthPrompt() {
  const [open, setOpen] = useState(true);
  const [netIdInput, setNetIdInput] = useState("");

  const [timer, setTimer] = useState(TIMER_DURATION);
  const { setUserId, logout } = useAuth();
  const { data: user, error } = useUser();

  // Open/close prompt based on user availability
  useEffect(() => {
    if (user && user.user_id) {
      setOpen(false);
      setTimer(TIMER_DURATION);
    } else {
      setOpen(true);
    }
  }, [user]);

  // Removed cache polling effect in favor of auth context
  useEffect(() => {
    // no-op
  }, []);

  useEffect(() => {
    if (error) {
      const message = (error as Error)?.message ?? "Unknown error";
      toast.error("Error fetching user: " + message);
      // Keep dialog open on error, but clear the netId so user can try again
    }
  }, [error]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          logout();
          setOpen(true);

          return TIMER_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [logout]);

  const handleSubmit = () => {
    const id = netIdInput.trim();
    if (id) {
      setUserId(id);
    }

    setNetIdInput("");
  };

  return (
    <>
      <Grid2 container width="100%">
        <Grid2 size={6} />
        <Grid2 size={6} sx={{ textAlign: "right" }}>
          <Stack direction="column">
            <Typography>
              Session expires in {Math.floor(timer / 60)}:
              {timer % 60 < 10 ? "0" : ""}
              {timer % 60}
            </Typography>
            <Typography>
              {"Current User: " +
                (user ? user.firstname + " " + user.lastname : "None")}
            </Typography>
          </Stack>
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
            helperText={
              error
                ? "Invalid netId"
                : !netIdInput
                  ? "Enter your NetID to continue"
                  : ""
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
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
