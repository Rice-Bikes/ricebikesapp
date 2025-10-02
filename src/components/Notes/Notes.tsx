import { useEffect, useState } from "react";
import { User } from "../../model";
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

const Notes: React.FC<NotesProps> = ({
  notes,
  onSave,
  user,
  transaction_num,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editorState, setEditorState] = useState<string>(notes || "");

  // When notes prop changes (e.g. after save), update editorState
  useEffect(() => {
    setEditorState(notes || "");
  }, [notes]);

  // Save handler: called by Save Notes button
  const handleSave = async () => {
    // Prefer to capture a fresh serialized editor state from the
    // mounted editor (if available) so we include attribution meta
    // even if AutoSavePlugin's debounce hasn't fired yet. Fall back
    // to the last onSave-provided editorState.
    let payload = editorState;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e: any = (window as any).__currentLexicalEditor;
      if (e && typeof e.getEditorState === "function") {
        try {
          // If the AttributionPlugin exposed a helper, apply attribution lines
          // into edited paragraph nodes before serializing so the saved JSON
          // contains the inline "Last edited by: NAME" lines.
          try {
            if (typeof e.__applyAttributionLines === "function") {
              // await to ensure the inline lines are applied before serialization
              await e.__applyAttributionLines(
                user.firstname + " " + user.lastname || "",
              );
            }
          } catch {
            // ignore attribution apply failures
          }
          const jsonObj = e.getEditorState().toJSON();
          // Attach attribution meta if helper available
          try {
            if (typeof e.__getAttributionMeta === "function") {
              const meta = e.__getAttributionMeta();
              jsonObj.__meta = jsonObj.__meta || { attributions: {} };
              const now = new Date().toISOString();
              if (meta && Array.isArray(meta.dirtyKeys)) {
                for (const k of meta.dirtyKeys) {
                  try {
                    jsonObj.__meta.attributions[k] = {
                      lastEditedBy: meta.lastEditedBy || null,
                      lastEditedAt: now,
                    };
                  } catch {
                    // ignore per-key failures
                  }
                }
              }
              if (meta && meta.lastEditedBy) {
                jsonObj.lastEditedBy = meta.lastEditedBy;
                jsonObj.lastEditedAt = meta.lastEditedAt || now;
              }
            }
          } catch {
            // ignore attribution helper failures
          }
          payload = JSON.stringify(jsonObj);
        } catch {
          // if serialization fails, fallback to editorState
        }
      }
    } catch {
      // ignore global editor lookup failures
    }

    toast.success("Notes saved.");
    onSave(payload);
    setIsEditing(false);
  };

  // Called by editor when content changes
  const handleEditorChange = (html: string) => {
    setEditorState(html);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {isEditing ? (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <EditorApp
            user={user}
            initialValue={editorState}
            onSave={handleEditorChange}
            transaction_num={transaction_num}
          />
          <Button onClick={handleSave} variant="contained">
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
              backgroundColor: "grey.50",
              borderRadius: 1,
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
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: 1.5,
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
            {editorState ? "Edit Notes" : "Add Notes"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Notes;
