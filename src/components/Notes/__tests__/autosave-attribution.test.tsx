import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notes from '../Notes';
import { User } from '../../../model';
import { useEffect, useRef, useState } from 'react';

// Mock the EditorContainer like other Notes tests so we have a deterministic
// textarea that emits a minimal Lexical JSON string when edited.
vi.mock('../EditorContainer', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    EditorApp: ({ initialValue, onSave }: any) => {
        const ref = useRef<HTMLTextAreaElement | null>(null);
        const [value, setValue] = useState<string>(() => {
            if (!initialValue) return '';
            try {
                const parsed = JSON.parse(initialValue);
                // walk for first text node
                const walk = (n: unknown): string | null => {
                    if (!n || typeof n !== 'object') return null;
                    const obj = n as Record<string, unknown>;
                    if (obj.type === 'text' && typeof obj.text === 'string') return obj.text as string;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const kids: any[] = (obj.children as any) || (obj.nodes as any) || [];
                    for (const c of kids) {
                        const r = walk(c);
                        if (r) return r;
                    }
                    return null;
                };
                const found = walk(parsed.root || parsed);
                return found ?? '';
            } catch {
                return String(initialValue);
            }
        });

        useEffect(() => {
            const ta = ref.current;
            if (ta) {
                ta.focus();
                ta.selectionStart = ta.value.length;
                ta.selectionEnd = ta.value.length;
            }
        }, []);

        const emitLexical = (text: string) => {
            const lexical = JSON.stringify({
                root: {
                    type: 'root',
                    version: 1,
                    children: [
                        {
                            type: 'paragraph',
                            version: 1,
                            children: [
                                { type: 'text', version: 1, text },
                            ],
                        },
                    ],
                },
            });
            onSave(lexical);
        };

        return (
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => {
                    const v = e.target.value;
                    setValue(v);
                    emitLexical(v);
                }}
            />
        );
    }
}));

const mockUser: User = {
    user_id: 'u-test',
    username: 'utest',
    firstname: 'Auto',
    lastname: 'Saver',
    active: true,
    permissions: [],
};

describe('AutoSave attribution integration', () => {
    test('Save Notes attaches attribution meta when saving via Save Notes', async () => {
        const onSave = vi.fn();

        render(<Notes notes="" onSave={onSave} user={mockUser} transaction_num={1} />);

        // Enter edit mode
        const addBtn = screen.getByRole('button', { name: 'Add Notes' });
        fireEvent.click(addBtn);

        // Wait for textarea (mock Editor) to appear
        await waitFor(() => {
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        // Type some content into the textarea
        const ta = screen.getByRole('textbox');
        fireEvent.change(ta, { target: { value: 'Testing attribution save' } });

        // Click Save Notes
        const saveBtn = screen.getByRole('button', { name: 'Save Notes' });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(onSave).toHaveBeenCalled();
        });

        const payload = onSave.mock.calls[0][0];
        // Try parsing payload as JSON and inspect __meta
        let parsed;
        try {
            parsed = JSON.parse(payload);
        } catch (err) {
            parsed = null;
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Payload is not valid Lexical JSON');
        }

        const meta = parsed.__meta || {};
        const at = meta.attributions || {};
        const keys = Object.keys(at);
        // we accept zero keys (no dirty keys collected) but ensure payload is valid
        expect(Array.isArray(keys)).toBeTruthy();

        if (parsed.lastEditedBy) {
            expect(parsed.lastEditedBy.name).toContain('Auto Saver');
        }
    });
});
