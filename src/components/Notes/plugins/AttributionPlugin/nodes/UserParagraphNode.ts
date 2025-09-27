import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';

import { ParagraphNode } from 'lexical';
import React from 'react';

export type UserIdentity = {
  userId?: string;
  userName?: string;
  avatarUrl?: string;
};

export type Attribution = {
  createdBy?: UserIdentity;
  createdAt?: string; // ISO
  lastModifiedBy?: UserIdentity;
  lastModifiedAt?: string; // ISO
  version?: number;
};

export type SerializedUserParagraphNode = SerializedLexicalNode & {
  attribution?: Attribution;
  // allow extra element-specific fields for compatibility
  [k: string]: unknown;
};

export class UserParagraphNode extends ParagraphNode {
  __attribution?: Attribution;

  static getType(): string {
    return 'user-paragraph';
  }

  static clone(node: UserParagraphNode): UserParagraphNode {
    const cloned = new UserParagraphNode(node.__key);
    cloned.__attribution = node.__attribution ? { ...node.__attribution } : undefined;
    return cloned;
  }

  constructor(key?: NodeKey) {
    super(key);
    this.__attribution = undefined;
  }

  getAttribution(): Attribution | undefined {
    return this.__attribution;
  }

  setAttribution(attribution: Attribution): void {
    const writable = this.getWritable();
    writable.__attribution = { ...attribution };
  }

  updateLastModified(user: UserIdentity | null): void {
    const writable = this.getWritable();
    const now = new Date().toISOString();
    if (!writable.__attribution) writable.__attribution = {};
    writable.__attribution.lastModifiedBy = user || undefined;
    writable.__attribution.lastModifiedAt = now;
    writable.__attribution.version = (writable.__attribution.version || 0) + 1;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      attribution: this.__attribution,
    };
  }

  static importJSON(serializedNode: unknown): UserParagraphNode {
    const node = new UserParagraphNode();
    if (serializedNode && typeof serializedNode === 'object' && 'attribution' in serializedNode) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (node as any).__attribution = { ...((serializedNode as any).attribution) };
      } catch {
        // ignore malformed attribution
      }
    }
    // Let superclass handle updating known fields by delegating to ParagraphNode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = (ParagraphNode.prototype as any).updateFromJSON.call(node, serializedNode);
    return updated as UserParagraphNode;
  }

  createDOM(config: EditorConfig): HTMLElement {
    // Use default paragraph DOM from ParagraphNode but allow theme class
    const dom = super.createDOM(config);
    // Add a marker class so CSS can target attributed paragraphs
    dom.classList.add('user-paragraph');
    // If we have attribution at create time, set a title attr for quick UI
    try {
      const a = this.__attribution;
      if (a && a.lastModifiedBy) {
        const name = a.lastModifiedBy.userName || a.lastModifiedBy.userId || '';
        const time = a.lastModifiedAt || a.createdAt || '';
        if (name || time) dom.setAttribute('title', `By ${name}${time ? ' • ' + time : ''}`);
      }
    } catch {
      // ignore DOM set failures
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    try {
  const prev = ((prevNode as unknown) as { __attribution?: Attribution }).__attribution as Attribution | undefined;
      const now = this.__attribution;
      const prevName = prev && prev.lastModifiedBy ? prev.lastModifiedBy.userName || prev.lastModifiedBy.userId : '';
      const nowName = now && now.lastModifiedBy ? now.lastModifiedBy.userName || now.lastModifiedBy.userId : '';
      const prevTime = prev && prev.lastModifiedAt ? prev.lastModifiedAt : prev && prev.createdAt ? prev.createdAt : '';
      const nowTime = now && now.lastModifiedAt ? now.lastModifiedAt : now && now.createdAt ? now.createdAt : '';
      const prevTitle = prevName || prevTime ? `By ${prevName}${prevTime ? ' • ' + prevTime : ''}` : '';
      const nowTitle = nowName || nowTime ? `By ${nowName}${nowTime ? ' • ' + nowTime : ''}` : '';
      if (prevTitle !== nowTitle) {
        if (nowTitle) dom.setAttribute('title', nowTitle);
        else dom.removeAttribute('title');
      }
    } catch {
      // ignore
    }
    // we don't need to replace the DOM element
    return false;
  }

  decorate(): JSX.Element | null {
    // Provide a small React decoration (chip) after the paragraph to show attribution
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AttributionChip = require('../ui/AttributionChip').default;
    try {
      const key = this.getKey();
      // Use createElement to avoid JSX syntax in a .ts file
      return React.createElement(AttributionChip, { nodeKey: key });
    } catch {
      return null;
    }
  }
}

export function $createUserParagraphNode(): UserParagraphNode {
  return new UserParagraphNode();
}

export function $isUserParagraphNode(node: LexicalNode | null | undefined): node is UserParagraphNode {
  return node instanceof UserParagraphNode;
}
