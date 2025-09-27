import { describe, test, expect } from 'vitest';
import { createEditor, ParagraphNode, TextNode } from 'lexical';
import { $createUserParagraphNode } from '../nodes/UserParagraphNode';

describe('UserParagraphNode', () => {
  test('can be created and serialized with attribution', async () => {
    const editor = createEditor({ namespace: 'UserParagraphNodeTest', nodes: [ParagraphNode, TextNode] });
    await editor.update(() => {
      const node = $createUserParagraphNode();
      node.setAttribution({
        createdBy: { userId: 'u1', userName: 'Alice' },
        createdAt: '2020-01-01T00:00:00.000Z',
        lastModifiedBy: { userId: 'u1', userName: 'Alice' },
        lastModifiedAt: '2020-01-01T00:00:00.000Z',
        version: 1,
      });

      const json = node.exportJSON();
  expect(json.attribution).toBeDefined();
  expect(json.attribution!.createdBy!.userId).toBe('u1');
    });
  });
});
