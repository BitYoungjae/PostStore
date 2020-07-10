import { GlobalProp, MainProp } from './prop';
import { PageCategory } from './common';

export interface PageProp<T extends PageCategory> {
  param: string;
  global: GlobalProp;
  main: MainProp<T>;
}

export type PostPageProp = PageProp<'post'>;
export type ListPageProp = PageProp<'category'>;
