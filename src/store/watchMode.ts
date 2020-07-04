import { watch, FSWatcher } from 'chokidar';
import { getPostByPath, isSubDir } from '../lib/common';
import { makePost } from '../core/postParser';
import { buildInfoFileSave } from '../core/incrementalBuild';
import path from 'path';
import { PostData, CorePostData } from '../typings';
import { makeStoreProps, makeStore } from './makeStore';
import { storeMap } from './common';
import { PLATFROM_DARWIN } from '../lib/constants';

const watcherMap: Map<string, FSWatcher> = new Map();

export const startWatchMode = ({
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
  const changeFileHandler = async (filePath: string) => {
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

  /*
   * mac os에서 chokidar이 의도한대로 동작하지 않아 추가한 예외처리용 핸들러
   * TODO: 좀 더 깔끔하고 완전하게 보수할 것.
   */
  const rawHandlerForDarwin = async (
    eventName: string,
    path: string,
    detail: any,
  ) => {
    if (eventName === 'modified' && detail.type === 'file') {
      await changeFileHandler(path);
      return;
    }
    if (detail.flags === 72704) return;
    if (['unknown', 'error', 'ready'].includes(eventName)) return;
    if (eventName === 'created' && detail.type === 'directory') return;
    if (['created', 'moved'].includes(eventName) && !isMarkDownFile(path))
      return;

    await restEventHandler();
  };

  const restEventHandler = async () => {
    const store = storeMap.get(postDir)!;

    await makeStore({
      postDir,
      perPage,
      pageParam,
      incremental,
    });

    console.log(`${store.rootNode.name} 스토어 재생성함`);
  };

  if (!PLATFROM_DARWIN) {
    watcher.on('change', changeFileHandler);
    watcher.on('add', restEventHandler);
    watcher.on('addDir', restEventHandler);
    watcher.on('unlink', restEventHandler);
    watcher.on('unlinkDir', restEventHandler);
    return;
  }

  watcher.on('raw', rawHandlerForDarwin);
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
