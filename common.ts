import { FileNode, PostNode, CategoryNode } from './utils/getNodeTree';
import { findNode, findNodeAll } from './utils/visit';

export interface SlugOption {
  category?: string;
  tag?: string;
  post?: string;
  page?: string;
}

export const isCategory = (node: FileNode): node is CategoryNode =>
  node.type === 'category';
export const isPost = (node: FileNode): node is PostNode =>
  node.type === 'post';

export const findCategory = (rootNode: FileNode, categories: string[]) => {
  let now: FileNode | undefined = rootNode;

  for (const category of categories) {
    const finded = findNode(
      now,
      (node) => isCategory(node) && node.slug === category,
    );
    if (!finded) break;
    now = finded;
  }

  return now;
};

export const getPostsAll = (rootNode: FileNode) =>
  findNodeAll(rootNode, isPost) as PostNode[];

export const getCategoriesAll = (rootNode: FileNode) =>
  findNodeAll(rootNode, isCategory);

export const getTagsAll = (rootNode: FileNode) => {
  const posts = getPostsAll(rootNode);
  const tags = posts.reduce((tagList, now) => {
    now.postData.tags.forEach((tag) => tagList.add(tag));
    return tagList;
  }, new Set<string>());

  return [...tags];
};

export const getPostBySlug = (
  rootNode: FileNode,
  slug: string,
): PostNode | undefined => {
  const finded = findNode(
    rootNode,
    (node) => isPost(node) && node.slug === slug,
  );
  if (finded && isPost(finded)) return finded;
};

export const getPostsByCategories = (
  rootNode: FileNode,
  categories: string[],
) => {
  const categoryNode = findCategory(rootNode, categories);
  const posts = getPostsAll(categoryNode);

  return posts;
};

export const getPostsByTag = (rootNode: FileNode, tag: string) =>
  findNodeAll(
    rootNode,
    (node) => isPost(node) && node.postData.tags.includes(tag),
  );

export const getPostsByTags = (rootNode: FileNode, tags: string[]) => {
  return findNodeAll(rootNode, (node) => {
    if (!isPost(node)) return false;

    let isMatch = false;
    const postTags = node.postData.tags;
    isMatch = tags.some((tag) => postTags.includes(tag));
    return isMatch;
  }) as PostNode[];
};

export const getPostsByPage = (
  postList: PostNode[],
  page: number,
  perPage = 5,
) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return postList.slice(start, end);
};

export const getTotalPage = (total: number, perPage: number) => {
  return Math.ceil(total / perPage);
};

export const isPageSlug = (slug: string[]): boolean => {
  const pagePointer = slug.length - 2;
  if (pagePointer < 0) return false;
  if (slug[pagePointer].toLowerCase() === 'page') return true;

  return false;
};

export const trimPagePath = (slug: string[]): string[] => {
  if (!isPageSlug(slug)) return slug;
  return slug.slice(0, -2);
};

export const getPageNum = (slug: string[]): number => {
  if (!isPageSlug(slug)) return -1;
  return +slug[slug.length - 1];
};
