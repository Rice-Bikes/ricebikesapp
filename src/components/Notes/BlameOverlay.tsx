import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, LexicalNode } from 'lexical';
import { useEffect, useState } from 'react';

function formatName(rec: { lastEditedBy?: { id?: string; name?: string } | null } | null | undefined) {
    if (!rec) return 'unknown';
    const by = rec.lastEditedBy;
    if (!by) return 'unknown';
    return by.name || by.id || 'unknown';
}

export default function BlameOverlay() {
    const [editor] = useLexicalComposerContext();
    const [summary, setSummary] = useState<Array<{ key: string; name: string; at: string }>>([]);

    useEffect(() => {
        let mounted = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = editor as unknown as { [k: string]: any };

        const buildSummary = () => {
            try {
                // prefer plugin helper
                if (e && typeof e.__getAttributionMeta === 'function') {
                    try {
                        const meta = e.__getAttributionMeta();
                        if (meta && meta.attributions) {
                            const s = Object.keys(meta.attributions).map((k) => {
                                const rec = meta.attributions[k] || null;
                                return ({ key: k, name: formatName(rec), at: (rec && rec.lastEditedAt) || meta.lastEditedAt || '' });
                            });
                            if (mounted) setSummary(s);
                            return;
                        }
                    } catch {
                        // ignore
                    }
                }

                // fallback to hydrated shim attached by AttributionLoader
                if (e && e.__hydratedAttributions) {
                    try {
                        const at = e.__hydratedAttributions.attributions || {};
                        const defaultAt = e.__hydratedAttributions.defaultAttribution || { lastEditedBy: null, lastEditedAt: '' };
                        const s = Object.keys(at).map((k) => {
                            const rec = at[k] || null;
                            const name = (rec && rec.lastEditedBy && (rec.lastEditedBy.name || rec.lastEditedBy.id)) || (defaultAt.lastEditedBy && (defaultAt.lastEditedBy.name || defaultAt.lastEditedBy.id)) || 'unknown';
                            const atTime = (rec && rec.lastEditedAt) || defaultAt.lastEditedAt || '';
                            return ({ key: k, name, at: atTime });
                        });
                        if (mounted) setSummary(s);
                        return;
                    } catch {
                        // ignore
                    }
                }

                // If nobody provided attribution we can attempt to scan the editor
                // children and show unknowns.
                try {
                    editor.update(() => {
                        const root = $getRoot();
                        const children = root.getChildren();
                        const s = (children as LexicalNode[]).map((c) => ({ key: typeof c.getKey === 'function' ? (c.getKey() as string) : String(Math.random()), name: 'unknown', at: '' }));
                        if (mounted) setSummary(s);
                    });
                } catch {
                    // ignore
                }
            } catch {
                // ignore overall
            }
        };

        buildSummary();

        // subscribe to plugin updates if available
        let unsub: (() => void) | null = null;
        try {
            if (e && typeof e.__subscribeAttribution === 'function') {
                unsub = e.__subscribeAttribution(() => buildSummary());
            }
        } catch {
            // ignore
        }

        return () => {
            mounted = false;
            if (unsub) unsub();
        };
    }, [editor]);

    if (!summary || summary.length === 0) return null;

    // Render a compact list of attributions above the editor. In a full UX
    // we'd position badges per-block; keep this simple and reliable.
    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', right: 8, top: 8, zIndex: 60, background: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.12)', fontSize: 12 }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>Blame</strong>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {summary.map((s) => (
                        <div key={s.key} title={`${s.name} ${s.at ? `— ${new Date(s.at).toLocaleString()}` : ''}`} style={{ marginBottom: 4 }}>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                            <span style={{ color: '#666', marginLeft: 6, fontSize: 11 }}>{s.at ? new Date(s.at).toLocaleString() : 'unknown'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
