import fs from 'fs';
import path from 'path';

import { makePost } from './postParser';
import { slugify } from '../lib/slugify';
import { isCategoryNode, isPostNode } from '../lib/common';
import { FileNode, PostNode, CategoryNode } from '../typings';
import { NODE_TYPE_CATEGORY, NODE_TYPE_POST } from '../lib/constants';
import { getStyledCautionMsg } from '../lib/msgHandler';
import chalk from 'chalk';

const fsPromise = fs.promises;
const markdownRegex = new RegExp(/\.mdx?$/);

const isDirectory = (dirent: fs.Dirent) => dirent.isDirectory();
const isMarkdown = (dirent: fs.Dirent) =>
  dirent.isFile() && markdownRegex.test(dirent.name);

interface getNodeTreeProps {
  rootPath: string;
  slugMap?: Map<string, boolean>;
}

export async function getNodeTree({
  rootPath,
  slugMap = new Map(),
}: getNodeTreeProps): Promise<FileNode> {
  const node: FileNode = await createCategoryNode({
    slugMap,
    nodePath: rootPath,
  });

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
      });

      // 자손이 없는 카테고리는 트리에서 제외
      if (!childNode.children || childNode.children.length === 0) {
        continue;
      }
    } else if (isMarkdown(currentFile)) {
      try {
        childNode = await createPostNode({
          slugMap,
          nodePath: currentFilePath,
        });

        // publish 상태가 아니거나 본문이 없는 게시물은 트리에서 제외
        const { isPublished, html } = (childNode as PostNode).postData;
        if (!isPublished || !html) continue;
      } catch {
        console.log(
          getStyledCautionMsg(
            chalk`Failed to parse {bold [ ${currentFile.name} ]} file. Please check the file content.`,
          ),
        );
        continue;
      }
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
  slugMap: Map<string, boolean>;
}

const createNode = (type: FileNode['type']) => async ({
  nodePath,
  slugMap,
}: createNodeProps): Promise<FileNode> => {
  const name = path.basename(nodePath).normalize();
  const newNode: Partial<FileNode> = {
    type,
    name,
    path: nodePath,
  };

  if (type === NODE_TYPE_POST) {
    const postData = await makePost({ filePath: nodePath, slugMap });
    const slug = postData.slug;

    newNode.slug = slug;
    newNode.postData = postData;

    return newNode as PostNode;
  }

  newNode.slug = slugify(name);
  return newNode as CategoryNode;
};

const createCategoryNode = createNode(NODE_TYPE_CATEGORY);
const createPostNode = createNode(NODE_TYPE_POST);

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
