import type { Node } from 'unist';
import path from 'path';
import url from 'url';
import { selectAll } from 'unist-util-select';
import { PostStoreAsset, PostInfo } from '../typings';
import { makeHash } from '../lib/common';
import { rehypeImageNode } from './types';
import { DEFAULT_ASSET_DIRNAME } from '../lib/constants';

const isURL = (input: string) => !!url.parse(input).protocol;

export default (filePath: string, info: PostInfo) => () => {
  return (root: Node) => {
    info.assets = [];

    const imageNodes = selectAll(
      'element[tagName="img"]',
      root,
    ) as rehypeImageNode[];

    const imageNodeHandler = (node: rehypeImageNode) => {
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

      if (node.properties.alt === 'thumbnail') {
        if (!node.properties.className) node.properties.className = [];
        node.properties.className.push('thumbnail-image');
        info.thumbnail = targetPath;
      }

      info.assets!.push(assetInfo);
    };

    imageNodes.forEach(imageNodeHandler);
    if (!info.thumbnail) {
      info.thumbnail = '';
    }

    return root;
  };
};
