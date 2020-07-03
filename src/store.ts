import { buildInfoFileSave } from './utils/incrementalBuild';
import {
  SlugOption,
  PageOption,
  PostStore,
  FileNode,
  Path,
  PostData,
} from './typings';
import { isDev, isTest, pagePathFilter, getPostsByCategories } from './common';
import { getNodeTree } from './utils/getNodeTree';
import { getPathList } from './pathGenerator';
import { getPropList } from './propGenerator';

export interface getStoreProps {
  postDir: string;
  perPage?: number;
  slugOption?: SlugOption;
  pageOption?: PageOption;
  shouldUpdate?: boolean;
  incremental?: boolean;
}

const defaultSlugs: Required<SlugOption> = {
  category: 'slug',
  tag: 'slug',
  post: 'slug',
  page: 'slug',
};

const storeMap: Map<string, PostStore> = new Map();

export const getStore = async ({
  postDir,
  perPage = 10,
  slugOption = defaultSlugs,
  shouldUpdate = isDev || isTest,
  incremental = true,
}: getStoreProps): Promise<PostStore> => {
  const cachedStore = storeMap.get(postDir);
  if (cachedStore && !shouldUpdate) return cachedStore;

  const filledSlugOption: Required<SlugOption> = {
    ...defaultSlugs,
    ...slugOption,
  };

  const rootNode = await getNodeTree({
    rootPath: postDir,
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
