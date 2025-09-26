import { useEffect, useState } from 'react';
import { createHeadlessEditor } from '@lexical/headless';
import { LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import ReadOnlyEditor from './ReadOnlyEditor';
import hydratePolls from './hydratePolls';

interface Props {
    initialValue: string;
    className?: string;
}

export default function LexicalStaticRenderer({ initialValue, className }: Props) {
    const [html, setHtml] = useState<string>('');
    const [showFallback, setShowFallback] = useState<boolean>(false);
    const [attributionsSummary, setAttributionsSummary] = useState<Array<{ key: string, name: string, at: string }>>([]);

    useEffect(() => {
        let mounted = true;
        if (!initialValue || initialValue.trim() === '') {
            setHtml('');
            setShowFallback(false);
            return;
        }



        const editor: LexicalEditor = createHeadlessEditor({
            namespace: `lexical-static-renderer-${Date.now()}`,
            nodes: [...PlaygroundNodes],
            onError: (err: Error) => console.error('Lexical static render error', err),
        });

        try {
            const editorState = editor.parseEditorState(initialValue);
            editor.setEditorState(editorState);
            editor.read(() => {
                try {
                    // open collapsibles so export includes their content
                    let out = $generateHtmlFromNodes(editor);
                    // Also include the canonical Lexical JSON in a script tag so
                    // refresh flows that only have HTML can recover the full
                    // editor state (including custom/decorator nodes).
                    let canonicalJson = '';
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const js: any = (editor.getEditorState && typeof (editor.getEditorState()).toJSON === 'function') ? (editor.getEditorState()).toJSON() : null;
                        if (js) canonicalJson = JSON.stringify(js);
                    } catch {
                        // ignore
                    }

                    // When rendering exported/static HTML outside the in-editor
                    // environment the editor-scoped CSS (e.g. .editor ol ::marker)
                    // may not be present. Inject a minimal, self-contained style
                    // block so ordered lists render correctly in the exported HTML.
                    const listStyle = `\n<style>
/* Minimal ordered-list styles for exported/static HTML */
ol { margin: 0 0 1em 1.6em; padding-left: 0; }
ol li { margin: 0.1em 0; }
/* Use ::marker where supported for modern browsers */
ol li::marker { font-weight: 500; color: #444; }
/* Fallback for environments that don't support ::marker */
ol li { list-style: decimal; }
</style>\n`;

                    // we'll build final HTML into 'out' (listStyle is prepended later)

                    // If exported HTML contains Poll placeholders, render a
                    // static (non-interactive) HTML representation for each
                    // poll so it displays correctly without mounting the
                    // full editor. We do this by parsing the exported HTML
                    // and replacing poll placeholder spans with markup that
                    // mirrors the PollComponent DOM & classes.
                    try {
                        const parserContainer = document.createElement('div');
                        parserContainer.innerHTML = out;
                        const pollSpans = Array.from(
                            parserContainer.querySelectorAll('span[data-lexical-poll-question]'),
                        );

                        for (const span of pollSpans) {
                            try {
                                const question = span.getAttribute('data-lexical-poll-question') || '';
                                const optionsRaw = span.getAttribute('data-lexical-poll-options') || '[]';
                                const options = JSON.parse(optionsRaw);

                                const pollContainer = document.createElement('div');
                                pollContainer.className = 'PollNode__container';

                                const inner = document.createElement('div');
                                inner.className = 'PollNode__inner';

                                const heading = document.createElement('h2');
                                heading.className = 'PollNode__heading';
                                heading.textContent = question;
                                inner.appendChild(heading);

                                const optsContainer = document.createElement('div');
                                optsContainer.className = 'PollNode__optionContainer';

                                if (Array.isArray(options)) {
                                    for (const opt of options) {
                                        const optionRow = document.createElement('div');
                                        optionRow.className = 'PollNode__optionContainerRow';

                                        const checkboxWrapper = document.createElement('div');
                                        checkboxWrapper.className = 'PollNode__optionCheckboxWrapper';

                                        const checkbox = document.createElement('div');
                                        checkbox.className = 'PollNode__optionCheckbox';
                                        checkbox.setAttribute('aria-hidden', 'true');
                                        checkboxWrapper.appendChild(checkbox);

                                        const inputWrapper = document.createElement('div');
                                        inputWrapper.className = 'PollNode__optionInputWrapper';

                                        const votesSpan = document.createElement('span');
                                        votesSpan.className = 'PollNode__optionInputVotes';
                                        const votesCount = Array.isArray(opt.votes) ? opt.votes.length : 0;
                                        const votesCountSpan = document.createElement('span');
                                        votesCountSpan.className = 'PollNode__optionInputVotesCount';
                                        votesCountSpan.textContent = String(votesCount);
                                        votesSpan.appendChild(votesCountSpan);

                                        const inputText = document.createElement('span');
                                        inputText.className = 'PollNode__optionInput';
                                        inputText.textContent = opt.text || '';

                                        inputWrapper.appendChild(votesSpan);
                                        inputWrapper.appendChild(inputText);

                                        optionRow.appendChild(checkboxWrapper);
                                        optionRow.appendChild(inputWrapper);
                                        optsContainer.appendChild(optionRow);
                                    }
                                }

                                inner.appendChild(optsContainer);
                                const footer = document.createElement('div');
                                footer.className = 'PollNode__footer';
                                inner.appendChild(footer);

                                pollContainer.appendChild(inner);

                                span.replaceWith(pollContainer);
                            } catch (innerErr) {
                                // ignore malformed poll payloads and leave span as-is
                                console.warn('Failed to render static poll', innerErr);
                            }
                        }

                        // Serialize the transformed DOM back to HTML
                        // After poll placeholders are converted, also transform
                        // mentions, datetimes, and hashtags into more distinct
                        // HTML so exported/static pages can style them.

                        // Mentions: spans emitted by our MentionNode include
                        // data-lexical-mention and optional data-lexical-mention-name
                        const mentionSpans = Array.from(
                            parserContainer.querySelectorAll('span[data-lexical-mention]'),
                        );
                        for (const span of mentionSpans) {
                            try {
                                const mentionName = span.getAttribute('data-lexical-mention-name') || span.textContent || '';
                                const wrapper = document.createElement('span');
                                wrapper.className = 'MentionNode__html mention';
                                wrapper.setAttribute('data-lexical-mention', 'true');
                                if (mentionName) wrapper.setAttribute('data-lexical-mention-name', mentionName);
                                // Render with a leading @ so static pages clearly show it's a mention
                                wrapper.textContent = '@' + String(mentionName || span.textContent || '').trim();
                                span.replaceWith(wrapper);
                            } catch {
                                // ignore and leave original span
                            }
                        }

                        // Datetimes: convert span[data-lexical-datetime] -> <time datetime="...">text</time>
                        const dateSpans = Array.from(
                            parserContainer.querySelectorAll('span[data-lexical-datetime]'),
                        );
                        for (const span of dateSpans) {
                            try {
                                const raw = span.getAttribute('data-lexical-datetime') || '';
                                let iso = '';
                                try {
                                    const parsed = Date.parse(raw);
                                    if (!isNaN(parsed)) iso = new Date(parsed).toISOString();
                                } catch {
                                    // ignore parse errors
                                }

                                const timeEl = document.createElement('time');
                                timeEl.className = 'DateTimeNode__time';
                                if (iso) timeEl.setAttribute('datetime', iso);
                                timeEl.textContent = span.textContent || '';
                                span.replaceWith(timeEl);
                            } catch {
                                // leave as-is on error
                            }
                        }

                        // Hashtags: detect hashtag-styled elements from theme class
                        // or simple text that starts with '#', and render as links
                        const hashtagSelectors = [
                            'span.PlaygroundEditorTheme__hashtag',
                            'a.PlaygroundEditorTheme__hashtag',
                            'span.hashtag',
                            "span[data-lexical-hashtag]",
                        ].join(',');
                        const hashtagEls = Array.from(parserContainer.querySelectorAll(hashtagSelectors));
                        for (const el of hashtagEls) {
                            try {
                                const txt = (el.textContent || '').trim();
                                if (!txt) continue;
                                const tag = txt.replace(/^#/, '');
                                const a = document.createElement('a');
                                a.className = 'HashtagNode__html PlaygroundEditorTheme__hashtag';
                                // Provide a sensible href pattern but allow styling without navigation
                                a.setAttribute('href', `/tags/${encodeURIComponent(tag)}`);
                                a.textContent = txt;
                                el.replaceWith(a);
                            } catch {
                                // ignore
                            }
                        }

                        out = parserContainer.innerHTML;
                    } catch (parseErr) {
                        // ignore parser failures and continue with original out
                        console.warn('Failed to transform poll placeholders for static render', parseErr);
                    }

                    if (mounted) {
                        const finalHtml = listStyle + out + (canonicalJson ? `\n<script type="application/lexical+json">${canonicalJson}</script>` : '');
                        setHtml(finalHtml);
                        setShowFallback(false);

                        // Run the client-side hydrator to mount interactive polls
                        // into the static markup. Delay slightly to ensure
                        // React's setState has flushed and the DOM is updated.
                        setTimeout(() => {
                            try {
                                const container = document.createElement('div');
                                container.innerHTML = finalHtml;
                                // hydratePolls can accept document or an element
                                hydratePolls(document);
                            } catch (err) {
                                console.warn('hydratePolls call failed', err);
                            }
                        }, 0);

                        // try to extract attribution summary from parsed JSON
                        try {
                            const parsed = JSON.parse(initialValue);
                            const meta = parsed.__meta || {};
                            const at = meta.attributions || {};
                            const summary = Object.keys(at).map((k) => ({ key: k, name: at[k].lastEditedBy?.name || 'unknown', at: at[k].lastEditedAt || '' }));
                            setAttributionsSummary(summary);
                        } catch (err) {
                            console.warn('Failed to parse attributions for static renderer (post export)', err);
                        }
                    }
                } catch (exportErr) {
                    console.warn('Lexical static export failed, falling back to ReadOnlyEditor:', exportErr);
                    if (mounted) setShowFallback(true);
                }
            });
        } catch {
            if (mounted) {
                setHtml(initialValue);
                setShowFallback(false);
            }
        }

        return () => {
            mounted = false;
        };
    }, [initialValue]);

    if (showFallback) {
        // Mounting a real readonly editor is heavier but guarantees correct rendering
        return (
            <div>
                {attributionsSummary.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <strong>Attributions:</strong>
                        <ul style={{ margin: '4px 0 0 12px' }}>
                            {attributionsSummary.map((s) => (
                                <li key={s.key} style={{ fontSize: 12 }}>{s.name} - {s.at ? new Date(s.at).toLocaleString() : 'unknown'}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <ReadOnlyEditor initialValue={initialValue} />
            </div>
        );
    }

    return (
        <div className={className}>
            {attributionsSummary.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    <strong>Attributions:</strong>
                    <ul style={{ margin: '4px 0 0 12px' }}>
                        {attributionsSummary.map((s) => (
                            <li key={s.key} style={{ fontSize: 12 }}>{s.name} - {s.at ? new Date(s.at).toLocaleString() : 'unknown'}</li>
                        ))}
                    </ul>
                </div>
            )}
            {html && html.trim() !== '' ? (
                <>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                </>
            ) : (
                <div style={{ border: '1px solid #f0ad4e', padding: 8, borderRadius: 6 }}>
                    <div style={{ color: '#663c00', fontWeight: 600, marginBottom: 6 }}>Static render produced no HTML  raw content below</div>
                    <div style={{ maxHeight: 160, overflow: 'auto', background: '#fff', padding: 8 }}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{initialValue}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}
