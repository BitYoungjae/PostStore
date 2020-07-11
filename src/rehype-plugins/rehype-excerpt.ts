import type { Node } from 'unist';
import { selectAll } from 'unist-util-select';
import { PostInfo } from '../typings';

interface ParagraphNode extends Node {
  value?: string;
}

export default (info: PostInfo, length = 256) => () => {
  return (root: Node) => {
    const nodes = selectAll(
      'element[tagName="p"] text',
      root,
    ) as ParagraphNode[];
    const fullText = nodes.reduce(
      (excerpt, { value }) =>
        value && value.trim() ? `${excerpt} ${value}` : excerpt,
      '',
    );

    info.excerpt = fullText.trim().substr(0, length) + '...' || '';

    return root;
  };
};
