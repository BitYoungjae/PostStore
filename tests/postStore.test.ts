import { getStore } from '../src/store';
import { getPostsByCategories, getPostBySlug } from '../src/common';
import { testPath } from './lib/env';
import { getCategoriesPaths } from '../src/pathGenerator';
import { snapShotTest } from './lib/snapshotTest';
import { getNodeTree, FileNode } from '../src/utils/getNodeTree';

let rootNode: FileNode;

beforeAll(async () => {
  rootNode = await getNodeTree({ nodePath: testPath });
});

test('getCategoriesPaths', async () => {
  const categories = getCategoriesPaths(rootNode);
  const testResult = await snapShotTest(categories, 'getCategoriesPaths');

  expect(testResult).toBe(true);
});

test('getPostsByCategories', async () => {
  const posts = getPostsByCategories(rootNode, ['javascript', '특별-시리즈']);

  expect(
    posts.some(
      (node) => node.name.normalize() === '자바스크립트의 모든 것 1탄.md',
    ),
  ).toBe(true);
});

test('getPostsBySlug', async () => {
  const post = getPostBySlug(rootNode, '2020-06-22-자바스크립트의-모든-것-1탄');

  expect(post?.postData.title).toBe('자바스크립트의 모든 거엇!');
});

test('propList Snapshot Test', async () => {
  const store = await getStore({ postDir: testPath, perPage: 2 });

  const tests = [
    snapShotTest(store.propList.category, 'propList.category'),
    snapShotTest(store.propList.tag, 'propList.tag'),
    snapShotTest(store.propList.page, 'propList.page'),
    snapShotTest(store.propList.post, 'propList.post'),
    snapShotTest(store.propList.global, 'propList.global'),
  ];

  const testResults = await Promise.all(tests);
  const result = testResults.every((r) => r === true);

  expect(result).toBe(true);
});
