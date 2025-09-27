import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect, useState } from 'react';

export default function AttributionDebug(): JSX.Element {
    const [editor] = useLexicalComposerContext();
    const [visible, setVisible] = useState<boolean>(false);
    const [items, setItems] = useState<Array<{ key: string; snippet: string; dirty: boolean }>>([]);
    const [meta, setMeta] = useState<{ dirtyKeys: string[]; lastEditedAt: string; lastEditedBy?: { id?: string; name?: string } } | null>(null);

    useEffect(() => {
        let mounted = true;

        const update = () => {
            try {
                // Read runtime editor state (not parsing saved JSON)
                editor.getEditorState().read(() => {
                    const root = $getRoot();
                    const children = root.getChildren();
                    const localItems: Array<{ key: string; snippet: string; dirty: boolean }> = children.map((node) => {
                        // node.getTextContent is commonly available on block nodes
                        let text = '';
                        try {
                            // dynamic node typing: nodes have different runtime shapes. Use a runtime
                            // check and a narrow cast for the dynamic call.
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            if (typeof (node as any).getTextContent === 'function') {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                text = (node as any).getTextContent();
                            } else {
                                // fallback to toString
                                text = String(node);
                            }
                        } catch {
                            text = '';
                        }
                        const key = node.getKey();
                        return { key, snippet: (text || '').slice(0, 200).replace(/\s+/g, ' ').trim(), dirty: false };
                    });

                    // Try to gather attribution metadata from editor helper exposed by AttributionPlugin
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const helper = (editor as any).__getAttributionMeta ? (editor as any).__getAttributionMeta() : null;
                    if (mounted) {
                        setMeta(helper);
                        if (helper && Array.isArray(helper.dirtyKeys)) {
                            const dirtySet = new Set(helper.dirtyKeys);
                            for (const it of localItems) {
                                it.dirty = dirtySet.has(it.key);
                            }
                        }
                        setItems(localItems);
                    }
                });
            } catch {
                // ignore
            }
        };


        update();
        const remove = editor.registerUpdateListener(() => {
            update();
        });

        // Prefer subscribing to the AttributionPlugin if available so the debug
        // panel updates instantly when __setAttributionUser or __markAttributionDirty
        // is called. Fallback to relying on editor.registerUpdateListener above.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsubscribeSub: (() => void) | null = null;
        try {
            const e = editor as unknown as { __subscribeAttribution?: (cb: () => void) => () => void } | null;
            if (visible && e && typeof e.__subscribeAttribution === 'function') {
                unsubscribeSub = e.__subscribeAttribution(() => {
                    try {
                        update();
                    } catch {
                        // ignore
                    }
                });
            }
        } catch {
            // ignore subscription errors
        }

        return () => {
            mounted = false;
            remove();
            if (unsubscribeSub) {
                try {
                    unsubscribeSub();
                } catch {
                    // ignore
                }
            }
        };
    }, [editor, visible]);

    return (
        <div>
            <button
                title="Toggle attribution debug"
                onClick={() => setVisible((v) => !v)}
                style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, padding: '6px 8px', borderRadius: 6 }}>
                {visible ? 'Hide Attribution Debug' : 'Show Attribution Debug'}
            </button>
            {visible && (
                <div style={{ position: 'fixed', right: 12, bottom: 56, zIndex: 9999, width: 420, maxHeight: '50vh', overflow: 'auto', background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Attribution Debug</div>
                    <div style={{ fontSize: 12, color: '#444', marginBottom: 8 }}>
                        Last editor:&nbsp;
                        {meta && meta.lastEditedBy ? `${meta.lastEditedBy.name || meta.lastEditedBy.id} @ ${new Date(meta.lastEditedAt).toLocaleString()}` : 'none'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Top-level nodes (key → snippet) — "Dirty" indicates recently edited nodes</div>
                    <div>
                        {items.map((it) => (
                            <div key={it.key} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: it.dirty ? 'orange' : 'transparent', border: it.dirty ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent' }} />
                                <div style={{ flex: '0 0 140px', fontSize: 11, color: '#222', wordBreak: 'break-all' }}>{it.key}</div>
                                <div style={{ flex: 1, fontSize: 13, color: '#111' }}>{it.snippet || '—'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
