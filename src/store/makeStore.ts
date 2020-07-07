import {
  PageParamOption,
  PerPageOption,
  PostStore,
  FileNode,
  Path,
  PostData,
} from '../typings';
import { getStoreProps } from './getStore';
import { getNodeTree } from '../core/getNodeTree';
import { getPathList } from '../pageHandler/pathGenerator';
import { makePropList } from '../pageHandler/propGenerator';
import { buildInfoFileSave } from '../core/incrementalBuild';
import { storeMap } from './common';
import { pagePathFilter, getPostsByCategories } from '../lib/common';
import { getAssetList, copyAssetsTo } from './copyAsset';
import { DEFAULT_PARAM_OPTION, DEFAULT_PERPAGE_OPTION } from '../lib/constants';

export interface makeStoreProps
  extends Omit<getStoreProps, 'shouldUpdate' | 'watchMode'> {}

export const makeStore = async ({
  postDir,
  storeName,
  perPage,
  pageParam,
  incremental,
}: makeStoreProps): Promise<PostStore> => {
  const [paramOption, perPageOption] = normalizeOption(pageParam, perPage);

  const rootNode = await getNodeTree({
    rootPath: postDir,
  });

  const pathList = getPathList({
    paramOption,
    perPageOption,
    rootNode: rootNode,
  });

  appendExtraToPost({
    rootNode,
    categoryPathList: pathList.category,
    categoryParamName: paramOption.category,
  });

  const propList = makePropList({
    paramOption,
    perPageOption,
    rootNode: rootNode,
    pathList: pathList,
  });

  const info: PostStore['info'] = {
    name: storeName ? storeName : rootNode.name,
    postDir: postDir,
  };

  const options: PostStore['options'] = {
    postDir,
    perPage: perPageOption,
    pageParam: paramOption,
  };

  const assetList = getAssetList(rootNode);
  await copyAssetsTo('./public')(assetList);

  const store: PostStore = {
    rootNode,
    pathList,
    propList,
    info,
    options,
  };

  if (incremental) buildInfoFileSave();
  storeMap.set(postDir, store);

  return store;
};

interface appendExtraToPostProps {
  rootNode: FileNode;
  categoryPathList: Path[];
  categoryParamName: string;
}

const appendExtraToPost = ({
  rootNode,
  categoryPathList,
  categoryParamName,
}: appendExtraToPostProps) => {
  const trimmedCategories = pagePathFilter(categoryPathList, categoryParamName);

  for (const category of trimmedCategories) {
    const posts = getPostsByCategories(rootNode, category);
    let prev: PostData | undefined;
    for (const { postData: now } of posts) {
      if (prev) {
        now.prevPost = {
          slug: prev.slug,
          title: prev.title,
        };
        prev.nextPost = {
          slug: now.slug,
          title: now.title,
        };
      }
      now.categories = category;
      prev = now;
    }
  }
};

export const normalizeOption = (
  paramOption: getStoreProps['pageParam'],
  PerPageOption: getStoreProps['perPage'],
): [Required<PageParamOption>, Required<PerPageOption>] => {
  let paramOptionResult =
    typeof paramOption === 'object'
      ? { ...DEFAULT_PARAM_OPTION, ...paramOption }
      : DEFAULT_PARAM_OPTION;
  let countOptionResult =
    typeof PerPageOption === 'object'
      ? { ...DEFAULT_PERPAGE_OPTION, ...PerPageOption }
      : DEFAULT_PERPAGE_OPTION;

  return [paramOptionResult, countOptionResult];
};
