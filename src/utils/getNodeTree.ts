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
  nodePath: string;
  type?: FileNode['type'];
  slugMap?: Map<string, boolean>;
}

export async function getNodeTree({
  nodePath,
  type = 'category',
  slugMap = new Map(),
}: getNodeTreeProps): Promise<FileNode> {
  const newNode: FileNode = await createNode(nodePath, type, slugMap);

  if (isPostNode(newNode)) return newNode;

  const children = await fsPromise.readdir(nodePath, {
    withFileTypes: true,
    encoding: 'utf-8',
  });

  if (!children.length) return newNode;

  newNode.children = [];

  for (const node of children) {
    const nextNodePath = `${nodePath}/${node.name}`;

    if (isDirectory(node)) {
      const newCategoryNode = await getNodeTree({
        nodePath: nextNodePath,
        type: 'category',
        slugMap,
      });
      newNode.children.push(newCategoryNode);
    } else if (isMarkdown(node)) {
      const newPostNode = (await getNodeTree({
        nodePath: nextNodePath,
        type: 'post',
        slugMap,
      })) as PostNode;

      const { isPublished, html } = newPostNode.postData;
      if (!isPublished || !html) continue;

      newNode.children.push(newPostNode);
    }
  }

  newNode.children = sortChildren(newNode.children);

  return newNode;
}

const createNode = async (
  nodePath: string,
  type: FileNode['type'],
  slugMap: Map<string, boolean>,
): Promise<FileNode> => {
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
