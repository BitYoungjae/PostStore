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
  sortRule,
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
  PageCategory,
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
    pageCategory: 'category',
  });

  const tag: PropList['tag'] = makeListPageProp({
    rootNode,
    pathList: pathList.tag,
    perPage: perPageOption.tag,
    pageParam: paramOption.tag,
    getPostsFn: getPostsByTags,
    pageCategory: 'tag',
  });

  const page: PropList['page'] = makeListPageProp({
    rootNode,
    perPage: perPageOption.page,
    pathList: pathList.page,
    pageParam: paramOption.page,
    getPostsFn: getPostsAll,
    sort: true,
    pageCategory: 'page',
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

const makeCategoryTree = (rootNode: FileNode, isRoot = true): PropInfoNode => {
  const newNode: PropInfoNode = {
    name: rootNode.name,
    slug: rootNode.slug,
    postCount: getPostsAll(rootNode).length,
  };

  if (!rootNode.children) return newNode;

  for (const child of rootNode.children) {
    if (isCategoryNode(child)) {
      if (!newNode.childList) newNode.childList = [];

      if (isRoot) {
        newNode.childList.push(makeCategoryTree(child, false));
        continue;
      }

      const childNode = makeCategoryTree(
        {
          ...child,
          ...{ slug: `${newNode.slug}/${child.slug}` },
        },
        false,
      );

      newNode.childList.push(childNode);
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
  pageCategory: PageCategory;
  getPostsFn?: (rootNode: FileNode, slug?: string[]) => PostNode[];
  perPage?: number;
  sort?: boolean;
}

const makeListPageProp = ({
  rootNode,
  pathList,
  pageParam,
  pageCategory,
  perPage = 10,
  getPostsFn = getPostsAll,
  sort = false,
}: makePropListProps): ObjectMap<ListProp> => {
  const propMap: ObjectMap<ListProp> = {};

  for (const path of pathList) {
    const slug = path.params[pageParam] as string[];
    const isPage = isPageSlug(slug);
    const trimmedSlug = trimPagePath(slug);
    const posts = getPostsFn(rootNode, trimmedSlug);
    const totalPage = getTotalPage(posts.length, perPage);

    if (sort) posts.sort(sortRule);

    const currentPage = isPage ? getPageNum(slug) : 1;
    const postList = getPostsByPage(posts, currentPage, perPage).map(
      (node) => node.postData,
    );

    const count = postList.length;
    const joinedSlug = slug.join('/');

    const prop: ListProp = {
      slug: joinedSlug,
      pageCategory,
      count,
      currentPage,
      perPage,
      postList,
      totalPage,
    };

    propMap[joinedSlug] = prop;
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

    postMap[slug] = { slug, postData, relatedPosts, pageCategory: 'post' };
  }

  return postMap;
};
