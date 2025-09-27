import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { User } from '../../model';


type AttributionSetterProps = {
    user: User;
}

export default function AttributionSetter({ user }: AttributionSetterProps): JSX.Element | null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // When the editor mounts and we have a signed-in user, set the
        // attribution helper. AttributionPlugin may mount slightly after
        // this setter, so if the helper isn't present yet, register a
        // short-lived update listener and call it when available.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = (editor as any);
        if (!user) return;

        const setUser = () => {
            try {
                if (e && typeof e.__setAttributionUser === 'function') {
                    e.__setAttributionUser({ id: user.user_id, name: `${user.firstname} ${user.lastname}`.trim() });
                    return true;
                }
            } catch {
                // ignore
            }
            return false;
        };

        if (setUser()) {
            return;
        }

        // Fallback: wait for the AttributionPlugin to attach helpers by
        // listening for editor updates. Remove the listener as soon as we
        // successfully set the user or on unmount.
        const remove = editor.registerUpdateListener(() => {
            if (setUser()) {
                try {
                    remove();
                } catch {
                    // ignore
                }
            }
        });

        return () => {
            try {
                remove();
            } catch {
                // ignore
            }
        };
    }, [editor, user]);

    return null;
}
