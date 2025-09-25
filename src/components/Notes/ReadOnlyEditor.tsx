import { EditorApp } from "./EditorContainer";
import { Box } from "@mui/material";

interface ReadOnlyEditorProps {
  initialValue: string;
}

export default function ReadOnlyEditor({ initialValue }: ReadOnlyEditorProps) {
  // Render the Lexical editor in read-only mode
  return (
    <Box sx={{ pointerEvents: "none", opacity: 0.8 }}>
      <EditorApp initialValue={initialValue} onSave={() => {}} />
    </Box>
  );
}