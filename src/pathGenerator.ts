import { FileNode } from './utils/getNodeTree';
import {
  isCategory,
  isPost,
  getPostsAll,
  SlugOption,
  getTagsAll,
  getTotalPage,
} from './common';
import { findNodeAll } from './utils/visit';

export interface Path {
  params: {
    [paramName: string]: string | string[];
  };
}

export interface PathList {
  post: Path[];
  category: Path[];
  tag: Path[];
  page: Path[];
}

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
    if (isCategory(node)) {
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
      (node) => isPost(node) && node.postData.tags.includes(tag),
    );
    pagePaths.forEach((path) => tagPaths.push([tag, ...path]));
  }

  return tagPaths;
};

export const getPagePaths = (
  rootNode: FileNode,
  perPage = 5,
  nodeCondition: (node: FileNode) => boolean = isPost,
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
  slugOption: SlugOption;
  perPage: number;
}

export const getPathList = (options: getPathListProps): PathList => {
  const { rootNode, slugOption, perPage } = options;

  const {
    category: categorySlug,
    page: pageSlug,
    post: postSlug,
    tag: tagSlug,
  } = slugOption as Required<SlugOption>;

  const convertToPostPath = convertToPath(postSlug);
  const convertToCategoryPath = convertToPath(categorySlug);
  const convertToPagePath = convertToPath(pageSlug);
  const convertToTagPath = convertToPath(tagSlug);

  const postList = getPostsAll(rootNode);
  const post = postList.map(({ slug }) => convertToPostPath(slug));
  const category = getCategoriesPaths(rootNode, perPage).map(
    convertToCategoryPath,
  );
  const page = getPagePaths(rootNode, perPage).map(convertToPagePath);
  const tag = getTagsPaths(rootNode, perPage).map(convertToTagPath);

  return {
    post,
    category,
    page,
    tag,
  };
};
