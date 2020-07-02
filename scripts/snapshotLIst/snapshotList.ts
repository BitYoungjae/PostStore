import { testPath } from '../../tests/lib/env';
import { getStore } from '../../src/store';
import { snapShotTest, onlyFileName } from '../lib/snapshotTest';
import { getCategoriesPaths } from '../../src/pathGenerator';
import { getNodeTree, FileNode } from '../../src/utils/getNodeTree';
import { getPostsByCategories } from '../../src/common';
import { getMainPageHandler } from '../../src/pageHandler';

let rootNode: FileNode;

export const getRootNode = async () => {
  if (rootNode) return rootNode;

  rootNode = await getNodeTree({ nodePath: testPath });
  return rootNode;
};

export type SnapshotGenerator = (shoudUpdate: boolean) => Promise<boolean>;

export async function propListSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const store = await getStore({ postDir: testPath, perPage: 2 });

  const tests = [
    snapShotTest(store.propList.category, 'propList.category', shoudUpdate),
    snapShotTest(store.propList.tag, 'propList.tag', shoudUpdate),
    snapShotTest(store.propList.page, 'propList.page', shoudUpdate),
    snapShotTest(store.propList.post, 'propList.post', shoudUpdate),
    snapShotTest(store.propList.global, 'propList.global', shoudUpdate),
  ];

  const testResults = (await Promise.all(tests)).every(
    (result) => result === true,
  );

  return testResults;
}

export async function getCategoriesPathSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const rootNode = await getRootNode();
  const categories = getCategoriesPaths(rootNode);
  const testResult = await snapShotTest(
    categories,
    'getCategoriesPaths',
    shoudUpdate,
  );

  return testResult;
}

export async function getNodeTreeSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const rootNode = await getRootNode();
  const testResult = await snapShotTest(rootNode, 'fileTree', shoudUpdate);

  return testResult;
}

export async function sortTestSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const rootNode = await getRootNode();

  const sortByDate = onlyFileName(
    getPostsByCategories(rootNode, ['테스트용-게시물들', '날짜순-정렬']),
  );
  const sortByName = onlyFileName(
    getPostsByCategories(rootNode, ['테스트용-게시물들', '제목순-정렬']),
  );
  const sortByComplex = onlyFileName(
    getPostsByCategories(rootNode, ['테스트용-게시물들', '복합-정렬']),
  );

  const testResult = await snapShotTest(
    { sortByDate, sortByName, sortByComplex },
    'sortTest',
    shoudUpdate,
  );

  return testResult;
}

export async function getMainPageHandlerSnapshot(
  shouldUpdate: boolean = false,
) {
  const { getMainProps } = getMainPageHandler({
    postDir: testPath,
  });

  const mainProps = await getMainProps();
  const testResult = await snapShotTest(
    mainProps,
    'getMainPageHandler',
    shouldUpdate,
  );

  return testResult;
}
