import { getStyledErrorMsg } from '../common';

const spaceRegex = /\s+/g;
const nonAllowedRegex = /[^가-힣a-z\d\s\.\-]/gi;

const slugify = (name: string, delimeter = '-') => {
  const result = name
    .normalize()
    .replace(nonAllowedRegex, '')
    .trim()
    .replace(spaceRegex, delimeter);

  if (!result)
    throw new Error(
      getStyledErrorMsg(
        `The name cannot be slugified by the slugify module.`,
        `name : ${name}`,
      ),
    );

  return result;
};

export { slugify };
