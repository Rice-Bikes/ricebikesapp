import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import HydratedPoll from './HydratedPoll';

// Find static poll containers and hydrate the interactive PollComponent into them.
export default function hydratePolls(container: HTMLElement | Document = document) {
    try {
        const pollContainers = Array.from(container.querySelectorAll('.PollNode__container[data-lexical-poll-options]'));
        for (const el of pollContainers) {
            try {
                const optionsRaw = el.getAttribute('data-lexical-poll-options') || '[]';
                const question = el.getAttribute('data-lexical-poll-question') || '';
                const options = JSON.parse(optionsRaw);

                // Prevent double-hydration
                if ((el as HTMLElement).dataset.hydrated === 'true') continue;

                const root = createRoot(el as HTMLElement);
                root.render(
                    createElement(HydratedPoll, { question, options }),
                );
                (el as HTMLElement).dataset.hydrated = 'true';
            } catch (err) {
                console.warn('Failed to hydrate poll', err);
            }
        }
    } catch (err) {
        console.warn('hydratePolls error', err);
    }
}
