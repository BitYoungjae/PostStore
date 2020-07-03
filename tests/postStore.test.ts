import { getPostsByCategories, getPostBySlug } from '../src/common';
import { getNodeTree } from '../src/utils/getNodeTree';
import { testPath } from './lib/env';
import { FileNode } from '../src/typings';

let rootNode: FileNode;

beforeAll(async () => {
  rootNode = await getNodeTree({ rootPath: testPath });
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
