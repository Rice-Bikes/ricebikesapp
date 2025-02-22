import { useState } from "react";
import { User } from "../../model";
import { TextField, Button } from "@mui/material";

interface NotesProps {
  notes: string;
  onSave: (newNotes: string) => void;
  user: User;
}

const Notes: React.FC<NotesProps> = ({ notes, onSave, user }) => {
  // console.log("initial data passed to Notes", notes);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);

  const handleSave = () => {
    setEditedNotes(editedNotes + " - " + user.firstname + " " + user.lastname);
    // console.log("edited notes in Notes component", editedNotes);
    onSave(editedNotes + " - " + user.firstname + " " + user.lastname);
    setIsEditing(false);
  };

  const handleOpenToEdit = () => {
    setEditedNotes(editedNotes === "" ? "" : editedNotes + "\n");
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
              if (e.key === "Enter" && !e.shiftKey) handleSave();
            }}
            multiline
            autoFocus
          />
          <button
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
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <pre
            style={{
              textAlign: "left",
              border: "1px solid black",
              padding: "10px",
              textWrap: "wrap",
              height: "fit-content",
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
