import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

export default function AttributionLoader(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = editor;

        try {
            // If initial state has __meta, try to hydrate the AttributionPlugin's
            // runtime map so editors have per-node attributions on load.
            const editorStateJson = (() => {
                try {
                    // Prefer getting the serialized state from editor's current state
                    // so we avoid depending on outer props.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const st = (editor.getEditorState && typeof editor.getEditorState === 'function') ? editor.getEditorState().toJSON() : null;
                    return st;
                } catch {
                    return null;
                }
            })();

            if (editorStateJson && typeof editorStateJson === 'object') {
                const meta = editorStateJson.__meta || {};
                const at = meta.attributions || {};
                const defaultAt = meta.defaultAttribution || null;

                // If AttributionPlugin attached helpers, use them to populate the
                // runtime map. Otherwise attempt to attach a tiny shim that other
                // components can read until the plugin mounts.
                if (e && typeof e.__markAttributionDirty === 'function' && typeof e.__setAttributionUser === 'function') {
                    // iterate keys and call mark dirty and set attribution as recorded
                    try {
                        for (const k of Object.keys(at)) {
                            try {
                                // mark dirty so debug UI highlights it
                                e.__markAttributionDirty(k);
                                // set the recorded per-key attribution by calling plugin helper
                                // if plugin exposed a way to set the raw attribution map we would
                                // use that; fall back to setting current user briefly then
                                // calling mark so the plugin records lastEditedBy/At.
                                const rec = at[k];
                                if (rec && rec.lastEditedBy) {
                                    e.__setAttributionUser(rec.lastEditedBy);
                                    // re-mark so the plugin captures this user/time
                                    e.__markAttributionDirty(k);
                                }
                            } catch {
                                // ignore per-key failures
                            }
                        }
                        // restore default user
                        if (defaultAt && defaultAt.lastEditedBy) {
                            e.__setAttributionUser(defaultAt.lastEditedBy);
                        }
                    } catch {
                        // ignore whole-meta failures
                    }
                } else {
                    // Attach a permissive shim so other components can query initial
                    // attribution info until AttributionPlugin mounts and replaces it.
                    try {
                        Object.defineProperty(e, '__hydratedAttributions', {
                            configurable: true,
                            enumerable: false,
                            value: {
                                attributions: at,
                                defaultAttribution: defaultAt,
                            },
                        });
                    } catch {
                        // ignore define failure
                    }
                }
            }
        } catch {
            // swallow loader errors
        }
    }, [editor]);

    return null;
}
