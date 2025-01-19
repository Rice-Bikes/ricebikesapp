import { useState } from "react";
import { User } from "../../model";

interface NotesProps {
  notes: string;
  onSave: (newNotes: string) => void;
  user: User;
}

const Notes: React.FC<NotesProps> = ({ notes, onSave, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);

  const handleSave = () => {
    onSave(editedNotes);
    setEditedNotes(
      editedNotes + "-" + user.firstname + " " + user.lastname + "\n"
    );
    setIsEditing(false);
  };

  return (
    <div style={{ width: "100%", textAlign: "center", margin: "0 auto" }}>
      <h3>Notes</h3>
      {isEditing ? (
        <div>
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            style={{ width: "100%", height: "100px", textAlign: "left" }}
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
        <div>
          <pre
            style={{
              textAlign: "left",
              border: "1px solid black",
              padding: "10px",
            }}
          >
            {notes || "No notes yet."}
          </pre>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              marginTop: "10px",
              padding: "5px 10px",
              cursor: "pointer",
              border: "1px solid black",
              borderRadius: "5px",
            }}
          >
            Edit Notes
          </button>
        </div>
      )}
    </div>
  );
};

export default Notes;
