// Candidate generation (blocking) matching src/blocking.py

import { BusinessRecord, PreparedRecord } from '../types';
import { nameTokens, addressTokens, skeleton } from './normalize';

const MAX_NAME_TOKENS = 6;
const MAX_DF_CUTOFF = 5000;

/**
 * Generate rare blocking keys for a record matching record_keys in blocking.py
 */
export function generateRecordKeys(name: string, address: string): string[] {
  const nTokens = nameTokens(name);
  const skeletons = Array.from(
    new Set(
      nTokens
        .slice(0, MAX_NAME_TOKENS)
        .map((t) => skeleton(t))
        .filter((s) => s.length >= 2)
    )
  ).sort();

  const keys: string[] = [];

  // n:<word>
  for (const t of nTokens) {
    keys.push(`n:${t}`);
  }

  // k:<skeleton>
  for (const s of skeletons) {
    keys.push(`k:${s}`);
  }

  // p:<s1>_<s2> (unordered pairs of skeletons)
  for (let i = 0; i < skeletons.length; i++) {
    for (let j = i + 1; j < skeletons.length; j++) {
      keys.push(`p:${skeletons[i]}_${skeletons[j]}`);
    }
  }

  // c:<w1w2..> (first 1-3 name words glued together)
  for (let i = 1; i <= Math.min(3, nTokens.length); i++) {
    keys.push(`c:${nTokens.slice(0, i).join('')}`);
  }

  // Address keys
  const aTokens = addressTokens(address || '');
  for (const t of aTokens) {
    keys.push(`a:${t}`);
  }

  // Adjacent address words: b:<w1>_<w2>
  for (let i = 0; i < aTokens.length - 1; i++) {
    keys.push(`b:${aTokens[i]}_${aTokens[i + 1]}`);
  }

  return keys;
}

/**
 * Prepares record for blocking and feature calculations
 */
export function prepareRecord(record: BusinessRecord): PreparedRecord {
  const nTokens = nameTokens(record.name);
  const aTokens = addressTokens(record.address || '');
  const keys = generateRecordKeys(record.name, record.address || '');
  const houseNums = aTokens.filter((t) => /^\d+$/.test(t)).slice(0, 4);

  return {
    record,
    nameCleaned: nTokens.join(' '),
    nameTokens: nTokens,
    nameSkeletons: nTokens.map((t) => skeleton(t) || t),
    nameGlued: nTokens.join(''),
    addressCleaned: aTokens.join(' '),
    addressTokens: aTokens,
    houseNumbers: houseNums,
    rawNumbers: houseNums.map((n) => parseInt(n, 10)),
    keys,
  };
}

export interface BlockingIndex {
  documentFrequencies: Map<string, number>;
  idfWeights: Map<string, number>;
  poolRecords: PreparedRecord[];
  totalRecords: number;
}

/**
 * Builds an inverted index with TF-IDF weights over candidate pool (S2 and S3 records)
 */
export function buildBlockingIndex(pool: BusinessRecord[]): BlockingIndex {
  const poolRecords = pool.map(prepareRecord);
  const dfMap = new Map<string, number>();

  for (const prep of poolRecords) {
    const uniqueKeys = new Set(prep.keys);
    uniqueKeys.forEach((key) => {
      dfMap.set(key, (dfMap.get(key) || 0) + 1);
    });
  }

  const N = poolRecords.length;
  const idfWeights = new Map<string, number>();

  dfMap.forEach((df, key) => {
    // Drop keys that exceed MAX_DF_CUTOFF (too common to identify specific business, e.g. "ltd", "street")
    if (df > MAX_DF_CUTOFF && df > N * 0.4) {
      return;
    }
    const idf = Math.log((N + 1) / (df + 1)) + 1.0;
    idfWeights.set(key, idf);
  });

  return {
    documentFrequencies: dfMap,
    idfWeights,
    poolRecords,
    totalRecords: N,
  };
}

export interface ScoredCandidate {
  record: PreparedRecord;
  blockingScore: number;
  blockingRank: number;
}

/**
 * Retrieve top candidates by TF-IDF Cosine similarity between S1 and pool records
 */
export function retrieveCandidates(
  s1Record: BusinessRecord,
  index: BlockingIndex,
  topK = 50
): ScoredCandidate[] {
  const s1Prep = prepareRecord(s1Record);
  const s1Keys = new Set(s1Prep.keys);

  // Compute S1 vector norm
  let s1NormSq = 0;
  const s1KeyWeights = new Map<string, number>();

  s1Keys.forEach((key) => {
    const idf = index.idfWeights.get(key);
    if (idf !== undefined) {
      s1KeyWeights.set(key, idf);
      s1NormSq += idf * idf;
    }
  });

  const s1Norm = Math.sqrt(s1NormSq) || 1.0;

  const scored: { record: PreparedRecord; score: number }[] = [];

  for (const poolPrep of index.poolRecords) {
    // Enforce country match: matches never cross countries!
    if (s1Record.country && poolPrep.record.country && s1Record.country !== poolPrep.record.country) {
      continue;
    }

    let dotProduct = 0;
    let poolNormSq = 0;

    const poolKeys = new Set(poolPrep.keys);
    poolKeys.forEach((key) => {
      const idf = index.idfWeights.get(key);
      if (idf !== undefined) {
        poolNormSq += idf * idf;
        if (s1KeyWeights.has(key)) {
          dotProduct += (s1KeyWeights.get(key) || 0) * idf;
        }
      }
    });

    if (dotProduct > 0) {
      const poolNorm = Math.sqrt(poolNormSq) || 1.0;
      const cosine = dotProduct / (s1Norm * poolNorm);
      scored.push({ record: poolPrep, score: cosine });
    }
  }

  // Sort descending by cosine score
  scored.sort((a, b) => b.score - a.score);

  const topResults = scored.slice(0, topK);

  return topResults.map((item, index) => ({
    record: item.record,
    blockingScore: Number(item.score.toFixed(4)),
    blockingRank: index + 1,
  }));
}
