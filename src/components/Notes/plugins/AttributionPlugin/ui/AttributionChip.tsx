import * as React from 'react';
import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';

type Attr = {
    createdBy?: { userId?: string; userName?: string };
    createdAt?: string;
    lastModifiedBy?: { userId?: string; userName?: string };
    lastModifiedAt?: string;
};

export default function AttributionChip({ nodeKey }: { nodeKey: string }) {
    const [editor] = useLexicalComposerContext();
    const [attr, setAttr] = useState<Attr | null>(null);

    useEffect(() => {
        let mounted = true;

        const readAttr = () => {
            try {
                editor.getEditorState().read(() => {
                    const node = $getNodeByKey(nodeKey);
                    if (!node) {
                        if (mounted) setAttr(null);
                        return;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const a = (node as any).getAttribution ? (node as any).getAttribution() : undefined;
                    if (mounted) setAttr(a || null);
                });
            } catch {
                // ignore read errors
            }
        };

        const remove = editor.registerUpdateListener(() => {
            readAttr();
        });

        // Debug: log mount and nodeKey for runtime tracing
        try {
            console.log('[AttributionChip] mounted for nodeKey', nodeKey);
        } catch {
            /* ignore */
        }

        // initial read
        readAttr();

        return () => {
            mounted = false;
            try {
                remove();
            } catch (e) {
                /* ignore */
            }
            try { console.log('[AttributionChip] unmounted for nodeKey', nodeKey); } catch { /* ignore */ }
        };
    }, [editor, nodeKey]);

    if (!attr) return null;

    const name = attr.lastModifiedBy?.userName || attr.createdBy?.userName || '';
    const time = attr.lastModifiedAt || attr.createdAt || '';

    const style: React.CSSProperties = {
        display: 'inline-block',
        marginLeft: 8,
        padding: '2px 6px',
        fontSize: 12,
        color: '#fff',
        background: '#666',
        borderRadius: 12,
        verticalAlign: 'middle',
        cursor: 'default',
    };

    return (
        <span
            className="attribution-chip"
            title={`By ${name}${time ? ' • ' + time : ''}`}
            style={style}
            role="note"
            tabIndex={0}
            aria-label={`Last modified by ${name}${time ? ' at ' + time : ''}`}
            data-node-key={nodeKey}
        >
            {name}
        </span>
    );
}
