import { nanoid } from 'nanoid';

// todo: consider creating image slug instead of id
export const slugify = (originalString: string) => {
  if (!originalString) return nanoid();

  let str = originalString;
  str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
  str = str.toLowerCase(); // convert string to lowercase
  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
  return str;
};
