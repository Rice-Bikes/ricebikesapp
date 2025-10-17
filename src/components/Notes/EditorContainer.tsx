import { $createHeadingNode } from "@lexical/rich-text";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  DOMConversionMap,
  TextNode,
} from "lexical";
import { type JSX } from "react";
import "./notes.css";

import { isDevPlayground } from "./appSettings";
import { FlashMessageProvider } from "./context/FlashMessageContext";
import { SettingsContext, useSettings } from "./context/SettingsContext";
import { SharedHistoryContext } from "./context/SharedHistoryContext";
import { ToolbarContext } from "./context/ToolbarContext";
import Editor from "./Editor";
import PlaygroundNodes from "./nodes/PlaygroundNodes";
import DocsPlugin from "./plugins/DocsPlugin";
import PasteLogPlugin from "./plugins/PasteLogPlugin";
import { TableContext } from "./plugins/TablePlugin";
import TestRecorderPlugin from "./plugins/TestRecorderPlugin";
import { parseAllowedFontSize } from "./plugins/ToolbarPlugin/fontSize";
import TypingPerfPlugin from "./plugins/TypingPerfPlugin";
import Settings from "./Settings";
import PlaygroundEditorTheme from "./themes/PlaygroundEditorTheme";
import { parseAllowedColor } from "./ui/ColorPicker";
import { User } from "../../model";

const playgroundConfig = {
  namespace: "PlaygroundEditor",
  theme: PlaygroundEditorTheme,
  onError(error: Error) {
    console.error("Lexical Error:", error);
    throw error;
  },
  nodes: PlaygroundNodes,
  editorState: $prepopulatedRichText,
  html: { import: buildImportMap() },
};

function $prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode("h1");
    heading.append($createTextNode("Repair Inspection & Approved Repairs"));
    root.append(heading);
  }
}

function getExtraStyles(element: HTMLElement): string {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = "";
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== "" && fontSize !== "15px") {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== "" && backgroundColor !== "rgb(255, 255, 255)") {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== "" && color !== "rgb(0, 0, 0)") {
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
  transaction_num: number;
}>;

export function EditorApp({
  user,
  initialValue,
  onSave,
  transaction_num,
}: EditorAppProps): JSX.Element {
  const {
    settings: { measureTypingPerf },
  } = useSettings();

  function isValidLexicalState(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === "object" && parsed !== null;
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
      <FlashMessageProvider>
        <LexicalComposer initialConfig={actualConfig}>
          <SharedHistoryContext>
            <TableContext>
              <ToolbarContext>
                <div className="editor-shell">
                  <Editor
                    onSave={onSave}
                    user={user}
                    transaction_num={transaction_num}
                  />
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
      </FlashMessageProvider>
    </SettingsContext>
  );
}
