import { Clone } from './helper';
import { PropList } from './prop';
import { FileNode } from './node';
import { PathList } from './path';

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

export interface PathStore extends Pick<PostStore, 'pathList'> {}
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
