import { getStore, getStoreProps } from './store';
import {
  GlobalProp,
  PostListProp,
  PostProp,
  PropList,
  PropType,
} from './propGenerator';
import { Path, PathList } from './pathGenerator';

type PageCategory = keyof PropList & keyof PathList;

interface PageProp<T> {
  global: GlobalProp;
  main: T;
}

export type PostPageProp = PageProp<PostProp>;
export type PostListPageProp = PageProp<PostListProp>;

const makePageHandler = <T extends PageCategory>(pageCategory: T) => ({
  postDir,
  slugOption,
  perPage = 10,
}: getStoreProps) => {
  async function getPathsBySlug(): Promise<Path[]> {
    const store = await getStore({
      postDir,
      slugOption,
      perPage,
    });

    const pathList = store.pathList[pageCategory];
    return pathList;
  }

  async function getPropsBySlug(
    slug: string | string[],
  ): Promise<PageProp<PropType<T>>> {
    const store = await getStore({
      postDir,
      slugOption,
      perPage,
    });

    const propList = store.propList[pageCategory] as PropType<T>;
    const key = Array.isArray(slug) ? slug.join('/') : slug;

    return {
      global: store.propList.global,
      main: propList[key],
    };
  }

  return {
    getPathsBySlug,
    getPropsBySlug,
  };
};

export const getCategoryPageHandler = makePageHandler('category');
export const getPostPageHandler = makePageHandler('post');
export const getTagPageHandler = makePageHandler('tag');
export const getPageHandler = makePageHandler('page');
