import path from 'path';
import { testPath } from '../../tests/lib/env';
import { getStore, normalizeOption } from '../../src/store';
import { snapShotTest, pickProp } from '../lib/snapshotTest';
import { getNodeTree } from '../../src/utils/getNodeTree';
import { getPostsByCategories } from '../../src/common';
import { makePost } from '../../src/postParser';
import {
  getMainPageHandler,
  getCategoryPageHandler,
  getPostPageHandler,
  getPageHandler,
  getTagPageHandler,
} from '../../src/pageHandler';
import { FileNode, PostStore } from '../../src/typings';

let rootNode: FileNode;

const getRootNode = async () => {
  if (rootNode) return rootNode;

  rootNode = await getNodeTree({ rootPath: testPath });
  return rootNode;
};

export async function propListAndMultipleStoreSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const store = await getStore({ postDir: testPath });
  const subStore = await getStore({
    postDir: path.resolve(testPath, './Javascript'),
    perPage: 5,
  });

  const makePropListSnapshot = (
    store: PostStore,
    pathPrefix: string,
    shoudUpdate: boolean,
  ) => {
    const keys = Object.keys(store.propList);
    return keys.map((key) =>
      snapShotTest(store.propList[key], pathPrefix + key, shoudUpdate),
    );
  };

  const tests = [
    ...makePropListSnapshot(store, './propList/store/', shoudUpdate),
    ...makePropListSnapshot(subStore, './propList/subStore/', shoudUpdate),
  ];

  const testResults = (await Promise.all(tests)).every(
    (result) => result === true,
  );

  return testResults;
}

export async function getNodeTreeSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const rootNode = await getRootNode();
  const testResult = await snapShotTest(
    rootNode,
    './tree/fileTree',
    shoudUpdate,
  );

  return testResult;
}

export async function sortTestSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const rootNode = await getRootNode();

  const sortByDate = pickProp(
    getPostsByCategories(rootNode, ['테스트용-게시물들', '날짜순-정렬']),
    'name',
  );
  const sortByName = pickProp(
    getPostsByCategories(rootNode, ['테스트용-게시물들', '제목순-정렬']),
    'name',
  );
  const sortByComplex = pickProp(
    getPostsByCategories(rootNode, ['테스트용-게시물들', '복합-정렬']),
    'name',
  );

  const testResult = await snapShotTest(
    { sortByDate, sortByName, sortByComplex },
    './util/sortTest',
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
    './pageHandler/main',
    shouldUpdate,
  );

  return testResult;
}

const makePageHandlerTest = (
  name: string,
  handlerFn: Function,
  slug: string[] | string,
) => {
  const PageHandlerTest = async (shouldUpdate: boolean = false) => {
    const { getPathsBySlug, getPropsBySlug } = handlerFn({
      postDir: testPath,
    });

    const proplist = await getPropsBySlug(slug);
    const pathlist = await getPathsBySlug();
    const testResult = await snapShotTest(
      { proplist, pathlist },
      `./pageHandler/${name}`,
      shouldUpdate,
    );
    return testResult;
  };

  return PageHandlerTest;
};

export const categoryPageHandlerTest = makePageHandlerTest(
  'category',
  getCategoryPageHandler,
  ['테스트용-게시물들'],
);

export const PostPageHandlerTest = makePageHandlerTest(
  'post',
  getPostPageHandler,
  '2020-06-20-리덕스-저자-직강-정리',
);

export const PageHandlerTest = makePageHandlerTest('page', getPageHandler, [
  'page',
  '1',
]);

export const TagHandlerTest = makePageHandlerTest('tag', getTagPageHandler, [
  '자바스크립트',
]);

export async function duplicatedNameTest(shoudUpdate: boolean = false) {
  const rootNode = await getRootNode();
  const targetPosts = getPostsByCategories(rootNode, ['이름이-중복되는-경우']);
  const slugs = pickProp(targetPosts, 'slug');

  const testResult = await snapShotTest(
    slugs,
    './util/duplicatedNames',
    shoudUpdate,
  );
  return testResult;
}

export async function makePostSnapshotTest(shouldUpdate: boolean = false) {
  const postData = await makePost(
    path.resolve(testPath, './Javascript/객체에 대하여.md'),
    new Map(),
  );

  const testResult = await snapShotTest(
    postData,
    './core/makePost',
    shouldUpdate,
  );

  return testResult;
}

export async function perPageOptionTest(shouldUpdate: boolean = false) {
  const store = await getStore({
    postDir: path.resolve(testPath, './테스트용 게시물들'),
    perPage: {
      page: 2,
      category: 3,
      tag: 4,
    },
    shouldUpdate: true,
  });

  const data = {
    page: store.propList.page,
    category: store.propList.category,
    tag: store.propList.tag,
  };

  const testResult = await snapShotTest(
    data,
    './util/perPageOption',
    shouldUpdate,
  );

  return testResult;
}

export async function normalizeOptionTest(shouldUpdate: boolean = false) {
  const primitive = normalizeOption('abc', 7);
  const object = normalizeOption(
    {
      page: 'pageeee',
      category: 'categoryeeee',
    },
    { category: 7 },
  );

  const data = {
    primitive,
    object,
  };

  const testResult = await snapShotTest(
    data,
    './util/normalizeOption',
    shouldUpdate,
  );

  return testResult;
}
