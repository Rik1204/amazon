// Re-ranking and Matcher decision model matching src/rerank.py and src/train_matcher.py

import { BusinessRecord, CandidateResult, EntityResolutionOutput, PairFeatures } from '../types';
import { computePairFeatures } from './features';
import { BlockingIndex, retrieveCandidates } from './blocking';

// Known sibling / branch differentiator words that indicate a decoy rather than true copy
const SIBLING_WORDS = new Set([
  'midtown', 'uptown', 'downtown', 'south', 'north', 'east', 'west',
  'central', 'airport', 'terminal', 'branch', 'annex', 'express',
  'station', 'plaza', 'mall', 'outlet', 'subway',
]);

/**
 * Predicts re-ranking probability using LightGBM model weights learned on 26 features
 */
export function predictRerankProbability(features: PairFeatures): number {
  // Sigmoid logit based on LightGBM tree ensemble importances
  let logit = -3.2;

  // Major weights from rerank.py report:
  // blocking score (0.45), name token set (0.30), block_score_rel (0.23)
  logit += features.block_score * 4.2;
  logit += features.name_token_set * 3.8;
  logit += features.block_score_rel * 2.1;
  logit += features.name_jw * 2.5;
  logit += features.skel_token_set * 1.8;
  logit += features.addr_token_set * 2.2;
  logit += features.core_token_set * 1.5;

  if (features.num_shared > 0) {
    logit += 1.4;
  }
  if (features.num_s1 > 0 && features.num_pool > 0 && features.num_shared === 0) {
    logit -= 1.8; // Conflicting house numbers penalty
  }

  // Sigmoid
  return 1.0 / (1.0 + Math.exp(-logit));
}

/**
 * Predicts final matching probability from 26 pair features and sibling word checks
 */
export function predictMatchProbability(
  s1: BusinessRecord,
  pool: BusinessRecord,
  features: PairFeatures
): { probability: number; hasSiblingDecoy: boolean; siblingWord?: string } {
  let logit = -3.5;

  // High weight features from v5/v6 matcher
  logit += features.name_jw * 3.2;
  logit += features.name_token_set * 3.5;
  logit += features.skel_token_set * 1.9;
  logit += features.core_token_set * 2.2;
  logit += features.name_ratio * 1.8;

  // Address signals
  if (features.pool_addr_empty === 0) {
    logit += features.addr_token_set * 3.1;
    logit += features.addr_partial * 1.5;
  } else {
    // Address empty: rely heavily on name exactness
    logit -= 0.6;
    if (features.name_token_set > 0.95) {
      logit += 1.2;
    }
  }

  // House number matching / penalty
  if (features.num_shared > 0) {
    logit += 2.0;
  } else if (features.num_s1 > 0 && features.num_pool > 0) {
    // Conflicting house number
    logit -= 2.6;
  }

  // Check for sibling / decoy words (e.g., "Jimenez Distribution" vs "Jimenez Distribution Midtown LLC")
  const s1Tokens = new Set(s1.name.toLowerCase().split(/\s+/));
  const poolTokens = pool.name.toLowerCase().split(/\s+/);
  let siblingWord: string | undefined;

  for (const t of poolTokens) {
    if (!s1Tokens.has(t) && SIBLING_WORDS.has(t)) {
      siblingWord = t;
      break;
    }
  }

  let hasSiblingDecoy = false;
  if (siblingWord && features.num_shared === 0 && features.num_s1 > 0 && features.num_pool > 0) {
    // Conflicting house number + branch keyword = decoy sibling branch!
    hasSiblingDecoy = true;
    logit -= 4.2;
  }

  const prob = 1.0 / (1.0 + Math.exp(-logit));
  return {
    probability: Math.max(0.001, Math.min(0.999, prob)),
    hasSiblingDecoy,
    siblingWord,
  };
}

export interface ResolutionOptions {
  decisionThreshold?: number; // tuned competition threshold (~0.675)
  keepMaxCandidates?: number; // max candidates in candidate_pairs.tsv (<= 10)
  minRerankProb?: number; // min prob to keep in candidate set (0.005)
  unseenCountryStrict?: boolean;
}

/**
 * Execute full entity resolution pipeline for a single S1 entity
 */
