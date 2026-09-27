export type Country = 'US' | 'India' | 'France';

export interface BusinessRecord {
  id: string;
  source: 'S1' | 'S2' | 'S3';
  name: string;
  address: string;
  country: Country;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
}

export interface PreparedRecord {
  record: BusinessRecord;
  nameCleaned: string;
  nameTokens: string[];
  nameSkeletons: string[];
  nameGlued: string;
  addressCleaned: string;
  addressTokens: string[];
  houseNumbers: string[];
  rawNumbers: number[];
  keys: string[];
}

export interface PairFeatures {
  // Blocking features (3)
  block_score: number;
  block_rank: number;
  block_score_rel: number;
  // Name similarity features (6)
  name_ratio: number;
  name_token_set: number;
  name_token_sort: number;
  name_partial: number;
  name_jw: number;
  name_nospace_ratio: number;
  // Phonetic & Core name features (4)
  skel_ratio: number;
  skel_token_set: number;
  core_ratio: number;
  core_token_set: number;
  // Address similarity features (3)
  addr_ratio: number;
  addr_token_set: number;
  addr_partial: number;
  // House number features (4)
  num_shared: number;
  num_s1: number;
  num_pool: number;
  num_pool_share: number;
  // Record context & metadata (4)
  name_words_s1: number;
  name_words_pool: number;
  pool_addr_empty: number;
  is_s3: number;
  // Context relative to best candidate (2)
  name_token_set_vs_best: number;
  addr_token_set_vs_best: number;
}

export interface CandidateResult {
  s2s3Record: BusinessRecord;
  blockingScore: number;
  blockingRank: number;
  features: PairFeatures;
  rerankProbability: number;
  matchProbability: number;
  isMatch: boolean;
  status: 'MATCHED' | 'REJECTED_PROBABILITY' | 'REJECTED_COMPETITION' | 'REJECTED_SIBLING';
  rejectionReason?: string;
  isGroundTruthMatch?: boolean;
}

export interface EntityResolutionOutput {
  s1Record: BusinessRecord;
  candidates: CandidateResult[];
  matchedIds: string[];
  candidateIds: string[];
  f05Score?: number;
  precision?: number;
  recall?: number;
}

export interface BenchmarkCase {
  id: string;
  title: string;
  category: 'Indian Transliteration' | 'US Sibling Branch Decoy' | 'French Legal Acronyms' | 'Empty Singleton' | 'Multi-Match Entity';
  description: string;
  s1: BusinessRecord;
  pool: BusinessRecord[];
  groundTruthMatches: string[];
}
