// server/utils/similarity.js

// Normalizes string: lowercases, removes punctuation, sorts tokens alphabetically
export const normalizeTokens = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
};

// Calculates similarity score between 0 and 1
export const getSimilarityScore = (str1, str2) => {
  const norm1 = normalizeTokens(str1);
  const norm2 = normalizeTokens(str2);

  if (norm1 === norm2) return 1.0;

  const set1 = new Set(norm1.split(' '));
  const set2 = new Set(norm2.split(' '));
  
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
};