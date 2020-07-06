import path from 'path';
import url from 'url';
import type { Node } from 'unist';
import visit from 'unist-util-visit';
import { PostStoreAsset } from '../typings';
import { makeHash } from '../lib/common';

interface rehypeNode extends Node {
  tagName: string;
  properties: {
    className?: string[];
    [key: string]: string[] | undefined;
  };
  children?: (Node & { value: string })[];
}

interface rehypeImageNode extends rehypeNode {
  tagName: 'img';
  properties: rehypeNode['properties'] & {
    src: string;
    alt?: string;
  };
}

const isImageNode = (node: rehypeNode): node is rehypeImageNode => {
  if (node.tagName === 'img' && node.properties && node.properties.src != null)
    return true;
  return false;
};

const isURL = (input: string) => !!url.parse(input).protocol;

const nodeEditor = (filePath: string, assetStore: PostStoreAsset[]) => (
  node: rehypeNode,
) => {
  assetStore;
  if (isImageNode(node)) {
    const { src } = node.properties;
    const decodedPath = decodeURIComponent(src);
    const { isAbsolute } = path;

    let sourcePath: string = decodedPath;
    let extName: string = '';

    if (!isURL(sourcePath) && !isAbsolute(sourcePath)) {
      const fileDir = path.dirname(filePath);
      sourcePath = path.resolve(fileDir, decodedPath);
      extName = path.extname(sourcePath);
    }

    const targetPath = 'assets/' + makeHash(sourcePath, 'hex') + extName;

    const assetInfo: PostStoreAsset = {
      sourcePath,
      targetPath,
    };

    node.properties.src = targetPath;
    assetStore.push(assetInfo);
  }
};

export default (filePath: string, assetStore: PostStoreAsset[]) => () => {
  return (root) => {
    return visit(root, 'element', nodeEditor(filePath, assetStore));
  };
};
