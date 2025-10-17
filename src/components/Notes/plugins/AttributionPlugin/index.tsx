import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
  $getNodeByKey,
  $isParagraphNode,
  $addUpdateTag,
  $createTextNode,
  $createParagraphNode,
} from "lexical";
import { $isListItemNode } from "@lexical/list";
import DBModel, { User } from "../../../../model";
import { toast } from "react-toastify";
import { queryClient } from "../../../../app/queryClient";

// Custom tag to mark updates made by attribution application so we can
// ignore them when collecting dirty keys.
const ATTRIBUTION_UPDATE_TAG = "rb-attribution-update";

interface AttributionPluginProps {
  transaction_num?: number;
  user?: User;
}

export default function AttributionPlugin({
  transaction_num,
  user,
}: AttributionPluginProps) {
  const [editor] = useLexicalComposerContext();
  // Extract transaction_num from query params if available as a fallback
  useEffect(() => {
    // In-memory set of dirty keys recorded across updates.
    const dirtyKeys = new Set<string>();
    // No AttributionNode, dedupe, or snapshot logic at all.
    // last editor info captured by plugin (set by external callers or tests)
    // For test compatibility - store user object

    // Expose helper for external callers to read attribution meta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor as any).__getAttributionMeta = () => ({
      dirtyKeys: Array.from(dirtyKeys),
    });

    // For test compatibility - expose method to mark nodes as dirty
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor as any).__markAttributionDirty = (key: string) => {
      dirtyKeys.add(key);
    };

    // Expose helper to apply attribution lines into paragraph nodes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor as any).__applyAttributionLines = (name: string): Promise<void> => {
      return new Promise((resolve) => {
        editor.update(
          () => {
            $addUpdateTag(ATTRIBUTION_UPDATE_TAG);
            // const now = new Date().toISOString();
            for (const key of Array.from(dirtyKeys)) {
              const node = $getNodeByKey(key as string);
              if (node && $isListItemNode(node)) {
                // Only append attribution if the paragraph is not empty
                const textContent = node.getTextContent().trim();
                if (textContent.length === 0) continue;
                // const dateObj = new Date(now);
                // const dateParts = dateObj.toString().split(' ');
                // const datePart = dateParts.slice(0, 4).join(' ');
                // const timePart = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                const attributionLine = ` -- ${name || "unknown"}`;
                node.append($createTextNode(attributionLine));
              } else if (node && $isParagraphNode(node)) {
                try {
                  // Only append attribution if the paragraph is not empty
                  const textContent = node.getTextContent().trim();
                  if (textContent.length === 0) continue;
                  // const dateObj = new Date(now);
                  // const dateParts = dateObj.toString().split(' ');
                  // const datePart = dateParts.slice(0, 4).join(' ');
                  // const timePart = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                  const attributionLine = ` -- ${name || "unknown"}`;
                  node.append($createTextNode(attributionLine));
                  const parent = node.getParent();
                  if (parent && parent !== null) {
                    parent.append($createParagraphNode());
                  }
                  // Log the attribution action to the transaction log if applicable
                  try {
                    // Use the transaction_num prop if available, otherwise use the one from URL

                    if (transaction_num != null && user && user.user_id) {
                      DBModel.postTransactionLog(
                        transaction_num,
                        user.user_id,
                        "to notes section",
                        textContent,
                      ).catch((e) =>
                        console.error("Failed to log attribution action:", e),
                      );
                      queryClient.invalidateQueries({
                        queryKey: ["transactionLogs", transaction_num],
                      });
                    } else {
                      toast.warn(
                        "Could not log attribution: No transaction_num or user ID available",
                      );
                    }
                  } catch (err) {
                    if (err instanceof Error)
                      toast.error(
                        `Error logging attribution action: ${err.message}`,
                      );
                  }
                } catch {
                  // ignore individual failures
                }
              }
            }
            dirtyKeys.clear();
          },
          { tag: ATTRIBUTION_UPDATE_TAG },
        );
        resolve();
      });
    };

    // Register listener to capture dirty paragraph/list item keys based on leaf (text) changes
    const remove = editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyLeaves, tags }) => {
        try {
          // Ignore our own updates
          if (
            tags &&
            (tags as Set<string>).has &&
            (tags as Set<string>).has(ATTRIBUTION_UPDATE_TAG)
          ) {
            return;
          }

          // Helper: climb up from a node to the nearest Paragraph or ListItem
          const findAttributableBlockKey = (
            startKey: string | null,
          ): string | null => {
            if (!startKey) return null;
            let node = $getNodeByKey(startKey);
            while (node) {
              if ($isParagraphNode(node) || $isListItemNode(node)) {
                return node.getKey();
              }
              const parent = node.getParent();
              if (!parent) break;
              node = parent;
            }
            return null;
          };

          // Only use dirtyLeaves (text nodes) to determine actual content changes
          const leafKeys = new Set<string>();
          if (dirtyLeaves) {
            for (const n of dirtyLeaves as unknown as Iterable<unknown>) {
              let candidate: unknown;
              let isDirty = true;
              if (Array.isArray(n) && n.length === 2) {
                candidate = n[0];
                isDirty = Boolean(n[1]);
              } else {
                candidate = n;
              }
              if (!isDirty) continue;

              if (typeof candidate === "string") {
                leafKeys.add(candidate);
              } else if (
                candidate &&
                typeof (candidate as { getKey?: unknown }).getKey === "function"
              ) {
                leafKeys.add((candidate as { getKey: () => string }).getKey());
              } else if (
                candidate &&
                typeof (candidate as { key?: unknown }).key === "string"
              ) {
                leafKeys.add((candidate as { key: string }).key);
              }
            }
          }

          // For each changed leaf, find the enclosing Paragraph/ListItem and ensure its text actually changed
          for (const leafKey of leafKeys) {
            let blockKey: string | null = null;

            editorState.read(() => {
              blockKey = findAttributableBlockKey(leafKey);
            });

            if (!blockKey) continue;

            let prevText = "";
            let currText = "";

            prevEditorState.read(() => {
              const prevNode = $getNodeByKey(blockKey as string);
              prevText = prevNode?.getTextContent() ?? "";
            });

            editorState.read(() => {
              const currNode = $getNodeByKey(blockKey as string);
              currText = currNode?.getTextContent() ?? "";
            });

            if (currText !== prevText) {
              dirtyKeys.add(blockKey as string);
            }
          }
        } catch {
          // swallow listener errors
        }
      },
    );

    return () => {
      remove();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (editor as any).__getAttributionMeta;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (editor as any).__applyAttributionLines;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (editor as any).__setAttributionUser;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (editor as any).__markAttributionDirty;
    };
  }, [editor, transaction_num]);

  return null;
}
