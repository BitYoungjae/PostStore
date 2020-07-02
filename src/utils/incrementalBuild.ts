import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isTest } from '../common';

const ALGORITHM = 'sha1';
const buildInfoPath = path.resolve(process.cwd(), './.poststore.buildinfo');

export const getCachedData = <T>(content: string): T | undefined => {
  if (isTest) return;

  const hash = makeHash(content);
  const buildInfo = loadBuildInfo(buildInfoPath);

  return buildInfo[hash] as T;
};

export const saveCache = <T>(content: string, data: T) => {
  if (isTest) return;

  const hash = makeHash(content);
  const deepCopied = JSON.parse(JSON.stringify(data));
  buildInfo[hash] = deepCopied;
  buildInfoFileSave();
};

interface BuildInfo<T> {
  [hash: string]: T;
}

let buildInfo: BuildInfo<unknown>;
const loadBuildInfo = (
  buildInfoPath: string,
  shouldUpdate: boolean = false,
) => {
  if (buildInfo && shouldUpdate === false) return buildInfo;

  try {
    const rawInfo = fs.readFileSync(buildInfoPath, 'utf8');
    buildInfo = JSON.parse(rawInfo);
  } catch {
    buildInfo = {};
  }

  return buildInfo;
};

const makeHash = (content: string) =>
  crypto.createHash(ALGORITHM).update(content, 'utf8').digest('base64');

const debounce = (fn: Function, time: number = 1000) => {
  let timerId: NodeJS.Timeout;
  return () => {
    if (timerId) clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn();
    }, time);
  };
};

const buildInfoFileSave = debounce(async () => {
  const stringified = JSON.stringify(buildInfo, null, 2);
  await fs.promises.writeFile(buildInfoPath, stringified, 'utf8');
});
