import { PerPageOption, PageParamOption, PostStore } from '../typings';
import { MODE_TEST, MODE_DEV } from '../lib/constants';
import { storeMap } from './common';
import { makeStore } from './makeStore';
import { startWatchMode } from './watchMode';

export interface getStoreProps {
  postDir: string;
  perPage?: number | PerPageOption;
  pageParam?: string | PageParamOption;
  shouldUpdate?: boolean;
  watchMode?: boolean;
  incremental?: boolean;
}

export const getStore = async ({
  postDir,
  perPage = 10,
  pageParam = 'slug',
  shouldUpdate = MODE_TEST,
  watchMode = MODE_DEV,
  incremental = true,
}: getStoreProps): Promise<PostStore> => {
  const cachedStore = storeMap.get(postDir);
  if (cachedStore && (!shouldUpdate || watchMode)) return cachedStore;

  const store = await makeStore({ postDir, perPage, pageParam, incremental });
  if (watchMode) startWatchMode({ postDir, perPage, pageParam, incremental });

  return store;
};
