import fs from 'fs';
import path from 'path';

import { PostData, parsePost } from '../postParser';
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
  isFile?: boolean;
}

export async function getNodeTree({
  nodePath,
  isFile = false,
}: getNodeTreeProps): Promise<FileNode> {
  const nodeName = path.basename(nodePath).normalize();

  const newNode: FileNode = {
    type: isFile ? 'post' : 'category',
    name: nodeName,
    slug: isFile ? '' : slugify(nodeName),
    path: nodePath,
  };

  if (isFile) {
    newNode.postData = await parsePost(nodePath);
    newNode.slug = newNode.postData.slug;

    return newNode;
  }

  newNode.children = [];

  const nodeList = await fsPromise.readdir(nodePath, {
    withFileTypes: true,
    encoding: 'utf-8',
  });
  if (!nodeList.length) return newNode;

  for (const node of nodeList) {
    const newPath = `${nodePath}/${node.name}`;

    if (isDirectory(node)) {
      newNode.children.push(await getNodeTree({ nodePath: newPath }));
    } else if (isMarkdown(node)) {
      newNode.children.push(
        await getNodeTree({
          nodePath: newPath,
          isFile: true,
        }),
      );
    }
  }

  newNode.children = sortChildren(newNode.children);
  return newNode;
}

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
