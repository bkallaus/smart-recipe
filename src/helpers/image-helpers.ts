
export const getFileEnding = (url: string) => {
  const cleanUrl = url.split(/[?#]/)[0].split('%3')[0];
  const lastPart = cleanUrl.split('/').pop() || '';
  const extension = lastPart.split('.').pop();
  return extension && extension !== lastPart ? extension : 'jpg';
};
