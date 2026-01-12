import { useState } from "react";
import DBModel from "../../model";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { diffWords } from "diff";
import { useUser, useAuth } from "../../contexts/UserContext";
import { toast } from "react-toastify";
interface NotesProps {
  notes: string;
  onSave: (newNotes: string) => void;
  transaction_num: number;
}

const Notes: React.FC<NotesProps> = ({ notes, onSave, transaction_num }) => {
  // // console.log("initial data passed to Notes", notes);
  const { data: user } = useUser();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [originalNotes, setOriginalNotes] = useState(notes);

  const handleSubmit = () => {
    // setIsWaitingForUser(true);
    // console.log("invalidated user query", user, isWaitingForUser);
    handleSave();
  };

  const handleSave = () => {
    if (!user) {
      toast.error("User not found. Cannot save notes.");
      return;
    }
    setEditedNotes(editedNotes + " - " + user.firstname + " " + user.lastname + "\n");
    // // console.log("edited notes in Notes component", editedNotes);
    onSave(editedNotes + " - " + user.firstname + " " + user.lastname + "\n");
    DBModel.postTransactionLog(
      transaction_num,
      user.user_id,
      `"${diffWords(originalNotes, editedNotes)
        .filter((changeObj) => changeObj.added)
        .map((changeObj) => changeObj.value)
        .join("")}"`,
      "updated",
    );
    setOriginalNotes(editedNotes);
    setIsEditing(false);
  };

  const handleOpenToEdit = () => {
    setEditedNotes(editedNotes.trim() === "" ? "" : editedNotes);
    logout();
    setIsEditing(true);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {isEditing ? (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <TextField
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            onFocus={(e) =>
              (e.target as HTMLTextAreaElement).setSelectionRange(
                (e.target as HTMLTextAreaElement).value.length,
                (e.target as HTMLTextAreaElement).value.length,
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSubmit();
            }}
            multiline
            fullWidth
            autoFocus
            variant="outlined"
            placeholder="Add your notes here..."
            sx={{
              mb: 2,
              fontSize: "14px",
              lineHeight: 1.5,
              "& .MuiInputBase-root": {
                height: "400px",
                alignItems: "flex-start",
                padding: "12px",
              },
              "& .MuiInputBase-input": {
                height: "100% !important",
                overflow: "auto !important",
              },
            }}
          />
          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth
            sx={{ mt: 0 }}
          >
            Save Notes
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", mt: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              minHeight: 120,
              backgroundColor: "grey.50",
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                fontSize: "14px",
                padding: 2,
                lineHeight: 1.5,
                backgroundColor: "grey.50",
                color: editedNotes ? "text.primary" : "text.secondary",
              }}
            >
              {editedNotes || "No notes yet. Click 'Add Notes' to get started."}
            </Typography>
          </Paper>
          <Button
            onClick={() => handleOpenToEdit()}
            variant="outlined"
            fullWidth
            sx={{ mt: 0 }}
          >
            {editedNotes ? "Edit Notes" : "Add Notes"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Notes;
