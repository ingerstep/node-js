export const hash = (d) => {
  let hash = 0;

  for (let i = 0, len = d.length; i < len; i++) {
    let chr = d.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }

  return hash;
};
