import { PostData } from './commonTypes';

export interface FileNode {
  type: PostNode['type'] | CategoryNode['type'];
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
