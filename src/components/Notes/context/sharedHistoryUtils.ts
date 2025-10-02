/**
 * Shared history utilities for use with the SharedHistoryContext
 * Extracted to a separate file to avoid React Fast Refresh warnings
 */

import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin';
import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin';

/**
 * Creates a history context object with an empty history state
 * @returns An object containing a historyState property
 */
export function createHistoryContext(): { historyState: HistoryState } {
  return { historyState: createEmptyHistoryState() };
}
