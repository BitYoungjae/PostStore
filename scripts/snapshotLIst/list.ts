import { testPath } from '../../tests/lib/env';
import { getStore } from '../../src/store';
import { snapShotTest, pickProp } from '../lib/snapshotTest';
import { getCategoriesPaths } from '../../src/pathGenerator';
import { getNodeTree, FileNode } from '../../src/utils/getNodeTree';
import { getPostsByCategories } from '../../src/common';
import {
  getMainPageHandler,
  getCategoryPageHandler,
  getPostPageHandler,
  getPageHandler,
  getTagPageHandler,
} from '../../src/pageHandler';

let rootNode: FileNode;

const getRootNode = async () => {
  if (rootNode) return rootNode;

  rootNode = await getNodeTree({ nodePath: testPath });
  return rootNode;
};

export async function propListSnapshot(
  shoudUpdate: boolean = false,
): Promise<boolean> {
  const store = await getStore({ postDir: testPath, perPage: 2 });

  const tests = [
    snapShotTest(store.propList.category, './propList/category', shoudUpdate),
    snapShotTest(store.propList.tag, './propList/tag', shoudUpdate),
    snapShotTest(store.propList.page, './propList/page', shoudUpdate),
    snapShotTest(store.propList.post, './propList/post', shoudUpdate),
    snapShotTest(store.propList.global, './propList/global', shoudUpdate),
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
    './etc/getCategoriesPaths',
    shoudUpdate,
  );

  return testResult;
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
    './tree/sortTest',
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
    './etc/duplicatedNames',
    shoudUpdate,
  );
  return testResult;
}
