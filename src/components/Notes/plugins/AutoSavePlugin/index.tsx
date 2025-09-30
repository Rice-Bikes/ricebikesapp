import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getRoot } from 'lexical';

// AutoSavePlugin: debounced auto-save that emits serialized Lexical JSON only
// when it changes. This reduces races where other components emit HTML or
// partial states and overwrite the canonical JSON.
export default function AutoSavePlugin({
    onSave,
}: {
    onSave?: (json: string) => void;
}) {
    const [editor] = useLexicalComposerContext();
    const timerRef = useRef<number | null>(null);
    const lastSentRef = useRef<string | null>(null);

    useEffect(() => {
        if (!onSave) return;

        const remove = editor.registerUpdateListener(() => {
            try {
                // Before serializing, if AttributionPlugin exposed runtime meta,
                // write per-top-level node attributions into nodes that support
                // setAttribution. This embeds attribution in node JSON so it
                // persists with the editorState.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jsonAny: any = $getRoot().exportJSON();

                const serialized = JSON.stringify(jsonAny);
                // debounce: wait 800ms of inactivity
                if (timerRef.current) {
                    window.clearTimeout(timerRef.current);
                }
                timerRef.current = window.setTimeout(() => {
                    // only send if changed
                    if (lastSentRef.current !== serialized) {
                        lastSentRef.current = serialized;
                        onSave(serialized);
                    }
                }, 800);
            } catch (err) {
                // If serialization fails, don't crash the editor; just skip
                console.warn('AutoSavePlugin: failed to serialize state', err);
            }
        });

        return () => {
            remove();
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [editor, onSave]);

    return null;
}