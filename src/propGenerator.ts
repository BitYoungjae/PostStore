import { PostData } from './postParser';
import { FileNode, PostNode } from './utils/getNodeTree';
import { PathList, Path } from './pathGenerator';
import {
  getCategoriesAll,
  getPostsAll,
  getTagsAll,
  SlugOption,
  getPostsByCategories,
  getTotalPage,
  isPageSlug,
  trimPagePath,
  getPostsByPage,
  getPageNum,
  getPostsByTags,
  getPostBySlug,
} from './common';

export interface PostListProp {
  count: number;
  currentPage: number;
  totalPage: number;
  postList: PostData[];
}

export interface PostProp extends PostData {
  relatedPosts: PostData[];
}

export interface GlobalProp {
  postCount: number;
  categoryCount: number;
  tagCount: number;
}

interface PropMap<T> {
  [key: string]: T;
}

export type PropType<K extends keyof PropList> = PropList[K] extends PropMap<
  infer R
>
  ? R
  : never;

export interface PropList {
  global: GlobalProp;
  category: PropMap<PostListProp>;
  page: PropMap<PostListProp>;
  tag: PropMap<PostListProp>;
  post: PropMap<PostProp>;
}

interface getPropListProps {
  rootNode: FileNode;
  pathList: PathList;
  slugOption: SlugOption;
  perPage?: number;
}

export const getPropList = (options: getPropListProps): PropList => {
  const { rootNode, pathList, slugOption, perPage = 10 } = options;
  const global: PropList['global'] = getGlobalProps(rootNode);
  const category: PropList['category'] = makePropList({
    rootNode,
    perPage,
    pathList: pathList.category,
    slugName: slugOption.category!,
    getPostsFn: getPostsByCategories,
  });

  const tag: PropList['tag'] = makePropList({
    rootNode,
    perPage,
    pathList: pathList.tag,
    slugName: slugOption.tag!,
    getPostsFn: getPostsByTags,
  });

  const page: PropList['page'] = makePropList({
    rootNode,
    perPage,
    pathList: pathList.page,
    slugName: slugOption.page!,
    getPostsFn: getPostsAll,
  });

  const post = makePostPropList(rootNode, pathList.post, slugOption.post!);

  return {
    global,
    category,
    page,
    tag,
    post,
  };
};

const getGlobalProps = (rootNode: FileNode): PropList['global'] => {
  const categoryCount = getCategoriesAll(rootNode).length - 1;
  const postCount = getPostsAll(rootNode).length;
  const tagCount = getTagsAll(rootNode).length;

  return {
    categoryCount,
    postCount,
    tagCount,
  };
};

interface getPropProps {
  rootNode: FileNode;
  pathList: Path[];
  slugName: string;
  getPostsFn: (rootNode: FileNode, slug?: string[]) => PostNode[];
  perPage?: number;
}

const makePropList = (options: getPropProps): PropMap<PostListProp> => {
  const { rootNode, pathList, slugName, perPage = 10, getPostsFn } = options;
  const propMap: PropMap<PostListProp> = {};

  for (const path of pathList) {
    const slug = path.params[slugName] as string[];
    const isPage = isPageSlug(slug);
    const trimmedSlug = trimPagePath(slug);
    const posts = getPostsFn(rootNode, trimmedSlug);
    const totalPage = getTotalPage(posts.length, perPage);

    const currentPage = isPage ? getPageNum(slug) : 1;
    const postList = getPostsByPage(posts, currentPage, perPage).map(
      (node) => node.postData,
    );
    const count = postList.length;

    const prop: PostListProp = {
      count,
      currentPage,
      postList,
      totalPage,
    };

    propMap[slug.join('/')] = prop;
  }

  return propMap;
};

const makePostPropList = (
  rootNode: FileNode,
  pathList: Path[],
  slugName: string,
): PropList['post'] => {
  const postMap: PropList['post'] = {};

  for (const path of pathList) {
    const slug = path.params[slugName] as string;
    const post = getPostBySlug(rootNode, slug);

    if (!post) continue;

    const postData = post.postData;
    const categories = postData?.categories;
    let relatedPosts: PostData[] = [];

    if (categories?.length > 0) {
      relatedPosts = getPostsByCategories(rootNode, categories)
        .filter((node) => node.slug !== slug)
        .map((node) => node.postData);
    }

    postMap[slug] = { ...post.postData, relatedPosts };
  }

  return postMap;
};
