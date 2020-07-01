import fs from 'fs';
import { getStore } from '../src/store';
import { getPostsByCategories, getPostBySlug } from '../src/common';
import isEqual from 'lodash.isequal';
import { testPath } from './lib/env';
import { getCategoriesPaths } from '../src/pathGenerator';
import { snapShotTest } from './lib/snapshotTest';

test('getCategoriesPaths', async () => {
  const store = await getStore({ postDir: testPath, perPage: 2 });
  const categories = getCategoriesPaths(store.rootNode);

  const target = [
    ['javascript'],
    ['javascript', 'page', '1'],
    ['javascript', '특별-시리즈'],
    ['javascript', '특별-시리즈', 'page', '1'],
    ['react'],
    ['react', 'page', '1'],
    ['react', '꿀팁-정리'],
    ['react', '꿀팁-정리', 'page', '1'],
    ['react', '리액트-핵심정리'],
    ['react', '리액트-핵심정리', 'page', '1'],
    ['redux'],
    ['redux', 'page', '1'],
    ['테스트용-게시물들'],
    ['테스트용-게시물들', 'page', '1'],
  ];

  expect(isEqual(target, categories)).toBe(true);
});

test('getPostsByCategories', async () => {
  const store = await getStore({ postDir: testPath });
  const posts = getPostsByCategories(store.rootNode, [
    'javascript',
    '특별-시리즈',
  ]);

  expect(posts[0].slug).toBe('2020-06-22-자바스크립트의-모든-것-1탄');
});

test('getPostsBySlug', async () => {
  const store = await getStore({ postDir: testPath });
  const post = getPostBySlug(
    store.rootNode,
    '2020-06-22-자바스크립트의-모든-것-1탄',
  );

  expect(post?.postData?.title).toBe('자바스크립트의 모든 거엇!');
});

test('propList Snapshot', async () => {
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
