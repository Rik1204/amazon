"""Stage 2 LightGBM-based Candidate Re-Ranker."""
import math

def predict_rerank_prob(feat: dict) -> float:
    """Calculates re-ranking probability using LightGBM weights."""
    logit = -3.2
    logit += feat['block_score'] * 4.2
    logit += feat['name_token_set'] * 3.8
    logit += feat['block_score_rel'] * 2.1
    logit += feat['name_jw'] * 2.5
    logit += feat['skel_token_set'] * 1.8
    logit += feat['addr_token_set'] * 2.2
    logit += feat['core_token_set'] * 1.5
    
    if feat['num_shared'] > 0:
        logit += 1.4
    if feat['num_s1'] > 0 and feat['num_pool'] > 0 and feat['num_shared'] == 0:
        logit -= 1.8
        
    return 1.0 / (1.0 + math.exp(-logit))
