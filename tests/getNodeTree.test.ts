import { testPath } from './lib/env';
import { getNodeTree, FileNode } from '../src/utils/getNodeTree';
import { snapShotTest } from './lib/snapshotTest';
import { getPostsByCategories } from '../src/common';

const onlyFileName = (nodeList: FileNode[]) =>
  nodeList.map((node) => node.name.normalize());

test('getNodeTree', async () => {
  const fileTree = await getNodeTree({
    nodePath: testPath,
  });

  const testResult = await snapShotTest(fileTree, 'fileTree');
  expect(testResult).toBe(true);
});

test('sort test', async () => {
  const fileTree = await getNodeTree({
    nodePath: testPath,
  });

  const sortByDate = onlyFileName(
    getPostsByCategories(fileTree, ['테스트용-게시물들', '날짜순-정렬']),
  );
  const sortByName = onlyFileName(
    getPostsByCategories(fileTree, ['테스트용-게시물들', '제목순-정렬']),
  );
  const sortByComplex = onlyFileName(
    getPostsByCategories(fileTree, ['테스트용-게시물들', '복합-정렬']),
  );

  const testResult = await snapShotTest(
    { sortByDate, sortByName, sortByComplex },
    'sortTest',
  );

  expect(testResult).toBe(true);
});
