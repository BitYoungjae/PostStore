import fs from 'fs';
import path from 'path';

import { PostData, parsePost } from '../postParser';
import { slugify } from './slugify';

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
  const nodeName = path.basename(nodePath);

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

  const nodeList = await fsPromise.readdir(nodePath, { withFileTypes: true });
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

  return newNode;
}
