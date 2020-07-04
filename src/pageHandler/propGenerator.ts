import {
  getCategoriesAll,
  getPostsAll,
  getTagsAll,
  getPostsByCategories,
  getTotalPage,
  isPageSlug,
  trimPagePath,
  getPostsByPage,
  getPageNum,
  getPostsByTags,
  getPostBySlug,
  isCategoryNode,
} from '../lib/common';
import {
  FileNode,
  PathList,
  PageParamOption,
  PropList,
  Path,
  PostNode,
  ObjectMap,
  ListProp,
  PostData,
  PropInfoNode,
  PropInfo,
  PerPageOption,
} from '../typings';
import { MODE_DEV, MODE_TEST } from '../lib/constants';

interface getPropListProps {
  rootNode: FileNode;
  pathList: PathList;
  paramOption: Required<PageParamOption>;
  perPageOption: Required<PerPageOption>;
}

export const makePropList = ({
  rootNode,
  pathList,
  paramOption,
  perPageOption,
}: getPropListProps): PropList => {
  const global: PropList['global'] = makeGlobalProp(rootNode);

  const category: PropList['category'] = makeListPageProp({
    rootNode,
    pathList: pathList.category,
    perPage: perPageOption.category,
    pageParam: paramOption.category,
    getPostsFn: getPostsByCategories,
  });

  const tag: PropList['tag'] = makeListPageProp({
    rootNode,
    pathList: pathList.tag,
    perPage: perPageOption.tag,
    pageParam: paramOption.tag,
    getPostsFn: getPostsByTags,
  });

  const page: PropList['page'] = makeListPageProp({
    rootNode,
    perPage: perPageOption.page,
    pathList: pathList.page,
    pageParam: paramOption.page,
    getPostsFn: getPostsAll,
  });

  const post = makePostPageProp(rootNode, pathList.post, paramOption.post);

  return {
    global,
    category,
    page,
    tag,
    post,
  };
};

const makeGlobalProp = (rootNode: FileNode): PropList['global'] => {
  const categoryCount = getCategoriesAll(rootNode).length - 1;
  const postCount = getPostsAll(rootNode).length;
  const tagCount = getTagsAll(rootNode).length;
  const buildTime = MODE_DEV || MODE_TEST ? 0 : Date.now();
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
  pageParam: string;
  getPostsFn?: (rootNode: FileNode, slug?: string[]) => PostNode[];
  perPage?: number;
}

const makeListPageProp = ({
  rootNode,
  pathList,
  pageParam,
  perPage = 10,
  getPostsFn = getPostsAll,
}: makePropListProps): ObjectMap<ListProp> => {
  const propMap: ObjectMap<ListProp> = {};

  for (const path of pathList) {
    const slug = path.params[pageParam] as string[];
    const isPage = isPageSlug(slug);
    const trimmedSlug = trimPagePath(slug);
    const posts = getPostsFn(rootNode, trimmedSlug);
    const totalPage = getTotalPage(posts.length, perPage);

    const currentPage = isPage ? getPageNum(slug) : 1;
    const postList = getPostsByPage(posts, currentPage, perPage).map(
      (node) => node.postData,
    );
    const count = postList.length;

    const prop: ListProp = {
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

const makePostPageProp = (
  rootNode: FileNode,
  pathList: Path[],
  pageParam: string,
): PropList['post'] => {
  const postMap: PropList['post'] = {};

  for (const path of pathList) {
    const slug = path.params[pageParam] as string;
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
