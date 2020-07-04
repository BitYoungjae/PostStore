import path from 'path';
import { watch, FSWatcher } from 'chokidar';
import { buildInfoFileSave } from './utils/incrementalBuild';
import {
  PageParamOption,
  PerPageOption,
  PostStore,
  FileNode,
  Path,
  PostData,
  CorePostData,
} from './typings';
import {
  isDev,
  isTest,
  pagePathFilter,
  getPostsByCategories,
  isSubDir,
  getPostByPath,
} from './common';
import { getNodeTree } from './utils/getNodeTree';
import { getPathList } from './pathGenerator';
import { makePropList } from './propGenerator';
import { makePost } from './postParser';

const defaultParam = 'slug';
const defaultCount = 10;
const defaultParamOption: Required<PageParamOption> = {
  page: defaultParam,
  category: defaultParam,
  post: defaultParam,
  tag: defaultParam,
};
const defaultCountOption: Required<PerPageOption> = {
  page: defaultCount,
  category: defaultCount,
  tag: defaultCount,
};

export interface getStoreProps {
  postDir: string;
  perPage?: number | PerPageOption;
  pageParam?: string | PageParamOption;
  shouldUpdate?: boolean;
  watchMode?: boolean;
  incremental?: boolean;
}

const storeMap: Map<string, PostStore> = new Map();

export const getStore = async ({
  postDir,
  perPage = 10,
  pageParam = 'slug',
  shouldUpdate = isTest,
  watchMode = isDev,
  incremental = true,
}: getStoreProps): Promise<PostStore> => {
  const cachedStore = storeMap.get(postDir);
  if (cachedStore && (!shouldUpdate || watchMode)) return cachedStore;

  const store = await makeStore({ postDir, perPage, pageParam, incremental });
  if (watchMode) startWatchMode({ postDir, perPage, pageParam, incremental });

  return store;
};

const watcherMap: Map<string, FSWatcher> = new Map();

const startWatchMode = ({
  postDir,
  pageParam,
  perPage,
  incremental,
}: makeStoreProps): void => {
  const watcher = watch(postDir, {
    ignoreInitial: true,
    persistent: true,
    interval: 1000,
    binaryInterval: 3000,
  });
  watcherMap.set(postDir, watcher);

  // 현재 watcherMap keyList 중에 postDir의 상위경로가 있는지 확인 후, 있다면 해당 watcher에서 현재 경로 제거
  unwatchToParents(postDir);

  /*
   * Watcher: File Change Handler
   * 파일에 대한 change event일 경우 store 재생성 대신 postData에 대한 재가공만 진행할 것.
   * store 빌드 과정에서만 알 수 있는 ExtraPostData는 업데이트에서 제외해야 함.
   * 또한, slug 역시 store 빌드 과정에서 중복 방지 해시 및 ctime에 의해 가변되는 extra 데이터가 있으므로 업데이트에서 제외해야함.
   */
  const changeWatchHandler = async (filePath: string) => {
    if (!isMarkDownFile(filePath)) return;

    const store = storeMap.get(postDir)!;

    const post = getPostByPath(store.rootNode, filePath);
    if (!post) {
      console.log(
        `${store.rootNode.name} 기존 포스트가 없어서 스토어 재생성함`,
      );
      await makeStore({ postDir, perPage, pageParam, incremental });
      return;
    }

    const { postData } = post;
    const newPostData = await makePost({ filePath, useCache: false });

    updatePostData(postData, newPostData, ['title', 'html', 'tags', 'date']);
    console.log(`현재 store : ${store.rootNode.name} 게시물만 업데이트 완료`);
    if (incremental) buildInfoFileSave();
  };

  const restWatcherHandler = async (
    eventName: string,
    // path: string,
    detail: any,
  ) => {
    if (['unknown', 'error', 'ready'].includes(eventName)) return;
    if (eventName === 'modified' && detail.type === 'file') return;
    if (eventName === 'created' && detail.type === 'directory') return;

    const store = storeMap.get(postDir)!;

    if (detail.type === 'file') {
      // if (!isMarkDownFile(path)) return;
      // const post = getPostByPath(store.rootNode, path);
      // if (post) return;

      console.log(detail);
    }

    await makeStore({
      postDir,
      perPage,
      pageParam,
      incremental,
    });

    console.log(`${store.rootNode.name} 스토어 재생성함`);
  };

  watcher.on('change', changeWatchHandler);
  watcher.on('raw', restWatcherHandler);
};

const isMarkDownFile = (filePath: string) =>
  path.extname(filePath).normalize().toLowerCase() === '.md';

const getParentWatchers = (postDir: string) =>
  [...watcherMap.keys()]
    .filter((watcherKey) => isSubDir(watcherKey, postDir))
    .map((key) => watcherMap.get(key)!);

const unwatchToParents = (postDir: string) =>
  getParentWatchers(postDir).forEach((watcher) => watcher.unwatch(postDir));

const updatePostData = (
  targetPostData: PostData,
  newPostData: PostData,
  keys: (keyof (PostData | CorePostData))[],
) =>
  keys.forEach((key) => {
    (targetPostData[key] as any) = newPostData[key];
  });

interface makeStoreProps
  extends Pick<
    getStoreProps,
    'postDir' | 'perPage' | 'pageParam' | 'incremental'
  > {}

const makeStore = async ({
  postDir,
  perPage,
  pageParam,
  incremental,
}: makeStoreProps): Promise<PostStore> => {
  const [paramOption, perPageOption] = normalizeOption(pageParam, perPage);

  const rootNode = await getNodeTree({
    rootPath: postDir,
  });

  const pathList = getPathList({
    paramOption,
    perPageOption,
    rootNode: rootNode,
  });

  appendExtraToPost({
    rootNode,
    categoryPathList: pathList.category,
    categoryParamName: paramOption.category,
  });

  const propList = makePropList({
    paramOption,
    perPageOption,
    rootNode: rootNode,
    pathList: pathList,
  });

  const store: PostStore = {
    postDir,
    rootNode,
    pathList,
    propList,
  };

  if (incremental) buildInfoFileSave();
  storeMap.set(postDir, store);

  return store;
};

interface appendExtraToPostProps {
  rootNode: FileNode;
  categoryPathList: Path[];
  categoryParamName: string;
}

const appendExtraToPost = ({
  rootNode,
  categoryPathList,
  categoryParamName,
}: appendExtraToPostProps) => {
  const trimmedCategories = pagePathFilter(categoryPathList, categoryParamName);

  for (const category of trimmedCategories) {
    const posts = getPostsByCategories(rootNode, category);
    let prev: PostData | undefined;
    for (const { postData: now } of posts) {
      if (prev) {
        now.prevPost = {
          slug: prev.slug,
          title: prev.title,
        };
        prev.nextPost = {
          slug: now.slug,
          title: now.title,
        };
      }
      now.categories = category;
      prev = now;
    }
  }
};

export const normalizeOption = (
  paramOption: getStoreProps['pageParam'],
  PerPageOption: getStoreProps['perPage'],
): [Required<PageParamOption>, Required<PerPageOption>] => {
  let paramOptionResult =
    typeof paramOption === 'object'
      ? { ...defaultParamOption, ...paramOption }
      : defaultParamOption;
  let countOptionResult =
    typeof PerPageOption === 'object'
      ? { ...defaultCountOption, ...PerPageOption }
      : defaultCountOption;

  return [paramOptionResult, countOptionResult];
};
