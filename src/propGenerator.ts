import { PostData } from './postParser';
import { FileNode, PostNode } from './utils/getNodeTree';
import { PathList, Path } from './pathGenerator';
import type { ObjectMap, SubTypeWithoutObjectMap } from './utils/helperTypes';
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
  isDev,
  isCategoryNode,
} from './common';

export interface PostListProp {
  count: number;
  currentPage: number;
  perPage: number;
  totalPage: number;
  postList: PostData[];
}

export interface PostProp extends PostData {
  relatedPosts: PostData[];
}

interface PropInfo {
  slug: string;
  name: string;
  postCount: number;
}

interface PropInfoNode extends PropInfo {
  children?: PropInfoNode[];
}

export interface GlobalProp {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  categoryTree?: PropInfoNode;
  tagList?: PropInfo[];
  buildTime: number;
}

export type PropListSubType<K extends keyof PropList> = SubTypeWithoutObjectMap<
  PropList,
  K
>;

export interface PropList {
  global: GlobalProp;
  category: ObjectMap<PostListProp>;
  page: ObjectMap<PostListProp>;
  tag: ObjectMap<PostListProp>;
  post: ObjectMap<PostProp>;
}

interface getPropListProps {
  rootNode: FileNode;
  pathList: PathList;
  slugOption: Required<SlugOption>;
  perPage?: number;
}

export const getPropList = ({
  rootNode,
  pathList,
  slugOption,
  perPage = 10,
}: getPropListProps): PropList => {
  const global: PropList['global'] = getGlobalProps(rootNode);
  const category: PropList['category'] = makePropList({
    rootNode,
    perPage,
    pathList: pathList.category,
    slugName: slugOption.category,
    getPostsFn: getPostsByCategories,
  });

  const tag: PropList['tag'] = makePropList({
    rootNode,
    perPage,
    pathList: pathList.tag,
    slugName: slugOption.tag,
    getPostsFn: getPostsByTags,
  });

  const page: PropList['page'] = makePropList({
    rootNode,
    perPage,
    pathList: pathList.page,
    slugName: slugOption.page,
    getPostsFn: getPostsAll,
  });

  const post = makePostPropList(rootNode, pathList.post, slugOption.post);

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
  const buildTime = isDev ? 0 : Date.now();
  const categoryTree = makeCategoryTree(rootNode);
  const tagList = makeTagList(rootNode);

  return {
    categoryCount,
    postCount,
    tagCount,
    categoryTree,
    tagList,
    buildTime,
  };
};

const makeCategoryTree = (rootNode: FileNode): PropInfoNode => {
  const newNode: PropInfoNode = {
    name: rootNode.name,
    slug: rootNode.slug,
    postCount: getPostsAll(rootNode).length,
  };

  for (const child of rootNode.children!) {
    if (isCategoryNode(child)) {
      if (!newNode.children) newNode.children = [];
      newNode.children.push(makeCategoryTree(child));
    }
  }

  return newNode;
};

const makeTagList = (rootNode: FileNode): PropInfo[] => {
  const tags = getTagsAll(rootNode);
  const infoList = tags.map((tag) => ({
    name: tag,
    slug: tag,
    postCount: getPostsByTags(rootNode, [tag]).length,
  }));

  return infoList;
};

interface makePropListProps {
  rootNode: FileNode;
  pathList: Path[];
  slugName: string;
  getPostsFn?: (rootNode: FileNode, slug?: string[]) => PostNode[];
  perPage?: number;
}

const makePropList = ({
  rootNode,
  pathList,
  slugName,
  perPage = 10,
  getPostsFn = getPostsAll,
}: makePropListProps): ObjectMap<PostListProp> => {
  const propMap: ObjectMap<PostListProp> = {};

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
      perPage,
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
    const categories = postData.categories;
    let relatedPosts: PostData[] = [];

    if (categories.length > 0) {
      relatedPosts = getPostsByCategories(rootNode, categories)
        .filter((node) => node.slug !== slug)
        .map((node) => node.postData);
    }

    postMap[slug] = { ...post.postData, relatedPosts };
  }

  return postMap;
};
