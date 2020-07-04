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

export interface makeStoreProps
  extends Pick<
    getStoreProps,
    'postDir' | 'perPage' | 'pageParam' | 'incremental'
  > {}

export const makeStore = async ({
  postDir,
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
