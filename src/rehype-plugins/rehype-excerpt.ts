import type { Node } from 'unist';
import { selectAll } from 'unist-util-select';
import { PostInfo } from '../typings';

interface ParagraphNode extends Node {
  value?: string;
}

export default (info: PostInfo, length = 180) => () => {
  return (root: Node) => {
    const nodes = selectAll(
      'element[tagName="p"] text',
      root,
    ) as ParagraphNode[];

    const fullText = nodes.reduce((excerpt, { value }) => {
      const trimmedValue = value?.trim();
      if (!trimmedValue) return excerpt;

      return `${excerpt} ${trimmedValue}`;
    }, '');

    const trimmedFullText = fullText.trim();

    if (!trimmedFullText) {
      info.excerpt = '';
      return root;
    }

    const subText = [...trimmedFullText].slice(0, length).join('');
    const ellipsis = trimmedFullText.length > length ? '...' : '';

    info.excerpt = subText.trim() + ellipsis;

    return root;
  };
};
