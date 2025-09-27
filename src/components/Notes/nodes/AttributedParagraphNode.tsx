import { ElementNode, SerializedElementNode, DOMExportOutput, NodeKey } from 'lexical';

type SerializedAttributedParagraphNode = SerializedElementNode & {
    type: 'attributed-paragraph';
    attribution?: { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string } | null;
};

export class AttributedParagraphNode extends ElementNode {
    __attribution: { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string } | null;

    static getType(): string {
        return 'attributed-paragraph';
    }

    static clone(node: AttributedParagraphNode): AttributedParagraphNode {
        return new AttributedParagraphNode(node.__attribution, node.__key);
    }

    constructor(attribution: { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string } | null = null, key?: NodeKey) {
        super(key);
        this.__attribution = attribution || null;
    }

    createDOM(): HTMLElement {
        const p = document.createElement('p');
        return p;
    }

    updateDOM(): boolean {
        return false;
    }

    static importDOM(): null {
        return null;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('p');
        return { element };
    }

    exportJSON(): SerializedAttributedParagraphNode {
        const children = this.getChildren().map((c) => (c && typeof c.exportJSON === 'function' ? c.exportJSON() : null)).filter(Boolean) as Array<unknown>;
        const json: SerializedAttributedParagraphNode = {
            type: 'attributed-paragraph',
            version: 1,
            children,
            attribution: this.__attribution || null,
        } as SerializedAttributedParagraphNode;
        return json;
    }

    setAttribution(attribution: { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string } | null) {
        this.getWritable();
        this.__attribution = attribution || null;
    }

    getAttribution() {
        return this.__attribution || null;
    }
}

export function $createAttributedParagraphNode(attribution: { lastEditedBy?: { id?: string; name?: string } | null; lastEditedAt?: string } | null = null) {
    return new AttributedParagraphNode(attribution);
}

export function $isAttributedParagraphNode(node: unknown): node is AttributedParagraphNode {
    return node instanceof AttributedParagraphNode && node.getType() === 'attributed-paragraph';
}
