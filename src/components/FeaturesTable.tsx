import React from 'react';
import { PairFeatures } from '../types';

interface FeaturesTableProps {
  features: PairFeatures;
  candidateId: string;
}

export const FeaturesTable: React.FC<FeaturesTableProps> = ({ features, candidateId }) => {
  const groups = [
    {
      title: 'Blocking Features (3)',
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      items: [
        { key: 'block_score', name: 'TF-IDF Cosine Score', val: features.block_score, desc: 'Cosine similarity of rare key inverted index' },
        { key: 'block_rank', name: 'Blocking Rank', val: features.block_rank, desc: 'Rank in stage 1 retrieval pool' },
        { key: 'block_score_rel', name: 'Relative Block Score', val: features.block_score_rel, desc: 'Ratio vs top candidate blocking score' },
      ],
    },
    {
      title: 'Name String Similarities (6)',
      color: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
      items: [
        { key: 'name_token_set', name: 'Token Set Ratio', val: features.name_token_set, desc: 'Overlap insensitive to word repetition/order' },
        { key: 'name_jw', name: 'Jaro-Winkler', val: features.name_jw, desc: 'Prefix-weighted typo & character edit distance' },
        { key: 'name_token_sort', name: 'Token Sort Ratio', val: features.name_token_sort, desc: 'Alphabetically sorted token similarity' },
        { key: 'name_ratio', name: 'Levenshtein Ratio', val: features.name_ratio, desc: 'Normalized full edit distance' },
        { key: 'name_partial', name: 'Partial Ratio', val: features.name_partial, desc: 'Best substring alignment ratio' },
        { key: 'name_nospace_ratio', name: 'No-Space Ratio', val: features.name_nospace_ratio, desc: 'Handles merged words ("willshore" vs "will shore")' },
      ],
    },
    {
      title: 'Phonetic & Core Name Features (4)',
      color: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
      items: [
        { key: 'skel_ratio', name: 'Skeleton Ratio', val: features.skel_ratio, desc: 'Levenshtein ratio of phonetic skeleton keys' },
        { key: 'skel_token_set', name: 'Skeleton Token Set', val: features.skel_token_set, desc: 'Phonetic skeleton bag-of-words similarity' },
        { key: 'core_ratio', name: 'Core Name Ratio', val: features.core_ratio, desc: 'Name stripped of frequent words (LLC, Pvt Ltd, SARL)' },
        { key: 'core_token_set', name: 'Core Token Set', val: features.core_token_set, desc: 'Token set on unique distinctive business words' },
      ],
    },
    {
      title: 'Address Similarities & House Numbers (7)',
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      items: [
        { key: 'addr_token_set', name: 'Address Token Set', val: features.addr_token_set, desc: 'Street, city, locality word overlap' },
        { key: 'addr_ratio', name: 'Address Ratio', val: features.addr_ratio, desc: 'Normalized address edit distance' },
        { key: 'addr_partial', name: 'Address Partial', val: features.addr_partial, desc: 'Sub-address matching ratio' },
        { key: 'num_shared', name: 'Shared House Numbers', val: features.num_shared, desc: 'Exact numeric house / plot number matches' },
        { key: 'num_s1', name: 'S1 House Numbers Count', val: features.num_s1, desc: 'Count of numbers in S1 address' },
        { key: 'num_pool', name: 'Pool House Numbers Count', val: features.num_pool, desc: 'Count of numbers in candidate address' },
        { key: 'num_pool_share', name: 'House Number Share', val: features.num_pool_share, desc: 'num_shared / num_pool' },
      ],
    },
    {
      title: 'Context & Metadata (6)',
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      items: [
        { key: 'name_token_set_vs_best', name: 'Name Overlap vs Best', val: features.name_token_set_vs_best, desc: 'Difference vs top candidate of entity' },
        { key: 'addr_token_set_vs_best', name: 'Addr Overlap vs Best', val: features.addr_token_set_vs_best, desc: 'Address overlap difference vs best candidate' },
        { key: 'name_words_s1', name: 'S1 Words Count', val: features.name_words_s1, desc: 'Length of S1 cleaned name' },
        { key: 'name_words_pool', name: 'Pool Words Count', val: features.name_words_pool, desc: 'Length of pool cleaned name' },
        { key: 'pool_addr_empty', name: 'Address Empty Flag', val: features.pool_addr_empty, desc: '1 if pool address is missing, else 0' },
        { key: 'is_s3', name: 'Source 3 Indicator', val: features.is_s3, desc: '1 for S3 vendor, 0 for S2' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
        <span>26 LightGBM Pair Features for Candidate: <strong className="text-amber-400 font-mono">{candidateId}</strong></span>
        <span>Deterministic Scoring</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className={`p-3 rounded-lg border ${group.color} space-y-2`}>
            <div className="text-xs font-semibold tracking-wide uppercase">{group.title}</div>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-xs bg-slate-900/60 px-2 py-1 rounded">
                  <div className="truncate pr-2" title={item.desc}>
                    <span className="text-slate-300 font-medium">{item.name}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{item.key}</span>
                  </div>
                  <div className="font-mono font-semibold text-slate-100">
                    {typeof item.val === 'number' ? item.val : String(item.val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
