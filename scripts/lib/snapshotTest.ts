import { snapshotPath } from '../../tests/lib/env';
import path from 'path';
import fs from 'fs';
import isEqual from 'lodash.isequal';
import { FileNode } from '../../src/utils/getNodeTree';
const fsPromise = fs.promises;

export const onlyFileName = (nodeList: FileNode[]) =>
  nodeList.map((node) => node.name.normalize());

export const snapShotTest = async (
  data: any,
  snapshotName: string,
  shouldUpdate = false,
): Promise<boolean> => {
  const snapshotFilePath = makeSnapShotFilePath(snapshotPath, snapshotName);

  const saveSnapshot = async () => {
    const newJSON = JSON.stringify(data, null, 2);
    const dirName = path.dirname(snapshotFilePath);
    await fsPromise.mkdir(dirName, { recursive: true });
    fsPromise.writeFile(snapshotFilePath, newJSON, { flag: 'w' });
  };

  try {
    const prevJSON = await fsPromise.readFile(snapshotFilePath, 'utf-8');
    const prevData = JSON.parse(prevJSON);

    if (shouldUpdate) await saveSnapshot();

    return isEqual(data, prevData);
  } catch (e) {
    const errorCode = e.code;
    if (errorCode === 'ENOENT') saveSnapshot();

    return false;
  }
};

const makeSnapShotFilePath = (snapshotPath: string, snapshotName: string) =>
  path.resolve(snapshotPath, `${snapshotName}.snapshot.json`);
