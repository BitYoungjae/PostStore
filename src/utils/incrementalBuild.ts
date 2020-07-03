import fs from 'fs';
import path from 'path';
import { isTest, makeHash } from '../common';

const buildInfoPath = path.resolve(process.cwd(), './.poststore.buildinfo');

export const getCachedData = <T>(
  filePath: string,
  newContent: string,
): T | undefined => {
  if (isTest) return;

  const newHash = makeHash(newContent);
  const buildInfo = loadBuildInfo(buildInfoPath);
  const cachedInfo = buildInfo[filePath];

  if (!cachedInfo) return;

  const { hash: oldHash, content } = cachedInfo;
  if (newHash === oldHash) return content as T;
};

export const saveCache = <T>(filePath: string, content: string, data: T) => {
  if (isTest) return;

  const hash = makeHash(content);
  const deepCopied = JSON.parse(JSON.stringify(data));
  const cacheData = {
    hash,
    content: deepCopied,
  };

  buildInfo[filePath] = cacheData;
};

interface BuildInfo<T> {
  [filePath: string]: {
    hash: string;
    content: T;
  };
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

export const buildInfoFileSave = () => {
  const stringified = JSON.stringify(buildInfo, null, 2);

  if (!stringified) return;

  const writeBuildInfo = () => {
    fs.promises.writeFile(buildInfoPath, stringified, 'utf8');
  };
  fs.promises.unlink(buildInfoPath).then(writeBuildInfo, writeBuildInfo);
};
