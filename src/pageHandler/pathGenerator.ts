import {
  isCategoryNode,
  isPostNode,
  getPostsAll,
  getTagsAll,
  getTotalPage,
} from '../lib/common';
import { findNodeAll } from '../lib/visit';
import {
  Path,
  FileNode,
  PageParamOption,
  PathList,
  PerPageOption,
} from '../typings';

export const convertToPath = (paramName: string) => (
  slug: string | string[],
): Path => ({
  params: {
    [paramName]: slug,
  },
});

export const getCategoriesPaths = (
  rootNode: FileNode,
  perPage: number = 10,
  parents: string[] = [],
) => {
  const result: string[][] = [];

  if (!rootNode.children) return result;

  if (parents.length) {
    result.push(parents);
    const pagePaths = getPagePaths(rootNode, perPage);
    pagePaths.forEach((path) => result.push([...parents, ...path]));
  }

  for (const node of rootNode.children) {
    if (isCategoryNode(node)) {
      const category = [...parents, node.slug];
      result.push(...getCategoriesPaths(node, perPage, category));
    }
  }

  return result;
};

export const getTagsPaths = (
  rootNode: FileNode,
  perPage: number = 10,
): string[][] => {
  const tagPaths: string[][] = [];
  const tags = getTagsAll(rootNode);

  for (const tag of tags) {
    tagPaths.push([tag]);
    const pagePaths = getPagePaths(
      rootNode,
      perPage,
      (node) => isPostNode(node) && node.postData.tags.includes(tag),
    );
    pagePaths.forEach((path) => tagPaths.push([tag, ...path]));
  }

  return tagPaths;
};

export const getPagePaths = (
  rootNode: FileNode,
  perPage = 5,
  nodeCondition: (node: FileNode) => boolean = isPostNode,
) => {
  const pagePaths: string[][] = [];

  const posts = findNodeAll(rootNode, nodeCondition);
  const length = posts.length;
  const pageCount = getTotalPage(length, perPage);
  const prefix = 'page';

  for (let i = 1; i <= pageCount; i++) {
    pagePaths.push([prefix, `${i}`]);
  }

  return pagePaths;
};

interface getPathListProps {
  rootNode: FileNode;
  paramOption: Required<PageParamOption>;
  perPageOption: Required<PerPageOption>;
}

export const getPathList = ({
  rootNode,
  paramOption: {
    category: categoryParam,
    page: pageParam,
    post: postParam,
    tag: tagParam,
  },
  perPageOption: {
    page: pagesPerMain,
    category: pagesPerCategoryPage,
    tag: pagesPerTagPage,
  },
}: getPathListProps): PathList => {
  const convertToPostPath = convertToPath(postParam);
  const convertToCategoryPath = convertToPath(categoryParam);
  const convertToPagePath = convertToPath(pageParam);
  const convertToTagPath = convertToPath(tagParam);

  const postList = getPostsAll(rootNode);
  const post = postList.map(({ slug }) => convertToPostPath(slug));
  const category = getCategoriesPaths(rootNode, pagesPerCategoryPage).map(
    convertToCategoryPath,
  );
  const page = getPagePaths(rootNode, pagesPerMain).map(convertToPagePath);
  const tag = getTagsPaths(rootNode, pagesPerTagPage).map(convertToTagPath);

  return {
    post,
    category,
    page,
    tag,
  };
};
