import path from 'path';
import { watch } from 'chokidar';
import { getPostByPath, isSubDir, debounce } from '../lib/common';
import { makePost } from '../core/postParser';
import { buildInfoFileSave } from '../core/incrementalBuild';
import { PostData, CorePostData, PostInfo } from '../typings';
import { makeStoreProps, makeStore } from './makeStore';
import { storeMap, watcherMap } from './common';
import {
  getStyledLogMsg,
  getStyledCautionMsg,
  getStyledInfoMsg,
} from '../lib/msgHandler';
import {
  PLATFROM_DARWIN,
  MODE_TEST,
  DEFAULT_PUBLICDIR_PATH,
} from '../lib/constants';
import chalk from 'chalk';
import { copyAssetsTo } from './copyAsset';

export const startWatchMode = (props: makeStoreProps): void => {
  console.log(getStyledInfoMsg('Start Watch mode..', props.postDir));

  const parentWatcherKey = getParentWatcherKey(props.postDir);

  const watcher = parentWatcherKey
    ? watcherMap.get(parentWatcherKey)!
    : watch(props.postDir, {
        persistent: true,
        ignoreInitial: true,
        interval: 100,
        binaryInterval: 3000,
      });

  watcherMap.set(props.postDir, watcher);

  const updateStore = debounce(async (msg: string) => {
    await makeStore(props);
    console.log(msg);
  }, 200);

  /*
   * Watcher: File Change Handler
   * 파일에 대한 change event일 경우 store 재생성 대신 postData에 대한 재가공만 진행할 것.
   * store 빌드 과정에서만 알 수 있는 ExtraPostData는 업데이트에서 제외해야 함.
   * 또한, slug 역시 store 빌드 과정에서 중복 방지 해시 및 ctime에 의해 가변되는 extra 데이터가 있으므로 업데이트에서 제외해야함.
   */
  const changeFileHandler = async (filePath: string) => {
    const store = storeMap.get(props.postDir)!;
    let newPostData: PostData;

    try {
      newPostData = await makePost({
        filePath: filePath,
        useCache: false,
      });
    } catch {
      console.log(
        getStyledCautionMsg(
          chalk`Failed to parse {bold [ ${path.basename(
            filePath,
          )} ]} file. Please check the file content.`,
        ),
      );
      return;
    }

    if (!newPostData.html) return;

    const post = getPostByPath(store.rootNode, filePath);

    if (!post) {
      updateStore(
        getStyledLogMsg(
          chalk`{red.bold There is no stored post corresponding to the [ ${path.basename(
            filePath,
          )} ] file.} The Store is created again.`,
          `store : ${store.info.name}`,
        ),
      );
      return;
    }

    updatePostData(post.postData, newPostData, [
      'title',
      'html',
      'tags',
      'date',
      'excerpt',
      'thumbnail',
    ]);

    if (newPostData.assets) {
      await copyAssetsTo(DEFAULT_PUBLICDIR_PATH)(newPostData.assets);
    }

    console.log(
      getStyledLogMsg(
        chalk`{bold [ ${newPostData.title} ]} Post updated.`,
        `store : ${store.info.name}`,
      ),
    );
    if (props.incremental) buildInfoFileSave();
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
    if (MODE_TEST)
      console.log({
        event: detail.event,
        flags: detail.flags,
        type: detail.type,
      });

    // 해당 store가 관리하는 경로가 아니라면 무시
    const { info: storeInfo } = storeMap.get(props.postDir)!;
    const fileDirPath = path.dirname(filePath);

    if (!isSubDir(storeInfo.postDir, fileDirPath)) return;

    if (
      eventName === 'modified' &&
      detail.type === 'file' &&
      extName(filePath) === '.md'
    ) {
      await changeFileHandler(filePath);
      return;
    }
    if (['error', 'ready'].includes(eventName)) return;
    if (
      ['created', 'moved'].includes(eventName) &&
      detail.type === 'file' &&
      !['.md', '.jpg', '.png', '.jpeg', '.gif', '.svg'].includes(
        extName(filePath),
      )
    )
      return;

    await restEventHandler(filePath, detail.type);
  };

  const restEventHandler = async (filePath: string, type = 'file') => {
    const { info: storeInfo } = storeMap.get(props.postDir)!;
    updateStore(
      getStyledLogMsg(
        chalk`{bold [ ${path.basename(
          filePath,
        )} ${type} ]} has changed. The Store is created again.`,
        `store : ${storeInfo.name}`,
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

const extName = (filePath: string) =>
  path.extname(filePath).normalize().toLowerCase();

const getParentWatcherKey = (postDir: string) =>
  [...watcherMap.keys()].find((watcherKey) => isSubDir(watcherKey, postDir));

const updatePostData = (
  targetPostData: PostData,
  newPostData: PostData,
  keys: (keyof ((PostData | CorePostData) & PostInfo))[],
) =>
  keys.forEach((key) => {
    (targetPostData[key] as any) = newPostData[key];
  });
