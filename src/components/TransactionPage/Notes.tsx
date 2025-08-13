import { useEffect, useState } from "react";
import DBModel, { User } from "../../model";
import { TextField, Button } from "@mui/material";
import { queryClient } from "../../app/queryClient";

interface NotesProps {
  notes: string;
  onSave: (newNotes: string) => void;
  user: User;
  transaction_num: number;
  // checkUser: () => void;
}

const Notes: React.FC<NotesProps> = ({ notes, onSave, user, transaction_num }) => {
  // console.log("initial data passed to Notes", notes);
  const [currentUser, setCurrentUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const [prevLengthOfNotes, setPrevLengthOfNotes] = useState(0);
  useEffect(() => {
    if (currentUser !== user && isWaitingForUser) {
      console.log("setting new user in Notes component", user);
      setCurrentUser(user);
      setIsWaitingForUser(false);
    }
  }, [user, isWaitingForUser]);

  const handleSubmit = () => {
    setIsWaitingForUser(true);
    console.log("invalidated user query", user, isWaitingForUser);
    handleSave();
  }

  const handleSave = () => {
    const currentLengthOfNotes = editedNotes.length;
    setEditedNotes(editedNotes + " - " + user.firstname + " " + user.lastname);
    // console.log("edited notes in Notes component", editedNotes);
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
    <div style={{ width: "100%", textAlign: "center", margin: "0 auto" }}>
      <h3>Notes</h3>
      {isEditing ? (
        <div>
          <TextField
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            style={{ width: "100%", textAlign: "left" }}
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
            autoFocus
          />
          <Button
            onClick={handleSave}
            style={{
              marginTop: "10px",
              padding: "5px 10px",
              cursor: "pointer",
              border: "1px solid black",
              borderRadius: "5px",
            }}
          >
            Save
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <pre
            style={{
              textAlign: "left",
              border: "1px solid black",
              padding: "20px",
              textWrap: "wrap",
              height: "fit-content",
              fontSize: "16px"
            }}
          >
            {editedNotes || "No notes yet."}
          </pre>
          <Button
            onClick={() => handleOpenToEdit()}
            style={{
              marginTop: "10px",
              padding: "5px 10px",
              cursor: "pointer",
              border: "1px solid black",
              borderRadius: "5px",
            }}
          >
            Edit Notes
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notes;
