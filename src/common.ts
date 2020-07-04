import path from 'path';
import crypto from 'crypto';
import { findNode, findNodeAll } from './utils/visit';
import chalk from 'chalk';
import { FileNode, CategoryNode, PostNode } from './typings';
import { Path } from './typings';

export const isDev = process.env['NODE_ENV'] === 'development' ? true : false;
export const isTest = process.env['NODE_ENV'] === 'test' ? true : false;
export const isProduction =
  process.env['NODE_ENV'] === 'production' ? true : false;

export const isCategoryNode = (node: FileNode): node is CategoryNode =>
  node.type === 'category';
export const isPostNode = (node: FileNode): node is PostNode =>
  node.type === 'post';

export const findCategory = (rootNode: FileNode, categories: string[]) => {
  let now: FileNode | undefined = rootNode;

  for (const category of categories) {
    const finded = findNode(
      now,
      (node) => isCategoryNode(node) && node.slug === category,
    );
    if (!finded) break;
    now = finded;
  }

  return now;
};

export const getPostsAll = (rootNode: FileNode) =>
  findNodeAll(rootNode, isPostNode) as PostNode[];

export const getCategoriesAll = (rootNode: FileNode) =>
  findNodeAll(rootNode, isCategoryNode);

export const getTagsAll = (rootNode: FileNode) => {
  const posts = getPostsAll(rootNode);
  const tags = posts.reduce((tagList, now) => {
    now.postData.tags.forEach((tag) => tagList.add(tag));
    return tagList;
  }, new Set<string>());

  return [...tags];
};

export const getPostBy = (propName: keyof PostNode) => (
  rootNode: FileNode,
  value: string,
): PostNode | undefined => {
  const finded = findNode(
    rootNode,
    (node) => isPostNode(node) && node[propName] === value,
  );
  if (finded && isPostNode(finded)) return finded;
};

export const getPostBySlug = getPostBy('slug');
export const getPostByPath = getPostBy('path');

export const getPostsByCategories = (
  rootNode: FileNode,
  categories: string[],
) => {
  const categoryNode = findCategory(rootNode, categories);
  const posts = getPostsAll(categoryNode);

  return posts;
};

export const getPostsByTags = (rootNode: FileNode, tags: string[]) => {
  return findNodeAll(rootNode, (node) => {
    if (!isPostNode(node)) return false;

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

export const pagePathFilter = (pathList: Path[], slug: string) =>
  pathList
    .map((path) => path.params[slug])
    .filter((slug) => !isPageSlug(slug as string[])) as string[][];

export const getStyledErrorMsg = (msg: string, inputValue?: string) => {
  const styledMsg = chalk`{red.bold Error :} {yellow ${msg}}{green.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;

  return styledMsg;
};

const ALGORITHM = 'sha1';
export const makeHash = (
  content: string,
  encoding: crypto.HexBase64Latin1Encoding = 'base64',
) => crypto.createHash(ALGORITHM).update(content, 'utf8').digest(encoding);

export const isSubDir = (parent: string, child: string): boolean => {
  const [normalizedParentPath, normalizedChildPath] = [parent, child].map(
    path.normalize,
  );

  const relativePath = path.relative(normalizedParentPath, normalizedChildPath);

  if (!relativePath) return false;

  const splittedPath = relativePath.split(path.sep);
  const isDotSegment = splittedPath[0] !== '..';

  return isDotSegment ? true : false;
};