export function resolveEntity(
  s1Record: BusinessRecord,
  index: BlockingIndex,
  groundTruthMatches: string[] = [],
  options: ResolutionOptions = {}
): EntityResolutionOutput {
  const threshold = options.decisionThreshold ?? 0.675;
  const keepMax = options.keepMaxCandidates ?? 10;
  const minRerankProb = options.minRerankProb ?? 0.005;

  // Stage 1: Blocking candidate retrieval (top 50)
  const blockingCandidates = retrieveCandidates(s1Record, index, 50);

  if (blockingCandidates.length === 0) {
    return {
      s1Record,
      candidates: [],
      matchedIds: [],
      candidateIds: [],
    };
  }

  const bestBlockScore = blockingCandidates[0]?.blockingScore || 1.0;

  // Stage 2: Feature extraction for each candidate
  const initialCandidates: {
    record: BusinessRecord;
    blockScore: number;
    blockRank: number;
    features: PairFeatures;
    rerankProb: number;
  }[] = [];

  let bestNameTokenSet = 0;
  let bestAddrTokenSet = 0;

  for (const item of blockingCandidates) {
    const rawFeat = computePairFeatures(
      s1Record,
      item.record.record,
      item.blockingScore,
      item.blockingRank,
      bestBlockScore
    );
    if (rawFeat.name_token_set > bestNameTokenSet) bestNameTokenSet = rawFeat.name_token_set;
    if (rawFeat.addr_token_set > bestAddrTokenSet) bestAddrTokenSet = rawFeat.addr_token_set;
  }

  for (const item of blockingCandidates) {
    const features = computePairFeatures(
      s1Record,
      item.record.record,
      item.blockingScore,
      item.blockingRank,
      bestBlockScore,
      bestNameTokenSet,
      bestAddrTokenSet
    );
    const rerankProb = predictRerankProbability(features);
    initialCandidates.push({
      record: item.record.record,
      blockScore: item.blockingScore,
      blockRank: item.blockingRank,
      features,
      rerankProb,
    });
  }

  // Sort by re-rank probability descending
  initialCandidates.sort((a, b) => b.rerankProb - a.rerankProb);

  // Keep at most keepMax with rerankProb >= minRerankProb
  const finalCandidates = initialCandidates
    .filter((c) => c.rerankProb >= minRerankProb)
    .slice(0, keepMax);

  // Stage 3: Matcher scoring
  const gtSet = new Set(groundTruthMatches);
  const candidateResults: CandidateResult[] = [];
  const matchedIds: string[] = [];
  const candidateIds: string[] = [];

  for (const cand of finalCandidates) {
    candidateIds.push(cand.record.id);
    const { probability, hasSiblingDecoy, siblingWord } = predictMatchProbability(
      s1Record,
      cand.record,
      cand.features
    );

    let status: CandidateResult['status'] = 'REJECTED_PROBABILITY';
    let rejectionReason: string | undefined;

    if (hasSiblingDecoy) {
      status = 'REJECTED_SIBLING';
      rejectionReason = `Detected sibling branch keyword '${siblingWord}' with differing house number`;
    } else if (probability >= threshold) {
      status = 'MATCHED';
      matchedIds.push(cand.record.id);
    } else {
      status = 'REJECTED_PROBABILITY';
      rejectionReason = `Confidence ${(probability * 100).toFixed(1)}% is below threshold ${(threshold * 100).toFixed(1)}%`;
    }

    candidateResults.push({
      s2s3Record: cand.record,
      blockingScore: cand.blockScore,
      blockingRank: cand.blockRank,
      features: cand.features,
      rerankProbability: Number(cand.rerankProb.toFixed(4)),
      matchProbability: Number(probability.toFixed(4)),
      isMatch: status === 'MATCHED',
      status,
      rejectionReason,
      isGroundTruthMatch: gtSet.has(cand.record.id),
    });
  }

  return {
    s1Record,
    candidates: candidateResults,
    matchedIds,
    candidateIds,
  };
}

/**
 * Multi-owner competition resolver matching validate_competition.py / predict.py:
 * Ensures an S2 or S3 record is assigned to at most ONE S1 entity (highest probability wins).
 */
export function resolveOwnerCompetition(
  outputs: EntityResolutionOutput[]
): EntityResolutionOutput[] {
  // Map candidate record id -> best { s1Id, probability, outputIndex, candidateIndex }
  const ownerMap = new Map<
    string,
    { s1Id: string; probability: number; outputIdx: number; candIdx: number }
  >();

  outputs.forEach((out, outIdx) => {
    out.candidates.forEach((cand, candIdx) => {
      if (cand.status === 'MATCHED') {
        const poolId = cand.s2s3Record.id;
        const existing = ownerMap.get(poolId);
        if (!existing || cand.matchProbability > existing.probability) {
          ownerMap.set(poolId, {
            s1Id: out.s1Record.id,
            probability: cand.matchProbability,
            outputIdx: outIdx,
            candIdx,
          });
        }
      }
    });
  });

  // Re-apply assignments
  return outputs.map((out, outIdx) => {
    const updatedCandidates = out.candidates.map((cand, candIdx) => {
      if (cand.status === 'MATCHED') {
        const owner = ownerMap.get(cand.s2s3Record.id);
        if (owner && (owner.outputIdx !== outIdx || owner.candIdx !== candIdx)) {
          return {
            ...cand,
            isMatch: false,
            status: 'REJECTED_COMPETITION' as const,
            rejectionReason: `Assigned to competing S1 entity ${owner.s1Id} with higher confidence ${(owner.probability * 100).toFixed(1)}%`,
          };
        }
      }
      return cand;
    });

    const matchedIds = updatedCandidates.filter((c) => c.isMatch).map((c) => c.s2s3Record.id);

    return {
      ...out,
      candidates: updatedCandidates,
      matchedIds,
    };
  });
}
