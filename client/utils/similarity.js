// client/utils/similarity.js

export const normalizeTokens = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
};

export const getSimilarityScore = (str1, str2) => {
  const norm1 = normalizeTokens(str1);
  const norm2 = normalizeTokens(str2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0;

  const set1 = new Set(norm1.split(' '));
  const set2 = new Set(norm2.split(' '));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
};