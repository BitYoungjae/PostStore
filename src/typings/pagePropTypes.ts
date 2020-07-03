import { GlobalProp, MainProp } from './propTypes';
import { PageCategory } from './commonTypes';

export interface PageProp<T extends PageCategory> {
  global: GlobalProp;
  main: MainProp<T>;
}

export type PostPageProp = PageProp<'post'>;
export type ListPageProp = PageProp<'category'>;
