import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getNodeByKey, $isParagraphNode, $addUpdateTag, $createTextNode, $createParagraphNode } from 'lexical';

// Custom tag to mark updates made by attribution application so we can
// ignore them when collecting dirty keys.
const ATTRIBUTION_UPDATE_TAG = 'rb-attribution-update';

export default function AttributionPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // In-memory set of dirty keys recorded across updates.
        const dirtyKeys = new Set<string>();
        // No AttributionNode, dedupe, or snapshot logic at all.
        // last editor info captured by plugin (set by external callers or tests)
        let lastEditedBy: string | null = null;
        let lastEditedAt: string | null = null;

        // Expose helper for external callers to read attribution meta
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (editor as any).__getAttributionMeta = () => ({
            dirtyKeys: Array.from(dirtyKeys),
            lastEditedBy,
            lastEditedAt,
        });

        // Expose helper to apply attribution lines into paragraph nodes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (editor as any).__applyAttributionLines = (name: string): Promise<void> => {
            lastEditedBy = name || null;
            lastEditedAt = new Date().toISOString();
            return new Promise((resolve) => {
                editor.update(() => {
                    $addUpdateTag(ATTRIBUTION_UPDATE_TAG);
                    const now = new Date().toISOString();
                    for (const key of Array.from(dirtyKeys)) {
                        const node = $getNodeByKey(key as string);
                        if (node && $isParagraphNode(node)) {
                            try {
                                // Only append attribution if the paragraph is not empty
                                const textContent = node.getTextContent().trim();
                                if (textContent.length === 0) continue;
                                const dateObj = new Date(now);
                                const dateParts = dateObj.toString().split(' ');
                                const datePart = dateParts.slice(0, 4).join(' ');
                                const timePart = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                                const attributionLine = ` -- ${name || "unknown"} at ${datePart} ${timePart}`;
                                node.append($createTextNode(attributionLine));
                                const parent = node.getParent();
                                if(parent && parent !== null){
                                       parent.append($createParagraphNode())
                                    }
                            } catch {
                                // ignore individual failures
                            }
                        }
                    }
                    dirtyKeys.clear();
                }, { tag: ATTRIBUTION_UPDATE_TAG });
                resolve();
            });
        };

        // Register listener to capture dirty paragraph node keys (no AttributionNode logic)
        const remove = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
            try {
                if (tags && tags.has && tags.has(ATTRIBUTION_UPDATE_TAG)) return;

                if (dirtyElements) {
                    for (const n of dirtyElements) {
                        let candidate: unknown, isDirty = true;
                        if (Array.isArray(n) && n.length === 2) {
                            candidate = n[0];
                            isDirty = Boolean(n[1]);
                        } else {
                            candidate = n;
                            isDirty = true;
                        }
                        if (!isDirty) continue;
                        let key: string | null = null;
                        if (typeof candidate === 'string') {
                            key = candidate;
                        } else if (candidate && typeof (candidate as { getKey?: unknown }).getKey === 'function') {
                            key = (candidate as { getKey: () => string }).getKey();
                        } else if (candidate && typeof (candidate as { key?: unknown }).key === 'string') {
                            key = (candidate as { key: string }).key;
                        }
                        if (key) {
                            try {
                                const node = $getNodeByKey(key as string);
                                if (node && $isParagraphNode(node)) {
                                    dirtyKeys.add(key);
                                }
                            } catch {
                                dirtyKeys.add(key);
                            }
                        }
                    }
                }
                if (dirtyLeaves) {
                    for (const n of dirtyLeaves) {
                        let candidate: unknown, isDirty = true;
                        if (Array.isArray(n) && n.length === 2) {
                            candidate = n[0];
                            isDirty = Boolean(n[1]);
                        } else {
                            candidate = n;
                            isDirty = true;
                        }
                        if (!isDirty) continue;
                        let key: string | null = null;
                        if (typeof candidate === 'string') {
                            key = candidate;
                        } else if (candidate && typeof (candidate as { getKey?: unknown }).getKey === 'function') {
                            key = (candidate as { getKey: () => string }).getKey();
                        } else if (candidate && typeof (candidate as { key?: unknown }).key === 'string') {
                            key = (candidate as { key: string }).key;
                        }
                        if (key) {
                            try {
                                const node = $getNodeByKey(key as string);
                                if (node && $isParagraphNode(node)) {
                                    dirtyKeys.add(key);
                                }
                            } catch {
                                dirtyKeys.add(key);
                            }
                        }
                    }
                }
            } catch {
                // swallow listener errors
            }
        });

        // No initial snapshot population needed for append mode.

        return () => {
            remove();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (editor as any).__getAttributionMeta;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (editor as any).__applyAttributionLines;
        };
    }, [editor]);

    return null;
}
