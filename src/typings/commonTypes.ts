import { Clone } from './helperTypes';
import { PropList } from './propTypes';
import { FileNode } from './nodeTypes';
import { PathList } from './pathTypes';

export type PageCategory = keyof PropList & keyof PathList;

export interface PageParamOption extends Partial<Clone<PageCategory, string>> {}
export interface PerPageOption
  extends Partial<Omit<Clone<PageCategory, number>, 'post'>> {}

export interface PostStore {
  postDir: string;
  rootNode: FileNode;
  propList: PropList;
  pathList: PathList;
}

export interface PostData {
  slug: string;
  title: string;
  tags: string[];
  html: string;
  date: number;
  isPublished: boolean;
  categories: string[];
  prevPost?: PostLink;
  nextPost?: PostLink;
}

interface PostLink extends Pick<PostData, 'slug' | 'title'> {}
