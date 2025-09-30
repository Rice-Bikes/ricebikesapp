/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  DOMConversionMap,
  TextNode,
} from 'lexical';
import { type JSX } from 'react';
import './notes.css';

import { isDevPlayground } from './appSettings';
import { FlashMessageContext } from './context/FlashMessageContext';
import { SettingsContext, useSettings } from './context/SettingsContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import { ToolbarContext } from './context/ToolbarContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import DocsPlugin from './plugins/DocsPlugin';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import { TableContext } from './plugins/TablePlugin';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import { parseAllowedFontSize } from './plugins/ToolbarPlugin/fontSize';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { parseAllowedColor } from './ui/ColorPicker';
import { User } from '../../model';

const playgroundConfig = {
  namespace: 'PlaygroundEditor',
  theme: PlaygroundEditorTheme,
  onError(error: Error) {
    console.error('Lexical Error:', error);
    throw error;
  },
  nodes: PlaygroundNodes,
  editorState: $prepopulatedRichText,
  html: { import: buildImportMap() },
};


function $prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1');
    heading.append($createTextNode('Repair Inspection & Approved Repairs'));
    root.append(heading);

    const intro = $createParagraphNode();
    intro.append(
      $createTextNode(
        'Use this template to record the bike inspection, the repairs approved by the customer, and any notes that the service technician should communicate to the customer.',
      ),
    );
    root.append(intro);

    // Inspection details
    const inspectionHeading = $createHeadingNode('h2');
    inspectionHeading.append($createTextNode('Inspection Details'));
    root.append(inspectionHeading);

    const inspectionPara = $createParagraphNode();
    inspectionPara.append(
      $createTextNode('Please enter a clear, concise summary of the inspection performed. Include observed issues, severity, and any diagnostic steps taken.'),
    );
    root.append(inspectionPara);

    const inspectionList = $createListNode('bullet');
    inspectionList.append(
      $createListItemNode().append($createTextNode('Observed issue (location on bike):')),
      $createListItemNode().append($createTextNode('Severity (minor/major/safety):')),
      $createListItemNode().append($createTextNode('Diagnostic steps performed:')),
    );
    root.append(inspectionList);

    // Approved repairs
    const approvedHeading = $createHeadingNode('h2');
    approvedHeading.append($createTextNode('Approved Repairs'));
    root.append(approvedHeading);

    const approvedPara = $createParagraphNode();
    approvedPara.append($createTextNode('List the repairs approved by the customer, including parts, labor, and estimates.'));
    root.append(approvedPara);

    const approvedList = $createListNode('bullet');
    approvedList.append(
      $createListItemNode().append($createTextNode('Repair 1: (description, parts required, estimate)')),
      $createListItemNode().append($createTextNode('Repair 2: (description, parts required, estimate)')),
    );
    root.append(approvedList);

    // Parts and notes
    const partsHeading = $createHeadingNode('h3');
    partsHeading.append($createTextNode('Parts & Materials'));
    root.append(partsHeading);

    // Customer-facing notes
    const customerHeading = $createHeadingNode('h2');
    customerHeading.append($createTextNode('Customer Notes / Potential Issues'));
    root.append(customerHeading);

    const customerPara = $createParagraphNode();
    customerPara.append(
      $createTextNode(
        'Summarize anything the customer should be aware of: safety concerns, follow-up maintenance, items that may require future attention, or optional upgrades.',
      ),
    );
    root.append(customerPara);
  }
}

function getExtraStyles(element: HTMLElement): string {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = '';
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== '' && fontSize !== '15px') {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== '' && backgroundColor !== 'rgb(255, 255, 255)') {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== '' && color !== 'rgb(0, 0, 0)') {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
}

function buildImportMap(): DOMConversionMap {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
}

type EditorAppProps = Readonly<{
  user: User;
  initialValue: string;
  onSave: (html: string) => void;
}>;

export function EditorApp({ user, initialValue, onSave }: EditorAppProps): JSX.Element {
  const {
    settings: { measureTypingPerf },
  } = useSettings();


  function isValidLexicalState(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }

  let editorState;
  if (initialValue && isValidLexicalState(initialValue)) {
    editorState = initialValue;
  } else {
    if (initialValue && initialValue.trim() !== "") {
      // Preserve raw user data that isn't valid Lexical JSON by
      // inserting it as plain text into the editor. This prevents
      // overwriting user content with the repair template.
      // The function here will be executed by Lexical to initialize
      // editor state when the editor mounts.
      editorState = () => {
        const root = $getRoot();
        if (root.getFirstChild() === null) {
          const p = $createParagraphNode();
          // Insert the raw string as a single text node. If the
          // string contains HTML, it will be preserved as text; if
          // you prefer HTML-to-node import, we can add a parser
          // path later.
          p.append($createTextNode(initialValue));
          root.append(p);
        }
      };
    } else {
      // No initial content provided: fall back to the repair template
      editorState = $prepopulatedRichText;
    }
  }

  const actualConfig = {
    ...playgroundConfig,
    editorState: editorState === "" ? undefined : editorState,
  };

  // console.warn("EditorApp rendered with initialValue: " + (actualConfig.editorState ? JSON.stringify(actualConfig.editorState) : "empty"));

  return (
    <SettingsContext>
      <FlashMessageContext>
        <LexicalComposer initialConfig={actualConfig}>
          <SharedHistoryContext>
            <TableContext>
              <ToolbarContext>
                <div className="editor-shell">
                  <Editor onSave={onSave} user={user} />
                </div>
                <Settings />
                {isDevPlayground ? <DocsPlugin /> : null}
                {isDevPlayground ? <PasteLogPlugin /> : null}
                {isDevPlayground ? <TestRecorderPlugin /> : null}

                {measureTypingPerf ? <TypingPerfPlugin /> : null}
              </ToolbarContext>
            </TableContext>
          </SharedHistoryContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
}


