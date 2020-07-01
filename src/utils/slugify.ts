const spaceRegex = /\s+/g;
const nonAllowedRegex = /[^가-힇a-z\d\s\.\-]/gi;

const slugify = (name: string, delimeter = '-') => {
  const result = name
    .replace(nonAllowedRegex, '')
    .trim()
    .replace(spaceRegex, delimeter)
    .toLowerCase();

  return result;
};

export { slugify };
