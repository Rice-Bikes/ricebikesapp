import { describe, test, expect } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

import PlaygroundNodes from '../nodes/PlaygroundNodes'
import { createHeadlessEditor } from '@lexical/headless'
import { $generateHtmlFromNodes } from '@lexical/html'
import { EditorApp } from '../EditorContainer'

// This test reproduces the save->reload flow that commonly causes decorator
// nodes (like youtube) to disappear when a non-JSON payload (HTML/plain
// text) overwrites the canonical Lexical JSON. It asserts that:
//  - When the editor is initialized with canonical Lexical JSON, the
//    prepopulated "Welcome to the playground" text should NOT be present.
//  - When the editor is initialized with an HTML payload (simulating an
//    accidental overwrite), the editor falls back to the prepopulated state
//    (thus the original youtube node would be lost).

describe('Notes refresh flow integration', () => {
    afterEach(() => cleanup())

    test('editor uses prepopulated state when given HTML instead of Lexical JSON', async () => {
        // Build a minimal serialized Lexical state containing a youtube node
        const lexicalState = JSON.stringify({
            root: {
                type: 'root',
                version: 1,
                children: [
                    {
                        type: 'paragraph',
                        version: 1,
                        children: [
                            { type: 'text', version: 1, text: 'Nice video' },
                        ],
                    },
                    { type: 'youtube', version: 1, format: '', videoID: 'HHOn8u-c2wk' },
                ],
            },
        })

        // Create headless editor and export HTML (simulating an autosave that
        // produces HTML output)
        const headless = createHeadlessEditor({ namespace: 'test-refresh', nodes: [...PlaygroundNodes] })
        const parsed = headless.parseEditorState(lexicalState)
        headless.setEditorState(parsed)

        let exportedHtml = ''
        headless.read(() => {
            exportedHtml = $generateHtmlFromNodes(headless)
        })
        // Simulate the static renderer appending canonical JSON in a script tag
        exportedHtml = exportedHtml + "\n<script type=\"application/lexical+json\">" + lexicalState + "</script>"

        // First: render EditorApp with the valid lexical JSON
        const { unmount } = render(<EditorApp initialValue={lexicalState} onSave={() => { }} />)

        // The prepopulated welcome text should NOT be present when valid state used
        await waitFor(() => {
            expect(screen.queryByText('Welcome to the playground')).not.toBeInTheDocument()
        })

        unmount()

        // Now render EditorApp with the exported HTML (simulating a bad save)
        render(<EditorApp initialValue={exportedHtml} onSave={() => { }} />)

        // Because the exported HTML contains an embedded canonical Lexical JSON
        // (script[type="application/lexical+json"]), EditorApp should recover
        // the original Lexical state and NOT fall back to the prepopulated
        // content. Assert the YouTube iframe is present and the welcome text is
        // not rendered.
        await waitFor(() => {
            expect(screen.queryByText('Welcome to the playground')).not.toBeInTheDocument()
            expect(screen.getByTitle('YouTube video')).toBeInTheDocument()
        })
    }, 20000)
})
