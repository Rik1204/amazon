// String distance metrics and 26-feature extractor matching src/features.py

import { BusinessRecord, PairFeatures } from '../types';
import { nameTokens, addressTokens, skeleton } from './normalize';

// Stop words / high-frequency business designations per country
const FREQUENT_WORDS: Record<string, Set<string>> = {
  US: new Set(['llc', 'inc', 'corp', 'corporation', 'co', 'company', 'ltd', 'limited', 'services', 'enterprises']),
  India: new Set(['pvt', 'ltd', 'private', 'limited', 'enterprises', 'trading', 'company', 'associates', 'services']),
  France: new Set(['sarl', 'sas', 'sasu', 'sa', 'eurl', 'sci', 'france', 'services', 'societe', 'cie']),
};

/**
 * Standard Levenshtein distance
 */
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Rapidfuzz / FuzzyWuzzy style ratio (0.0 to 1.0)
 */
export function stringRatio(s1: string, s2: string): number {
  if (!s1 && !s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;
  const totalLen = s1.length + s2.length;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, (totalLen - dist) / totalLen);
}

/**
 * Jaro-Winkler similarity (0.0 to 1.0)
 */
export function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3.0;

  // Winkler prefix adjustment
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1.0 - jaro);
}

/**
 * Token sort ratio (0.0 to 1.0)
 */
export function tokenSortRatio(s1: string, s2: string): number {
  const t1 = s1.split(/\s+/).filter(Boolean).sort().join(' ');
  const t2 = s2.split(/\s+/).filter(Boolean).sort().join(' ');
  return stringRatio(t1, t2);
}

/**
 * Token set ratio (0.0 to 1.0)
 */
export function tokenSetRatio(s1: string, s2: string): number {
  const set1 = new Set(s1.split(/\s+/).filter(Boolean));
  const set2 = new Set(s2.split(/\s+/).filter(Boolean));

  const intersection: string[] = [];
  const diff1: string[] = [];
  const diff2: string[] = [];

  set1.forEach((t) => {
    if (set2.has(t)) intersection.push(t);
    else diff1.push(t);
  });
  set2.forEach((t) => {
    if (!set1.has(t)) diff2.push(t);
  });

  intersection.sort();
  diff1.sort();
  diff2.sort();

  const interStr = intersection.join(' ');
  const s1Rest = [interStr, diff1.join(' ')].filter(Boolean).join(' ');
  const s2Rest = [interStr, diff2.join(' ')].filter(Boolean).join(' ');

  if (!interStr) {
    return stringRatio(s1Rest, s2Rest);
  }

  return Math.max(
    stringRatio(interStr, s1Rest),
    stringRatio(interStr, s2Rest),
    stringRatio(s1Rest, s2Rest)
  );
}

/**
 * Partial string ratio (0.0 to 1.0)
 */
export function partialRatio(s1: string, s2: string): number {
  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;

  const [shorter, longer] = s1.length <= s2.length ? [s1, s2] : [s2, s1];
  if (shorter.length === 0) return 0.0;

  let maxRatio = 0.0;
  const len = shorter.length;
  for (let i = 0; i <= longer.length - len; i++) {
    const sub = longer.substring(i, i + len);
    const r = stringRatio(shorter, sub);
    if (r > maxRatio) maxRatio = r;
    if (maxRatio >= 0.99) break;
  }
  return maxRatio;
}

/**
 * Extract numeric house / street numbers from address tokens
 */
export function extractNumbers(tokens: string[]): string[] {
  return Array.from(new Set(tokens.filter((t) => /^\d+$/.test(t)))).slice(0, 4);
}

/**
 * Compute the 26 pair features between an S1 record and an S2/S3 candidate record
 */
