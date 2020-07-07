import fs from 'fs';
import path from 'path';
import format from 'date-fns/format';
import matter from 'gray-matter';
import unified from 'unified';
import remark from 'remark-parse';
import remark2rehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHtml from 'rehype-stringify';
import { rehypePrism, rehypeAsset, rehypeYoutube } from '../rehype-plugins';
import rehypeSanitize from 'rehype-sanitize';
import sanitizeSchema from './sanitizeSchema.json';
import { slugify } from '../lib/slugify';
import { getCachedData, saveCache } from './incrementalBuild';
import { makeHash, makeSetLike } from '../lib/common';
import { PostData, SlugMap, PostStoreAsset } from '../typings';
import { MODE_TEST } from '../lib/constants';

const fsPromise = fs.promises;

interface CachedPostData extends Pick<PostData, 'html' | 'tags'> {}

interface makePostProps {
  filePath: string;
  slugMap?: SlugMap;
  useCache?: boolean;
}

export const makePost = async ({
  filePath,
  slugMap,
  useCache = true,
}: makePostProps): Promise<PostData> => {
  const rawText = await fsPromise.readFile(filePath, 'utf8');
  const cachedData = useCache
    ? getCachedData<CachedPostData>(filePath, rawText)
    : undefined;

  const {
    data: { title, date, tags = [], published = true },
    content = '',
  } = matter(rawText);

  const refinedDate = await refineDate(filePath, date);
  const parsedSlug = parseSlug(filePath, refinedDate);
  const refinedSlug = !slugMap
    ? parsedSlug
    : makeUnique(parsedSlug, filePath, slugMap);

  const post = await createPostData(
    filePath,
    {
      title,
      tags,
      slug: refinedSlug,
      date: refinedDate,
      categories: [],
      isPublished: published,
    },
    content,
    cachedData,
  );

  if (!cachedData || !useCache)
    saveCache(filePath, rawText, {
      html: post.html,
      tags: post.tags,
    } as CachedPostData);

  return post;
};

const parseSlug = (filePath: string, timestamp: number): string => {
  const basename = path.basename(filePath, '.md');
  const datePrepended = prependDate(basename, timestamp);
  const slugified = slugify(datePrepended);

  return slugified;
};

const refineDate = async (filePath: string, date?: Date): Promise<number> => {
  if (date == null) {
    // 스냅샷 테스트의 균일성을 위해, 테스트 시에는 모두 동일 날짜로 처리.
    if (MODE_TEST) return new Date('1990-04-10').valueOf();

    const ctime = (await fsPromise.stat(filePath)).ctime;
    return ctime.valueOf();
  }

  return (date as Date).valueOf();
};

const prependDate = (name: string, timestamp: number): string => {
  return `${format(new Date(timestamp), 'yyyy-MM-dd')}-${name}`;
};

const makeUnique = (
  slug: string,
  nodePath: string,
  slugMap: Map<string, boolean>,
  salt = 0,
  newSlug?: string,
) => {
  const target: string = newSlug || slug;
  const isDupl: boolean = slugMap.get(target) === true ? true : false;

  if (isDupl) {
    const nowDir = path.dirname(nodePath);
    const parentDir = path.resolve(nowDir, '..');
    const relativeDir = path.relative(parentDir, nowDir);

    const hash =
      salt === 0 ? '' : makeHash(relativeDir + `${salt}`, 'hex').substr(0, 5);
    const saltedSlug = slug + hash;

    return makeUnique(slug, nodePath, slugMap, salt + 1, saltedSlug);
  }

  slugMap.set(target, true);
  return target;
};

const createPostData = async (
  filePath: string,
  { slug, title, date, tags, categories, isPublished }: Omit<PostData, 'html'>,
  rawContent: string,
  cachedData?: CachedPostData,
): Promise<PostData> => {
  const postData: PostData = {
    slug,
    title: !title ? slug : title,
    date,
    html: '',
    tags: cachedData
      ? makeSetLike(cachedData.tags)
      : makeSetLike(tags.map((tag) => slugify(tag))),
    categories: categories ? categories : [],
    isPublished,
  };

  if (cachedData) {
    postData.html = cachedData.html;
    return postData;
  }

  const { html, assets } = await parseMarkdown(filePath, rawContent);

  postData.html = html;
  postData.assets = assets;

  return postData;
};

export const parseMarkdown = async (filePath: string, markdown: string) => {
  const assets: PostStoreAsset[] = [];
  const parser = unified()
    .use(remark)
    .use(remark2rehype)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeYoutube)
    .use(rehypeAsset(filePath, assets))
    .use(rehypeSlug)
    .use(rehypePrism)
    .use(rehypeHtml, {
      collapseEmptyAttributes: true,
    });

  const parsedData = await parser.process(markdown);
  const html = parsedData.contents.toString();

  return {
    html,
    assets,
  };
};
