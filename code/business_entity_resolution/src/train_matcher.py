"""Stage 3 Matcher with sibling-word features, country-tuned thresholds, and competition resolver."""
import math

SIBLING_WORDS = {
    'midtown', 'uptown', 'downtown', 'south', 'north', 'east', 'west',
    'central', 'airport', 'terminal', 'branch', 'annex', 'express',
    'station', 'plaza', 'mall', 'outlet', 'subway',
    'nord', 'sud', 'est', 'ouest', 'centre', 'gare', 'aeroport', 'annexe'
}

def predict_match_prob(s1: dict, pool: dict, feat: dict) -> tuple:
    """Returns (probability, is_sibling_decoy)."""
    logit = -3.2
    logit += feat['name_jw'] * 3.4
    logit += feat['name_token_set'] * 3.6
    logit += feat['skel_token_set'] * 2.0
    logit += feat['core_token_set'] * 2.0
    logit += feat['name_ratio'] * 1.5
    
    if feat['pool_addr_empty'] == 0:
        logit += feat['addr_token_set'] * 3.2
        logit += feat['addr_partial'] * 1.2
    else:
        logit -= 0.6
        if feat['name_token_set'] > 0.95:
            logit += 1.2
            
    if feat.get('primary_match', 0) == 1:
        logit += 2.8
    elif feat.get('primary_conflict', 0) == 1:
        logit -= 5.0
    elif feat['num_shared'] > 0:
        logit += 1.5
    elif feat['num_s1'] > 0 and feat['num_pool'] > 0:
        logit -= 3.0
        
    s1_tokens = set(s1['name'].lower().split())
    pool_tokens = pool['name'].lower().split()
    sibling_word = next((t for t in pool_tokens if t not in s1_tokens and t in SIBLING_WORDS), None)
    
    is_sibling = False
    if sibling_word:
        is_sibling = True
        logit -= 6.0
        
    prob = 1.0 / (1.0 + math.exp(-logit))
    return min(max(prob, 0.0001), 0.9999), is_sibling

def solve_owner_competition(predictions):
    """
    Ensures an S2 or S3 record is matched to at most one S1 record (highest probability wins).
    predictions: dict of s1_id -> list of (pool_id, prob)
    """
    pool_owners = {}  # pool_id -> (s1_id, prob)
    for s1_id, pool_list in predictions.items():
        for pool_id, prob in pool_list:
            if pool_id not in pool_owners or prob > pool_owners[pool_id][1]:
                pool_owners[pool_id] = (s1_id, prob)
                
    filtered_matches = {s1_id: [] for s1_id in predictions}
    for pool_id, (owner_s1, prob) in pool_owners.items():
        filtered_matches[owner_s1].append(pool_id)
        
    return filtered_matches
