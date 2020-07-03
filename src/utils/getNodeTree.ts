import fs from 'fs';
import path from 'path';

import { PostData, makePost } from '../postParser';
import { slugify } from './slugify';
import { isCategoryNode, isPostNode } from '../common';

const fsPromise = fs.promises;
const markdownRegex = new RegExp(/\.mdx?$/);

const isDirectory = (dirent: fs.Dirent) => dirent.isDirectory();
const isMarkdown = (dirent: fs.Dirent) =>
  dirent.isFile() && markdownRegex.test(dirent.name);

export interface FileNode {
  type: 'category' | 'post';
  name: string;
  slug: string;
  path: string;
  postData?: PostData;
  children?: FileNode[];
}

export interface PostNode extends FileNode {
  type: 'post';
  postData: PostData;
}

export interface CategoryNode extends FileNode {
  type: 'category';
  children: FileNode[];
}
interface getNodeTreeProps {
  rootPath: string;
  type?: FileNode['type'];
  slugMap?: Map<string, boolean>;
}

export async function getNodeTree({
  rootPath,
  type = 'category',
  slugMap = new Map(),
}: getNodeTreeProps): Promise<FileNode> {
  const node: FileNode = await createNode({
    type,
    slugMap,
    nodePath: rootPath,
  });

  if (isPostNode(node)) return node;

  const subFileList = await fsPromise.readdir(rootPath, {
    withFileTypes: true,
    encoding: 'utf-8',
  });

  if (!subFileList.length) return node;

  node.children = [];

  for (const currentFile of subFileList) {
    const currentFilePath = `${rootPath}/${currentFile.name}`;
    let childNode: FileNode;

    if (isDirectory(currentFile)) {
      childNode = await getNodeTree({
        slugMap,
        rootPath: currentFilePath,
        type: 'category',
      });

      // 자손이 없는 카테고리는 트리에서 제외
      if (!childNode.children || childNode.children.length === 0) {
        continue;
      }
    } else if (isMarkdown(currentFile)) {
      childNode = await getNodeTree({
        slugMap,
        rootPath: currentFilePath,
        type: 'post',
      });

      // publish 상태가 아니거나 본문이 없는 게시물은 트리에서 제외
      const { isPublished, html } = (childNode as PostNode).postData;
      if (!isPublished || !html) continue;
    } else {
      continue;
    }

    node.children.push(childNode);
  }

  node.children = sortChildren(node.children);

  return node;
}

interface createNodeProps {
  nodePath: string;
  type: FileNode['type'];
  slugMap: Map<string, boolean>;
}

const createNode = async ({
  nodePath,
  type,
  slugMap,
}: createNodeProps): Promise<FileNode> => {
  const name = path.basename(nodePath).normalize();
  const newNode: Partial<FileNode> = {
    type,
    name,
    path: nodePath,
  };

  if (type === 'post') {
    const postData = await makePost(nodePath, slugMap);
    const slug = postData.slug;

    newNode.slug = slug;
    newNode.postData = postData;

    return newNode as FileNode;
  }

  newNode.slug = slugify(name);
  return newNode as FileNode;
};

const sortChildren = (nodeList: FileNode[]): FileNode[] => {
  const categoryList = nodeList.filter(isCategoryNode);
  const postList = nodeList.filter(isPostNode);

  categoryList.sort(({ name: aName }, { name: bName }) =>
    aName.localeCompare(bName),
  );
  postList.sort(sortRule);

  return [...categoryList, ...postList];
};

const sortRule = (a: PostNode, b: PostNode): number => {
  const dateDiff = b.postData.date - a.postData.date; // 날짜 기준 내림차순 정렬

  // 같은 날짜인 경우 게시물 제목 기준으로 정렬
  if (dateDiff === 0) {
    const aTitle = a.postData.title.toLowerCase();
    const bTitle = b.postData.title.toLowerCase();

    // 첫 글자만 비교
    const firstCharDiff = aTitle[0].localeCompare(bTitle[0]);
    // 첫 글자도 같을 경우 전체 비교
    if (firstCharDiff === 0) return aTitle.localeCompare(bTitle);

    return firstCharDiff;
  }

  return dateDiff;
};
