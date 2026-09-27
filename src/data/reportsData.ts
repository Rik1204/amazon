// Summary data extracted directly from code/business_entity_resolution/reports/

export interface ReportItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  data: Record<string, any>;
}

export const COMPETITION_OVERVIEW = {
  team: 'Null-Pointers',
  competition: 'Amazon ML Challenge 2026',
  track: 'Business Entity Resolution',
  finalValidationF05: 0.9933,
  targetRange: '0.991 - 0.995',
  candidatesPerEntity: 6.8,
  maxCandidates: 10,
  trainEntities: 2206821,
  trainPoolRecords: 10320219,
  testEntities: 1732544,
  testPoolRecords: 9969589,
  singletonPercentage: 5.58,
};

export const ITERATION_10PCT_BENCHMARK = [
  { iter: 1, name: 'Naive Baseline Matcher (Leaderboard 0.969 Baseline)', singletons: 0.7576, matched: 0.8781, macroF05: 0.8703, status: 'baseline', tag: 'Baseline' },
  { iter: 2, name: 'Add Multi-Owner 1-to-1 Global Competition Resolution', singletons: 0.9697, matched: 0.9575, macroF05: 0.9583, status: 'improving', tag: '+0.0880' },
  { iter: 3, name: 'Add Address Consistency & Primary House Number Verification', singletons: 1.0000, matched: 0.9922, macroF05: 0.9927, status: 'target_met', tag: 'Target Met' },
  { iter: 4, name: 'Add Sibling Branch Decoy Suppression & Transliteration', singletons: 1.0000, matched: 0.9922, macroF05: 0.9927, status: 'target_met', tag: 'Target Met' },
  { iter: 5, name: 'Add Unseen France Strict Filtering & Dual-Threshold Ensemble', singletons: 1.0000, matched: 0.9928, macroF05: 0.9933, status: 'optimal', tag: '0.9933 Target' },
  { iter: 6, name: 'Optimal Ultra-High Precision Matcher (0.991 - 0.995 Target)', singletons: 1.0000, matched: 0.9928, macroF05: 0.9933, status: 'optimal', tag: 'Final 0.9933' },
];

export const BLOCKING_EXPERIMENTS = [
  { setup: 'Words only (max_df 1000)', k10: '0.616', k50: '0.704', k100: '0.743', recall: '74.3%', notes: 'Common keys left street names only' },
  { setup: 'Words only (max_df 5000)', k10: '0.750', k50: '0.811', k100: '0.831', recall: '83.1%', notes: 'Better recall but still missed word combinations' },
  { setup: '+ Skeleton pairs, glued names, address bigrams (max_df 2000, summed IDF)', k10: '0.888', k50: '0.942', k100: '0.954', recall: '95.4%', notes: 'Huge jump: rare combinations handle common words' },
  { setup: 'Separate passes (name + addr + combined)', k10: '0.907', k50: '0.960', k100: '0.964', recall: '96.5%', notes: '3x slower, no gain over combined pass' },
  { setup: 'Combined pass + Cosine Normalisation (max_df 5000) [CHOSEN]', k10: '0.907', k50: '0.963', k100: '0.972', recall: '97.2%', notes: 'Cosine prevented long records from winning unfairly' },
];

export const CANDIDATE_SIZE_EXPERIMENTS = [
  { method: 'Plain Cut Top 50', candsPerEntity: 50.0, pairRecall: 0.9645, oracleF05: 0.9874, modelF05: 0.9556 },
  { method: 'Plain Cut Top 20', candsPerEntity: 20.0, pairRecall: 0.9428, oracleF05: 0.9797, modelF05: 0.9497 },
  { method: 'Plain Cut Top 10', candsPerEntity: 10.0, pairRecall: 0.9079, oracleF05: 0.9678, modelF05: 0.9399 },
  { method: 'Plain Cut Top 5', candsPerEntity: 5.0, pairRecall: 0.8020, oracleF05: 0.9391, modelF05: 0.9145 },
  { method: 'LightGBM Re-ranker Top 8, p >= 0.05', candsPerEntity: 4.66, pairRecall: 0.9449, oracleF05: 0.9813, modelF05: 0.9550 },
  { method: 'LightGBM Re-ranker (26 features) Top 10, p >= 0.005 [CHOSEN]', candsPerEntity: 6.80, pairRecall: 0.9710, oracleF05: 0.9880, modelF05: 0.9758 },
];

export const IMPROVEMENT_MILESTONES = [
  { version: 'v2 Baseline', f05: 0.9550, description: '26 initial features, <= 8 candidates from blocking' },
  { version: '+ Candidate cluster similarity', f05: 0.9562, description: 'Similarity to other candidates of same S1 entity' },
  { version: '+ Learned missing/extra word scores', f05: 0.9627, description: 'Cross-fitted scores for added/dropped words (largest single gain)' },
  { version: 'v3 (+ Indian transliteration dict)', f05: 0.9673, description: 'Devanagari/Gujarati dictionary from training pairs (India recall 95.0 -> 97.2%)' },
  { version: '+ 30% Word dropout & unknown word self-training', f05: 0.9680, description: 'Robustness against unseen languages like French' },
  { version: '+ S1 Name counts & house number distance', f05: 0.9738, description: 'Disambiguates frequent franchise names and decoy branches' },
  { version: 'v4 (+ 26-feature re-ranker, <= 10 cands)', f05: 0.9758, description: 'Keeps 97.1% true pairs with only 6.8 candidates per entity' },
  { version: 'v4 Under Full Competition', f05: 0.9772, description: 'All training owners competing, best threshold tuned to 0.65' },
  { version: 'v5 (+ Formatting & dropped-digits)', f05: 0.9781, description: 'Case, accents, symbols, typo recovery ("y0ga" -> "yoga")' },
  { version: 'v5 Under Full Competition', f05: 0.9789, description: 'Multi-owner conflict solver threshold tuned to 0.675' },
  { version: 'v6 (+ Dotted acronyms & "+" normalisation)', f05: 0.9791, description: 'Resolves "S.A.S.", "L.L.C." and French legal abbreviations on full dataset' },
];

export const EDA_DATASET_SUMMARY = {
  train: {
    US: { s1: 1323633, s2: 3016817, s3: 3170056, total: 7510506 },
    India: { s1: 883188, s2: 2017799, s3: 2115547, total: 5016534 },
    Total: { s1: 2206821, s2: 5034616, s3: 5285603, total: 12527040 },
  },
  test: {
    India: { s1: 809986, s2: 2312565, s3: 2405000, total: 5527551 },
    US: { s1: 663106, s2: 1871330, s3: 1945701, total: 4480137 },
    France: { s1: 259452, s2: 703378, s3: 731615, total: 1694445 },
    Total: { s1: 1732544, s2: 4887273, s3: 5082316, total: 11702133 },
  },
  matchesPerEntityDistribution: [
    { matches: '0 (Singletons)', count: 123247, percentage: '5.58%' },
    { matches: '1 match', count: 119157, percentage: '5.40%' },
    { matches: '2 matches', count: 375212, percentage: '17.00%' },
    { matches: '3 matches', count: 530841, percentage: '24.05%' },
    { matches: '4 matches', count: 484115, percentage: '21.94%' },
    { matches: '5 matches', count: 321957, percentage: '14.59%' },
    { matches: '6 matches', count: 164868, percentage: '7.47%' },
    { matches: '7+ matches', count: 87424, percentage: '3.97%' },
  ],
};
