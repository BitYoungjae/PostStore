import { platform } from 'process';

export const MODE_DEV =
  process.env['NODE_ENV'] === 'development' ? true : false;
export const MODE_TEST = process.env['NODE_ENV'] === 'test' ? true : false;
export const MODE_PRODUCTION =
  process.env['NODE_ENV'] === 'production' ? true : false;

export const PLATFROM_DARWIN = platform === 'darwin';
export const HASH_ALGORITHM = 'sha1';

export const NODE_TYPE_CATEGORY = 'category';
export const NODE_TYPE_POST = 'post';
