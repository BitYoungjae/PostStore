import { PerPageOption, PageParamOption } from './common';

export interface PostStoreConfig {
  storeOption: StoreOption | StoreOption[];
}

export interface StoreOption {
  postDir: string;
  storeName?: string;
  perPage?: number | PerPageOption;
  pageParam?: string | PageParamOption;
  shouldUpdate?: boolean;
  watchMode?: boolean;
  incremental?: boolean;
  imageMaxWidth?: number;
}

export interface UseConfigOption {
  useConfig: true;
  storeName?: string;
  configPath?: string;
}
