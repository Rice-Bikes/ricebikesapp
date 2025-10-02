import type { JSX } from 'react';
import type { LexicalNode, NodeKey, SerializedLexicalNode } from 'lexical';

import { DecoratorNode } from 'lexical';

export type SerializedAttributionNode = SerializedLexicalNode & {
  author: string | null;
  timestamp: string | null;
};

function AttributionComponent({ nodeKey, author, timestamp }: { nodeKey: string; author: string | null; timestamp: string | null }) {
  return (
    <div className="attribution" data-node-key={nodeKey}>
      <small className="attribution-text">{author ? `Last edited by: ${author}` : 'Last edited'}</small>
      {timestamp ? <time className="attribution-time">{new Date(timestamp).toLocaleString()}</time> : null}
    </div>
  );
}

export class AttributionNode extends DecoratorNode<JSX.Element> {
  __author: string | null;
  __timestamp: string | null;

  static getType(): string {
    return 'attribution';
  }

  static clone(node: AttributionNode): AttributionNode {
    return new AttributionNode(node.__author, node.__timestamp, node.__key);
  }

  constructor(author: string | null = null, timestamp: string | null = null, key?: NodeKey) {
    super(key);
    this.__author = author;
    this.__timestamp = timestamp;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportJSON(): SerializedAttributionNode {
    return {
      ...super.exportJSON(),
      author: this.__author,
      timestamp: this.__timestamp,
    };
  }

  static importJSON(serialized: SerializedAttributionNode): AttributionNode {
    return new AttributionNode(serialized.author || null, serialized.timestamp || null).updateFromJSON(serialized);
  }

  decorate(): JSX.Element {
    return <AttributionComponent nodeKey={this.getKey()} author={this.__author} timestamp={this.__timestamp} />;
  }
}

export function $isAttributionNode(node: LexicalNode | null | undefined): node is AttributionNode {
  return node instanceof AttributionNode;
}

export function $createAttributionNode(author: string | null, timestamp: string | null) {
  return new AttributionNode(author, timestamp);
}
