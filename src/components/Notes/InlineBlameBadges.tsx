import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from 'react';

type Badge = { key: string; name: string; at: string; left: number; top: number };

export default function InlineBlameBadges() {
    const [editor] = useLexicalComposerContext();
    const [badges, setBadges] = useState<Badge[]>([]);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        let mounted = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = editor;

        const build = () => {
            try {
                const entries: Badge[] = [];

                // Prefer runtime helper
                let meta: unknown = null;
                try {
                    if (e && typeof e.__getAttributionMeta === 'function') meta = e.__getAttributionMeta();
                    else if (e && e.__hydratedAttributions) meta = { attributions: e.__hydratedAttributions.attributions, lastEditedBy: e.__hydratedAttributions.defaultAttribution && e.__hydratedAttributions.defaultAttribution.lastEditedBy, lastEditedAt: e.__hydratedAttributions.defaultAttribution && e.__hydratedAttributions.defaultAttribution.lastEditedAt };
                } catch {
                    meta = null;
                }

                // If we have parsed children from serialized JSON, prefer that list
                const keys: string[] = [];
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const js: any = (editor.getEditorState && typeof editor.getEditorState === 'function') ? editor.getEditorState().toJSON() : null;
                    if (js && js.root && Array.isArray(js.root.children)) {
                        for (const c of js.root.children) {
                            const k = c && (c.key || c.id || c._key);
                            if (typeof k === 'string') keys.push(k);
                        }
                    }
                } catch {
                    // fallback to empty
                }

                const containerRect = document.body.getBoundingClientRect();

                for (const k of keys) {
                    try {
                        // get the DOM element for this node
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const el: any = editor.getElementByKey ? editor.getElementByKey(k) : null;
                        if (!el || !(el instanceof HTMLElement)) continue;
                        const r = el.getBoundingClientRect();
                        const left = r.right + 8 - containerRect.left;
                        const top = r.top - containerRect.top + window.scrollY;

                        // find attribution record
                        let rec: unknown = null;
                        if (meta) {
                            const metaTyped = meta as { attributions?: Record<string, { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string }>; lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string };
                            if (metaTyped.attributions && metaTyped.attributions[k]) rec = metaTyped.attributions[k];
                        }
                        else if (el && el.dataset && el.dataset.attribution) {
                            try { rec = JSON.parse(el.dataset.attribution); } catch { rec = null; }
                        }

                        let name = 'unknown';
                        let at = '';
                        if (rec) {
                            const recTyped = rec as { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string };
                            name = (recTyped.lastEditedBy && (recTyped.lastEditedBy.name || recTyped.lastEditedBy.id)) || name;
                            at = recTyped.lastEditedAt || at;
                        } else if (meta) {
                            const metaTyped = meta as { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string };
                            name = (metaTyped.lastEditedBy && (metaTyped.lastEditedBy.name || metaTyped.lastEditedBy.id)) || name;
                            at = metaTyped.lastEditedAt || at;
                        }

                        entries.push({ key: k, name, at, left, top });
                    } catch {
                        // ignore per-key failures
                    }
                }

                if (mounted) setBadges(entries);
            } catch {
                // ignore
            }
        };

        build();

        let unsub: (() => void) | null = null;
        try {
            if (e && typeof e.__subscribeAttribution === 'function') {
                unsub = e.__subscribeAttribution(() => {
                    if (rafRef.current) cancelAnimationFrame(rafRef.current);
                    rafRef.current = requestAnimationFrame(build);
                });
            }
        } catch {
            // ignore
        }

        const onResize = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(build); };
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onResize, true);

        return () => {
            mounted = false;
            if (unsub) unsub();
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onResize, true);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [editor]);

    if (!badges || badges.length === 0) return null;

    return (
        <div aria-hidden style={{ position: 'fixed', left: 0, top: 0, pointerEvents: 'none', zIndex: 70 }}>
            {badges.map((b) => (
                <div key={b.key} style={{ position: 'absolute', left: b.left, top: b.top, pointerEvents: 'auto' }}>
                    <div title={b.at ? `${b.name} — ${new Date(b.at).toLocaleString()}` : b.name} style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', borderRadius: 12, fontSize: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                        <strong style={{ fontWeight: 600 }}>{b.name}</strong>
                    </div>
                </div>
            ))}
        </div>
    );
}
