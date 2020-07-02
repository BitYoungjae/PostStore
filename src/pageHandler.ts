import { getStore, getStoreProps } from './store';
import chalk from 'chalk';
import {
  GlobalProp,
  PropList,
  PropListSubType,
  PostListProp,
} from './propGenerator';
import { Path, PathList } from './pathGenerator';

type PageCategory = keyof PropList & keyof PathList;

interface PageProp<T extends PageCategory> {
  global: GlobalProp;
  main: PropListSubType<T>;
}

export type PostPageProp = PageProp<'post'>;
export type PostListPageProp = PageProp<'category'>;

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

  async function getPropsBySlug(slug: string | string[]): Promise<PageProp<T>> {
    const store = await getStore({
      postDir,
      slugOption,
      perPage,
    });

    const propList = store.propList[pageCategory] as PropListSubType<T>;
    const key = Array.isArray(slug) ? slug.join('/') : slug;
    const mainProp = propList[key];

    if (!mainProp) {
      throw new Error(
        `The data corresponding to the slug(${key}) does not exist.`,
      );
    }

    return {
      global: store.propList.global,
      main: mainProp,
    };
  }

  return {
    getPathsBySlug,
    getPropsBySlug,
  };
};

export const getMainPageHandler = ({
  postDir,
  slugOption,
  perPage = 10,
}: getStoreProps) => {
  async function getMainProps(): Promise<PageProp<'page'>> {
    const store = await getStore({
      postDir,
      slugOption,
      perPage,
    });

    const propList = store.propList.page;
    const mainKey = 'page/1';
    const mainProp = propList[mainKey];

    const emptyProp: PostListProp = {
      count: 0,
      currentPage: 0,
      postList: [],
      totalPage: 0,
      perPage,
    };

    if (!mainProp) {
      console.log(
        chalk`{red.bold Caution :} Since There are no posts in the {yellow.bold (${postDir})} path, the following default values is delivered.`,
      );
      console.log('\u001b[2m──────────────\u001b[22m');
      console.log(
        chalk`{blue.bold Default Prop :}\n{yellow ${JSON.stringify({
          global: store.propList.global,
          main: emptyProp,
        })}}`,
      );
    }

    return {
      global: store.propList.global,
      main: mainProp == null ? emptyProp : mainProp,
    };
  }

  return { getMainProps };
};

export const getCategoryPageHandler = makePageHandler('category');
export const getPostPageHandler = makePageHandler('post');
export const getTagPageHandler = makePageHandler('tag');
export const getPageHandler = makePageHandler('page');
