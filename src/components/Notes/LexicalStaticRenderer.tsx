import { useEffect, useState } from 'react';
import { createHeadlessEditor } from '@lexical/headless';
import { LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import hydratePolls from './hydratePolls';
import './headless.css';

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
                    // Instead of embedding a large inline style block we link to
                    // a dedicated static CSS file served from /lexical-static.css.
                    // This keeps the exported HTML cleaner and allows caching.
                    const listStyle = `\n<link rel="stylesheet" href="/lexical-static.css" />\n`;

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

                        // --- Normalize checklist / checkbox rendering ---
                        // Lexical may export checklist items as spans/divs with
                        // role/attributes indicating checked state. Detect common
                        // patterns and replace them with an accessible
                        // checkbox + label structure so static HTML shows checked
                        // state and can be styled consistently.
                        try {
                            // Patterns to look for:
                            // 1. <li class="check-list-item">...<span data-checked="true" ...> or similar
                            // 2. <span data-lexical-checklistchecked> or role="checkbox" aria-checked
                            const checklistItems = Array.from(parserContainer.querySelectorAll('li, div, span'));
                            for (const el of checklistItems) {
                                try {
                                    // If there's already an input[type=checkbox] inside this element,
                                    // preserve its checked state and make it non-interactive.
                                    if (el.querySelector) {
                                        const existingInput = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
                                        if (existingInput) {
                                            try {
                                                // Determine checked state from attribute or property
                                                const attrChecked = existingInput.getAttribute && existingInput.getAttribute('checked');
                                                const ariaChecked = existingInput.getAttribute && existingInput.getAttribute('aria-checked');
                                                const checked = (existingInput.checked === true) || attrChecked === 'true' || attrChecked === 'checked' || ariaChecked === 'true';
                                                existingInput.disabled = true;
                                                existingInput.classList.add('LexicalStatic__checklistInput');
                                                // Ensure checked property reflects state
                                                try {
                                                    existingInput.checked = !!checked;
                                                } catch {
                                                    // ignore if not settable
                                                }

                                                // If there's no explicit label ancestor, wrap non-input
                                                // children in a label and ensure the checkbox stays
                                                // inside the same list item element. This preserves
                                                // semantic <ul>/<ol> structures when the element is an <li>.
                                                const hasLabelAncestor = existingInput.closest && existingInput.closest('label');
                                                if (!hasLabelAncestor) {
                                                    // Build a label containing everything except the input
                                                    const label = document.createElement('label');
                                                    label.className = 'LexicalStatic__checklistLabel';
                                                    const children = Array.from(el.childNodes || []);
                                                    for (const node of children) {
                                                        if (node === existingInput) continue;
                                                        label.appendChild(node.cloneNode(true));
                                                    }

                                                    // Remove existing child nodes (we'll re-append)
                                                    while (el.firstChild) el.removeChild(el.firstChild);

                                                    // Append the (disabled) input and the label into the original element
                                                    const inputClone = existingInput.cloneNode(true) as HTMLElement;
                                                    (inputClone as HTMLInputElement).disabled = true;
                                                    inputClone.classList.add('LexicalStatic__checklistInput');
                                                    (inputClone as HTMLInputElement).checked = !!((existingInput as HTMLInputElement).checked);

                                                    el.appendChild(inputClone);
                                                    el.appendChild(label);
                                                }
                                                // Move to next element since we've handled this one
                                                continue;
                                            } catch {
                                                // fall through to other heuristics on error
                                            }
                                        }
                                    }
                                    // Prefer explicit aria-checked/role or data-checked attributes
                                    const role = el.getAttribute && el.getAttribute('role');
                                    const ariaChecked = el.getAttribute && el.getAttribute('aria-checked');
                                    const dataChecked = el.getAttribute && el.getAttribute('data-checked');
                                    const dataLexical = el.getAttribute && el.getAttribute('data-lexical-checklist-checked');
                                    const hasCheckboxClass = el.className && /check|checkbox|checklist|Checklist/i.test(el.className as string);

                                    let isCheckboxLike = false;
                                    let checked = false;

                                    if (role === 'checkbox') {
                                        isCheckboxLike = true;
                                        checked = ariaChecked === 'true' || ariaChecked === '1' || ariaChecked === 'checked';
                                    }
                                    if (!isCheckboxLike && (dataChecked === 'true' || dataChecked === '1' || dataChecked === 'checked' || dataLexical === 'true')) {
                                        isCheckboxLike = true;
                                        checked = true;
                                    }
                                    // detect inner marker spans like <span class="checkbox">✓</span>
                                    if (!isCheckboxLike && hasCheckboxClass) {
                                        // if the element contains a child with typical marker characters
                                        const innerText = (el.textContent || '').trim();
                                        if (/^[✓✔xX]$/.test(innerText) || innerText === '\u2713') {
                                            isCheckboxLike = true;
                                            checked = true;
                                        }
                                    }

                                    if (isCheckboxLike) {
                                        // Build input + label markup. If the element is an <li>
                                        // we must preserve the tag so native list markers remain
                                        // visible; otherwise fall back to wrapping with a div.
                                        const isLi = (el && (el as Element).tagName && (el as Element).tagName.toLowerCase() === 'li');

                                        const input = document.createElement('input');
                                        input.type = 'checkbox';
                                        input.disabled = true;
                                        if (checked) input.checked = true;
                                        input.className = 'LexicalStatic__checklistInput';

                                        const label = document.createElement('label');
                                        label.className = 'LexicalStatic__checklistLabel';

                                        // Extract content and strip marker characters from the start
                                        let contentHtml = el.innerHTML || '';
                                        contentHtml = contentHtml.replace(/^\s*(?:[\u2713\u2714\u2715xX]|\[[xX ]\])\s*/i, '');
                                        label.innerHTML = contentHtml;

                                        if (isLi) {
                                            // Mutate the existing <li> in-place to preserve list markers
                                            try {
                                                const li = el as Element;
                                                // Clear existing children
                                                while (li.firstChild) li.removeChild(li.firstChild);
                                                // Add a marker class to the li so editor CSS can target it
                                                li.classList.add('LexicalStatic__checklistItem');
                                                li.appendChild(input);
                                                li.appendChild(label);
                                            } catch {
                                                // On any error fallback to wrapper replacement below
                                                const wrapper = document.createElement('div');
                                                wrapper.className = 'LexicalStatic__checklistItem';
                                                wrapper.appendChild(input);
                                                wrapper.appendChild(label);
                                                el.replaceWith(wrapper);
                                            }
                                        } else {
                                            const wrapper = document.createElement('div');
                                            wrapper.className = 'LexicalStatic__checklistItem';
                                            wrapper.appendChild(input);
                                            wrapper.appendChild(label);
                                            el.replaceWith(wrapper);
                                        }
                                    }
                                } catch {
                                    // ignore per-element failures
                                }
                            }
                        } catch (checkboxErr) {
                            // keep original HTML if checklist transform fails
                            console.warn('Checklist normalization failed', checkboxErr);
                        }

                        // Repair invalid serialization cases where a <div> was inserted
                        // directly under a <ul> (e.g. <ul><div class="LexicalStatic__checklistItem">...</div></ul>)
                        // Convert those divs into <li> elements to preserve correct list semantics.
                        try {
                            const uls = Array.from(parserContainer.querySelectorAll('ul'));
                            for (const ul of uls) {
                                const children = Array.from(ul.children || []);
                                for (const child of children) {
                                    if (child.nodeType === 1 && child.classList && child.classList.contains('LexicalStatic__checklistItem') && child.tagName.toLowerCase() === 'div') {
                                        const li = document.createElement('li');
                                        // copy classes (keep the checklist item class)
                                        li.className = child.className || '';
                                        // move all children over
                                        while (child.firstChild) {
                                            li.appendChild(child.firstChild);
                                        }
                                        ul.replaceChild(li, child);
                                    }
                                }
                            }
                        } catch (repairErr) {
                            // don't block export for repair failures
                            console.warn('Failed to repair list structure for static render', repairErr);
                        }
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

                        try {
                            const quoteSelectors = [
                                'blockquote',
                                'div.QuoteNode',
                                'div.QuoteNode__content',
                                'span.quote',
                                'div.quote',
                            ].join(',');
                            const quoteEls = Array.from(parserContainer.querySelectorAll(quoteSelectors));
                            for (const qe of quoteEls) {
                                try {
                                    const text = (qe.textContent || '').trim();
                                    if (!text) continue;
                                    const bq = document.createElement('blockquote');
                                    bq.className = 'QuoteNode__html';
                                    // Preserve inner HTML where possible (links, formatting)
                                    bq.innerHTML = qe.innerHTML || text;
                                    qe.replaceWith(bq);
                                } catch {
                                    // ignore individual quote transform failures
                                }
                            }
                        } catch {
                            // ignore overall quote transform
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
                            const defaultAt = meta.defaultAttribution || { lastEditedBy: null, lastEditedAt: '' };

                            // Prefer node-level attribution when the serialized children
                            // include an `attribution` property (our AttributedParagraphNode)
                            const nodeMap: Record<string, unknown> = {};
                            try {
                                if (parsed.root && Array.isArray(parsed.root.children)) {
                                    for (const child of parsed.root.children) {
                                        try {
                                            const key = child && (child.key || child.id || child._key);
                                            if (typeof key === 'string') {
                                                if (child && child.attribution) {
                                                    nodeMap[key] = child.attribution;
                                                }
                                            }
                                        } catch {
                                            // ignore malformed child
                                        }
                                    }
                                }
                            } catch {
                                // ignore
                            }

                            const keys = Array.from(new Set([...Object.keys(at), ...Object.keys(nodeMap)]));
                            const summary = keys.map((k) => {
                                const nodeRecRaw = nodeMap[k] || null;
                                if (nodeRecRaw) {
                                    const nodeRec = nodeRecRaw as { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string };
                                    const name = (nodeRec && nodeRec.lastEditedBy && (nodeRec.lastEditedBy.name || nodeRec.lastEditedBy.id)) || 'unknown';
                                    return ({ key: k, name, at: nodeRec.lastEditedAt || '' });
                                }
                                const rec = at[k] || null;
                                const name = (rec && rec.lastEditedBy && (rec.lastEditedBy.name || rec.lastEditedBy.id)) || (defaultAt.lastEditedBy && (defaultAt.lastEditedBy.name || defaultAt.lastEditedBy.id)) || 'unknown';
                                const atTime = (rec && rec.lastEditedAt) || defaultAt.lastEditedAt || '';
                                return ({ key: k, name, at: atTime });
                            });
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
