import fs from 'fs';
import path from 'path';
import format from 'date-fns/format';
import matter from 'gray-matter';
import unified from 'unified';
import remark from 'remark-parse';
import remark2rehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHtml from 'rehype-stringify';
import rehypePrism from '../lib/rehype-prism';
import rehypeSanitize from 'rehype-sanitize';
import sanitizeSchema from '../lib/sanitizeSchema.json';
import { slugify } from '../lib/slugify';
import { getCachedData, saveCache } from './incrementalBuild';
import { makeHash, makeSetLike } from '../lib/common';
import { PostData, SlugMap } from '../typings';
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

  const refinedDate = await refinePostDate(filePath, date);
  const parsedSlug = parseSlug(filePath, refinedDate);
  const refinedSlug = !slugMap
    ? parsedSlug
    : makeUnique(parsedSlug, filePath, slugMap);

  const post = await createPostData(
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

export const markdownToHTML = async (markdown: string) => {
  const parser = unified()
    .use(remark)
    .use(remark2rehype)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeSlug)
    .use(rehypePrism)
    .use(rehypeHtml, {
      collapseEmptyAttributes: true,
    });

  const parsedData = await parser.process(markdown);
  const html = parsedData.contents.toString();

  return html;
};

const parseSlug = (filePath: string, timestamp: number): string => {
  const basename = path.basename(filePath, '.md');
  const datePrepended = prependDate(basename, timestamp);
  const slugified = slugify(datePrepended);

  return slugified;
};

const refinePostDate = async (
  filePath: string,
  date?: Date,
): Promise<number> => {
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
  let result: string;
  let isDupl: boolean | undefined;

  if (newSlug) {
    isDupl = slugMap.get(newSlug);
    result = newSlug;
  } else {
    isDupl = slugMap.get(slug);
    result = slug;
  }

  const nowDir = path.dirname(nodePath);
  const parentDir = path.resolve(nowDir, '..');
  const relativeDir = path.relative(parentDir, nowDir);

  if (isDupl) {
    const hash =
      salt === 0 ? '' : makeHash(relativeDir + `${salt}`, 'hex').substr(0, 5);

    const saltedSlug = slug + hash;
    return makeUnique(slug, nodePath, slugMap, salt + 1, saltedSlug);
  }

  slugMap.set(result, true);
  return result;
};

const createPostData = async (
  { slug, title, date, tags, categories, isPublished }: Omit<PostData, 'html'>,
  rawContent: string,
  cachedData?: CachedPostData,
): Promise<PostData> => {
  return {
    slug,
    title: !title ? slug : title,
    date,
    html: cachedData ? cachedData.html : await markdownToHTML(rawContent),
    tags: cachedData
      ? makeSetLike(cachedData.tags)
      : makeSetLike(tags.map((tag) => slugify(tag))),
    categories: categories ? categories : [],
    isPublished,
  };
};
