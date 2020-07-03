import { buildInfoFileSave } from './utils/incrementalBuild';
import {
  PageParamOption,
  PerPageOption,
  PostStore,
  FileNode,
  Path,
  PostData,
} from './typings';
import { isDev, isTest, pagePathFilter, getPostsByCategories } from './common';
import { getNodeTree } from './utils/getNodeTree';
import { getPathList } from './pathGenerator';
import { makePropList } from './propGenerator';

const defaultParam = 'slug';
const defaultCount = 10;
const defaultParamOption: Required<PageParamOption> = {
  page: defaultParam,
  category: defaultParam,
  post: defaultParam,
  tag: defaultParam,
};
const defaultCountOption: Required<PerPageOption> = {
  page: defaultCount,
  category: defaultCount,
  tag: defaultCount,
};

export interface getStoreProps {
  postDir: string;
  perPage?: number | PerPageOption;
  pageParam?: string | PageParamOption;
  shouldUpdate?: boolean;
  incremental?: boolean;
}

const storeMap: Map<string, PostStore> = new Map();

export const getStore = async ({
  postDir,
  perPage = 10,
  pageParam = 'slug',
  shouldUpdate = isDev || isTest,
  incremental = true,
}: getStoreProps): Promise<PostStore> => {
  const cachedStore = storeMap.get(postDir);
  if (cachedStore && !shouldUpdate) return cachedStore;

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

  const store: PostStore = {
    postDir,
    rootNode,
    pathList,
    propList,
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
      ? { ...defaultParamOption, ...paramOption }
      : defaultParamOption;
  let countOptionResult =
    typeof PerPageOption === 'object'
      ? { ...defaultCountOption, ...PerPageOption }
      : defaultCountOption;

  return [paramOptionResult, countOptionResult];
};
