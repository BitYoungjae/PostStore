import fs from 'fs';
import path from 'path';
import { PostStoreAsset, FileNode } from '../typings';
import { getPostsAll } from '../lib/common';
import { DEFAULT_ASSET_DIRNAME } from '../lib/constants';

const fsPromise = fs.promises;

export const copyAssetsTo = (publicDir: string) => async (
  assetList: PostStoreAsset[],
) => {
  const assetDir = path.resolve(publicDir, `./${DEFAULT_ASSET_DIRNAME}`);
  try {
    await fsPromise.stat(assetDir);
  } catch (e) {
    if (e.code === 'ENOENT') fsPromise.mkdir(assetDir, { recursive: true });
  }

  const operations = assetList.map(({ sourcePath, targetPath }) => {
    return fsPromise.copyFile(
      sourcePath,
      path.resolve(publicDir, targetPath),
      fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE,
    );
  });

  const settledResult = (await Promise.allSettled(operations)).map(
    (res) => res.status,
  );

  const result = {
    fulfilled: settledResult.filter((status) => status === 'fulfilled').length,
    rejected: settledResult.filter((status) => status === 'rejected').length,
  };

  return result;
};

export const getAssetList = (rootNode: FileNode) => {
  const postList = getPostsAll(rootNode).map((node) => node.postData);
  const assetList = postList.reduce((acc, now) => {
    if (now.assets) acc = acc.concat(now.assets);
    return acc;
  }, [] as PostStoreAsset[]);

  return assetList;
};
