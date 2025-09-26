/* Runtime smoke test for Notes: headless round-trip for a payload with a youtube node.

Usage (in browser console while running the app):
  window.__runNotesSmokeTest && window.__runNotesSmokeTest()

This will create a headless editor using PlaygroundNodes, parse a sample serialized state
containing a youtube node, and log whether the youtube node survives parse+read.
*/

import PlaygroundNodes from '../nodes/PlaygroundNodes';

export async function runNotesSmokeTest(): Promise<boolean> {
  const sample = {
    root: {
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              text: 'Smoke test for youtube node',
              version: 1,
            },
          ],
        },
        {
          type: 'youtube',
          version: 1,
          format: '',
          videoID: 'HHOn8u-c2wk',
        },
      ],
      type: 'root',
      version: 1,
    },
  };

  let createHeadlessEditor: unknown;
  try {
    // dynamic import so this only loads in dev where needed
    const headless = await import('@lexical/headless');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createHeadlessEditor = (headless as any).createHeadlessEditor;
  } catch (err) {
    console.error('runNotesSmokeTest: failed to import @lexical/headless', err);
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createFn = createHeadlessEditor as unknown as (opts: Record<string, unknown>) => any;
    const editor = createFn({
      namespace: `notes-smoke-${Date.now()}`,
      nodes: [...PlaygroundNodes],
      onError: (e: Error) => console.error('notes smoke editor error', e),
    });

    const stateStr = JSON.stringify(sample);
    let parsedState;
    try {
      parsedState = editor.parseEditorState(stateStr);
    } catch (err) {
      console.error('runNotesSmokeTest: parseEditorState threw', err);
      return false;
    }

    editor.setEditorState(parsedState);

    let foundYouTube = false;
    editor.read(() => {
      try {
        const json = editor.getEditorState().toJSON();
        const walk = (n: unknown) => {
          if (!n || typeof n !== 'object') return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj: any = n;
          if (obj.type === 'youtube') {
            foundYouTube = true;
          }
          const kids = obj.children || obj.nodes || [];
          for (const c of kids) walk(c);
        };
        walk(json.root || json);
      } catch (err) {
        console.error('runNotesSmokeTest: error during read', err);
      }
    });

    if (foundYouTube) {
      console.info('runNotesSmokeTest: SUCCESS - youtube node preserved through headless parse+read');
      return true;
    } else {
      console.warn('runNotesSmokeTest: FAILURE - youtube node NOT found after parse+read');
      return false;
    }
  } catch (err) {
    console.error('runNotesSmokeTest: unexpected error', err);
    return false;
  }
}

// Attach to window in a typed-safe way
declare global {
  interface Window {
    __runNotesSmokeTest__?: () => Promise<boolean>;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
(window as unknown as Window).__runNotesSmokeTest__ = runNotesSmokeTest;

export default runNotesSmokeTest;