export function computePairFeatures(
  s1: BusinessRecord,
  pool: BusinessRecord,
  blockingScore: number,
  blockingRank: number,
  bestBlockingScore: number,
  bestNameTokenSet = 1.0,
  bestAddrTokenSet = 1.0
): PairFeatures {
  const country = s1.country || pool.country || 'US';
  const freqSet = FREQUENT_WORDS[country] || FREQUENT_WORDS.US;

  // Name tokens and skeletons
  const s1NameTokens = nameTokens(s1.name);
  const poolNameTokens = nameTokens(pool.name);

  const s1NameClean = s1NameTokens.join(' ');
  const poolNameClean = poolNameTokens.join(' ');

  const s1NameNoSpace = s1NameTokens.join('');
  const poolNameNoSpace = poolNameTokens.join('');

  const s1SkelTokens = s1NameTokens.map((t) => skeleton(t) || t);
  const poolSkelTokens = poolNameTokens.map((t) => skeleton(t) || t);
  const s1Skel = s1SkelTokens.join(' ');
  const poolSkel = poolSkelTokens.join(' ');

  // Core names without frequent designations (e.g. LLC, Pvt Ltd, SARL)
  const s1CoreTokens = s1NameTokens.filter((t) => !freqSet.has(t));
  const poolCoreTokens = poolNameTokens.filter((t) => !freqSet.has(t));
  const s1Core = (s1CoreTokens.length ? s1CoreTokens : s1NameTokens).join(' ');
  const poolCore = (poolCoreTokens.length ? poolCoreTokens : poolNameTokens).join(' ');

  // Address tokens
  const s1AddrTokens = addressTokens(s1.address || '');
  const poolAddrTokens = addressTokens(pool.address || '');
  const s1AddrClean = s1AddrTokens.join(' ');
  const poolAddrClean = poolAddrTokens.join(' ');

  // House / plot numbers
  const s1Nums = extractNumbers(s1AddrTokens);
  const poolNums = extractNumbers(poolAddrTokens);
  const s1NumSet = new Set(s1Nums);
  const sharedNums = poolNums.filter((n) => s1NumSet.has(n));

  // Compute similarities
  const nameRatio = stringRatio(s1NameClean, poolNameClean);
  const nameTokenSet = tokenSetRatio(s1NameClean, poolNameClean);
  const nameTokenSort = tokenSortRatio(s1NameClean, poolNameClean);
  const namePartial = partialRatio(s1NameClean, poolNameClean);
  const nameJw = jaroWinkler(s1NameClean, poolNameClean);
  const nameNospaceRatio = stringRatio(s1NameNoSpace, poolNameNoSpace);

  const skelRatio = stringRatio(s1Skel, poolSkel);
  const skelTokenSet = tokenSetRatio(s1Skel, poolSkel);
  const coreRatio = stringRatio(s1Core, poolCore);
  const coreTokenSet = tokenSetRatio(s1Core, poolCore);

  const addrRatio = s1AddrClean && poolAddrClean ? stringRatio(s1AddrClean, poolAddrClean) : 0;
  const addrTokenSet = s1AddrClean && poolAddrClean ? tokenSetRatio(s1AddrClean, poolAddrClean) : 0;
  const addrPartial = s1AddrClean && poolAddrClean ? partialRatio(s1AddrClean, poolAddrClean) : 0;

  const numShared = sharedNums.length;
  const numS1 = s1Nums.length;
  const numPool = poolNums.length;
  const numPoolShare = numPool > 0 ? numShared / numPool : 0;

  const nameWordsS1 = s1NameTokens.length;
  const nameWordsPool = poolNameTokens.length;
  const poolAddrEmpty = poolAddrTokens.length === 0 ? 1 : 0;
  const isS3 = pool.id.startsWith('S3-') || pool.source === 'S3' ? 1 : 0;

  const blockScoreRel = bestBlockingScore > 0 ? blockingScore / bestBlockingScore : 1.0;
  const nameTokenSetVsBest = nameTokenSet - bestNameTokenSet;
  const addrTokenSetVsBest = addrTokenSet - bestAddrTokenSet;

  return {
    block_score: Number(blockingScore.toFixed(4)),
    block_rank: blockingRank,
    block_score_rel: Number(blockScoreRel.toFixed(4)),
    name_ratio: Number(nameRatio.toFixed(4)),
    name_token_set: Number(nameTokenSet.toFixed(4)),
    name_token_sort: Number(nameTokenSort.toFixed(4)),
    name_partial: Number(namePartial.toFixed(4)),
    name_jw: Number(nameJw.toFixed(4)),
    name_nospace_ratio: Number(nameNospaceRatio.toFixed(4)),
    skel_ratio: Number(skelRatio.toFixed(4)),
    skel_token_set: Number(skelTokenSet.toFixed(4)),
    core_ratio: Number(coreRatio.toFixed(4)),
    core_token_set: Number(coreTokenSet.toFixed(4)),
    addr_ratio: Number(addrRatio.toFixed(4)),
    addr_token_set: Number(addrTokenSet.toFixed(4)),
    addr_partial: Number(addrPartial.toFixed(4)),
    num_shared: numShared,
    num_s1: numS1,
    num_pool: numPool,
    num_pool_share: Number(numPoolShare.toFixed(4)),
    name_words_s1: nameWordsS1,
    name_words_pool: nameWordsPool,
    pool_addr_empty: poolAddrEmpty,
    is_s3: isS3,
    name_token_set_vs_best: Number(nameTokenSetVsBest.toFixed(4)),
    addr_token_set_vs_best: Number(addrTokenSetVsBest.toFixed(4)),
  };
}
