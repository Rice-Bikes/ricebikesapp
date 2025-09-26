
import { useEffect, useState } from "react";
import DBModel, { User } from "../../model";
import { Button, Box, Typography, Paper } from "@mui/material";
import { EditorApp } from "./EditorContainer";
import LexicalStaticRenderer from "./LexicalStaticRenderer";
import { toast } from "react-toastify";


interface NotesProps {
  notes: string;
  onSave: (newNotes: string) => void;
  user: User;
  transaction_num: number;
}




const Notes: React.FC<NotesProps> = ({ notes, onSave, user, transaction_num }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editorState, setEditorState] = useState<string>(notes || '');

  // When notes prop changes (e.g. after save), update editorState
  useEffect(() => {
    setEditorState(notes || '');
  }, [notes]);

  // Save handler: called by Save Notes button
  const handleSave = () => {
    // Save current editor content
    toast.success("Notes saved." + (editorState));
    onSave((editorState));
    DBModel.postTransactionLog(
      transaction_num,
      user.user_id,
      `"${editorState.trim()}"`,
      "updated"
    );
    setIsEditing(false);
  };

  // Called by editor when content changes
  const handleEditorChange = (html: string) => {
    setEditorState(html);
  };


  return (
    <Box sx={{ width: '100%' }}>
      {isEditing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <EditorApp initialValue={editorState} onSave={handleEditorChange}
          />
          <Button
            onClick={handleSave}
            variant="contained"
          >
            Save Notes
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              minHeight: 120,
              backgroundColor: 'grey.50',
              borderRadius: 1
            }}
          >
            {editorState ? (
              <Box sx={{ minHeight: 120 }}>
                <LexicalStaticRenderer initialValue={editorState} />
              </Box>
            ) : (
              <Typography
                variant="body2"
                component="div"
                sx={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: 1.5
                }}
              >
                No notes yet. Click 'Add Notes' to get started.
              </Typography>
            )}
          </Paper>
          <Button
            onClick={() => setIsEditing(true)}
            variant="outlined"
            fullWidth
            sx={{ mt: 0 }}
          >
            {editorState ? 'Edit Notes' : 'Add Notes'}
          </Button>
        </Box>
      )}
    </Box>
  );
};


export default Notes;
