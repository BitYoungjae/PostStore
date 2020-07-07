import { platform } from 'process';
import { PageParamOption, PerPageOption } from '../typings';

export const MODE_DEV =
  process.env['NODE_ENV'] === 'development' ? true : false;
export const MODE_TEST = process.env['NODE_ENV'] === 'test' ? true : false;
export const MODE_PRODUCTION =
  process.env['NODE_ENV'] === 'production' ? true : false;

export const PLATFROM_DARWIN = platform === 'darwin';
export const HASH_ALGORITHM = 'sha1';

export const NODE_TYPE_CATEGORY = 'category';
export const NODE_TYPE_POST = 'post';

export const DEFAULT_PARAM_VALUE = 'slug';
export const DEFAULT_PERPAGE_VALUE = 10;

export const DEFAULT_BUILDINFO_PATH = './.poststore.buildInfo';
export const DEFAULT_CONFIG_PATH = './poststore.config.js';
export const DEFAULT_ASSET_DIRNAME = 'assets';

export const DEFAULT_PARAM_OPTION: Required<PageParamOption> = {
  page: DEFAULT_PARAM_VALUE,
  category: DEFAULT_PARAM_VALUE,
  post: DEFAULT_PARAM_VALUE,
  tag: DEFAULT_PARAM_VALUE,
};

export const DEFAULT_PERPAGE_OPTION: Required<PerPageOption> = {
  page: DEFAULT_PERPAGE_VALUE,
  category: DEFAULT_PERPAGE_VALUE,
  tag: DEFAULT_PERPAGE_VALUE,
};

export const CONFIG_EXAMPLE = `export default {
  storeOption: StoreOption | StoreOption[]
}

interface StoreOption {
  postDir: string;
  storeName?: string;
  perPage?: number | PerPageOption;
  pageParam?: string | PageParamOption;
  shouldUpdate?: boolean;
  watchMode?: boolean;
  incremental?: boolean;
}`;
