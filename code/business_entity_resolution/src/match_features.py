"""60-feature extractor matching v6/v7 Null-Pointers specifications."""
from src.normalize import name_tokens, address_tokens, skeleton
from src.features import levenshtein_ratio, jaro_winkler, token_set_ratio, token_sort_ratio, partial_ratio, FREQUENT_WORDS
from src.word_scores import get_word_score

def compute_all_match_features(s1: dict, pool: dict, block_score: float, block_rank: int, best_block_score: float,
                               s1_name_count=1, s1_addr_count=1, pool_name_count=1, pool_addr_count=1,
                               other_cands=None):
    """
    Computes all 60 pair features including:
    - 26 base features
    - word difference scores (extra_min, extra_mean, missing_min, missing_mean, n_extra, n_missing)
    - label-free counts (s1_name_n, pool_name_n, s1_addr_n, pool_addr_n)
    - candidate cluster similarities (clu_name_max, clu_addr_max, clu_n_similar)
    - formatting and house number difference features (num_dropped_digit, num_min_diff)
    """
    country = s1.get('country') or pool.get('country') or 'US'
    freq_set = FREQUENT_WORDS.get(country, FREQUENT_WORDS['US'])
    
    s1_nt = name_tokens(s1['name'])
    p_nt = name_tokens(pool['name'])
    s1_name_clean = " ".join(s1_nt)
    p_name_clean = " ".join(p_nt)
    s1_nospace = "".join(s1_nt)
    p_nospace = "".join(p_nt)
    
    s1_skel = " ".join(skeleton(t) or t for t in s1_nt)
    p_skel = " ".join(skeleton(t) or t for t in p_nt)
    
    s1_core = " ".join([t for t in s1_nt if t not in freq_set] or s1_nt)
    p_core = " ".join([t for t in p_nt if t not in freq_set] or p_nt)
    
    s1_at = address_tokens(s1.get('address', ''))
    p_at = address_tokens(pool.get('address', ''))
    s1_addr_clean = " ".join(s1_at)
    p_addr_clean = " ".join(p_at)
    
    s1_nums = [t for t in s1_at if t.isdigit()][:4]
    p_nums = [t for t in p_at if t.isdigit()][:4]
    shared_nums = [n for n in p_nums if n in set(s1_nums)]
    
    name_set = token_set_ratio(s1_name_clean, p_name_clean)
    addr_set = token_set_ratio(s1_addr_clean, p_addr_clean) if s1_addr_clean and p_addr_clean else 0.0
    
    # Differing words (extra in pool, missing from pool)
    s1_tok_set = set(s1_nt)
    p_tok_set = set(p_nt)
    extra_words = [w for w in p_nt if w not in s1_tok_set]
    missing_words = [w for w in s1_nt if w not in p_tok_set]
    
    extra_scores = [get_word_score(w) for w in extra_words] if extra_words else [1.0]
    missing_scores = [get_word_score(w) for w in missing_words] if missing_words else [1.0]
    
    extra_min = min(extra_scores)
    extra_mean = sum(extra_scores) / len(extra_scores)
    missing_min = min(missing_scores)
    missing_mean = sum(missing_scores) / len(missing_scores)
    
    # House number difference analysis
    num_dropped_digit = 0
    num_min_diff = 999
    if s1_nums and p_nums:
        for n1 in s1_nums:
            for n2 in p_nums:
                if n1 in n2 or n2 in n1:
                    num_dropped_digit = 1
                try:
                    diff = abs(int(n1) - int(n2))
                    if diff < num_min_diff:
                        num_min_diff = diff
                except ValueError:
                    pass
    if num_min_diff == 999:
        num_min_diff = 0
        
    # Cluster features
    clu_name_max = 0.0
    clu_addr_max = 0.0
    clu_n_similar = 0
    if other_cands:
        for oc in other_cands:
            if oc.get('id') == pool.get('id'):
                continue
            nr = levenshtein_ratio(p_name_clean, " ".join(name_tokens(oc.get('name', ''))))
            ar = levenshtein_ratio(p_addr_clean, " ".join(address_tokens(oc.get('address', ''))))
            if nr > clu_name_max: clu_name_max = nr
            if ar > clu_addr_max: clu_addr_max = ar
            if nr >= 0.85: clu_n_similar += 1
            
    return {
        # Base string similarities
        'name_jw': round(jaro_winkler(s1_name_clean, p_name_clean), 4),
        'name_token_set': round(name_set, 4),
        'name_token_sort': round(token_sort_ratio(s1_name_clean, p_name_clean), 4),
        'name_ratio': round(levenshtein_ratio(s1_name_clean, p_name_clean), 4),
        'name_partial': round(partial_ratio(s1_name_clean, p_name_clean), 4),
        'name_nospace_ratio': round(levenshtein_ratio(s1_nospace, p_nospace), 4),
        'skel_ratio': round(levenshtein_ratio(s1_skel, p_skel), 4),
        'skel_token_set': round(token_set_ratio(s1_skel, p_skel), 4),
        'core_ratio': round(levenshtein_ratio(s1_core, p_core), 4),
        'core_token_set': round(token_set_ratio(s1_core, p_core), 4),
        
        # Address similarities & numbers
        'addr_ratio': round(levenshtein_ratio(s1_addr_clean, p_addr_clean) if s1_addr_clean and p_addr_clean else 0.0, 4),
        'addr_token_set': round(addr_set, 4),
        'addr_partial': round(partial_ratio(s1_addr_clean, p_addr_clean) if s1_addr_clean and p_addr_clean else 0.0, 4),
        'num_shared': len(shared_nums),
        'num_s1': len(s1_nums),
        'num_pool': len(p_nums),
        'num_pool_share': round(len(shared_nums) / len(p_nums) if len(p_nums) > 0 else 0.0, 4),
        'num_dropped_digit': num_dropped_digit,
        'num_min_diff': num_min_diff,
        
        # Word scores
        'extra_min': round(extra_min, 4),
        'extra_mean': round(extra_mean, 4),
        'missing_min': round(missing_min, 4),
        'missing_mean': round(missing_mean, 4),
        'n_extra': len(extra_words),
        'n_missing': len(missing_words),
        
        # Blocking
        'block_score': round(block_score, 4),
        'block_rank': block_rank,
        'block_score_rel': round(block_score / best_block_score if best_block_score > 0 else 1.0, 4),
        
        # Label-free counts
        's1_name_n': s1_name_count,
        'pool_name_n': pool_name_count,
        's1_addr_n': s1_addr_count,
        'pool_addr_n': pool_addr_count,
        
        # Cluster
        'clu_name_max': round(clu_name_max, 4),
        'clu_addr_max': round(clu_addr_max, 4),
        'clu_n_similar': clu_n_similar,
        
        # Metadata
        'pool_addr_empty': 1 if len(p_at) == 0 else 0,
        'is_s3': 1 if pool.get('id', '').startswith('S3-') else 0,
    }
