import path from 'path';
import { watch } from 'chokidar';
import { getPostByPath, isSubDir, debounce } from '../lib/common';
import { makePost } from '../core/postParser';
import { buildInfoFileSave } from '../core/incrementalBuild';
import { PostData, CorePostData } from '../typings';
import { makeStoreProps, makeStore } from './makeStore';
import { storeMap, watcherMap } from './common';
import { getStyledInfoMsg } from '../lib/msgHandler';
import { PLATFROM_DARWIN, MODE_TEST, MODE_DEV } from '../lib/constants';

export const startWatchMode = ({
  postDir,
  pageParam,
  perPage,
  incremental,
}: makeStoreProps): void => {
  const parentWatcherKey = getParentWatcherKey(postDir);

  const watcher = parentWatcherKey
    ? watcherMap.get(parentWatcherKey)!
    : watch(postDir, {
        ignoreInitial: true,
        interval: 200,
        binaryInterval: 3000,
        persistent: true,
      });

  watcherMap.set(postDir, watcher);

  const updateStore = debounce(async (msg: string) => {
    await makeStore({
      postDir,
      perPage,
      pageParam,
      incremental,
    });

    console.log(msg);
  }, 200);

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

    console.log('포스트데이타', post);
    console.log('파일 경로', filePath);

    if (!post) {
      updateStore(
        getStyledInfoMsg(
          `The store was updated because there is no existing post.`,
          `Store name : ${store.rootNode.name}`,
        ),
      );
      return;
    }

    const { postData } = post;
    const newPostData = await makePost({ filePath, useCache: false });

    updatePostData(postData, newPostData, ['title', 'html', 'tags', 'date']);

    console.log(
      getStyledInfoMsg(
        `${newPostData.title} Post updated.`,
        `Store name : ${store.rootNode.name}`,
      ),
    );
    if (incremental) buildInfoFileSave();
  };

  /*
   * mac os에서 chokidar이 의도한대로 동작하지 않아 추가한 예외처리용 핸들러
   * TODO: 좀 더 깔끔하고 완전하게 보수할 것.
   */
  const rawHandlerForDarwin = async (
    eventName: string,
    filePath: string,
    detail: any,
  ) => {
    if (MODE_TEST || MODE_DEV)
      console.log({
        event: detail.event,
        flags: detail.flags,
        type: detail.type,
      });

    // 해당 store가 관리하는 경로가 아니라면 무시
    const store = storeMap.get(postDir)!;
    const fileDirPath = path.dirname(filePath);

    if (!isSubDir(store.postDir, fileDirPath)) return;

    if (eventName === 'modified' && detail.type === 'file') {
      console.log({
        postDir: store.postDir,
        fileDirPath,
        isSubDir: isSubDir(store.postDir, fileDirPath),
      });

      await changeFileHandler(filePath);
      return;
    }
    // if (detail.flags === 72704) return;
    if (['unknown', 'error', 'ready'].includes(eventName)) return;
    if (
      ['created', 'moved'].includes(eventName) &&
      detail.type === 'file' &&
      !isMarkDownFile(filePath)
    )
      return;

    await restEventHandler(filePath, detail.type);
  };

  const restEventHandler = async (filePath: string, type = 'file') => {
    const store = storeMap.get(postDir)!;
    updateStore(
      getStyledInfoMsg(
        `The store was updated because a change in the ${path.basename(
          filePath,
        )} ${type}.`,
        `Store name : ${store.rootNode.name}`,
      ),
    );
  };

  if (!PLATFROM_DARWIN) {
    watcher.on('change', changeFileHandler);
    watcher.on('add', restEventHandler);
    watcher.on('addDir', restEventHandler);
    watcher.on('unlink', restEventHandler);
    watcher.on('unlinkDir', restEventHandler);
    watcher.on('all', async (eventName, path) => {
      if (eventName === 'change') return;
      await restEventHandler(path);
    });
    return;
  }

  watcher.on('raw', rawHandlerForDarwin);
};

const isMarkDownFile = (filePath: string) =>
  path.extname(filePath).normalize().toLowerCase() === '.md';

const getParentWatcherKey = (postDir: string) =>
  [...watcherMap.keys()].find((watcherKey) => isSubDir(watcherKey, postDir));

const updatePostData = (
  targetPostData: PostData,
  newPostData: PostData,
  keys: (keyof (PostData | CorePostData))[],
) =>
  keys.forEach((key) => {
    (targetPostData[key] as any) = newPostData[key];
  });
