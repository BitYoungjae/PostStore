import { PostData, ShortPostData, PageCategory } from './common';
import { SubTypeWithoutObjectMap, ObjectMap } from './helper';

export interface PropList {
  global: GlobalProp;
  category: ObjectMap<ListProp>;
  page: ObjectMap<ListProp>;
  tag: ObjectMap<ListProp>;
  post: ObjectMap<PostProp>;
}

export interface CoreProp {
  pageCategory: PageCategory;
  slug: string;
}

export interface ListProp extends CoreProp {
  count: number;
  currentPage: number;
  perPage: number;
  totalPage: number;
  postList: ShortPostData[];
}

export interface PostProp extends CoreProp {
  postData: PostData;
  relatedPosts: PostData[];
}

export interface GlobalProp {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  categoryTree?: PropInfoNode;
  tagList?: PropInfo[];
  buildTime: number;
}

export type MainProp<K extends PageCategory> = K extends 'post'
  ? PostProp
  : ListProp;

export interface PropInfo {
  slug: string;
  name: string;
  postCount: number;
}

export interface PropInfoNode extends PropInfo {
  childList?: PropInfoNode[];
}
