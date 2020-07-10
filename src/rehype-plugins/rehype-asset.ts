import type { Node } from 'unist';
import path from 'path';
import url from 'url';
import visit from 'unist-util-visit';
import { PostStoreAsset } from '../typings';
import { makeHash } from '../lib/common';
import { rehypeNode, rehypeImageNode } from './types';
import { DEFAULT_ASSET_DIRNAME } from '../lib/constants';

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

    if (isURL(decodedPath)) return;

    let sourcePath: string = decodedPath;
    let extName: string = '';

    if (!isAbsolute(sourcePath)) {
      const fileDir = path.dirname(filePath);
      sourcePath = path.resolve(fileDir, decodedPath);
      extName = path.extname(sourcePath);
    }

    const hashedPath = makeHash(sourcePath, 'hex');
    const targetPath = `/${DEFAULT_ASSET_DIRNAME}/${hashedPath}${extName}`;

    const assetInfo: PostStoreAsset = {
      sourcePath,
      targetPath,
    };

    node.properties.src = targetPath;
    assetStore.push(assetInfo);
  }
};

export default (filePath: string, assetStore: PostStoreAsset[]) => () => {
  return (root: Node) => {
    return visit(root, 'element', nodeEditor(filePath, assetStore));
  };
};
