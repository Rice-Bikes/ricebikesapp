import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '../../../../hooks/useUserQuery';
import { $createUserParagraphNode } from './nodes/UserParagraphNode';

export default function AttributionPlugin(): null {
    const [editor] = useLexicalComposerContext();
    const currentUser = useCurrentUser();
    const dirtyRef = useRef<Set<string>>(new Set<string>());
    // Map of nodeKey -> { lastEditedBy, lastEditedAt }
    const attributionMapRef = useRef<Map<string, { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string }>>(new Map());
    const userRef = useRef<{ id?: string; name?: string } | null>(null);
    const subscribersRef = useRef<Set<() => void>>(new Set());

    useEffect(() => {
        try {
            console.log('[AttributionPlugin] useEffect mounted');
        } catch {
            // ignore
        }
        // TEMP VISUAL BADGE: show counts in editor UI for debugging
        let badgeEl: HTMLElement | null = null;
        try {
            const shell = document.querySelector('.editor-shell');
            if (shell) {
                badgeEl = document.createElement('div');
                badgeEl.className = 'attribution-debug-badge';
                badgeEl.style.position = 'fixed';
                badgeEl.style.left = '12px';
                badgeEl.style.bottom = '100px';
                badgeEl.style.zIndex = '99999';
                badgeEl.style.background = 'rgba(0,0,0,0.8)';
                badgeEl.style.color = 'white';
                badgeEl.style.padding = '6px 8px';
                badgeEl.style.borderRadius = '6px';
                badgeEl.style.fontSize = '12px';
                badgeEl.style.fontFamily = 'monospace';
                badgeEl.textContent = 'Attribution: initializing...';
                document.body.appendChild(badgeEl);
            }
        } catch {
            // ignore DOM injection failures
        }
        const notifySubscribers = () => {
            for (const cb of subscribersRef.current) {
                try {
                    cb();
                } catch (err) {
                    // swallow subscriber error
                    void err;
                }
            }
        };

        // initialize userRef from currentUser snapshot
        try {
            const user = currentUser;
            if (user && user.user_id) {
                userRef.current = { id: user.user_id, name: user.username || `${user.firstname || ''} ${user.lastname || ''}`.trim() };
            } else {
                userRef.current = null;
            }
        } catch {
            // ignore
        }

        const remove = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
            try {
                const collect = (iterable: Iterable<unknown> | null | undefined) => {
                    if (!iterable) return;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    for (const n of iterable as any) {
                        try {
                            if (!n) continue;
                            // If it's a string key, add it directly
                            if (typeof n === 'string') {
                                // Attempt to resolve the string key to a node so we can map
                                // leaf keys up to their top-level block ancestor. $getNodeByKey
                                // requires being called within a read context; the editor's
                                // update listener is already running in an update cycle, so
                                // it's safe to call $getNodeByKey here.
                                try {
                                    const resolved = $getNodeByKey(n as string);
                                    if (resolved && typeof resolved.getKey === 'function') {
                                        // Walk up to top-level ancestor whose parent is the root
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        let curr: any = resolved;
                                        while (
                                            curr &&
                                            typeof curr.getParent === 'function' &&
                                            curr.getParent() &&
                                            typeof curr.getParent().getType === 'function' &&
                                            curr.getParent().getType() !== 'root'
                                        ) {
                                            curr = curr.getParent();
                                        }
                                        const topKey = typeof curr.getKey === 'function' ? curr.getKey() : resolved.getKey();
                                        if (typeof topKey === 'string') {
                                            dirtyRef.current.add(topKey);
                                            // record per-key attribution (who marked it dirty and when)
                                            try {
                                                attributionMapRef.current.set(topKey, {
                                                    lastEditedBy: userRef.current || null,
                                                    lastEditedAt: new Date().toISOString(),
                                                });
                                            } catch {
                                                // ignore
                                            }
                                            continue;
                                        }
                                    }
                                } catch {
                                    // fallback to adding the raw key if resolution fails
                                    dirtyRef.current.add(n as string);
                                    continue;
                                }
                                // If resolution didn't produce a top-level key, fall through
                            }
                            // Node-like objects expose getKey(); map to top-level block key
                            // by walking up to a child of the root.
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const maybeNode: any = n;
                            if (typeof maybeNode.getKey === 'function') {
                                try {
                                    // Walk up to top-level ancestor whose parent is the root
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    let curr: any = maybeNode;
                                    // Some node implementations may not expose getParent/getType,
                                    // so guard defensively.
                                    while (
                                        curr &&
                                        typeof curr.getParent === 'function' &&
                                        curr.getParent() &&
                                        typeof curr.getParent().getType === 'function' &&
                                        curr.getParent().getType() !== 'root'
                                    ) {
                                        curr = curr.getParent();
                                    }
                                    const topKey = typeof curr.getKey === 'function' ? curr.getKey() : maybeNode.getKey();
                                    if (typeof topKey === 'string') {
                                        dirtyRef.current.add(topKey);
                                        try {
                                            attributionMapRef.current.set(topKey, {
                                                lastEditedBy: userRef.current || null,
                                                lastEditedAt: new Date().toISOString(),
                                            });
                                        } catch {
                                            // ignore
                                        }
                                    }
                                } catch {
                                    // fallback to node key
                                    try {
                                        const key = maybeNode.getKey();
                                        if (key) dirtyRef.current.add(key);
                                    } catch {
                                        // ignore
                                    }
                                }
                            }
                        } catch {
                            // ignore single-item failures
                        }
                    }
                };

                collect(dirtyElements);
                collect(dirtyLeaves);
                // Notify subscribers so debug UIs can update immediately
                notifySubscribers();

                // Update visual badge
                try {
                    if (badgeEl) {
                        const dirtyCount = dirtyRef.current.size;
                        const atCount = attributionMapRef.current.size;
                        badgeEl.textContent = `Attribution - dirty: ${dirtyCount}, at: ${atCount}`;
                    }
                } catch {
                    // ignore
                }

                // Attribution: convert plain paragraphs to UserParagraphNode and update lastModified
                if (dirtyRef.current.size > 0 && userRef.current) {
                    try {
                        editor.update(() => {
                            for (const key of Array.from(dirtyRef.current)) {
                                try {
                                    const node = $getNodeByKey(key);
                                    if (!node) continue;
                                    // If node is a ParagraphNode but not a UserParagraphNode, replace it
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    if ((node as any).getType && (node as any).getType() === 'paragraph' && !(node as any).getType || (node as any).getType && (node as any).getType() !== 'user-paragraph') {
                                        // best-effort check: if it's a ParagraphNode and not our UserParagraphNode
                                    }
                                    // More robust check using instance checks is not always reliable across bundles, so use duck-typing
                                    // If it's a user paragraph, it should have getAttribution method
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const maybeAny: any = node;
                                    if (maybeAny.getAttribution === undefined && maybeAny.getType && maybeAny.getType() === 'paragraph') {
                                        // create user paragraph and move children
                                        const userNode = $createUserParagraphNode();
                                        try {
                                            const children = maybeAny.getChildren();
                                            for (const c of children) userNode.append(c);
                                        } catch {
                                            // ignore
                                        }
                                        try {
                                            userNode.setAttribution({
                                                createdBy: userRef.current ? { userId: userRef.current.id, userName: userRef.current.name } : undefined,
                                                createdAt: new Date().toISOString(),
                                                lastModifiedBy: userRef.current ? { userId: userRef.current.id, userName: userRef.current.name } : undefined,
                                                lastModifiedAt: new Date().toISOString(),
                                                version: 1,
                                            });
                                        } catch {
                                            // ignore
                                        }
                                        try {
                                            maybeAny.replace(userNode);
                                        } catch {
                                            // ignore
                                        }
                                        continue;
                                    }

                                    // If it's already a user paragraph, call updateLastModified if available
                                    if (maybeAny.updateLastModified && typeof maybeAny.updateLastModified === 'function') {
                                        try {
                                            maybeAny.updateLastModified(userRef.current || null);
                                        } catch {
                                            // ignore
                                        }
                                    }
                                } catch {
                                    // ignore per-key failures
                                }
                            }
                        });
                    } catch {
                        // ignore
                    }
                }
            } catch {
                // swallow errors - don't let this plugin crash the editor
            }
        });

        try {
            // Attach helpers for external save code to use. We purposefully do
            // not parse or modify serialized editor output here; this merely
            // exposes attribution metadata collected at runtime.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = editor as any;
            Object.defineProperty(e, '__getAttributionMeta', {
                configurable: true,
                enumerable: false,
                value: () => ({
                    dirtyKeys: Array.from(dirtyRef.current),
                    // expose a shallow copy of per-key attributions
                    attributions: Object.fromEntries(Array.from(attributionMapRef.current.entries())),
                    lastEditedAt: new Date().toISOString(),
                    lastEditedBy: userRef.current,
                }),
            });

            Object.defineProperty(e, '__setAttributionUser', {
                configurable: true,
                enumerable: false,
                value: (user: { id?: string; name?: string } | null) => {
                    userRef.current = user;
                    notifySubscribers();
                },
            });

            Object.defineProperty(e, '__markAttributionDirty', {
                configurable: true,
                enumerable: false,
                value: (keys: string | string[]) => {
                    if (!keys) return;
                    const arr = Array.isArray(keys) ? keys : [keys];
                    for (const k of arr) {
                        try {
                            if (typeof k === 'string' && k.length > 0) {
                                dirtyRef.current.add(k);
                                try {
                                    attributionMapRef.current.set(k, {
                                        lastEditedBy: userRef.current || null,
                                        lastEditedAt: new Date().toISOString(),
                                    });
                                } catch {
                                    // ignore
                                }
                            }
                        } catch {
                            // ignore malformed keys
                        }
                    }
                    notifySubscribers();
                },
            });

            Object.defineProperty(e, '__clearAttribution', {
                configurable: true,
                enumerable: false,
                value: () => {
                    dirtyRef.current.clear();
                    attributionMapRef.current.clear();
                    notifySubscribers();
                },
            });

            Object.defineProperty(e, '__subscribeAttribution', {
                configurable: true,
                enumerable: false,
                value: (cb: () => void) => {
                    subscribersRef.current.add(cb);
                    return () => subscribersRef.current.delete(cb);
                },
            });
            try { console.log('[AttributionPlugin] helpers attached on editor'); } catch { }
        } catch {
            // ignore defineProperty failures in odd runtimes
        }

        return () => {
            remove();
            try {
                // cleanup attached helpers
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const e = editor as any;
                if (e.__getAttributionMeta) delete e.__getAttributionMeta;
                if (e.__setAttributionUser) delete e.__setAttributionUser;
                if (e.__clearAttribution) delete e.__clearAttribution;
                if (e.__subscribeAttribution) delete e.__subscribeAttribution;
            } catch {
                // ignore
            }
            try {
                if (badgeEl && badgeEl.parentElement) badgeEl.parentElement.removeChild(badgeEl);
            } catch {
                // ignore
            }
        };
    }, [editor, currentUser]);

    return null;
}
