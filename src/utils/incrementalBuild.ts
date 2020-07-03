import fs from 'fs';
import path from 'path';
import { isTest, makeHash } from '../common';

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

export const buildInfoFileSave = () => {
  const stringified = JSON.stringify(buildInfo, null, 2);
  const writeBuildInfo = () => {
    fs.promises.writeFile(buildInfoPath, stringified, 'utf8');
    buildInfo = {};
  };
  fs.promises.unlink(buildInfoPath).then(writeBuildInfo, writeBuildInfo);
};
