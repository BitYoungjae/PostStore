import fs from 'fs';
import path, { extname } from 'path';
import { PostStoreAsset, FileNode } from '../typings';
import { getPostsAll } from '../lib/common';
import { DEFAULT_ASSET_DIRNAME, MODE_PRODUCTION } from '../lib/constants';
import sharp from 'sharp';
import { getStyledLogMsg } from '../lib/msgHandler';

const fsPromise = fs.promises;

export const copyAssetsTo = (publicDir: string, imageMaxWidth = 600) => async (
  assetList: PostStoreAsset[],
) => {
  const assetDir = path.resolve(publicDir, `./${DEFAULT_ASSET_DIRNAME}`);

  try {
    // 프로덕션 빌드시에는 asset 디렉터리를 초기화 함
    if (MODE_PRODUCTION) {
      await fsPromise.rmdir(assetDir, { recursive: true });
    }
    await fsPromise.stat(assetDir);
  } catch (e) {
    if (e.code === 'ENOENT') fsPromise.mkdir(assetDir, { recursive: true });
  }

  const operations = assetList.map(async ({ sourcePath, targetPath }) => {
    const writePath = path.join(publicDir, targetPath);

    // 이미 생성된 파일은 패스
    try {
      await fsPromise.stat(writePath);
    } catch {
      const ext = extname(sourcePath);

      if (['.jpeg', '.jpg', '.png'].includes(ext)) {
        const image = sharp(sourcePath);
        const metadata = await image.metadata();
        const width = metadata.width;

        if (width && width > imageMaxWidth) {
          image.resize({ width: imageMaxWidth });
        }

        if (ext === '.png') {
          image.png();
        } else if (['.jpeg', '.jpg'].includes(ext)) {
          image.jpeg();
        }

        return image.trim().toFile(writePath);
      }

      return fsPromise.copyFile(
        sourcePath,
        path.join(publicDir, targetPath),
        fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE,
      );
    }

    return Promise.reject();
  });

  const settledResult = (await Promise.allSettled(operations)).map(
    (res) => res.status,
  );

  const result = {
    fulfilled: settledResult.filter((status) => status === 'fulfilled'),
    rejected: settledResult.filter((status) => status === 'rejected'),
  };

  const settledLength = result.fulfilled.length;

  if (settledLength > 0) {
    const resultMsg = `${result.fulfilled.length} image files have been created.`;
    console.log(getStyledLogMsg(resultMsg));
  }

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
