import { getNodeTree, FileNode } from './utils/getNodeTree';
import { PropList, getPropList } from './propGenerator';
import { PathList, getPathList, Path } from './pathGenerator';
import {
  SlugOption,
  getPostsByCategories,
  pagePathFilter,
  isTest,
  isDev,
} from './common';
import { PostData } from './postParser';
import { buildInfoFileSave } from './utils/incrementalBuild';

interface PostStore {
  postDir: string;
  rootNode: FileNode;
  propList: PropList;
  pathList: PathList;
}

export interface getStoreProps {
  postDir: string;
  slugOption?: SlugOption;
  perPage?: number;
  shouldUpdate?: boolean;
  incrementalBuild?: boolean;
}

const defaultSlugs: Required<SlugOption> = {
  category: 'slug',
  tag: 'slug',
  post: 'slug',
  page: 'slug',
};

let store: PostStore;

export const getStore = async ({
  postDir,
  perPage = 10,
  slugOption = defaultSlugs,
  shouldUpdate = isDev || isTest,
  incrementalBuild = true,
}: getStoreProps): Promise<PostStore> => {
  if (store && !shouldUpdate) return store;

  const filledSlugOption: Required<SlugOption> = {
    ...defaultSlugs,
    ...slugOption,
  };

  const rootNode = await getNodeTree({
    nodePath: postDir,
  });

  const pathList = getPathList({
    perPage,
    slugOption: filledSlugOption,
    rootNode: rootNode,
  });

  appendExtraToPost(rootNode, pathList.category, filledSlugOption.category);

  const propList = getPropList({
    perPage,
    slugOption: filledSlugOption,
    pathList: pathList,
    rootNode: rootNode,
  });

  store = {
    postDir,
    rootNode,
    pathList,
    propList,
  };

  if (incrementalBuild) buildInfoFileSave();

  return store;
};

const appendExtraToPost = (
  rootNode: FileNode,
  categoryPathList: Path[],
  categorySlug: string,
) => {
  const trimmedCategories = pagePathFilter(categoryPathList, categorySlug);

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
