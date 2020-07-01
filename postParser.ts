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

const fsPromise = fs.promises;

export interface PostData {
  slug: string;
  title: string;
  tags: string[];
  html: string;
  date: number;
  isPublished: boolean;
  categories: string[];
  prevPost: string;
  nextPost: string;
}

const getPostTimestamp = async (
  filePath: string,
  date?: Date,
): Promise<number> => {
  if (date == null) {
    const ctime = (await fsPromise.stat(filePath)).ctime;
    return ctime.valueOf();
  }

  return (date as Date).valueOf();
};

export const parsePost = async (filePath: string) => {
  const rawText = await fsPromise.readFile(filePath);

  const {
    data: { title, date, tags = [], published = true },
    content = '',
  } = matter(rawText);

  const timestamp = await getPostTimestamp(filePath, date);
  const slug = parseSlug(filePath, timestamp);
  const html = await markdownToHTML(content);

  const post: PostData = {
    slug,
    title: title ? title : slug,
    tags: (tags as string[]).map((tag) => slugify(tag)),
    date: timestamp,
    html,
    isPublished: published ? true : false,
    categories: [],
    prevPost: '',
    nextPost: '',
  };

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

const prependDate = (name: string, timestamp: number): string => {
  return `${format(new Date(timestamp), 'yyyy-MM-dd')}-${name}`;
};
