import { getNodeTree, FileNode, PostNode } from './utils/getNodeTree';
import { PropList, getPropList } from './propGenerator';
import { PathList, getPathList, Path } from './pathGenerator';
import { SlugOption, isPageSlug, getPostsByCategories } from './common';

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
}: getStoreProps): Promise<PostStore> => {
  if (store) return store;

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

  return store;
};

const appendExtraToPost = (
  rootNode: FileNode,
  categoryPathList: Path[],
  categorySlug: string,
) => {
  const trimmedCategories = categoryPathList
    .map((path) => path.params[categorySlug])
    .filter((slug) => !isPageSlug(slug as string[])) as string[][];

  for (const category of trimmedCategories) {
    const posts = getPostsByCategories(rootNode, category);
    let prev: PostNode | undefined;
    for (const post of posts) {
      if (prev) {
        prev.postData.nextPost = post.slug;
        post.postData.prevPost = prev.slug;
      }
      post.postData.categories = category;
      prev = post;
    }
  }
};
