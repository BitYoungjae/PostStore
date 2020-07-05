import { PerPageOption, PageParamOption, PostStore } from '../typings';
import { MODE_TEST, MODE_DEV, MODE_PRODUCTION } from '../lib/constants';
import { storeMap } from './common';
import { makeStore } from './makeStore';
import { startWatchMode } from './watchMode';
import { getStyledInfoMsg } from '../lib/msgHandler';

export interface getStoreProps {
  postDir: string;
  storeName?: string;
  perPage?: number | PerPageOption;
  pageParam?: string | PageParamOption;
  shouldUpdate?: boolean;
  watchMode?: boolean;
  incremental?: boolean;
}

export const getStore = async ({
  postDir,
  storeName,
  perPage = 10,
  pageParam = 'slug',
  shouldUpdate = MODE_TEST,
  watchMode = MODE_DEV,
  incremental = true,
}: getStoreProps): Promise<PostStore> => {
  const cachedStore = storeMap.get(postDir);
  if (cachedStore && (!shouldUpdate || watchMode)) return cachedStore;

  const paramToMakeStore = {
    postDir,
    storeName,
    perPage,
    pageParam,
    incremental,
  };

  const store = await makeStore(paramToMakeStore);
  if (watchMode && !MODE_PRODUCTION) startWatchMode(paramToMakeStore);

  if (MODE_PRODUCTION) return store;

  console.log(
    getStyledInfoMsg(
      'New store has been created.',
      `name : ${store.info.name}`,
    ),
  );

  return store;
};
