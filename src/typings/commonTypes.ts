import { Clone } from './helperTypes';
import { PropList } from './propTypes';
import { FileNode } from './nodeTypes';
import { PathList } from './pathTypes';

export type PageCategory = keyof PropList & keyof PathList;

export interface PageParamOption extends Partial<Clone<PageCategory, string>> {}
export interface PerPageOption
  extends Partial<Omit<Clone<PageCategory, number>, 'post'>> {}

export interface PostStore {
  rootNode: FileNode;
  propList: PropList;
  pathList: PathList;
  info: {
    name: string;
    postDir: string;
  };
  options: {
    postDir: string;
    perPage: PerPageOption;
    pageParam: PageParamOption;
  };
}

export interface PostData extends CorePostData, ExtraPostData {}

export interface CorePostData {
  slug: string;
  title: string;
  tags: string[];
  html: string;
  date: number;
  isPublished: boolean;
}

export interface ExtraPostData {
  categories: string[];
  assets?: PostStoreAsset[];
  prevPost?: PostLink;
  nextPost?: PostLink;
}

export interface PostStoreAsset {
  sourcePath: string;
  targetPath: string;
}

interface PostLink extends Pick<PostData, 'slug' | 'title'> {}

export type SlugMap = Map<string, boolean>;

export interface FrontMatter {
  title?: string;
  date?: Date;
  tags?: string[];
  published?: boolean;
}
