/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const VERTICAL_GAP = 10;
const HORIZONTAL_OFFSET = 5;

export function setFloatingElemPosition(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  isLink: boolean = false,
  verticalGap: number = VERTICAL_GAP,
  horizontalOffset: number = HORIZONTAL_OFFSET,
): void {
  const scrollerElem = anchorElem.parentElement;

  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }

  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();

  let top = targetRect.top - floatingElemRect.height - verticalGap;
  // Prefer to place the floating toolbar to the left of the target (so it
  // doesn't cover text). We subtract the floating width and a small gap.
  let left = targetRect.left - floatingElemRect.width - horizontalOffset;

  // Check if text is end-aligned
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType === Node.ELEMENT_NODE || textNode.parentElement) {
      const textElement =
        textNode.nodeType === Node.ELEMENT_NODE
          ? (textNode as Element)
          : (textNode.parentElement as Element);
      const textAlign = window.getComputedStyle(textElement).textAlign;

      if (textAlign === 'right' || textAlign === 'end') {
        // For end-aligned text, position the toolbar relative to the text end
        // (so it doesn't float off the left edge).
        left = targetRect.right - floatingElemRect.width + horizontalOffset;
      }
    }
  }

  if (top < editorScrollerRect.top) {
    // adjusted height for link element if the element is at top
    top +=
      floatingElemRect.height +
      targetRect.height +
      verticalGap * (isLink ? 9 : 2);
  }

  // If the preferred left position would overflow the right, clamp it.
  const maxLeft = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
  if (left > maxLeft) {
    left = maxLeft;
  }

  // If the preferred left position would overflow the left edge, fall back
  // to aligning the toolbar just inside the left edge (or place it on top
  // of the anchor when there's no room to the left).
  const minLeft = editorScrollerRect.left + horizontalOffset;
  if (left < minLeft) {
    // Try placing the toolbar above the target centered horizontally with a
    // small offset so it doesn't overlap selection when space to the left
    // is insufficient.
    left = Math.max(
      minLeft,
      targetRect.left + (targetRect.width - floatingElemRect.width) / 2,
    );
  }

  top -= anchorElementRect.top;
  left -= anchorElementRect.left;

  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}
