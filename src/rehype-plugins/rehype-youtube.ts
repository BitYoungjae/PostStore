import visit from 'unist-util-visit';
import type { Node } from 'unist';
import unified from 'unified';
import rehypeParse from 'rehype-parse';
import { rehypeNode, rehypeLinkNode } from './types';

interface VideoInfo {
  videoID: string;
  startTime?: string;
}

const embedableLinkRegex = /https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_\-]+)(\?start=(\d+))?[-a-zA-Z0-9()@:%_\+.~#?&//=]*!!/i;

const getIframeCode = ({ videoID, startTime }: VideoInfo) => {
  const appendix = startTime ? `?start=${startTime}` : '';
  const result = `<iframe src="https://www.youtube.com/embed/${videoID}${appendix}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  return result;
};

const isLinkNode = (node: rehypeNode): node is rehypeLinkNode => {
  if (node.tagName === 'a' && node.properties && node.properties.href != null)
    return true;
  return false;
};

const isEmbedable = (href: string) => embedableLinkRegex.test(href);

const getVideoInfo = (href: string): VideoInfo | undefined => {
  const executed = embedableLinkRegex.exec(href);

  if (!executed) return;

  const videoID = executed[2];
  const startTime = executed[4];

  return {
    videoID,
    startTime,
  };
};

const setCode = (node: rehypeNode, code: string) => {
  const fragment = unified()
    .use(rehypeParse, { fragment: true })
    .parse(code) as rehypeNode;

  if (!fragment.children) return;

  node.tagName = fragment.tagName;
  node.type = fragment.type;
  if (!node.properties.className) node.properties.className = [];
  node.properties.className.push('youtube-video-iframe');
  node.children = [...fragment.children];
};

const nodeEditor = (node: rehypeNode) => {
  if (isLinkNode(node)) {
    const href = node.properties.href;
    if (!isEmbedable(href)) return;

    const videoInfo = getVideoInfo(href);
    if (!videoInfo) return;

    const iframeCode = getIframeCode(videoInfo);
    setCode(node, iframeCode);
  }
  return;
};

export default () => {
  return (root: Node) => {
    return visit(root, 'element', nodeEditor);
  };
};
