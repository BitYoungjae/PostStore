import { PostStore, StoreOption } from '../typings';
import {
  MODE_TEST,
  MODE_DEV,
  MODE_PRODUCTION,
  DEFAULT_PARAM_VALUE,
  DEFAULT_PERPAGE_VALUE,
} from '../lib/constants';
import { storeMap } from './common';
import { makeStore } from './makeStore';
import { startWatchMode } from './watchMode';
import { getStyledInfoMsg } from '../lib/msgHandler';

export const getStore = async ({
  postDir,
  storeName,
  perPage = DEFAULT_PERPAGE_VALUE,
  pageParam = DEFAULT_PARAM_VALUE,
  shouldUpdate = MODE_TEST,
  watchMode = MODE_DEV,
  incremental = true,
}: StoreOption): Promise<PostStore> => {
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

  if (MODE_PRODUCTION || MODE_TEST) return store;

  console.log(
    getStyledInfoMsg(
      'New store has been created.',
      `name : ${store.info.name}`,
    ),
  );

  return store;
};
