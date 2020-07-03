import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import matter from 'gray-matter';
import unified from 'unified';
import remark from 'remark-parse';
import remark2rehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHtml from 'rehype-stringify';
import rehypePrism from './utils/rehype-prism';
import rehypeSanitize from 'rehype-sanitize';
import sanitizeSchema from './utils/sanitizeSchema.json';
import { slugify } from './utils/slugify';
import { getCachedData, saveCache } from './utils/incrementalBuild';
import { isDev, isTest, makeHash } from './common';

const fsPromise = fs.promises;

interface PostLink extends Pick<PostData, 'slug' | 'title'> {}

export interface PostData {
  slug: string;
  title: string;
  tags: string[];
  html: string;
  date: number;
  isPublished: boolean;
  categories: string[];
  prevPost?: PostLink;
  nextPost?: PostLink;
}

export const parsePost = async (
  filePath: string,
  slugMap: Map<string, boolean>,
): Promise<PostData> => {
  const rawText = await fsPromise.readFile(filePath, 'utf8');
  const cachedData = getCachedData<PostData>(rawText);

  if (cachedData != null) return cachedData;

  const {
    data: { title, date, tags = [], published = true },
    content = '',
  } = matter(rawText);

  const timestamp = await getPostTimestamp(filePath, date);
  const slug = makeUnique(parseSlug(filePath, timestamp), filePath, slugMap);
  const html = await markdownToHTML(content);

  const post: PostData = {
    slug,
    title: title ? title : slug,
    tags: (tags as string[]).map((tag) => slugify(tag)),
    date: timestamp,
    html,
    isPublished: published ? true : false,
    categories: [],
  };

  saveCache(rawText, post);
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

const getPostTimestamp = async (
  filePath: string,
  date?: Date,
): Promise<number> => {
  if (date == null) {
    if (isDev || isTest) return new Date('1990-04-10').valueOf();

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
) => {
  const isDupl = slugMap.get(slug);
  const nowDir = path.dirname(nodePath);
  const parentDir = path.resolve(nowDir, '..');
  const relativeDir = path.relative(parentDir, nowDir);

  if (isDupl) {
    const hash = salt === 0 ? '' : makeHash(relativeDir).substr(0, 5);
    const saltedSlug = slug + hash;

    return makeUnique(saltedSlug, nodePath, slugMap, salt + 1);
  }

  slugMap.set(slug, true);
  return slug;
};
