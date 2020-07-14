import { PostData } from './common';
import { SubTypeWithoutObjectMap, ObjectMap } from './helper';

export interface PropList {
  global: GlobalProp;
  category: ObjectMap<ListProp>;
  page: ObjectMap<ListProp>;
  tag: ObjectMap<ListProp>;
  post: ObjectMap<PostProp>;
}

export interface ListProp {
  count: number;
  currentPage: number;
  perPage: number;
  totalPage: number;
  postList: PostData[];
}

export interface GlobalProp {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  categoryTree?: PropInfoNode;
  tagList?: PropInfo[];
  buildTime: number;
}

export type MainProp<K extends keyof PropList> = SubTypeWithoutObjectMap<
  PropList,
  K
>;

export interface PostProp {
  postData: PostData;
  relatedPosts: PostData[];
}

export interface PropInfo {
  slug: string;
  name: string;
  postCount: number;
}

export interface PropInfoNode extends PropInfo {
  children?: PropInfoNode[];
}
