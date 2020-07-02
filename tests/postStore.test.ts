import { getPostsByCategories, getPostBySlug } from '../src/common';
import { FileNode, getNodeTree } from '../src/utils/getNodeTree';
import {
  propListSnapshot,
  getCategoriesPathSnapshot,
} from '../scripts/snapshotList';
import { testPath } from './lib/env';

let rootNode: FileNode;

beforeAll(async () => {
  rootNode = await getNodeTree({ nodePath: testPath });
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
  expect(post).toBeDefined();
  expect(post?.postData?.title).toBe('자바스크립트의 모든 거엇!');
});

test('propList Snapshot Test', async () => {
  const result = await propListSnapshot();
  expect(result).toBe(true);
});

test('getCategoriesPaths', async () => {
  const testResult = await getCategoriesPathSnapshot();
  expect(testResult).toBe(true);
});
