"""End-to-end entity resolution inference script."""
import sys
from pathlib import Path
from src.config import DATA_DIR, OUTPUT_DIR
from src.data import load_source_file
from src.blocking import RareKeyIndex
from src.features import extract_features
from src.rerank import predict_rerank_prob
from src.train_matcher import predict_match_prob, solve_owner_competition
from src.output_writer import write_submission_files

def run_prediction(test_dir=None, out_dir=None, threshold=0.675, unseen_strict=True, unseen_threshold=0.85):
    test_path = Path(test_dir) if test_dir else DATA_DIR / "test"
    out_path = Path(out_dir) if out_dir else OUTPUT_DIR
    
    print(f"Loading data from {test_path}...")
    s1_df = load_source_file(test_path / "test_source1.tsv")
    s2_df = load_source_file(test_path / "test_source2.tsv")
    s3_df = load_source_file(test_path / "test_source3.tsv")
    
    def to_standard_records(data):
        if hasattr(data, 'to_dict'):
            return data.rename(columns={'entity_id': 'id', 'business_name': 'name', 'business_address': 'address'}).to_dict('records')
        standard = []
        for r in data:
            standard.append({
                'id': r.get('entity_id') or r.get('id', ''),
                'name': r.get('business_name') or r.get('name', ''),
                'address': r.get('business_address') or r.get('address', ''),
                'country': r.get('country', 'US')
            })
        return standard

    s1_records = to_standard_records(s1_df)
    s2_records = to_standard_records(s2_df)
    s3_records = to_standard_records(s3_df)
    
    pool_records = s2_records + s3_records
    print(f"Building blocking index over {len(pool_records)} pool records...")
    index = RareKeyIndex(pool_records)
    
    candidates_dict = {}
    prelim_matches = {}
    
    print(f"Processing {len(s1_records)} S1 entities...")
    for idx, s1 in enumerate(s1_records):
        s1_id = s1['id']
        country = s1.get('country', 'US')
        is_unseen = (country == 'France')
        
        # Stage 1: Blocking top 50
        blocking_top = index.query(s1, top_k=50)
        if not blocking_top:
            candidates_dict[s1_id] = []
            prelim_matches[s1_id] = []
            continue
            
        best_block = blocking_top[0][1]
        
        # Stage 2: Feature extraction & Re-ranking
        ranked_cands = []
        for rank, (cand, b_score) in enumerate(blocking_top, 1):
            feats = extract_features(s1, cand, b_score, rank, best_block)
            r_prob = predict_rerank_prob(feats)
            if r_prob >= 0.005:
                ranked_cands.append((cand, feats, r_prob))
                
        ranked_cands.sort(key=lambda x: x[2], reverse=True)
        kept_candidates = ranked_cands[:10]
        
        c_ids = [c[0]['id'] for c in kept_candidates]
        candidates_dict[s1_id] = c_ids
        
        # Stage 3: Matcher
        active_thresh = unseen_threshold if (is_unseen and unseen_strict) else threshold
        s1_matches = []
        
        for cand, feats, _ in kept_candidates:
            prob, is_sibling = predict_match_prob(s1, cand, feats)
            
            # France/Unseen strict house-number rule
            if is_unseen and unseen_strict:
                if feats['num_s1'] > 0 and feats['num_pool'] > 0 and feats['num_shared'] == 0:
                    continue
                    
            if not is_sibling and prob >= active_thresh:
                s1_matches.append((cand['id'], prob))
                
        prelim_matches[s1_id] = s1_matches
        
        if (idx + 1) % 50000 == 0:
            print(f"Processed {idx + 1}/{len(s1_records)} entities...")
            
    print("Solving multi-owner competition constraints...")
    final_matches = solve_owner_competition(prelim_matches)
    
    print(f"Writing official submission TSV files to {out_path}...")
    write_submission_files(out_path, final_matches, candidates_dict)
    print("Inference completed successfully!")

if __name__ == "__main__":
    run_prediction()
