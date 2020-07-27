import path from 'path';
import { getStore } from '../store/getStore';
import chalk from 'chalk';
import { getStyledErrorMsg, getStyledCautionMsg } from '../lib/msgHandler';
import {
  PageCategory,
  Path,
  PageProp,
  MainProp,
  ListProp,
  StoreOption,
  UseConfigOption,
  ShortPostData,
  GlobalProp,
} from '../typings';
import { loadConfig } from './loadConfig';
import { makePathStore } from '../store/makeStore';

type makePageHandlerProps = StoreOption | UseConfigOption;

const makePageHandler = <T extends PageCategory>(pageCategory: T) => (
  option: makePageHandlerProps,
) => {
  const storeOption = normalizeOption(option);

  async function getPathsBySlug(): Promise<Path[]> {
    const { postDir, perPage, pageParam } = await storeOption;
    const store = await makePathStore({
      postDir,
      perPage,
      pageParam,
    });

    const pathList = store.pathList[pageCategory];

    return pathList;
  }

  async function getPropsBySlug(
    param: string | string[],
  ): Promise<PageProp<T>> {
    const store = await getStore(await storeOption);
    const propList = store.propList[pageCategory];
    const key = Array.isArray(param) ? param.join('/') : param;
    const mainProp = propList[key] as MainProp<T>;

    if (!mainProp) {
      throw new Error(
        getStyledErrorMsg(
          `The data corresponding to the param does not exist.`,
          `input param : ${param}`,
        ),
      );
    }

    if (isListPage(mainProp)) {
      const refinedPostList: ShortPostData[] = mainProp.postList.map(
        ({ slug, title, date, thumbnail, excerpt, categories, tags }) => ({
          slug,
          title,
          date,
          thumbnail,
          excerpt,
          categories,
          tags,
        }),
      );

      const newMainProp = { ...(mainProp as ListProp) };
      newMainProp.postList = refinedPostList;

      return {
        param: key,
        global: store.propList.global,
        main: newMainProp as MainProp<T>,
      };
    }

    return {
      param: key,
      global: store.propList.global,
      main: mainProp,
    };
  }

  return {
    getPathsBySlug,
    getPropsBySlug,
  };
};

export const getMainPageHandler = (option: makePageHandlerProps) => {
  const storeOption = normalizeOption(option);

  async function getMainProps(): Promise<PageProp<'page'>> {
    const store = await getStore(await storeOption);

    const propList = store.propList.page;
    const mainKey = 'page/1';
    const mainProp = propList[mainKey];

    const emptyProp: ListProp = {
      slug: mainKey,
      pageCategory: 'page',
      count: 0,
      currentPage: 0,
      postList: [],
      totalPage: 0,
      perPage: 0,
    };

    if (!mainProp) {
      console.log(
        getStyledCautionMsg(
          'Since There are no posts in the [postDir] path, the following default values is delivered.',
          `postDir: ${path.basename(store.info.postDir)}`,
        ),
      );
      console.log('\u001b[2m──────────────\u001b[22m');
      console.log(
        chalk`{blue.bold Default Prop :}\n{yellow ${JSON.stringify(
          {
            global: store.propList.global,
            main: emptyProp,
          },
          null,
          2,
        )}}`,
      );
    }

    return {
      param: mainKey,
      global: store.propList.global,
      main: mainProp == null ? emptyProp : mainProp,
    };
  }

  return { getMainProps };
};

export const getGlobalPageHandler = (option: makePageHandlerProps) => {
  const storeOption = normalizeOption(option);

  async function getMainProps(): Promise<GlobalProp> {
    const store = await getStore(await storeOption);

    return {
      ...store.propList.global,
    };
  }

  return { getMainProps };
};

const isConfigOption = (
  option: makePageHandlerProps,
): option is UseConfigOption => {
  if ((option as UseConfigOption).useConfig) return true;
  return false;
};

const normalizeOption = async (
  option: makePageHandlerProps,
): Promise<StoreOption> => {
  if (isConfigOption(option)) {
    const storeOption = await loadConfig(option);
    return storeOption;
  }

  if (!option.postDir) {
    throw new Error(getStyledErrorMsg('The postDir parameter is required.'));
  }

  const storeOption = option;
  return storeOption;
};

const isListPage = (a: MainProp<any>): a is ListProp => {
  return a.pageCategory !== 'post';
};

export const getCategoryPageHandler = makePageHandler('category');
export const getPostPageHandler = makePageHandler('post');
export const getTagPageHandler = makePageHandler('tag');
export const getPageHandler = makePageHandler('page');
