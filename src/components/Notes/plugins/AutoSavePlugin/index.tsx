import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

// AutoSavePlugin: calls onSave with the stringified Lexical JSON state whenever the editor updates
export default function AutoSavePlugin({
    onSave,
}: {
    onSave?: (json: string) => void;
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!onSave) return;

        return editor.registerUpdateListener(({ editorState }) => {
            // Get the Lexical JSON state and call onSave with it as a string
            const json = editorState.toJSON();
            onSave(JSON.stringify(json)); // Stringify the JSON object
        });
    }, [editor, onSave]);

    return null;
}