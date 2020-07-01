import { snapshotPath } from './env';
import path from 'path';
import fs from 'fs';
import isEqual from 'lodash.isequal';
const fsPromise = fs.promises;

export const snapShotTest = async (
  data: any,
  snapshotName: string,
  shouldUpdate = false,
): Promise<boolean> => {
  const snapshotFilePath = path.resolve(
    snapshotPath,
    `${snapshotName}.snapshot.json`,
  );

  const saveSnapshot = () => {
    const newJSON = JSON.stringify(data, null, 2);
    fsPromise.writeFile(snapshotFilePath, newJSON, 'utf-8');
  };

  try {
    const prevJSON = await fsPromise.readFile(snapshotFilePath, 'utf-8');
    const prevData = JSON.parse(prevJSON);

    if (shouldUpdate) saveSnapshot();

    return isEqual(data, prevData);
  } catch (e) {
    const errorCode = e.code;
    if (errorCode === 'ENOENT') saveSnapshot();

    return false;
  }
};
