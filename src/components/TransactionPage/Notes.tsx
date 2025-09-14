import { useEffect, useState } from "react";
import DBModel, { User } from "../../model";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { queryClient } from "../../app/queryClient";

interface NotesProps {
  notes: string;
  onSave: (newNotes: string) => void;
  user: User;
  transaction_num: number;
  // checkUser: () => void;
}

const Notes: React.FC<NotesProps> = ({ notes, onSave, user, transaction_num }) => {
  // // console.log("initial data passed to Notes", notes);
  const [currentUser, setCurrentUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const [prevLengthOfNotes, setPrevLengthOfNotes] = useState(0);
  useEffect(() => {
    if (currentUser !== user && isWaitingForUser) {
      // console.log("setting new user in Notes component", user);
      setCurrentUser(user);
      setIsWaitingForUser(false);
    }
  }, [user, isWaitingForUser, currentUser]);

  const handleSubmit = () => {
    setIsWaitingForUser(true);
    // console.log("invalidated user query", user, isWaitingForUser);
    handleSave();
  }

  const handleSave = () => {
    const currentLengthOfNotes = editedNotes.length;
    setEditedNotes(editedNotes + " - " + user.firstname + " " + user.lastname);
    // // console.log("edited notes in Notes component", editedNotes);
    onSave(editedNotes + " - " + user.firstname + " " + user.lastname);
    DBModel.postTransactionLog(
      transaction_num,
      user.user_id,
      `"${editedNotes.slice(prevLengthOfNotes, currentLengthOfNotes).trim()}"`,
      "updated"
    )
    setIsEditing(false);
  };

  const handleOpenToEdit = () => {
    setEditedNotes(editedNotes === "" ? "" : editedNotes + "\n");
    queryClient.resetQueries({
      queryKey: ["user"],
    });
    setPrevLengthOfNotes(editedNotes.length);
    setIsEditing(true);
  };


  return (
    <Box sx={{ width: "100%" }}>
      {isEditing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            onFocus={(e) =>
              (e.target as HTMLTextAreaElement).setSelectionRange(
                (e.target as HTMLTextAreaElement).value.length,
                (e.target as HTMLTextAreaElement).value.length
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
              fontSize: '14px',
              lineHeight: 1.5,
              '& .MuiInputBase-root': {
                height: '400px',
                alignItems: 'flex-start',
                padding: '12px'
              },
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflow: 'auto !important'
              }
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
              p: 3,
              minHeight: 120,
              backgroundColor: 'grey.50',
              borderRadius: 1
            }}
          >
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                fontSize: '14px',
                lineHeight: 1.5
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
            {editedNotes ? 'Edit Notes' : 'Add Notes'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Notes;
